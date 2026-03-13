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
]);
