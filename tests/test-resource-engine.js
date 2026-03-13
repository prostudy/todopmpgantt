/**
 * Tests para Resource Engine
 */

TestRunner.registerSuite('Resource Engine', [
  {
    name: 'calculateResourceLoad - debe calcular carga diaria correctamente',
    fn: () => {
      const r1 = DataModel.createResource({ id: 'r1', name: 'Dev', maxUnits: 100 });
      const t1 = DataModel.createTask({ 
        id: 't1', 
        duration: 5,
        resourceAssignments: [{ resourceId: 'r1', units: 100 }],
        isSummary: false,
      });
      const project = {
        resources: [r1],
        tasks: [t1],
        calendarWorkdays: [1, 2, 3, 4, 5],
        startDate: '2026-01-05',
      };
      ScheduleEngine.calculate(project);
      const loadMap = ResourceEngine.calculateResourceLoad(project);
      const r1Load = loadMap.get('r1');
      assert.truthy(r1Load && r1Load.length >= 5, `Expected at least 5 days of load, got ${r1Load ? r1Load.length : 0}`);
    },
  },

  {
    name: 'detectOverallocation - debe detectar sobreasignación',
    fn: () => {
      const r1 = DataModel.createResource({ id: 'r1', name: 'Dev', maxUnits: 100 });
      const t1 = DataModel.createTask({ 
        id: 't1', 
        duration: 5,
        resourceAssignments: [{ resourceId: 'r1', units: 80 }],
        isSummary: false,
      });
      const t2 = DataModel.createTask({ 
        id: 't2', 
        duration: 5,
        resourceAssignments: [{ resourceId: 'r1', units: 50 }],
        isSummary: false,
      });
      const project = {
        resources: [r1],
        tasks: [t1, t2],
        calendarWorkdays: [1, 2, 3, 4, 5],
        startDate: '2026-01-05',
      };
      ScheduleEngine.calculate(project);
      const conflicts = ResourceEngine.detectOverallocation(project);
      assert.truthy(conflicts.length > 0, 'Debe detectar sobreasignación (130% > 100%)');
    },
  },

  {
    name: 'detectOverallocation - no debe reportar si está dentro del límite',
    fn: () => {
      const r1 = DataModel.createResource({ id: 'r1', name: 'Dev', maxUnits: 100 });
      const t1 = DataModel.createTask({ 
        id: 't1', 
        duration: 5,
        resourceAssignments: [{ resourceId: 'r1', units: 50 }],
        isSummary: false,
      });
      const t2 = DataModel.createTask({ 
        id: 't2', 
        duration: 5,
        resourceAssignments: [{ resourceId: 'r1', units: 50 }],
        isSummary: false,
      });
      const project = {
        resources: [r1],
        tasks: [t1, t2],
        calendarWorkdays: [1, 2, 3, 4, 5],
        startDate: '2026-01-05',
      };
      ScheduleEngine.calculate(project);
      const conflicts = ResourceEngine.detectOverallocation(project);
      assert.arrayLength(conflicts, 0, 'No debe reportar conflictos (100% = 100%)');
    },
  },

  {
    name: 'calculateResourceCost - debe calcular costo correctamente',
    fn: () => {
      const r1 = DataModel.createResource({ id: 'r1', costPerHour: 100 });
      const t1 = DataModel.createTask({ 
        id: 't1', 
        duration: 5,
        resourceAssignments: [{ resourceId: 'r1', units: 100 }],
      });
      const project = { hoursPerDay: 8 };
      const cost = ResourceEngine.calculateResourceCost(t1, r1, project);
      assert.equal(cost, 4000);
    },
  },

  {
    name: 'calculateResourceCost - debe considerar unidades parciales',
    fn: () => {
      const r1 = DataModel.createResource({ id: 'r1', costPerHour: 100 });
      const t1 = DataModel.createTask({ 
        id: 't1', 
        duration: 5,
        resourceAssignments: [{ resourceId: 'r1', units: 50 }],
      });
      const project = { hoursPerDay: 8 };
      const cost = ResourceEngine.calculateResourceCost(t1, r1, project);
      assert.equal(cost, 2000);
    },
  },

  {
    name: 'calculateTaskResourceCost - debe sumar costos de múltiples recursos',
    fn: () => {
      const r1 = DataModel.createResource({ id: 'r1', costPerHour: 100 });
      const r2 = DataModel.createResource({ id: 'r2', costPerHour: 150 });
      const t1 = DataModel.createTask({ 
        id: 't1', 
        duration: 5,
        resourceAssignments: [
          { resourceId: 'r1', units: 100 },
          { resourceId: 'r2', units: 50 },
        ],
      });
      const project = { 
        hoursPerDay: 8,
        resources: [r1, r2],
      };
      const cost = ResourceEngine.calculateTaskResourceCost(t1, project);
      assert.equal(cost, 7000);
    },
  },

  {
    name: 'generateHistogramData - debe generar datos para visualización',
    fn: () => {
      const r1 = DataModel.createResource({ id: 'r1', name: 'Dev', maxUnits: 100 });
      const t1 = DataModel.createTask({
        id: 't1',
        duration: 5,
        resourceAssignments: [{ resourceId: 'r1', units: 80 }],
        isSummary: false,
      });
      const project = {
        resources: [r1],
        tasks: [t1],
        calendarWorkdays: [1, 2, 3, 4, 5],
        startDate: '2026-01-05',
      };
      ScheduleEngine.calculate(project);
      const histogram = ResourceEngine.generateHistogramData(project);
      assert.truthy(histogram.labels.length > 0);
      assert.arrayLength(histogram.datasets, 1);
      assert.equal(histogram.datasets[0].resourceName, 'Dev');
    },
  },

  // ======= TESTS NUEVOS =======

  {
    name: 'calculateResourceCost - recurso con costPerHour 0 debe retornar 0',
    fn: () => {
      const r1 = DataModel.createResource({ id: 'r1', costPerHour: 0 });
      const t1 = DataModel.createTask({
        id: 't1',
        duration: 10,
        resourceAssignments: [{ resourceId: 'r1', units: 100 }],
      });
      const project = { hoursPerDay: 8 };
      const cost = ResourceEngine.calculateResourceCost(t1, r1, project);
      assert.equal(cost, 0);
    },
  },

  {
    name: 'calculateResourceCost - recurso no asignado a la tarea retorna 0',
    fn: () => {
      const r1 = DataModel.createResource({ id: 'r1', costPerHour: 100 });
      const t1 = DataModel.createTask({
        id: 't1',
        duration: 5,
        resourceAssignments: [{ resourceId: 'r2', units: 100 }],
      });
      const project = { hoursPerDay: 8 };
      const cost = ResourceEngine.calculateResourceCost(t1, r1, project);
      assert.equal(cost, 0, 'Recurso r1 no esta asignado a la tarea');
    },
  },

  {
    name: 'calculateTaskResourceCost - tarea sin recursos debe retornar 0',
    fn: () => {
      const t1 = DataModel.createTask({
        id: 't1',
        duration: 5,
        resourceAssignments: [],
      });
      const project = { hoursPerDay: 8, resources: [] };
      const cost = ResourceEngine.calculateTaskResourceCost(t1, project);
      assert.equal(cost, 0);
    },
  },

  {
    name: 'levelResources - debe respetar maxIterations y no ciclarse',
    fn: () => {
      const r1 = DataModel.createResource({ id: 'r1', name: 'Dev', maxUnits: 100 });
      const t1 = DataModel.createTask({
        id: 't1',
        duration: 5,
        predecessors: [],
        resourceAssignments: [{ resourceId: 'r1', units: 100 }],
        isSummary: false,
      });
      const t2 = DataModel.createTask({
        id: 't2',
        duration: 5,
        predecessors: [],
        resourceAssignments: [{ resourceId: 'r1', units: 100 }],
        isSummary: false,
      });
      const project = {
        resources: [r1],
        tasks: [t1, t2],
        calendarWorkdays: [1, 2, 3, 4, 5],
        startDate: '2026-01-05',
        hoursPerDay: 8,
      };
      ScheduleEngine.calculate(project);
      const result = ResourceEngine.levelResources(project);
      assert.truthy(typeof result.iterations === 'number', 'Debe retornar iteraciones');
      assert.truthy(result.iterations <= 100, 'No debe exceder maxIterations');
    },
  },

  {
    name: 'detectOverallocation - sin recursos no debe generar conflictos',
    fn: () => {
      const t1 = DataModel.createTask({
        id: 't1',
        duration: 5,
        resourceAssignments: [],
        isSummary: false,
      });
      const project = {
        resources: [],
        tasks: [t1],
        calendarWorkdays: [1, 2, 3, 4, 5],
        startDate: '2026-01-05',
      };
      ScheduleEngine.calculate(project);
      const conflicts = ResourceEngine.detectOverallocation(project);
      assert.arrayLength(conflicts, 0);
    },
  },

  {
    name: 'generateHistogramData - proyecto sin recursos debe retornar estructura valida',
    fn: () => {
      const project = {
        resources: [],
        tasks: [],
        calendarWorkdays: [1, 2, 3, 4, 5],
        startDate: '2026-01-05',
      };
      const histogram = ResourceEngine.generateHistogramData(project);
      assert.truthy(histogram.labels !== undefined, 'Debe tener labels');
      assert.truthy(histogram.datasets !== undefined, 'Debe tener datasets');
      assert.arrayLength(histogram.datasets, 0);
    },
  },
]);
