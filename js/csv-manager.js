/**
 * CSV Import/Export Manager
 * Maneja importacion y exportacion de datos del proyecto en formato CSV
 * Compatible con MS Project y GanttProject
 */

const CSVManager = {
  /**
   * Exporta las tareas del proyecto a CSV
   */
  exportTasks(project) {
    const tasks = project.tasks;
    const headers = [
      'WBS', 'ID', 'Nombre', 'Duracion (dias)', 'Fecha Inicio', 'Fecha Fin',
      'Predecesores', 'Recursos', 'Costo Planificado', 'Costo Real',
      '% Completado', 'Hito', 'Resumen', 'Nivel',
      'ES', 'EF', 'LS', 'LF',
      'Holgura Total', 'Holgura Libre', 'Ruta Critica', 'Notas'
    ];

    const rows = tasks.map((task, idx) => {
      const resourceNames = task.resourceAssignments.map(a => {
        const res = project.resources.find(r => r.id === a.resourceId);
        return res ? `${res.name}[${a.units}%]` : '';
      }).filter(Boolean).join('; ');

      const predStr = ScheduleEngine.formatPredecessors(task.predecessors, tasks);

      return [
        task.wbsCode,
        idx + 1,
        task.name,
        task.duration,
        task.startDate || '',
        task.endDate || '',
        predStr,
        resourceNames,
        task.plannedCost,
        task.actualCost,
        task.percentComplete,
        task.isMilestone ? 'Si' : 'No',
        task.isSummary ? 'Si' : 'No',
        task.level,
        task.earlyStart ?? '',
        task.earlyFinish ?? '',
        task.lateStart ?? '',
        task.lateFinish ?? '',
        task.totalFloat ?? '',
        task.freeFloat ?? '',
        task.isCritical ? 'Si' : 'No',
        task.notes,
      ];
    });

    return this.arrayToCSV([headers, ...rows]);
  },

  /**
   * Exporta los recursos del proyecto a CSV
   */
  exportResources(project) {
    const headers = ['ID', 'Nombre', 'Tipo', 'Costo por Hora', 'Unidades Max (%)'];
    const rows = project.resources.map((r, idx) => [
      idx + 1, r.name, r.type === 'work' ? 'Trabajo' : 'Material',
      r.costPerHour, r.maxUnits,
    ]);
    return this.arrayToCSV([headers, ...rows]);
  },

  /**
   * Exporta metricas EVM a CSV
   */
  exportEVM(project) {
    const metrics = EVMEngine.calculate(project);
    const headers = ['Metrica', 'Valor', 'Descripcion'];
    const rows = [
      ['BAC', metrics.BAC, 'Presupuesto total del proyecto'],
      ['PV', metrics.PV, 'Valor planificado a la fecha'],
      ['EV', metrics.EV, 'Valor ganado'],
      ['AC', metrics.AC, 'Costo real'],
      ['SV', metrics.SV, 'Varianza de cronograma (EV-PV)'],
      ['CV', metrics.CV, 'Varianza de costo (EV-AC)'],
      ['SPI', metrics.SPI, 'Indice de desempeno de cronograma'],
      ['CPI', metrics.CPI, 'Indice de desempeno de costo'],
      ['EAC', metrics.EAC, 'Estimado a la conclusion'],
      ['ETC', metrics.ETC, 'Estimado para completar'],
      ['VAC', metrics.VAC, 'Varianza a la conclusion'],
      ['TCPI (BAC)', metrics.TCPI_BAC, 'Indice de desempeno para completar'],
      ['% Completado', metrics.percentComplete, 'Porcentaje completado del proyecto'],
    ];
    return this.arrayToCSV([headers, ...rows]);
  },

  /**
   * Importa tareas desde CSV
   * @returns {Object} {tasks: [], errors: []}
   */
  importTasks(csvContent, project) {
    const errors = [];
    const parsed = this.parseCSV(csvContent);

    if (parsed.length < 2) {
      errors.push('El archivo CSV debe tener al menos una fila de encabezados y una de datos');
      return { tasks: [], errors };
    }

    const headers = parsed[0].map(h => h.trim().toLowerCase());
    const rows = parsed.slice(1);

    // Mapeo flexible de columnas
    const colMap = this.mapColumns(headers);

    const tasks = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.every(cell => !cell.trim())) continue; // Saltar filas vacias

      const task = DataModel.createTask({
        name: this.getCell(row, colMap.name) || `Tarea ${i + 1}`,
        duration: parseInt(this.getCell(row, colMap.duration)) || 1,
        plannedCost: parseFloat(this.getCell(row, colMap.cost)) || 0,
        actualCost: parseFloat(this.getCell(row, colMap.actualCost)) || 0,
        percentComplete: parseInt(this.getCell(row, colMap.percentComplete)) || 0,
        isMilestone: this.isTruthy(this.getCell(row, colMap.milestone)),
        notes: this.getCell(row, colMap.notes) || '',
        level: parseInt(this.getCell(row, colMap.level)) || 0,
      });

      // WBS code para determinar jerarquia
      const wbs = this.getCell(row, colMap.wbs);
      if (wbs) task.wbsCode = wbs.trim();

      tasks.push(task);
    }

    // Reconstruir jerarquia desde WBS o nivel
    this.reconstructHierarchy(tasks);

    // Parsear predecesores (segunda pasada, ya que necesitamos todas las tareas)
    for (let i = 0; i < rows.length && i < tasks.length; i++) {
      const predStr = this.getCell(rows[i], colMap.predecessors);
      if (predStr) {
        tasks[i].predecessors = ScheduleEngine.parsePredecessorString(predStr, tasks);
      }
    }

    // Parsear recursos
    for (let i = 0; i < rows.length && i < tasks.length; i++) {
      const resStr = this.getCell(rows[i], colMap.resources);
      if (resStr) {
        const assignments = this.parseResourceString(resStr, project);
        tasks[i].resourceAssignments = assignments;
      }
    }

    return { tasks, errors };
  },

  /**
   * Importa recursos desde CSV
   */
  importResources(csvContent) {
    const parsed = this.parseCSV(csvContent);
    if (parsed.length < 2) return { resources: [], errors: ['CSV vacio'] };

    const headers = parsed[0].map(h => h.trim().toLowerCase());
    const rows = parsed.slice(1);

    const nameCol = headers.findIndex(h => h.includes('nombre') || h.includes('name'));
    const typeCol = headers.findIndex(h => h.includes('tipo') || h.includes('type'));
    const costCol = headers.findIndex(h => h.includes('costo') || h.includes('cost') || h.includes('rate'));
    const unitsCol = headers.findIndex(h => h.includes('unidad') || h.includes('unit') || h.includes('max'));

    const resources = [];
    for (const row of rows) {
      if (row.every(cell => !cell.trim())) continue;
      resources.push(DataModel.createResource({
        name: row[nameCol] || 'Recurso',
        type: (row[typeCol] || '').toLowerCase().includes('material') ? 'material' : 'work',
        costPerHour: parseFloat(row[costCol]) || 0,
        maxUnits: parseInt(row[unitsCol]) || 100,
      }));
    }

    return { resources, errors: [] };
  },

  /**
   * Mapeo flexible de columnas CSV a campos internos
   */
  mapColumns(headers) {
    const find = (keywords) => {
      return headers.findIndex(h =>
        keywords.some(k => h.includes(k))
      );
    };

    return {
      wbs: find(['wbs', 'edt']),
      name: find(['nombre', 'name', 'tarea', 'task', 'actividad']),
      duration: find(['duracion', 'duration', 'dias', 'days']),
      startDate: find(['inicio', 'start', 'comienzo']),
      endDate: find(['fin', 'end', 'terminacion']),
      predecessors: find(['predecesor', 'predecessor', 'pred']),
      resources: find(['recurso', 'resource']),
      cost: find(['costo plan', 'planned cost', 'costo', 'cost', 'presupuesto', 'budget']),
      actualCost: find(['costo real', 'actual cost', 'real']),
      percentComplete: find(['% comp', 'percent', 'avance', 'completado', 'progress']),
      milestone: find(['hito', 'milestone']),
      level: find(['nivel', 'level', 'indent']),
      notes: find(['nota', 'note', 'comentario', 'comment']),
    };
  },

  getCell(row, colIndex) {
    if (colIndex < 0 || colIndex >= row.length) return '';
    return (row[colIndex] || '').trim();
  },

  isTruthy(val) {
    if (!val) return false;
    const v = val.toLowerCase().trim();
    return v === 'si' || v === 'yes' || v === 'true' || v === '1' || v === 'x';
  },

  /**
   * Reconstruye la jerarquia padre-hijo desde codigos WBS o niveles
   */
  reconstructHierarchy(tasks) {
    // Intentar por WBS primero
    const hasWBS = tasks.some(t => t.wbsCode && t.wbsCode.includes('.'));
    if (hasWBS) {
      for (const task of tasks) {
        if (!task.wbsCode || !task.wbsCode.includes('.')) continue;
        const parts = task.wbsCode.split('.');
        const parentWBS = parts.slice(0, -1).join('.');
        const parent = tasks.find(t => t.wbsCode === parentWBS);
        if (parent) {
          task.parentId = parent.id;
          task.level = parts.length - 1;
          parent.isSummary = true;
        }
      }
    } else {
      // Reconstruir por niveles (indentacion)
      const stack = []; // Stack de {task, level}
      for (const task of tasks) {
        while (stack.length > 0 && stack[stack.length - 1].level >= task.level) {
          stack.pop();
        }
        if (stack.length > 0) {
          task.parentId = stack[stack.length - 1].task.id;
          stack[stack.length - 1].task.isSummary = true;
        }
        stack.push({ task, level: task.level });
      }
    }

    DataModel.recalculateWBS(tasks);
  },

  /**
   * Parsea string de recursos "Recurso1[50%]; Recurso2[100%]"
   */
  parseResourceString(resStr, project) {
    const assignments = [];
    const parts = resStr.split(';').map(s => s.trim()).filter(Boolean);

    for (const part of parts) {
      const match = part.match(/^(.+?)(?:\[(\d+)%?\])?$/);
      if (match) {
        const name = match[1].trim();
        const units = parseInt(match[2] || '100');
        const resource = project.resources.find(r =>
          r.name.toLowerCase() === name.toLowerCase()
        );
        if (resource) {
          assignments.push({ resourceId: resource.id, units });
        }
      }
    }
    return assignments;
  },

  /**
   * Convierte array 2D a string CSV
   */
  arrayToCSV(data) {
    return data.map(row =>
      row.map(cell => {
        const str = String(cell ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }).join(',')
    ).join('\n');
  },

  /**
   * Parsea string CSV a array 2D
   */
  parseCSV(csvContent) {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < csvContent.length; i++) {
      const char = csvContent[i];
      const nextChar = csvContent[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentCell += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          currentCell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          currentRow.push(currentCell);
          currentCell = '';
        } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
          currentRow.push(currentCell);
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
          if (char === '\r') i++;
        } else if (char === '\r') {
          currentRow.push(currentCell);
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
    }

    // Ultima celda/fila
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }

    return rows;
  },

  /**
   * Descarga un string como archivo
   */
  downloadFile(content, filename, mimeType = 'text/csv;charset=utf-8;') {
    const BOM = '\uFEFF'; // Para que Excel abra bien con acentos
    const blob = new Blob([BOM + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Exporta el proyecto completo como JSON (para guardar/restaurar)
   */
  exportProjectJSON(project) {
    return JSON.stringify(project, null, 2);
  },

  /**
   * Importa proyecto desde JSON
   */
  importProjectJSON(jsonContent) {
    try {
      return JSON.parse(jsonContent);
    } catch (e) {
      return null;
    }
  },
};
