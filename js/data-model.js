/**
 * PMI Project Management - Data Models
 * Modelos de datos siguiendo PMBOK Guide
 */

const DataModel = {
  /**
   * Crea una nueva tarea con valores por defecto
   */
  createTask(overrides = {}) {
    return {
      id: overrides.id || DataModel.generateId(),
      wbsCode: overrides.wbsCode || '',
      name: overrides.name || 'Nueva Tarea',
      duration: overrides.duration ?? 1,
      startDate: overrides.startDate || null,
      endDate: overrides.endDate || null,
      predecessors: overrides.predecessors || [], // [{taskId, type:'FS'|'FF'|'SS'|'SF', lag:0}]
      resourceAssignments: overrides.resourceAssignments || [], // [{resourceId, units: 100}]
      plannedCost: overrides.plannedCost ?? 0,
      actualCost: overrides.actualCost ?? 0,
      percentComplete: overrides.percentComplete ?? 0,
      isMilestone: overrides.isMilestone ?? false,
      isSummary: overrides.isSummary ?? false,
      parentId: overrides.parentId || null,
      notes: overrides.notes || '',
      // Campos calculados por el motor de cronograma
      earlyStart: null,
      earlyFinish: null,
      lateStart: null,
      lateFinish: null,
      totalFloat: null,
      freeFloat: null,
      isCritical: false,
      // UI state
      collapsed: false,
      level: overrides.level ?? 0,
    };
  },

  /**
   * Crea un nuevo recurso
   */
  createResource(overrides = {}) {
    return {
      id: overrides.id || DataModel.generateId(),
      name: overrides.name || 'Nuevo Recurso',
      type: overrides.type || 'work', // 'work' | 'material'
      costPerHour: overrides.costPerHour ?? 0,
      maxUnits: overrides.maxUnits ?? 100, // % disponibilidad
    };
  },

  /**
   * Crea una dependencia entre tareas
   */
  createDependency(fromId, toId, type = 'FS', lag = 0) {
    return { taskId: fromId, type, lag };
  },

  /**
   * Crea una linea base (snapshot del proyecto)
   */
  createBaseline(project, name = '') {
    const tasks = project.tasks.map(t => ({
      id: t.id,
      startDate: t.startDate,
      endDate: t.endDate,
      duration: t.duration,
      plannedCost: t.plannedCost,
      percentComplete: t.percentComplete,
    }));
    return {
      id: DataModel.generateId(),
      name: name || `Linea Base ${new Date().toLocaleDateString('es-MX')}`,
      createdAt: new Date().toISOString(),
      tasks,
      totalBudget: tasks.reduce((sum, t) => sum + (t.plannedCost || 0), 0),
    };
  },

  /**
   * Crea un proyecto nuevo
   */
  createProject(overrides = {}) {
    return {
      name: overrides.name || 'Nuevo Proyecto',
      startDate: overrides.startDate || new Date().toISOString().split('T')[0],
      tasks: overrides.tasks || [],
      resources: overrides.resources || [],
      baselines: overrides.baselines || [],
      statusDate: overrides.statusDate || new Date().toISOString().split('T')[0],
      calendarWorkdays: overrides.calendarWorkdays || [1, 2, 3, 4, 5], // Lun-Vie
      hoursPerDay: overrides.hoursPerDay ?? 8,
    };
  },

  /**
   * Genera un ID unico
   */
  generateId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
  },

  /**
   * Obtiene las sub-tareas directas de una tarea
   */
  getChildren(tasks, parentId) {
    return tasks.filter(t => t.parentId === parentId);
  },

  /**
   * Obtiene todas las tareas descendientes (recursivo)
   */
  getDescendants(tasks, parentId) {
    const children = DataModel.getChildren(tasks, parentId);
    let all = [...children];
    children.forEach(c => {
      all = all.concat(DataModel.getDescendants(tasks, c.id));
    });
    return all;
  },

  /**
   * Obtiene las tareas raiz (sin padre)
   */
  getRootTasks(tasks) {
    return tasks.filter(t => !t.parentId);
  },

  /**
   * Recalcula codigos WBS para todas las tareas
   */
  recalculateWBS(tasks) {
    const assignWBS = (parentId, prefix) => {
      const children = tasks.filter(t => t.parentId === parentId);
      children.sort((a, b) => tasks.indexOf(a) - tasks.indexOf(b));
      children.forEach((child, index) => {
        const code = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
        child.wbsCode = code;
        child.level = code.split('.').length - 1;
        // Marcar como resumen si tiene hijos
        const hasChildren = tasks.some(t => t.parentId === child.id);
        child.isSummary = hasChildren;
        assignWBS(child.id, code);
      });
    };
    assignWBS(null, '');
  },

  /**
   * Obtiene tareas ordenadas jerarquicamente para la tabla
   */
  getOrderedTasks(tasks) {
    const result = [];
    const addWithChildren = (parentId, level) => {
      const children = tasks.filter(t => t.parentId === parentId);
      children.forEach(child => {
        child.level = level;
        result.push(child);
        if (!child.collapsed) {
          addWithChildren(child.id, level + 1);
        }
      });
    };
    addWithChildren(null, 0);
    return result;
  },

  /**
   * Valida que no haya dependencias circulares
   */
  hasCircularDependency(tasks, taskId, visited = new Set()) {
    if (visited.has(taskId)) return true;
    visited.add(taskId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;
    // Buscar tareas que dependen de esta
    const dependents = tasks.filter(t =>
      t.predecessors.some(p => p.taskId === taskId)
    );
    for (const dep of dependents) {
      if (DataModel.hasCircularDependency(tasks, dep.id, new Set(visited))) {
        return true;
      }
    }
    return false;
  },
};
