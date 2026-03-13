/**
 * PMI Schedule Engine
 * Implementa CPM (Critical Path Method), Forward/Backward Pass,
 * calculo de holguras y dependencias segun PMBOK
 */

const ScheduleEngine = {
  /**
   * Calcula el cronograma completo del proyecto
   * @param {Object} project - Proyecto con tasks y configuracion
   * @returns {Object} project actualizado con fechas calculadas
   */
  calculate(project) {
    const tasks = project.tasks;
    if (tasks.length === 0) return project;

    // 1. Calcular tareas resumen desde sub-tareas
    this.calculateSummaryTasks(tasks);

    // 2. Ordenar topologicamente (respetar dependencias)
    const sorted = this.topologicalSort(tasks);
    if (!sorted) {
      console.warn('Se detectaron dependencias circulares');
      return project;
    }

    // 3. Forward Pass - Calcular ES/EF
    this.forwardPass(sorted, project);

    // 4. Backward Pass - Calcular LS/LF
    this.backwardPass(sorted, project);

    // 5. Calcular holguras y ruta critica
    this.calculateFloats(tasks);

    // 6. Calcular fechas reales desde ES/EF usando calendario
    this.calculateDates(tasks, project);

    return project;
  },

  /**
   * Forward Pass: Calcula Early Start (ES) y Early Finish (EF)
   * ES = max(EF de todos los predecesores + lag, segun tipo de dependencia)
   * EF = ES + duracion
   */
  forwardPass(sortedTasks, project) {
    const taskMap = new Map(project.tasks.map(t => [t.id, t]));

    for (const task of sortedTasks) {
      if (task.isSummary) continue;

      let es = 0;

      if (task.predecessors.length === 0) {
        es = 0;
      } else {
        for (const pred of task.predecessors) {
          const predTask = taskMap.get(pred.taskId);
          if (!predTask) continue;

          let predDate = 0;
          switch (pred.type) {
            case 'FS': // Finish-to-Start
              predDate = (predTask.earlyFinish ?? 0) + (pred.lag || 0);
              break;
            case 'FF': // Finish-to-Finish
              predDate = (predTask.earlyFinish ?? 0) + (pred.lag || 0) - task.duration;
              break;
            case 'SS': // Start-to-Start
              predDate = (predTask.earlyStart ?? 0) + (pred.lag || 0);
              break;
            case 'SF': // Start-to-Finish
              predDate = (predTask.earlyStart ?? 0) + (pred.lag || 0) - task.duration;
              break;
          }
          es = Math.max(es, predDate);
        }
      }

      task.earlyStart = es;
      task.earlyFinish = es + task.duration;
    }
  },

  /**
   * Backward Pass: Calcula Late Start (LS) y Late Finish (LF)
   * LF = min(LS de todos los sucesores - lag, segun tipo)
   * LS = LF - duracion
   */
  backwardPass(sortedTasks, project) {
    const taskMap = new Map(project.tasks.map(t => [t.id, t]));

    // Encontrar el EF maximo del proyecto
    const maxEF = Math.max(...sortedTasks.filter(t => !t.isSummary).map(t => t.earlyFinish ?? 0));

    // Construir mapa de sucesores
    const successorMap = new Map();
    for (const task of project.tasks) {
      for (const pred of task.predecessors) {
        if (!successorMap.has(pred.taskId)) {
          successorMap.set(pred.taskId, []);
        }
        successorMap.get(pred.taskId).push({ task, type: pred.type, lag: pred.lag || 0 });
      }
    }

    // Recorrer en orden inverso
    for (let i = sortedTasks.length - 1; i >= 0; i--) {
      const task = sortedTasks[i];
      if (task.isSummary) continue;

      const successors = successorMap.get(task.id);

      if (!successors || successors.length === 0) {
        task.lateFinish = maxEF;
      } else {
        let lf = Infinity;
        for (const succ of successors) {
          let succDate = Infinity;
          switch (succ.type) {
            case 'FS': // Finish-to-Start
              succDate = (succ.task.lateStart ?? maxEF) - (succ.lag || 0);
              break;
            case 'FF': // Finish-to-Finish
              succDate = (succ.task.lateFinish ?? maxEF) - (succ.lag || 0);
              break;
            case 'SS': // Start-to-Start
              succDate = (succ.task.lateStart ?? maxEF) - (succ.lag || 0) + task.duration;
              break;
            case 'SF': // Start-to-Finish
              succDate = (succ.task.lateFinish ?? maxEF) - (succ.lag || 0) + task.duration;
              break;
          }
          lf = Math.min(lf, succDate);
        }
        task.lateFinish = lf;
      }

      task.lateStart = task.lateFinish - task.duration;
    }
  },

  /**
   * Calcula holgura total, holgura libre y ruta critica
   */
  calculateFloats(tasks) {
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Construir mapa de sucesores
    const successorMap = new Map();
    for (const task of tasks) {
      for (const pred of task.predecessors) {
        if (!successorMap.has(pred.taskId)) {
          successorMap.set(pred.taskId, []);
        }
        successorMap.get(pred.taskId).push(task);
      }
    }

    for (const task of tasks) {
      if (task.isSummary) {
        // Resumen hereda criticidad de sub-tareas
        const children = tasks.filter(t => t.parentId === task.id);
        task.isCritical = children.some(c => c.isCritical);
        task.totalFloat = children.length > 0 ? Math.min(...children.map(c => c.totalFloat ?? 0)) : 0;
        task.freeFloat = task.totalFloat;
        continue;
      }

      // Holgura Total = LS - ES (o LF - EF)
      task.totalFloat = (task.lateStart ?? 0) - (task.earlyStart ?? 0);

      // Holgura Libre = min(ES de sucesores) - EF
      const successors = successorMap.get(task.id);
      if (successors && successors.length > 0) {
        const minSuccES = Math.min(...successors.map(s => s.earlyStart ?? 0));
        task.freeFloat = minSuccES - (task.earlyFinish ?? 0);
      } else {
        task.freeFloat = task.totalFloat;
      }

      // Tarea critica = holgura total <= 0
      task.isCritical = Math.abs(task.totalFloat) < 0.001;
    }
  },

  /**
   * Convierte ES/EF (en dias de trabajo) a fechas calendario
   */
  calculateDates(tasks, project) {
    const startDate = new Date(project.startDate + 'T00:00:00');
    const workdays = project.calendarWorkdays;

    for (const task of tasks) {
      if (task.isSummary) {
        // Resumen: fechas de min/max de sub-tareas
        const children = tasks.filter(t => t.parentId === task.id);
        const leafDescendants = this.getLeafDescendants(tasks, task.id);
        if (leafDescendants.length > 0) {
          const starts = leafDescendants.filter(c => c.startDate).map(c => new Date(c.startDate));
          const ends = leafDescendants.filter(c => c.endDate).map(c => new Date(c.endDate));
          if (starts.length > 0) task.startDate = new Date(Math.min(...starts)).toISOString().split('T')[0];
          if (ends.length > 0) task.endDate = new Date(Math.max(...ends)).toISOString().split('T')[0];
          task.duration = this.getWorkdaysBetween(new Date(task.startDate), new Date(task.endDate), workdays);
        }
        continue;
      }

      if (task.earlyStart != null) {
        task.startDate = this.addWorkdays(startDate, task.earlyStart, workdays);
        task.endDate = this.addWorkdays(startDate, task.earlyFinish, workdays);
      }
    }
  },

  /**
   * Obtiene descendientes hoja (sin sub-tareas)
   */
  getLeafDescendants(tasks, parentId) {
    const result = [];
    const children = tasks.filter(t => t.parentId === parentId);
    for (const child of children) {
      if (child.isSummary) {
        result.push(...this.getLeafDescendants(tasks, child.id));
      } else {
        result.push(child);
      }
    }
    return result;
  },

  /**
   * Suma dias laborables a una fecha, respetando el calendario
   */
  addWorkdays(startDate, workdays, calendarWorkdays) {
    const date = new Date(startDate);
    let added = 0;
    while (added < workdays) {
      date.setDate(date.getDate() + 1);
      if (calendarWorkdays.includes(date.getDay())) {
        added++;
      }
    }
    // Si workdays es 0, la fecha es la misma de inicio (ajustada al dia laboral mas cercano)
    if (workdays === 0) {
      while (!calendarWorkdays.includes(date.getDay())) {
        date.setDate(date.getDate() + 1);
      }
    }
    return date.toISOString().split('T')[0];
  },

  /**
   * Calcula dias laborables entre dos fechas
   */
  getWorkdaysBetween(start, end, calendarWorkdays) {
    let count = 0;
    const current = new Date(start);
    while (current < end) {
      current.setDate(current.getDate() + 1);
      if (calendarWorkdays.includes(current.getDay())) {
        count++;
      }
    }
    return count;
  },

  /**
   * Ordena tareas topologicamente (respetando dependencias)
   * Retorna null si hay ciclos
   */
  topologicalSort(tasks) {
    const nonSummary = tasks.filter(t => !t.isSummary);
    const taskMap = new Map(nonSummary.map(t => [t.id, t]));
    const inDegree = new Map();
    const adjList = new Map();

    // Inicializar
    for (const task of nonSummary) {
      inDegree.set(task.id, 0);
      adjList.set(task.id, []);
    }

    // Construir grafo
    for (const task of nonSummary) {
      for (const pred of task.predecessors) {
        if (taskMap.has(pred.taskId)) {
          adjList.get(pred.taskId).push(task.id);
          inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
        }
      }
    }

    // BFS (Kahn's algorithm)
    const queue = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }

    const sorted = [];
    while (queue.length > 0) {
      const current = queue.shift();
      sorted.push(taskMap.get(current));
      for (const neighbor of (adjList.get(current) || [])) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Si no se procesaron todas, hay ciclo
    if (sorted.length !== nonSummary.length) return null;
    return sorted;
  },

  /**
   * Calcula duracion y fechas de tareas resumen
   */
  calculateSummaryTasks(tasks) {
    // Recorrer de hojas a raiz
    const process = (parentId) => {
      const children = tasks.filter(t => t.parentId === parentId);
      for (const child of children) {
        if (child.isSummary || tasks.some(t => t.parentId === child.id)) {
          child.isSummary = true;
          process(child.id);
          // Calcular costo planificado del resumen
          const descendants = tasks.filter(t => t.parentId === child.id);
          child.plannedCost = descendants.reduce((s, d) => s + (d.plannedCost || 0), 0);
          child.actualCost = descendants.reduce((s, d) => s + (d.actualCost || 0), 0);
          // Calcular % completado ponderado por duracion
          const totalDur = descendants.reduce((s, d) => s + (d.duration || 0), 0);
          child.percentComplete = totalDur > 0
            ? Math.round(descendants.reduce((s, d) => s + (d.percentComplete || 0) * (d.duration || 0), 0) / totalDur)
            : 0;
        }
      }
    };
    process(null);
  },

  /**
   * Parsea un string de predecesores (e.g., "1FS+2,3SS-1,5")
   * Retorna array de {taskId, type, lag}
   */
  parsePredecessorString(predString, tasks) {
    if (!predString || predString.trim() === '') return [];
    const parts = predString.split(',').map(s => s.trim()).filter(Boolean);
    const result = [];

    for (const part of parts) {
      const match = part.match(/^(\d+)\s*(FS|FF|SS|SF)?\s*([+-]\d+)?$/i);
      if (match) {
        const rowNum = parseInt(match[1]);
        const type = (match[2] || 'FS').toUpperCase();
        const lag = parseInt(match[3] || '0');

        // Buscar tarea por numero de fila (indice + 1)
        if (rowNum >= 1 && rowNum <= tasks.length) {
          const targetTask = tasks[rowNum - 1];
          if (targetTask) {
            result.push({ taskId: targetTask.id, type, lag });
          }
        }
      }
    }
    return result;
  },

  /**
   * Formatea predecesores a string legible
   */
  formatPredecessors(predecessors, tasks) {
    return predecessors.map(pred => {
      const idx = tasks.findIndex(t => t.id === pred.taskId);
      if (idx === -1) return '';
      let str = `${idx + 1}`;
      if (pred.type && pred.type !== 'FS') str += pred.type;
      if (pred.lag && pred.lag !== 0) str += (pred.lag > 0 ? '+' : '') + pred.lag;
      return str;
    }).filter(Boolean).join(', ');
  },
};
