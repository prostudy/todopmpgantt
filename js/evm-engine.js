/**
 * PMI Earned Value Management (EVM) Engine
 * Implementa metricas de valor ganado segun PMBOK Guide
 */

const EVMEngine = {
  /**
   * Calcula todas las metricas EVM del proyecto
   * @param {Object} project - Proyecto con tareas y linea base
   * @returns {Object} Metricas EVM completas
   */
  calculate(project) {
    const baseline = project.baselines.length > 0 ? project.baselines[0] : null;
    const tasks = project.tasks.filter(t => !t.isSummary);
    const statusDate = new Date(project.statusDate + 'T00:00:00');

    // BAC - Budget at Completion (presupuesto total)
    const BAC = tasks.reduce((sum, t) => sum + (t.plannedCost || 0), 0);

    // PV - Planned Value (valor planificado a la fecha de estado)
    const PV = this.calculatePV(tasks, baseline, statusDate, project);

    // EV - Earned Value (valor ganado = % completado * BAC de cada tarea)
    const EV = tasks.reduce((sum, t) => {
      return sum + ((t.percentComplete || 0) / 100) * (t.plannedCost || 0);
    }, 0);

    // AC - Actual Cost (costo real)
    const AC = tasks.reduce((sum, t) => sum + (t.actualCost || 0), 0);

    // Varianzas
    const SV = EV - PV;  // Schedule Variance
    const CV = EV - AC;  // Cost Variance

    // Indices de desempeno
    const SPI = PV !== 0 ? EV / PV : 0;  // Schedule Performance Index
    const CPI = AC !== 0 ? EV / AC : 0;  // Cost Performance Index

    // Estimaciones a completar
    const EAC = CPI !== 0 ? BAC / CPI : BAC;  // Estimate at Completion
    const ETC = EAC - AC;  // Estimate to Complete
    const VAC = BAC - EAC; // Variance at Completion

    // TCPI - To-Complete Performance Index (basado en BAC)
    const TCPI_BAC = (BAC - AC) !== 0 ? (BAC - EV) / (BAC - AC) : 0;
    // TCPI basado en EAC
    const TCPI_EAC = (EAC - AC) !== 0 ? (BAC - EV) / (EAC - AC) : 0;

    // Porcentaje completado del proyecto
    const percentComplete = BAC > 0 ? (EV / BAC) * 100 : 0;
    const percentSpent = BAC > 0 ? (AC / BAC) * 100 : 0;

    return {
      BAC: this.round(BAC),
      PV: this.round(PV),
      EV: this.round(EV),
      AC: this.round(AC),
      SV: this.round(SV),
      CV: this.round(CV),
      SPI: this.round(SPI, 3),
      CPI: this.round(CPI, 3),
      EAC: this.round(EAC),
      ETC: this.round(ETC),
      VAC: this.round(VAC),
      TCPI_BAC: this.round(TCPI_BAC, 3),
      TCPI_EAC: this.round(TCPI_EAC, 3),
      percentComplete: this.round(percentComplete, 1),
      percentSpent: this.round(percentSpent, 1),
    };
  },

  /**
   * Calcula PV (Planned Value) acumulado a la fecha de estado
   * Usa distribucion lineal del costo sobre la duracion de cada tarea
   */
  calculatePV(tasks, baseline, statusDate, project) {
    let pv = 0;
    for (const task of tasks) {
      const bTask = baseline ? baseline.tasks.find(bt => bt.id === task.id) : null;
      const startStr = bTask ? bTask.startDate : task.startDate;
      const endStr = bTask ? bTask.endDate : task.endDate;
      const cost = bTask ? bTask.plannedCost : task.plannedCost;

      if (!startStr || !endStr || !cost) continue;

      const start = new Date(startStr + 'T00:00:00');
      const end = new Date(endStr + 'T00:00:00');

      if (statusDate >= end) {
        // Tarea completamente pasada
        pv += cost;
      } else if (statusDate > start) {
        // Tarea parcialmente en progreso - distribucion lineal
        const totalDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
        const elapsedDays = (statusDate - start) / (1000 * 60 * 60 * 24);
        pv += cost * (elapsedDays / totalDays);
      }
      // Si statusDate <= start, PV = 0 para esta tarea
    }
    return pv;
  },

  /**
   * Genera datos para la curva S (PV, EV, AC acumulados en el tiempo)
   */
  generateSCurveData(project) {
    const tasks = project.tasks.filter(t => !t.isSummary);
    const baseline = project.baselines.length > 0 ? project.baselines[0] : null;

    // Encontrar rango de fechas
    const allDates = tasks
      .filter(t => t.startDate && t.endDate)
      .flatMap(t => [new Date(t.startDate), new Date(t.endDate)]);

    if (allDates.length === 0) return { labels: [], pv: [], ev: [], ac: [] };

    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));

    // Generar puntos semanales
    const labels = [];
    const pvData = [];
    const evData = [];
    const acData = [];

    const current = new Date(minDate);
    const statusDate = new Date(project.statusDate + 'T00:00:00');

    while (current <= maxDate) {
      labels.push(current.toISOString().split('T')[0]);

      // PV acumulado a esta fecha
      let pv = 0;
      for (const task of tasks) {
        const bTask = baseline ? baseline.tasks.find(bt => bt.id === task.id) : null;
        const startStr = bTask ? bTask.startDate : task.startDate;
        const endStr = bTask ? bTask.endDate : task.endDate;
        const cost = bTask ? bTask.plannedCost : task.plannedCost;
        if (!startStr || !endStr || !cost) continue;
        const start = new Date(startStr + 'T00:00:00');
        const end = new Date(endStr + 'T00:00:00');
        if (current >= end) {
          pv += cost;
        } else if (current > start) {
          const total = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
          const elapsed = (current - start) / (1000 * 60 * 60 * 24);
          pv += cost * (elapsed / total);
        }
      }
      pvData.push(Math.round(pv * 100) / 100);

      // EV y AC solo hasta la fecha de estado
      if (current <= statusDate) {
        const ev = tasks.reduce((sum, t) => {
          if (!t.startDate) return sum;
          const start = new Date(t.startDate + 'T00:00:00');
          if (current < start) return sum;
          return sum + ((t.percentComplete || 0) / 100) * (t.plannedCost || 0);
        }, 0);
        evData.push(Math.round(ev * 100) / 100);

        const ac = tasks.reduce((sum, t) => {
          if (!t.startDate) return sum;
          const start = new Date(t.startDate + 'T00:00:00');
          if (current < start) return sum;
          return sum + (t.actualCost || 0);
        }, 0);
        acData.push(Math.round(ac * 100) / 100);
      }

      current.setDate(current.getDate() + 7); // Semanal
    }

    return { labels, pv: pvData, ev: evData, ac: acData };
  },

  /**
   * Determina el estado semaforo de una metrica
   */
  getStatus(value, type) {
    switch (type) {
      case 'SPI':
      case 'CPI':
        if (value >= 0.95) return 'green';
        if (value >= 0.8) return 'yellow';
        return 'red';
      case 'SV':
      case 'CV':
        if (value >= 0) return 'green';
        if (value >= -Math.abs(value * 0.1)) return 'yellow';
        return 'red';
      default:
        return 'gray';
    }
  },

  /**
   * Interpreta una metrica EVM en texto
   */
  interpret(metrics) {
    const interpretations = [];

    if (metrics.SPI > 1) interpretations.push('El proyecto esta adelantado en cronograma');
    else if (metrics.SPI < 1) interpretations.push('El proyecto esta atrasado en cronograma');
    else interpretations.push('El proyecto esta en tiempo');

    if (metrics.CPI > 1) interpretations.push('El proyecto esta por debajo del presupuesto');
    else if (metrics.CPI < 1) interpretations.push('El proyecto esta por encima del presupuesto');
    else interpretations.push('El proyecto esta en presupuesto');

    if (metrics.EAC > metrics.BAC) {
      interpretations.push(`Se estima un sobrecosto de $${(metrics.EAC - metrics.BAC).toFixed(2)}`);
    }

    return interpretations;
  },

  round(value, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  },
};
