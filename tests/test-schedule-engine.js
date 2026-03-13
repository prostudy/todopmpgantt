/**
 * Tests para Schedule Engine (CPM)
 */

TestRunner.registerSuite('Schedule Engine - CPM', [
  {
    name: 'forwardPass - debe calcular ES/EF para tareas sin predecesores',
    fn: () => {
      const project = {
        tasks: [
          DataModel.createTask({ id: 't1', duration: 5, predecessors: [] }),
          DataModel.createTask({ id: 't2', duration: 3, predecessors: [] }),
        ],
        startDate: '2026-01-01',
        calendarWorkdays: [1, 2, 3, 4, 5],
      };
      ScheduleEngine.calculate(project);
      assert.equal(project.tasks[0].earlyStart, 0);
      assert.equal(project.tasks[0].earlyFinish, 5);
      assert.equal(project.tasks[1].earlyStart, 0);
      assert.equal(project.tasks[1].earlyFinish, 3);
    },
  },

  {
    name: 'forwardPass - debe calcular ES/EF con dependencia FS',
    fn: () => {
      const t1 = DataModel.createTask({ id: 't1', duration: 5, predecessors: [] });
      const t2 = DataModel.createTask({ id: 't2', duration: 3, predecessors: [{ taskId: 't1', type: 'FS', lag: 0 }] });
      const project = {
        tasks: [t1, t2],
        startDate: '2026-01-01',
        calendarWorkdays: [1, 2, 3, 4, 5],
      };
      ScheduleEngine.calculate(project);
      assert.equal(t1.earlyStart, 0);
      assert.equal(t1.earlyFinish, 5);
      assert.equal(t2.earlyStart, 5);
      assert.equal(t2.earlyFinish, 8);
    },
  },

  {
    name: 'forwardPass - debe calcular ES/EF con dependencia FS y lag positivo',
    fn: () => {
      const t1 = DataModel.createTask({ id: 't1', duration: 5, predecessors: [] });
      const t2 = DataModel.createTask({ id: 't2', duration: 3, predecessors: [{ taskId: 't1', type: 'FS', lag: 2 }] });
      const project = {
        tasks: [t1, t2],
        startDate: '2026-01-01',
        calendarWorkdays: [1, 2, 3, 4, 5],
      };
      ScheduleEngine.calculate(project);
      assert.equal(t2.earlyStart, 7);
      assert.equal(t2.earlyFinish, 10);
    },
  },

  {
    name: 'forwardPass - debe calcular ES/EF con dependencia SS',
    fn: () => {
      const t1 = DataModel.createTask({ id: 't1', duration: 5, predecessors: [] });
      const t2 = DataModel.createTask({ id: 't2', duration: 3, predecessors: [{ taskId: 't1', type: 'SS', lag: 2 }] });
      const project = {
        tasks: [t1, t2],
        startDate: '2026-01-01',
        calendarWorkdays: [1, 2, 3, 4, 5],
      };
      ScheduleEngine.calculate(project);
      assert.equal(t2.earlyStart, 2);
      assert.equal(t2.earlyFinish, 5);
    },
  },

  {
    name: 'forwardPass - debe calcular ES/EF con dependencia FF',
    fn: () => {
      const t1 = DataModel.createTask({ id: 't1', duration: 5, predecessors: [] });
      const t2 = DataModel.createTask({ id: 't2', duration: 3, predecessors: [{ taskId: 't1', type: 'FF', lag: 0 }] });
      const project = {
        tasks: [t1, t2],
        startDate: '2026-01-01',
        calendarWorkdays: [1, 2, 3, 4, 5],
      };
      ScheduleEngine.calculate(project);
      assert.equal(t2.earlyFinish, 5);
      assert.equal(t2.earlyStart, 2);
    },
  },

  {
    name: 'backwardPass - debe calcular LS/LF correctamente',
    fn: () => {
      const t1 = DataModel.createTask({ id: 't1', duration: 5, predecessors: [] });
      const t2 = DataModel.createTask({ id: 't2', duration: 3, predecessors: [{ taskId: 't1', type: 'FS', lag: 0 }] });
      const project = {
        tasks: [t1, t2],
        startDate: '2026-01-01',
        calendarWorkdays: [1, 2, 3, 4, 5],
      };
      ScheduleEngine.calculate(project);
      assert.equal(t2.lateFinish, 8);
      assert.equal(t2.lateStart, 5);
      assert.equal(t1.lateFinish, 5);
      assert.equal(t1.lateStart, 0);
    },
  },

  {
    name: 'calculateFloats - debe calcular holgura total correctamente',
    fn: () => {
      const t1 = DataModel.createTask({ id: 't1', duration: 5, predecessors: [] });
      const t2 = DataModel.createTask({ id: 't2', duration: 3, predecessors: [] });
      const t3 = DataModel.createTask({ id: 't3', duration: 2, predecessors: [
        { taskId: 't1', type: 'FS', lag: 0 },
        { taskId: 't2', type: 'FS', lag: 0 },
      ]});
      const project = {
        tasks: [t1, t2, t3],
        startDate: '2026-01-01',
        calendarWorkdays: [1, 2, 3, 4, 5],
      };
      ScheduleEngine.calculate(project);
      assert.equal(t1.totalFloat, 0);
      assert.equal(t2.totalFloat, 2);
      assert.equal(t3.totalFloat, 0);
    },
  },

  {
    name: 'calculateFloats - debe identificar ruta crítica',
    fn: () => {
      const t1 = DataModel.createTask({ id: 't1', duration: 5, predecessors: [] });
      const t2 = DataModel.createTask({ id: 't2', duration: 3, predecessors: [] });
      const t3 = DataModel.createTask({ id: 't3', duration: 2, predecessors: [
        { taskId: 't1', type: 'FS', lag: 0 },
        { taskId: 't2', type: 'FS', lag: 0 },
      ]});
      const project = {
        tasks: [t1, t2, t3],
        startDate: '2026-01-01',
        calendarWorkdays: [1, 2, 3, 4, 5],
      };
      ScheduleEngine.calculate(project);
      assert.truthy(t1.isCritical);
      assert.falsy(t2.isCritical);
      assert.truthy(t3.isCritical);
    },
  },

  {
    name: 'calculateDates - debe convertir ES/EF a fechas calendario',
    fn: () => {
      const t1 = DataModel.createTask({ id: 't1', duration: 5, predecessors: [] });
      const project = {
        tasks: [t1],
        startDate: '2026-01-05',
        calendarWorkdays: [1, 2, 3, 4, 5],
      };
      ScheduleEngine.calculate(project);
      assert.equal(t1.startDate, '2026-01-05');
      // Tarea de 5 dias iniciando lunes 05 debe terminar viernes 09
      assert.equal(t1.endDate, '2026-01-09');
    },
  },

  {
    name: 'addWorkdays - debe saltar fines de semana',
    fn: () => {
      const startDate = new Date('2026-01-05T00:00:00');
      // addWorkdays(5) cuenta 5 dias DESPUES del inicio = lunes siguiente
      const result = ScheduleEngine.addWorkdays(startDate, 5, [1, 2, 3, 4, 5]);
      assert.equal(result, '2026-01-12');
    },
  },

  {
    name: 'addWorkdays - debe manejar hitos (duration=0)',
    fn: () => {
      const startDate = new Date('2026-01-05T00:00:00');
      const result = ScheduleEngine.addWorkdays(startDate, 0, [1, 2, 3, 4, 5]);
      assert.equal(result, '2026-01-05');
    },
  },

  {
    name: 'parsePredecessorString - debe parsear formato simple',
    fn: () => {
      const tasks = [
        DataModel.createTask({ id: 't1' }),
        DataModel.createTask({ id: 't2' }),
        DataModel.createTask({ id: 't3' }),
      ];
      const result = ScheduleEngine.parsePredecessorString('1,2FS+2', tasks);
      assert.arrayLength(result, 2);
      assert.equal(result[0].taskId, 't1');
      assert.equal(result[0].type, 'FS');
      assert.equal(result[0].lag, 0);
      assert.equal(result[1].taskId, 't2');
      assert.equal(result[1].type, 'FS');
      assert.equal(result[1].lag, 2);
    },
  },

  {
    name: 'parsePredecessorString - debe parsear todos los tipos',
    fn: () => {
      const tasks = [
        DataModel.createTask({ id: 't1' }),
        DataModel.createTask({ id: 't2' }),
        DataModel.createTask({ id: 't3' }),
        DataModel.createTask({ id: 't4' }),
      ];
      const result = ScheduleEngine.parsePredecessorString('1FS,2SS+1,3FF-2,4SF', tasks);
      assert.arrayLength(result, 4);
      assert.equal(result[0].type, 'FS');
      assert.equal(result[1].type, 'SS');
      assert.equal(result[1].lag, 1);
      assert.equal(result[2].type, 'FF');
      assert.equal(result[2].lag, -2);
      assert.equal(result[3].type, 'SF');
    },
  },

  {
    name: 'topologicalSort - debe ordenar tareas respetando dependencias',
    fn: () => {
      const t1 = DataModel.createTask({ id: 't1', duration: 1, predecessors: [] });
      const t2 = DataModel.createTask({ id: 't2', duration: 1, predecessors: [{ taskId: 't1', type: 'FS', lag: 0 }] });
      const t3 = DataModel.createTask({ id: 't3', duration: 1, predecessors: [{ taskId: 't2', type: 'FS', lag: 0 }] });
      const tasks = [t3, t1, t2];
      const sorted = ScheduleEngine.topologicalSort(tasks);
      assert.truthy(sorted);
      assert.equal(sorted[0].id, 't1');
      assert.equal(sorted[1].id, 't2');
      assert.equal(sorted[2].id, 't3');
    },
  },

  {
    name: 'topologicalSort - debe detectar ciclos',
    fn: () => {
      const t1 = DataModel.createTask({ id: 't1', duration: 1, predecessors: [{ taskId: 't2', type: 'FS', lag: 0 }] });
      const t2 = DataModel.createTask({ id: 't2', duration: 1, predecessors: [{ taskId: 't1', type: 'FS', lag: 0 }] });
      const tasks = [t1, t2];
      const sorted = ScheduleEngine.topologicalSort(tasks);
      assert.falsy(sorted, 'Debe retornar null cuando hay ciclos');
    },
  },
]);
