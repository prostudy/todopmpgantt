/**
 * Tests para Data Model
 */

TestRunner.registerSuite('Data Model', [
  {
    name: 'createTask - debe crear tarea con valores por defecto',
    fn: () => {
      const task = DataModel.createTask();
      assert.truthy(task.id, 'Task debe tener ID');
      assert.equal(task.name, 'Nueva Tarea');
      assert.equal(task.duration, 1);
      assert.equal(task.plannedCost, 0);
      assert.equal(task.isMilestone, false);
      assert.equal(task.isSummary, false);
      assert.arrayLength(task.predecessors, 0);
      assert.arrayLength(task.resourceAssignments, 0);
    },
  },

  {
    name: 'createTask - debe aceptar overrides',
    fn: () => {
      const task = DataModel.createTask({
        name: 'Tarea Custom',
        duration: 10,
        plannedCost: 5000,
        isMilestone: true,
      });
      assert.equal(task.name, 'Tarea Custom');
      assert.equal(task.duration, 10);
      assert.equal(task.plannedCost, 5000);
      assert.equal(task.isMilestone, true);
    },
  },

  {
    name: 'createResource - debe crear recurso con valores por defecto',
    fn: () => {
      const resource = DataModel.createResource();
      assert.truthy(resource.id);
      assert.equal(resource.name, 'Nuevo Recurso');
      assert.equal(resource.type, 'work');
      assert.equal(resource.costPerHour, 0);
      assert.equal(resource.maxUnits, 100);
    },
  },

  {
    name: 'createDependency - debe crear dependencia correcta',
    fn: () => {
      const dep = DataModel.createDependency('task1', 'task2', 'FS', 2);
      assert.equal(dep.taskId, 'task1');
      assert.equal(dep.type, 'FS');
      assert.equal(dep.lag, 2);
    },
  },

  {
    name: 'getChildren - debe retornar hijos directos',
    fn: () => {
      const tasks = [
        DataModel.createTask({ id: 'p1', parentId: null }),
        DataModel.createTask({ id: 'c1', parentId: 'p1' }),
        DataModel.createTask({ id: 'c2', parentId: 'p1' }),
        DataModel.createTask({ id: 'gc1', parentId: 'c1' }),
      ];
      const children = DataModel.getChildren(tasks, 'p1');
      assert.arrayLength(children, 2);
      assert.arrayContains(children.map(c => c.id), 'c1');
      assert.arrayContains(children.map(c => c.id), 'c2');
    },
  },

  {
    name: 'getDescendants - debe retornar todos los descendientes',
    fn: () => {
      const tasks = [
        DataModel.createTask({ id: 'p1', parentId: null }),
        DataModel.createTask({ id: 'c1', parentId: 'p1' }),
        DataModel.createTask({ id: 'c2', parentId: 'p1' }),
        DataModel.createTask({ id: 'gc1', parentId: 'c1' }),
      ];
      const descendants = DataModel.getDescendants(tasks, 'p1');
      assert.arrayLength(descendants, 3);
    },
  },

  {
    name: 'recalculateWBS - debe asignar códigos WBS correctos',
    fn: () => {
      const tasks = [
        DataModel.createTask({ id: 't1', parentId: null }),
        DataModel.createTask({ id: 't2', parentId: null }),
        DataModel.createTask({ id: 't2.1', parentId: 't2' }),
        DataModel.createTask({ id: 't2.2', parentId: 't2' }),
      ];
      DataModel.recalculateWBS(tasks);
      assert.equal(tasks[0].wbsCode, '1');
      assert.equal(tasks[1].wbsCode, '2');
      assert.equal(tasks[2].wbsCode, '2.1');
      assert.equal(tasks[3].wbsCode, '2.2');
      assert.equal(tasks[1].isSummary, true);
    },
  },

  {
    name: 'hasCircularDependency - debe detectar ciclos simples',
    fn: () => {
      const tasks = [
        DataModel.createTask({ id: 't1', predecessors: [{ taskId: 't2', type: 'FS', lag: 0 }] }),
        DataModel.createTask({ id: 't2', predecessors: [{ taskId: 't1', type: 'FS', lag: 0 }] }),
      ];
      const hasCycle = DataModel.hasCircularDependency(tasks, 't1');
      assert.truthy(hasCycle, 'Debe detectar dependencia circular');
    },
    skip: true,
  },

  {
    name: 'createBaseline - debe crear snapshot del proyecto',
    fn: () => {
      const project = {
        tasks: [
          DataModel.createTask({ id: 't1', startDate: '2026-01-01', endDate: '2026-01-05', plannedCost: 1000 }),
          DataModel.createTask({ id: 't2', startDate: '2026-01-06', endDate: '2026-01-10', plannedCost: 2000 }),
        ],
      };
      const baseline = DataModel.createBaseline(project, 'Test Baseline');
      assert.equal(baseline.name, 'Test Baseline');
      assert.arrayLength(baseline.tasks, 2);
      assert.equal(baseline.totalBudget, 3000);
      assert.truthy(baseline.createdAt);
    },
  },

  // ======= TESTS NUEVOS =======

  {
    name: 'createProject - debe crear proyecto con valores por defecto',
    fn: () => {
      const project = DataModel.createProject();
      assert.truthy(project.name, 'Debe tener nombre');
      assert.truthy(project.startDate, 'Debe tener fecha inicio');
      assert.truthy(Array.isArray(project.tasks), 'Debe tener array de tareas');
      assert.truthy(Array.isArray(project.resources), 'Debe tener array de recursos');
      assert.truthy(Array.isArray(project.baselines), 'Debe tener array de baselines');
      assert.truthy(Array.isArray(project.calendarWorkdays), 'Debe tener calendario');
      assert.truthy(project.hoursPerDay > 0, 'Debe tener horas por dia');
    },
  },

  {
    name: 'createProject - debe aceptar overrides',
    fn: () => {
      const project = DataModel.createProject({ name: 'Mi Proyecto', hoursPerDay: 6 });
      assert.equal(project.name, 'Mi Proyecto');
      assert.equal(project.hoursPerDay, 6);
    },
  },

  {
    name: 'generateId - debe generar IDs unicos',
    fn: () => {
      const id1 = DataModel.generateId();
      const id2 = DataModel.generateId();
      const id3 = DataModel.generateId();
      assert.notEqual(id1, id2, 'IDs deben ser unicos');
      assert.notEqual(id2, id3, 'IDs deben ser unicos');
      assert.truthy(typeof id1 === 'string', 'ID debe ser string');
      assert.truthy(id1.length > 0, 'ID no debe ser vacio');
    },
  },

  {
    name: 'getDescendants - arbol vacio debe retornar array vacio',
    fn: () => {
      const tasks = [
        DataModel.createTask({ id: 'p1', parentId: null }),
      ];
      const descendants = DataModel.getDescendants(tasks, 'p1');
      assert.arrayLength(descendants, 0, 'Sin hijos = 0 descendientes');
    },
  },

  {
    name: 'recalculateWBS - debe manejar arbol profundo (3 niveles)',
    fn: () => {
      const tasks = [
        DataModel.createTask({ id: 'r1', parentId: null }),
        DataModel.createTask({ id: 'c1', parentId: 'r1' }),
        DataModel.createTask({ id: 'gc1', parentId: 'c1' }),
        DataModel.createTask({ id: 'gc2', parentId: 'c1' }),
      ];
      DataModel.recalculateWBS(tasks);
      assert.equal(tasks[0].wbsCode, '1');
      assert.equal(tasks[1].wbsCode, '1.1');
      assert.equal(tasks[2].wbsCode, '1.1.1');
      assert.equal(tasks[3].wbsCode, '1.1.2');
      assert.equal(tasks[0].isSummary, true, 'Raiz es resumen');
      assert.equal(tasks[1].isSummary, true, 'Hijo con nietos es resumen');
      assert.equal(tasks[2].isSummary, false, 'Hoja no es resumen');
    },
  },

  {
    name: 'createBaseline - debe ser un snapshot independiente (deep copy)',
    fn: () => {
      const project = {
        tasks: [
          DataModel.createTask({ id: 't1', startDate: '2026-01-01', endDate: '2026-01-05', plannedCost: 1000 }),
        ],
      };
      const baseline = DataModel.createBaseline(project, 'BL1');
      // Modificar el proyecto original no debe afectar la baseline
      project.tasks[0].plannedCost = 9999;
      assert.equal(baseline.tasks[0].plannedCost, 1000, 'Baseline no debe verse afectada por cambios al proyecto');
    },
  },
]);
