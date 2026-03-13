/**
 * PMI Resource Management Engine
 * Gestion de recursos, deteccion de sobreasignacion y nivelacion
 */

const ResourceEngine = {
  /**
   * Calcula la carga de cada recurso por periodo
   * @returns {Map} resourceId -> [{date, load, tasks}]
   */
  calculateResourceLoad(project) {
    const loadMap = new Map();
    const tasks = project.tasks.filter(t => !t.isSummary && t.startDate && t.endDate);

    for (const resource of project.resources) {
      loadMap.set(resource.id, []);
    }

    // Para cada dia laboral, sumar la carga de cada recurso
    const allDates = tasks.flatMap(t => [new Date(t.startDate + 'T00:00:00'), new Date(t.endDate + 'T00:00:00')]);
    if (allDates.length === 0) return loadMap;

    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    const workdays = project.calendarWorkdays;

    const current = new Date(minDate);
    while (current <= maxDate) {
      if (workdays.includes(current.getDay())) {
        const dateStr = current.toISOString().split('T')[0];

        for (const resource of project.resources) {
          let totalLoad = 0;
          const assignedTasks = [];

          for (const task of tasks) {
            const start = new Date(task.startDate + 'T00:00:00');
            const end = new Date(task.endDate + 'T00:00:00');

            if (current >= start && current <= end) {
              const assignment = task.resourceAssignments.find(a => a.resourceId === resource.id);
              if (assignment) {
                totalLoad += assignment.units;
                assignedTasks.push(task.name);
              }
            }
          }

          if (totalLoad > 0) {
            const entries = loadMap.get(resource.id) || [];
            entries.push({
              date: dateStr,
              load: totalLoad,
              tasks: assignedTasks,
              overallocated: totalLoad > resource.maxUnits,
            });
            loadMap.set(resource.id, entries);
          }
        }
      }
      current.setDate(current.getDate() + 1);
    }

    return loadMap;
  },

  /**
   * Detecta recursos sobreasignados
   * @returns {Array} [{resourceId, resourceName, date, load, maxUnits}]
   */
  detectOverallocation(project) {
    const loadMap = this.calculateResourceLoad(project);
    const conflicts = [];

    for (const resource of project.resources) {
      const entries = loadMap.get(resource.id) || [];
      for (const entry of entries) {
        if (entry.overallocated) {
          conflicts.push({
            resourceId: resource.id,
            resourceName: resource.name,
            date: entry.date,
            load: entry.load,
            maxUnits: resource.maxUnits,
            tasks: entry.tasks,
          });
        }
      }
    }

    return conflicts;
  },

  /**
   * Nivelacion de recursos basica
   * Retrasa tareas no criticas para resolver sobreasignaciones
   * Algoritmo: prioridad por holgura total (mayor holgura se retrasa primero)
   */
  levelResources(project) {
    const tasks = project.tasks.filter(t => !t.isSummary);
    let conflicts = this.detectOverallocation(project);
    let iterations = 0;
    const maxIterations = 100;

    while (conflicts.length > 0 && iterations < maxIterations) {
      // Agrupar conflictos por recurso y fecha
      const conflict = conflicts[0];

      // Encontrar tareas no criticas asignadas a este recurso en esta fecha
      const conflictDate = new Date(conflict.date + 'T00:00:00');
      const candidateTasks = tasks.filter(t => {
        if (t.isCritical || !t.startDate || !t.endDate) return false;
        const start = new Date(t.startDate + 'T00:00:00');
        const end = new Date(t.endDate + 'T00:00:00');
        if (conflictDate < start || conflictDate > end) return false;
        return t.resourceAssignments.some(a => a.resourceId === conflict.resourceId);
      });

      if (candidateTasks.length === 0) break;

      // Retrasar la tarea con mayor holgura
      candidateTasks.sort((a, b) => (b.totalFloat || 0) - (a.totalFloat || 0));
      const taskToDelay = candidateTasks[0];

      if ((taskToDelay.totalFloat || 0) <= 0) break;

      // Retrasar 1 dia
      const newStart = new Date(taskToDelay.startDate + 'T00:00:00');
      newStart.setDate(newStart.getDate() + 1);
      // Saltar fines de semana
      while (!project.calendarWorkdays.includes(newStart.getDay())) {
        newStart.setDate(newStart.getDate() + 1);
      }
      taskToDelay.startDate = newStart.toISOString().split('T')[0];

      const newEnd = new Date(taskToDelay.endDate + 'T00:00:00');
      newEnd.setDate(newEnd.getDate() + 1);
      while (!project.calendarWorkdays.includes(newEnd.getDay())) {
        newEnd.setDate(newEnd.getDate() + 1);
      }
      taskToDelay.endDate = newEnd.toISOString().split('T')[0];

      // Recalcular
      conflicts = this.detectOverallocation(project);
      iterations++;
    }

    return {
      resolved: conflicts.length === 0,
      remainingConflicts: conflicts.length,
      iterations,
    };
  },

  /**
   * Genera datos para histograma de recursos (para visualizacion)
   * @returns {Object} {labels: [], datasets: [{resourceName, data: []}]}
   */
  generateHistogramData(project) {
    const loadMap = this.calculateResourceLoad(project);
    const allDates = new Set();

    for (const entries of loadMap.values()) {
      entries.forEach(e => allDates.add(e.date));
    }

    const labels = [...allDates].sort();
    const datasets = [];

    for (const resource of project.resources) {
      const entries = loadMap.get(resource.id) || [];
      const data = labels.map(date => {
        const entry = entries.find(e => e.date === date);
        return entry ? entry.load : 0;
      });
      datasets.push({
        resourceId: resource.id,
        resourceName: resource.name,
        maxUnits: resource.maxUnits,
        data,
      });
    }

    return { labels, datasets };
  },

  /**
   * Calcula el costo de un recurso en una tarea
   */
  calculateResourceCost(task, resource, project) {
    const assignment = task.resourceAssignments.find(a => a.resourceId === resource.id);
    if (!assignment) return 0;

    const hours = task.duration * project.hoursPerDay * (assignment.units / 100);
    return hours * resource.costPerHour;
  },

  /**
   * Calcula el costo total de recursos para una tarea
   */
  calculateTaskResourceCost(task, project) {
    return task.resourceAssignments.reduce((sum, assignment) => {
      const resource = project.resources.find(r => r.id === assignment.resourceId);
      if (!resource) return sum;
      return sum + this.calculateResourceCost(task, resource, project);
    }, 0);
  },
};
