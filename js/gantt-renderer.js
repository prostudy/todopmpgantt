/**
 * Gantt Chart SVG Renderer
 * Renderiza diagrama de Gantt profesional usando SVG
 */

const GanttRenderer = {
  config: {
    rowHeight: 32,
    headerHeight: 50,
    dayWidth: 28,
    weekWidth: 28 * 7,
    monthWidth: 28 * 30,
    leftPanelWidth: 0, // Se calcula dinamicamente
    barHeight: 18,
    barRadius: 3,
    milestoneSize: 12,
    colors: {
      critical: '#e74c3c',
      normal: '#3498db',
      summary: '#2c3e50',
      milestone: '#e67e22',
      progress: '#27ae60',
      baseline: '#bdc3c7',
      todayLine: '#e74c3c',
      gridLine: '#ecf0f1',
      headerBg: '#34495e',
      headerText: '#ffffff',
      weekendBg: '#f8f9fa',
      dependencyLine: '#7f8c8d',
    },
  },

  /**
   * Renderiza el diagrama de Gantt completo
   * @param {Object} project - Proyecto con tareas calculadas
   * @param {string} scale - 'day' | 'week' | 'month'
   * @returns {string} SVG markup
   */
  render(project, scale = 'day') {
    const tasks = DataModel.getOrderedTasks(project.tasks);
    if (tasks.length === 0) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="100"><text x="300" y="50" text-anchor="middle" fill="#999" font-size="14">No hay tareas para mostrar</text></svg>';
    }

    const cfg = this.config;
    const dates = this.getDateRange(tasks, project);
    if (!dates) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="100"><text x="300" y="50" text-anchor="middle" fill="#999" font-size="14">Calcule el cronograma primero</text></svg>';
    }

    const unitWidth = scale === 'day' ? cfg.dayWidth : scale === 'week' ? cfg.dayWidth * 2 : cfg.dayWidth * 0.8;
    const totalDays = Math.ceil((dates.end - dates.start) / (1000 * 60 * 60 * 24)) + 2;
    const chartWidth = totalDays * unitWidth;
    const chartHeight = tasks.length * cfg.rowHeight;
    const svgWidth = chartWidth + 20;
    const svgHeight = chartHeight + cfg.headerHeight + 20;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px;">`;

    // Definir filtros y marcadores
    svg += this.renderDefs();

    // Header temporal
    svg += this.renderTimeHeader(dates, totalDays, unitWidth, scale);

    // Grid y fines de semana
    svg += this.renderGrid(dates, totalDays, unitWidth, tasks.length, scale, project);

    // Linea de hoy
    svg += this.renderTodayLine(dates, unitWidth, chartHeight);

    // Linea base (si existe)
    const baseline = project.baselines.length > 0 ? project.baselines[0] : null;

    // Barras de tareas
    const g = `<g transform="translate(0, ${cfg.headerHeight})">`;
    svg += g;

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      svg += this.renderTaskBar(task, i, dates, unitWidth, baseline, project);
    }

    // Lineas de dependencia
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      for (const pred of task.predecessors) {
        const predIdx = tasks.findIndex(t => t.id === pred.taskId);
        if (predIdx >= 0) {
          svg += this.renderDependencyLine(tasks[predIdx], predIdx, task, i, dates, unitWidth, pred.type);
        }
      }
    }

    svg += '</g>';
    svg += '</svg>';

    return svg;
  },

  /**
   * Renderiza SVG defs (marcadores, filtros)
   */
  renderDefs() {
    return `
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="${this.config.colors.dependencyLine}" />
        </marker>
        <filter id="shadow" x="-2%" y="-2%" width="104%" height="104%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.15" />
        </filter>
      </defs>`;
  },

  /**
   * Renderiza el header con escala temporal
   */
  renderTimeHeader(dates, totalDays, unitWidth, scale) {
    const cfg = this.config;
    let svg = '';

    // Fondo del header
    svg += `<rect x="0" y="0" width="${totalDays * unitWidth + 20}" height="${cfg.headerHeight}" fill="${cfg.colors.headerBg}" />`;

    const current = new Date(dates.start);
    let x = 10;

    if (scale === 'day') {
      // Fila superior: Meses
      let monthStart = x;
      let lastMonth = current.getMonth();
      let lastMonthX = x;

      for (let d = 0; d < totalDays; d++) {
        const date = new Date(dates.start);
        date.setDate(date.getDate() + d);

        if (date.getMonth() !== lastMonth || d === totalDays - 1) {
          const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          const midX = (lastMonthX + d * unitWidth + 10) / 2;
          svg += `<text x="${midX}" y="15" text-anchor="middle" fill="${cfg.colors.headerText}" font-size="11" font-weight="bold">${monthNames[lastMonth]} ${date.getFullYear()}</text>`;
          svg += `<line x1="${d * unitWidth + 10}" y1="0" x2="${d * unitWidth + 10}" y2="25" stroke="${cfg.colors.headerText}" stroke-opacity="0.3" />`;
          lastMonth = date.getMonth();
          lastMonthX = d * unitWidth + 10;
        }
      }

      // Fila inferior: Dias
      for (let d = 0; d < totalDays; d++) {
        const date = new Date(dates.start);
        date.setDate(date.getDate() + d);
        const dayX = d * unitWidth + 10 + unitWidth / 2;
        svg += `<text x="${dayX}" y="${cfg.headerHeight - 5}" text-anchor="middle" fill="${cfg.colors.headerText}" font-size="9">${date.getDate()}</text>`;
      }
    } else if (scale === 'week') {
      for (let d = 0; d < totalDays; d += 7) {
        const date = new Date(dates.start);
        date.setDate(date.getDate() + d);
        const weekX = d * unitWidth + 10;
        const label = `${date.getDate()}/${date.getMonth() + 1}`;
        svg += `<text x="${weekX + unitWidth * 3.5}" y="${cfg.headerHeight - 8}" text-anchor="middle" fill="${cfg.colors.headerText}" font-size="10">${label}</text>`;
        svg += `<line x1="${weekX}" y1="25" x2="${weekX}" y2="${cfg.headerHeight}" stroke="${cfg.colors.headerText}" stroke-opacity="0.3" />`;
      }
    } else {
      // Meses
      let lastMonth = -1;
      for (let d = 0; d < totalDays; d++) {
        const date = new Date(dates.start);
        date.setDate(date.getDate() + d);
        if (date.getMonth() !== lastMonth) {
          const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
          const monthX = d * unitWidth + 10;
          svg += `<text x="${monthX + 5}" y="${cfg.headerHeight - 8}" fill="${cfg.colors.headerText}" font-size="11" font-weight="bold">${monthNames[date.getMonth()]} ${date.getFullYear()}</text>`;
          svg += `<line x1="${monthX}" y1="0" x2="${monthX}" y2="${cfg.headerHeight}" stroke="${cfg.colors.headerText}" stroke-opacity="0.3" />`;
          lastMonth = date.getMonth();
        }
      }
    }

    // Linea divisoria
    svg += `<line x1="0" y1="${cfg.headerHeight}" x2="${totalDays * unitWidth + 20}" y2="${cfg.headerHeight}" stroke="#2c3e50" stroke-width="2" />`;

    return svg;
  },

  /**
   * Renderiza grid de fondo y sombreado de fines de semana
   */
  renderGrid(dates, totalDays, unitWidth, taskCount, scale, project) {
    const cfg = this.config;
    let svg = '<g opacity="0.5">';

    // Filas alternas
    for (let i = 0; i < taskCount; i++) {
      if (i % 2 === 0) {
        svg += `<rect x="0" y="${cfg.headerHeight + i * cfg.rowHeight}" width="${totalDays * unitWidth + 20}" height="${cfg.rowHeight}" fill="#fafafa" />`;
      }
    }

    // Fines de semana (solo en escala dia)
    if (scale === 'day') {
      for (let d = 0; d < totalDays; d++) {
        const date = new Date(dates.start);
        date.setDate(date.getDate() + d);
        if (!project.calendarWorkdays.includes(date.getDay())) {
          svg += `<rect x="${d * unitWidth + 10}" y="${cfg.headerHeight}" width="${unitWidth}" height="${taskCount * cfg.rowHeight}" fill="${cfg.colors.weekendBg}" opacity="0.8" />`;
        }
      }
    }

    // Lineas horizontales
    for (let i = 0; i <= taskCount; i++) {
      svg += `<line x1="0" y1="${cfg.headerHeight + i * cfg.rowHeight}" x2="${totalDays * unitWidth + 20}" y2="${cfg.headerHeight + i * cfg.rowHeight}" stroke="${cfg.colors.gridLine}" stroke-width="0.5" />`;
    }

    svg += '</g>';
    return svg;
  },

  /**
   * Renderiza la linea del dia actual
   */
  renderTodayLine(dates, unitWidth, chartHeight) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysDiff = Math.ceil((today - dates.start) / (1000 * 60 * 60 * 24));
    if (daysDiff < 0) return '';

    const x = daysDiff * unitWidth + 10;
    const cfg = this.config;
    return `
      <line x1="${x}" y1="${cfg.headerHeight}" x2="${x}" y2="${cfg.headerHeight + chartHeight}"
            stroke="${cfg.colors.todayLine}" stroke-width="2" stroke-dasharray="4,2" opacity="0.7" />
      <text x="${x}" y="${cfg.headerHeight - 2}" text-anchor="middle" fill="${cfg.colors.todayLine}" font-size="9" font-weight="bold">HOY</text>`;
  },

  /**
   * Renderiza una barra de tarea individual
   */
  renderTaskBar(task, rowIndex, dates, unitWidth, baseline, project) {
    const cfg = this.config;
    if (!task.startDate || !task.endDate) return '';

    const startDay = Math.ceil((new Date(task.startDate) - dates.start) / (1000 * 60 * 60 * 24));
    const endDay = Math.ceil((new Date(task.endDate) - dates.start) / (1000 * 60 * 60 * 24));
    const x = startDay * unitWidth + 10;
    const width = Math.max((endDay - startDay) * unitWidth, task.isMilestone ? 0 : unitWidth);
    const y = rowIndex * cfg.rowHeight + (cfg.rowHeight - cfg.barHeight) / 2;

    let svg = '';

    // Linea base (si existe)
    if (baseline) {
      const bTask = baseline.tasks.find(bt => bt.id === task.id);
      if (bTask && bTask.startDate && bTask.endDate) {
        const bStartDay = Math.ceil((new Date(bTask.startDate) - dates.start) / (1000 * 60 * 60 * 24));
        const bEndDay = Math.ceil((new Date(bTask.endDate) - dates.start) / (1000 * 60 * 60 * 24));
        const bx = bStartDay * unitWidth + 10;
        const bw = Math.max((bEndDay - bStartDay) * unitWidth, unitWidth);
        svg += `<rect x="${bx}" y="${y + cfg.barHeight - 4}" width="${bw}" height="4" rx="1" fill="${cfg.colors.baseline}" opacity="0.6" />`;
      }
    }

    if (task.isMilestone) {
      // Hito: diamante
      const cx = x;
      const cy = y + cfg.barHeight / 2;
      const s = cfg.milestoneSize / 2;
      svg += `<polygon points="${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}"
                fill="${cfg.colors.milestone}" filter="url(#shadow)" />`;
      svg += `<text x="${cx + s + 4}" y="${cy + 4}" fill="#333" font-size="10" font-weight="bold">${this.escapeXml(task.name)}</text>`;
    } else if (task.isSummary) {
      // Tarea resumen: barra con puntas
      const sh = 8;
      const sy = y + (cfg.barHeight - sh) / 2;
      svg += `<rect x="${x}" y="${sy}" width="${width}" height="${sh}" fill="${cfg.colors.summary}" />`;
      // Puntas triangulares
      svg += `<polygon points="${x},${sy} ${x},${sy + sh + 4} ${x + 6},${sy + sh}" fill="${cfg.colors.summary}" />`;
      svg += `<polygon points="${x + width},${sy} ${x + width},${sy + sh + 4} ${x + width - 6},${sy + sh}" fill="${cfg.colors.summary}" />`;
      // Nombre
      svg += `<text x="${x + width + 4}" y="${sy + sh}" fill="#333" font-size="10" font-weight="bold">${this.escapeXml(task.name)}</text>`;
    } else {
      // Tarea normal
      const color = task.isCritical ? cfg.colors.critical : cfg.colors.normal;

      // Barra principal
      svg += `<rect x="${x}" y="${y}" width="${width}" height="${cfg.barHeight}" rx="${cfg.barRadius}" fill="${color}" filter="url(#shadow)" opacity="0.85" />`;

      // Barra de progreso
      if (task.percentComplete > 0) {
        const progWidth = width * (task.percentComplete / 100);
        svg += `<rect x="${x}" y="${y}" width="${progWidth}" height="${cfg.barHeight}" rx="${cfg.barRadius}" fill="${cfg.colors.progress}" opacity="0.9" />`;
      }

      // Texto del % dentro de la barra (solo si cabe)
      if (width > 40) {
        svg += `<text x="${x + width / 2}" y="${y + cfg.barHeight / 2 + 4}" text-anchor="middle" fill="white" font-size="9" font-weight="bold">${task.percentComplete}%</text>`;
      }

      // Nombre de la tarea a la derecha
      svg += `<text x="${x + width + 4}" y="${y + cfg.barHeight / 2 + 4}" fill="#333" font-size="10">${this.escapeXml(task.name)}</text>`;
    }

    return svg;
  },

  /**
   * Renderiza linea de dependencia entre dos tareas
   */
  renderDependencyLine(fromTask, fromIdx, toTask, toIdx, dates, unitWidth, type) {
    const cfg = this.config;
    if (!fromTask.startDate || !fromTask.endDate || !toTask.startDate || !toTask.endDate) return '';

    const fromStartDay = Math.ceil((new Date(fromTask.startDate) - dates.start) / (1000 * 60 * 60 * 24));
    const fromEndDay = Math.ceil((new Date(fromTask.endDate) - dates.start) / (1000 * 60 * 60 * 24));
    const toStartDay = Math.ceil((new Date(toTask.startDate) - dates.start) / (1000 * 60 * 60 * 24));
    const toEndDay = Math.ceil((new Date(toTask.endDate) - dates.start) / (1000 * 60 * 60 * 24));

    let x1, y1, x2, y2;
    const midY = cfg.rowHeight / 2;

    switch (type) {
      case 'FS':
        x1 = fromEndDay * unitWidth + 10;
        y1 = fromIdx * cfg.rowHeight + midY;
        x2 = toStartDay * unitWidth + 10;
        y2 = toIdx * cfg.rowHeight + midY;
        break;
      case 'SS':
        x1 = fromStartDay * unitWidth + 10;
        y1 = fromIdx * cfg.rowHeight + midY;
        x2 = toStartDay * unitWidth + 10;
        y2 = toIdx * cfg.rowHeight + midY;
        break;
      case 'FF':
        x1 = fromEndDay * unitWidth + 10;
        y1 = fromIdx * cfg.rowHeight + midY;
        x2 = toEndDay * unitWidth + 10;
        y2 = toIdx * cfg.rowHeight + midY;
        break;
      case 'SF':
        x1 = fromStartDay * unitWidth + 10;
        y1 = fromIdx * cfg.rowHeight + midY;
        x2 = toEndDay * unitWidth + 10;
        y2 = toIdx * cfg.rowHeight + midY;
        break;
      default:
        return '';
    }

    // Ruta con esquinas redondeadas
    const bend = 8;
    const midX = x1 + bend;
    let path;

    if (toIdx > fromIdx) {
      // Sucesor esta abajo
      path = `M${x1},${y1} H${midX} V${y2} H${x2}`;
    } else {
      // Sucesor esta arriba
      path = `M${x1},${y1} H${midX} V${y2} H${x2}`;
    }

    return `<path d="${path}" fill="none" stroke="${cfg.colors.dependencyLine}" stroke-width="1.5" marker-end="url(#arrowhead)" />`;
  },

  /**
   * Obtiene el rango de fechas del proyecto
   */
  getDateRange(tasks, project) {
    const validTasks = tasks.filter(t => t.startDate && t.endDate);
    if (validTasks.length === 0) return null;

    const starts = validTasks.map(t => new Date(t.startDate + 'T00:00:00'));
    const ends = validTasks.map(t => new Date(t.endDate + 'T00:00:00'));

    const start = new Date(Math.min(...starts));
    const end = new Date(Math.max(...ends));

    // Agregar margen
    start.setDate(start.getDate() - 2);
    end.setDate(end.getDate() + 5);

    return { start, end };
  },

  /**
   * Escapa caracteres XML especiales
   */
  escapeXml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  },
};
