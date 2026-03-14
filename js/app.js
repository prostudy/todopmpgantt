/**
 * PMI Gantt Tool - Vue.js Application
 * Aplicacion principal con todos los componentes de UI
 */

const { createApp, ref, reactive, computed, watch, onMounted, nextTick } = Vue;

const app = createApp({
  setup() {
    // ---- State ----
    const activeTab = ref('tasks');
    const project = reactive(DataModel.createProject());
    const ganttScale = ref('day');
    const ganttSvg = ref('');
    const evmMetrics = ref(null);
    const evmInterpretations = ref([]);
    const overallocations = ref([]);
    const toasts = ref([]);
    const showConfigModal = ref(false);
    const showTaskModal = ref(false);
    const editingTask = ref(null);
    const showResourceModal = ref(false);
    const editingResource = ref(null);
    const showAssignModal = ref(false);
    const assigningTask = ref(null);

    // ---- Computed ----
    const orderedTasks = computed(() => DataModel.getOrderedTasks(project.tasks));

    const totalBudget = computed(() =>
      project.tasks.filter(t => !t.isSummary).reduce((s, t) => s + (t.plannedCost || 0), 0)
    );

    const totalActualCost = computed(() =>
      project.tasks.filter(t => !t.isSummary).reduce((s, t) => s + (t.actualCost || 0), 0)
    );

    const criticalTasks = computed(() =>
      project.tasks.filter(t => t.isCritical && !t.isSummary)
    );

    const projectEndDate = computed(() => {
      const dates = project.tasks.filter(t => t.endDate).map(t => new Date(t.endDate));
      if (dates.length === 0) return '-';
      return new Date(Math.max(...dates)).toISOString().split('T')[0];
    });

    const projectDurationDays = computed(() => {
      const ends = project.tasks.filter(t => t.endDate).map(t => new Date(t.endDate));
      if (ends.length === 0) return 0;
      const start = new Date(project.startDate + 'T00:00:00');
      const end = new Date(Math.max(...ends));
      return ScheduleEngine.getWorkdaysBetween(start, end, project.calendarWorkdays);
    });

    // ---- Methods ----

    // Toast notifications
    function toast(message, type = 'info') {
      const id = Date.now();
      toasts.value.push({ id, message, type });
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id);
      }, 3000);
    }

    // Project management
    function newProject() {
      if (!confirm('Se perdera el proyecto actual. Continuar?')) return;
      Object.assign(project, DataModel.createProject());
      recalculate();
      toast('Nuevo proyecto creado', 'info');
    }

    function recalculate() {
      DataModel.recalculateWBS(project.tasks);
      ScheduleEngine.calculate(project);
      autoCalculateCosts();
      updateGantt();
      updateEVM();
      checkOverallocations();
      saveToLocalStorage();
    }

    function autoCalculateCosts() {
      for (const task of project.tasks) {
        if (task.isSummary) continue;
        if (task.resourceAssignments.length === 0) continue;
        const cost = ResourceEngine.calculateTaskResourceCost(task, project);
        task.plannedCost = Math.round(cost * 100) / 100;
      }
    }

    function updateGantt() {
      ganttSvg.value = GanttRenderer.render(project, ganttScale.value);
    }

    function updateEVM() {
      if (project.tasks.length === 0) {
        evmMetrics.value = null;
        evmInterpretations.value = [];
        return;
      }
      evmMetrics.value = EVMEngine.calculate(project);
      evmInterpretations.value = EVMEngine.interpret(evmMetrics.value);
    }

    function checkOverallocations() {
      overallocations.value = ResourceEngine.detectOverallocation(project);
    }

    // Task CRUD
    function addTask(parentId = null) {
      const task = DataModel.createTask({
        parentId,
        name: 'Nueva Tarea',
        duration: 5,
      });
      project.tasks.push(task);
      recalculate();
      toast('Tarea agregada', 'success');
    }

    function addMilestone() {
      const task = DataModel.createTask({
        name: 'Nuevo Hito',
        duration: 0,
        isMilestone: true,
      });
      project.tasks.push(task);
      recalculate();
      toast('Hito agregado', 'success');
    }

    function deleteTask(taskId) {
      // Eliminar descendientes
      const descendants = DataModel.getDescendants(project.tasks, taskId);
      const idsToRemove = new Set([taskId, ...descendants.map(d => d.id)]);

      // Limpiar predecesores que referencian tareas eliminadas
      project.tasks.forEach(t => {
        t.predecessors = t.predecessors.filter(p => !idsToRemove.has(p.taskId));
      });

      project.tasks = project.tasks.filter(t => !idsToRemove.has(t.id));
      recalculate();
      toast('Tarea eliminada', 'info');
    }

    function indentTask(taskId) {
      const idx = project.tasks.findIndex(t => t.id === taskId);
      if (idx <= 0) return;
      // Buscar tarea anterior al mismo nivel o superior
      const task = project.tasks[idx];
      for (let i = idx - 1; i >= 0; i--) {
        const prev = project.tasks[i];
        if (prev.level <= task.level && prev.id !== task.parentId) {
          task.parentId = prev.id;
          prev.isSummary = true;
          break;
        }
      }
      recalculate();
    }

    function outdentTask(taskId) {
      const task = project.tasks.find(t => t.id === taskId);
      if (!task || !task.parentId) return;
      const parent = project.tasks.find(t => t.id === task.parentId);
      if (parent) {
        task.parentId = parent.parentId;
        // Verificar si el padre aun tiene hijos
        const remaining = project.tasks.filter(t => t.parentId === parent.id);
        if (remaining.length === 0) parent.isSummary = false;
      }
      recalculate();
    }

    function moveTaskUp(taskId) {
      const idx = project.tasks.findIndex(t => t.id === taskId);
      if (idx <= 0) return;
      const task = project.tasks[idx];
      // Buscar tarea anterior con mismo padre
      for (let i = idx - 1; i >= 0; i--) {
        if (project.tasks[i].parentId === task.parentId) {
          [project.tasks[idx], project.tasks[i]] = [project.tasks[i], project.tasks[idx]];
          break;
        }
      }
      recalculate();
    }

    function moveTaskDown(taskId) {
      const idx = project.tasks.findIndex(t => t.id === taskId);
      if (idx >= project.tasks.length - 1) return;
      const task = project.tasks[idx];
      for (let i = idx + 1; i < project.tasks.length; i++) {
        if (project.tasks[i].parentId === task.parentId) {
          [project.tasks[idx], project.tasks[i]] = [project.tasks[i], project.tasks[idx]];
          break;
        }
      }
      recalculate();
    }

    function toggleCollapse(taskId) {
      const task = project.tasks.find(t => t.id === taskId);
      if (task) task.collapsed = !task.collapsed;
    }

    function openTaskEdit(task) {
      editingTask.value = { ...task };
      showTaskModal.value = true;
    }

    function saveTaskEdit() {
      const idx = project.tasks.findIndex(t => t.id === editingTask.value.id);
      if (idx >= 0) {
        Object.assign(project.tasks[idx], editingTask.value);
      }
      showTaskModal.value = false;
      editingTask.value = null;
      recalculate();
    }

    // Inline editing handlers
    function onTaskFieldChange(task, field, value) {
      if (field === 'duration') {
        task.duration = parseInt(value) || 0;
        if (task.duration === 0) task.isMilestone = true;
        else task.isMilestone = false;
      } else if (field === 'plannedCost' || field === 'actualCost') {
        task[field] = parseFloat(value) || 0;
      } else if (field === 'percentComplete') {
        task[field] = Math.min(100, Math.max(0, parseInt(value) || 0));
      } else if (field === 'predecessors') {
        task.predecessors = ScheduleEngine.parsePredecessorString(value, project.tasks);
      } else if (field === 'name') {
        task.name = value;
      } else if (field === 'isMilestone') {
        task.isMilestone = value;
        if (value) task.duration = 0;
      }
      recalculate();
    }

    function getPredecessorString(task) {
      return ScheduleEngine.formatPredecessors(task.predecessors, project.tasks);
    }

    function getTaskRowNumber(task) {
      return project.tasks.indexOf(task) + 1;
    }

    // Resource CRUD
    function addResource() {
      editingResource.value = DataModel.createResource();
      showResourceModal.value = true;
    }

    function editResource(resource) {
      editingResource.value = { ...resource };
      showResourceModal.value = true;
    }

    function saveResource() {
      const idx = project.resources.findIndex(r => r.id === editingResource.value.id);
      if (idx >= 0) {
        Object.assign(project.resources[idx], editingResource.value);
      } else {
        project.resources.push(editingResource.value);
      }
      showResourceModal.value = false;
      editingResource.value = null;
      recalculate();
      toast('Recurso guardado', 'success');
    }

    function deleteResource(resourceId) {
      project.resources = project.resources.filter(r => r.id !== resourceId);
      // Limpiar asignaciones
      project.tasks.forEach(t => {
        t.resourceAssignments = t.resourceAssignments.filter(a => a.resourceId !== resourceId);
      });
      recalculate();
      toast('Recurso eliminado', 'info');
    }

    // Resource assignment
    function openAssignResources(task) {
      assigningTask.value = task;
      showAssignModal.value = true;
    }

    function isResourceAssigned(task, resourceId) {
      return task.resourceAssignments.some(a => a.resourceId === resourceId);
    }

    function getAssignmentUnits(task, resourceId) {
      const a = task.resourceAssignments.find(a => a.resourceId === resourceId);
      return a ? a.units : 100;
    }

    function toggleResourceAssignment(task, resourceId) {
      const idx = task.resourceAssignments.findIndex(a => a.resourceId === resourceId);
      if (idx >= 0) {
        task.resourceAssignments.splice(idx, 1);
      } else {
        task.resourceAssignments.push({ resourceId, units: 100 });
      }
      recalculate();
    }

    function updateAssignmentUnits(task, resourceId, units) {
      const a = task.resourceAssignments.find(a => a.resourceId === resourceId);
      if (a) a.units = parseInt(units) || 100;
      recalculate();
    }

    function getResourceNames(task) {
      return task.resourceAssignments.map(a => {
        const r = project.resources.find(r => r.id === a.resourceId);
        return r ? r.name : '?';
      }).join(', ');
    }

    // Baseline management
    function saveBaseline() {
      const name = prompt('Nombre de la linea base:', `Linea Base ${project.baselines.length + 1}`);
      if (name === null) return;
      const bl = DataModel.createBaseline(project, name);
      project.baselines.push(bl);
      saveToLocalStorage();
      toast('Linea base guardada', 'success');
    }

    function deleteBaseline(id) {
      project.baselines = project.baselines.filter(b => b.id !== id);
      saveToLocalStorage();
      toast('Linea base eliminada', 'info');
    }

    function setActiveBaseline(id) {
      // Mover la baseline seleccionada al indice 0
      const idx = project.baselines.findIndex(b => b.id === id);
      if (idx > 0) {
        const bl = project.baselines.splice(idx, 1)[0];
        project.baselines.unshift(bl);
        updateGantt();
        toast('Linea base activa cambiada', 'info');
      }
    }

    // Resource leveling
    function levelResources() {
      const result = ResourceEngine.levelResources(project);
      recalculate();
      if (result.resolved) {
        toast('Nivelacion completada. Conflictos resueltos.', 'success');
      } else {
        toast(`Nivelacion parcial. ${result.remainingConflicts} conflictos restantes.`, 'warning');
      }
    }

    // CSV Import/Export
    function exportTasksCSV() {
      const csv = CSVManager.exportTasks(project);
      CSVManager.downloadFile(csv, `${project.name}_tareas.csv`);
      toast('Tareas exportadas a CSV', 'success');
    }

    function exportResourcesCSV() {
      const csv = CSVManager.exportResources(project);
      CSVManager.downloadFile(csv, `${project.name}_recursos.csv`);
      toast('Recursos exportados a CSV', 'success');
    }

    function exportEVMCSV() {
      const csv = CSVManager.exportEVM(project);
      CSVManager.downloadFile(csv, `${project.name}_evm.csv`);
      toast('Metricas EVM exportadas', 'success');
    }

    function exportProjectJSON() {
      const json = CSVManager.exportProjectJSON(project);
      CSVManager.downloadFile(json, `${project.name}.json`, 'application/json');
      toast('Proyecto exportado como JSON', 'success');
    }

    function importCSV(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;

        if (file.name.endsWith('.json')) {
          const imported = CSVManager.importProjectJSON(content);
          if (imported) {
            Object.assign(project, imported);
            recalculate();
            toast('Proyecto importado desde JSON', 'success');
          } else {
            toast('Error al importar JSON', 'error');
          }
        } else {
          const result = CSVManager.importTasks(content, project);
          if (result.errors.length > 0) {
            toast(result.errors.join('; '), 'error');
          }
          if (result.tasks.length > 0) {
            if (confirm(`Se importaran ${result.tasks.length} tareas. Esto reemplazara las tareas actuales. Continuar?`)) {
              project.tasks = result.tasks;
              recalculate();
              toast(`${result.tasks.length} tareas importadas`, 'success');
            }
          }
        }
        // Reset file input
        event.target.value = '';
      };
      reader.readAsText(file);
    }

    function importResourcesCSV(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = CSVManager.importResources(e.target.result);
        if (result.resources.length > 0) {
          project.resources = result.resources;
          recalculate();
          toast(`${result.resources.length} recursos importados`, 'success');
        }
        event.target.value = '';
      };
      reader.readAsText(file);
    }

    // Image export
    function exportGanttImage() {
      const ganttEl = document.getElementById('gantt-chart');
      if (!ganttEl) {
        toast('No hay diagrama para exportar', 'error');
        return;
      }

      // Crear canvas desde SVG
      const svgData = ganttEl.innerHTML;
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const padding = 40;
        canvas.width = img.width + padding * 2;
        canvas.height = img.height + padding * 2 + 60;
        const ctx = canvas.getContext('2d');

        // Fondo blanco
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header del proyecto
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, canvas.width, 50);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Segoe UI, Arial';
        ctx.fillText(project.name, padding, 32);
        ctx.font = '12px Segoe UI, Arial';
        ctx.fillText(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, canvas.width - 200, 32);

        // SVG del Gantt
        ctx.drawImage(img, padding, 60);

        // Descargar
        const link = document.createElement('a');
        link.download = `${project.name}_gantt.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        URL.revokeObjectURL(url);
        toast('Imagen del Gantt exportada', 'success');
      };

      img.src = url;
    }

    // S-Curve rendering (simple SVG)
    const scurveSvg = computed(() => {
      if (!project.tasks.length) return '';
      const data = EVMEngine.generateSCurveData(project);
      if (data.labels.length === 0) return '';

      const w = 700, h = 300, pad = 50;
      const maxVal = Math.max(...data.pv, ...data.ev, ...data.ac, 1);
      const xScale = (w - pad * 2) / Math.max(data.labels.length - 1, 1);
      const yScale = (h - pad * 2) / maxVal;

      const line = (points) => {
        if (points.length === 0) return '';
        return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${pad + i * xScale},${h - pad - p * yScale}`).join(' ');
      };

      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="width:100%;max-width:${w}px">`;
      // Grid
      for (let i = 0; i <= 5; i++) {
        const y = h - pad - (maxVal / 5 * i) * yScale;
        svg += `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="#eee" />`;
        svg += `<text x="${pad - 5}" y="${y + 4}" text-anchor="end" fill="#999" font-size="10">$${Math.round(maxVal / 5 * i)}</text>`;
      }
      // Axes
      svg += `<line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h - pad}" stroke="#333" />`;
      svg += `<line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="#333" />`;
      // Lines
      if (data.pv.length > 0) svg += `<path d="${line(data.pv)}" fill="none" stroke="#3498db" stroke-width="2" />`;
      if (data.ev.length > 0) svg += `<path d="${line(data.ev)}" fill="none" stroke="#27ae60" stroke-width="2" />`;
      if (data.ac.length > 0) svg += `<path d="${line(data.ac)}" fill="none" stroke="#e74c3c" stroke-width="2" />`;
      svg += '</svg>';
      return svg;
    });

    // Histogram data for resources
    const histogramData = computed(() => ResourceEngine.generateHistogramData(project));

    // LocalStorage persistence
    function saveToLocalStorage() {
      try {
        localStorage.setItem('pmi-gantt-project', JSON.stringify(project));
      } catch (e) {
        console.warn('No se pudo guardar en localStorage');
      }
    }

    function loadFromLocalStorage() {
      try {
        const saved = localStorage.getItem('pmi-gantt-project');
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.assign(project, parsed);
          return true;
        }
      } catch (e) {
        console.warn('No se pudo cargar desde localStorage');
      }
      return false;
    }

    // Auto-save on changes
    watch(() => JSON.stringify(project), () => {
      saveToLocalStorage();
    }, { deep: false });

    // Scale change
    watch(ganttScale, () => updateGantt());

    // Tab change
    watch(activeTab, (tab) => {
      if (tab === 'gantt') nextTick(() => updateGantt());
      if (tab === 'evm') updateEVM();
      if (tab === 'resources') checkOverallocations();
    });

    // Init
    onMounted(() => {
      const loaded = loadFromLocalStorage();
      if (loaded && project.tasks.length > 0) {
        recalculate();
        toast('Proyecto cargado desde guardado local', 'info');
      }
    });

    // Demo project
    function loadDemo() {
      if (project.tasks.length > 0 && !confirm('Se reemplazara el proyecto actual. Continuar?')) return;

      Object.assign(project, DataModel.createProject({
        name: 'Proyecto Demo - Sistema Web',
        startDate: '2026-04-01',
        statusDate: '2026-05-15',
      }));

      // Recursos
      project.resources = [
        DataModel.createResource({ name: 'Analista', type: 'work', costPerHour: 350, maxUnits: 100 }),
        DataModel.createResource({ name: 'Desarrollador Sr', type: 'work', costPerHour: 500, maxUnits: 100 }),
        DataModel.createResource({ name: 'Tester QA', type: 'work', costPerHour: 300, maxUnits: 100 }),
        DataModel.createResource({ name: 'DBA', type: 'work', costPerHour: 450, maxUnits: 100 }),
      ];

      // Tareas
      const t = (name, dur, opts = {}) => DataModel.createTask({ name, duration: dur, ...opts });

      // Fase 1: Inicio
      const f1 = t('Fase 1: Inicio', 0);
      const t1 = t('Definir alcance', 3, { plannedCost: 8400, actualCost: 8400, percentComplete: 100 });
      const t2 = t('Analisis de requisitos', 5, { plannedCost: 14000, actualCost: 15000, percentComplete: 100 });
      const t3 = t('Aprobacion del proyecto', 0, { isMilestone: true, plannedCost: 0, percentComplete: 100 });

      // Fase 2: Planificacion
      const f2 = t('Fase 2: Planificacion', 0);
      const t4 = t('Diseno de arquitectura', 5, { plannedCost: 20000, actualCost: 18000, percentComplete: 100 });
      const t5 = t('Diseno de base de datos', 4, { plannedCost: 14400, actualCost: 14000, percentComplete: 80 });
      const t6 = t('Plan de pruebas', 3, { plannedCost: 7200, actualCost: 5000, percentComplete: 60 });

      // Fase 3: Ejecucion
      const f3 = t('Fase 3: Ejecucion', 0);
      const t7 = t('Desarrollo backend', 15, { plannedCost: 60000, actualCost: 30000, percentComplete: 40 });
      const t8 = t('Desarrollo frontend', 12, { plannedCost: 48000, actualCost: 15000, percentComplete: 25 });
      const t9 = t('Integracion de BD', 5, { plannedCost: 18000, actualCost: 0, percentComplete: 0 });

      // Fase 4: Cierre
      const f4 = t('Fase 4: Cierre', 0);
      const t10 = t('Pruebas integrales', 8, { plannedCost: 19200, actualCost: 0, percentComplete: 0 });
      const t11 = t('Despliegue', 3, { plannedCost: 12000, actualCost: 0, percentComplete: 0 });
      const t12 = t('Cierre del proyecto', 0, { isMilestone: true, plannedCost: 0, percentComplete: 0 });

      // Jerarquia
      t1.parentId = f1.id; t2.parentId = f1.id; t3.parentId = f1.id;
      t4.parentId = f2.id; t5.parentId = f2.id; t6.parentId = f2.id;
      t7.parentId = f3.id; t8.parentId = f3.id; t9.parentId = f3.id;
      t10.parentId = f4.id; t11.parentId = f4.id; t12.parentId = f4.id;

      project.tasks = [f1, t1, t2, t3, f2, t4, t5, t6, f3, t7, t8, t9, f4, t10, t11, t12];

      // Dependencias (por referencia directa)
      t2.predecessors = [{ taskId: t1.id, type: 'FS', lag: 0 }];
      t3.predecessors = [{ taskId: t2.id, type: 'FS', lag: 0 }];
      t4.predecessors = [{ taskId: t3.id, type: 'FS', lag: 0 }];
      t5.predecessors = [{ taskId: t4.id, type: 'SS', lag: 2 }];
      t6.predecessors = [{ taskId: t4.id, type: 'FS', lag: 0 }];
      t7.predecessors = [{ taskId: t4.id, type: 'FS', lag: 0 }, { taskId: t5.id, type: 'FS', lag: 0 }];
      t8.predecessors = [{ taskId: t7.id, type: 'SS', lag: 3 }];
      t9.predecessors = [{ taskId: t5.id, type: 'FS', lag: 0 }, { taskId: t7.id, type: 'FS', lag: 0 }];
      t10.predecessors = [{ taskId: t7.id, type: 'FS', lag: 0 }, { taskId: t8.id, type: 'FS', lag: 0 }, { taskId: t9.id, type: 'FS', lag: 0 }];
      t11.predecessors = [{ taskId: t10.id, type: 'FS', lag: 0 }];
      t12.predecessors = [{ taskId: t11.id, type: 'FS', lag: 0 }];

      // Asignar recursos
      t1.resourceAssignments = [{ resourceId: project.resources[0].id, units: 100 }];
      t2.resourceAssignments = [{ resourceId: project.resources[0].id, units: 100 }];
      t4.resourceAssignments = [{ resourceId: project.resources[1].id, units: 100 }];
      t5.resourceAssignments = [{ resourceId: project.resources[3].id, units: 100 }];
      t6.resourceAssignments = [{ resourceId: project.resources[2].id, units: 100 }];
      t7.resourceAssignments = [{ resourceId: project.resources[1].id, units: 100 }];
      t8.resourceAssignments = [{ resourceId: project.resources[1].id, units: 100 }];
      t9.resourceAssignments = [{ resourceId: project.resources[3].id, units: 100 }];
      t10.resourceAssignments = [{ resourceId: project.resources[2].id, units: 100 }];
      t11.resourceAssignments = [{ resourceId: project.resources[1].id, units: 100 }];

      // Linea base
      recalculate();
      const bl = DataModel.createBaseline(project, 'Linea Base Original');
      project.baselines = [bl];

      recalculate();
      toast('Proyecto demo cargado', 'success');
    }

    return {
      // State
      activeTab, project, ganttScale, ganttSvg, evmMetrics, evmInterpretations,
      overallocations, toasts, showConfigModal, showTaskModal, editingTask,
      showResourceModal, editingResource, showAssignModal, assigningTask,
      // Computed
      orderedTasks, totalBudget, totalActualCost, criticalTasks, scurveSvg, histogramData,
      projectEndDate, projectDurationDays,
      // Methods
      toast, newProject, recalculate, updateGantt, updateEVM,
      addTask, addMilestone, deleteTask, indentTask, outdentTask,
      moveTaskUp, moveTaskDown, toggleCollapse,
      openTaskEdit, saveTaskEdit, onTaskFieldChange, getPredecessorString, getTaskRowNumber,
      addResource, editResource, saveResource, deleteResource,
      openAssignResources, isResourceAssigned, getAssignmentUnits,
      toggleResourceAssignment, updateAssignmentUnits, getResourceNames,
      saveBaseline, deleteBaseline, setActiveBaseline, levelResources,
      exportTasksCSV, exportResourcesCSV, exportEVMCSV, exportProjectJSON,
      importCSV, importResourcesCSV, exportGanttImage, loadDemo,
      // Helpers
      EVMEngine,
    };
  },
});

app.mount('#app');
