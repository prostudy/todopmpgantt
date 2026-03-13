/**
 * Tests para EVM Engine
 */

TestRunner.registerSuite('EVM Engine', [
  {
    name: 'calculate - debe calcular BAC correctamente',
    fn: () => {
      const project = {
        tasks: [
          DataModel.createTask({ id: 't1', plannedCost: 1000, isSummary: false }),
          DataModel.createTask({ id: 't2', plannedCost: 2000, isSummary: false }),
          DataModel.createTask({ id: 't3', plannedCost: 0, isSummary: true }),
        ],
        baselines: [],
        statusDate: '2026-01-15',
      };
      const metrics = EVMEngine.calculate(project);
      assert.equal(metrics.BAC, 3000);
    },
  },

  {
    name: 'calculate - debe calcular EV correctamente',
    fn: () => {
      const project = {
        tasks: [
          DataModel.createTask({ id: 't1', plannedCost: 1000, percentComplete: 100, isSummary: false }),
          DataModel.createTask({ id: 't2', plannedCost: 2000, percentComplete: 50, isSummary: false }),
        ],
        baselines: [],
        statusDate: '2026-01-15',
      };
      const metrics = EVMEngine.calculate(project);
      assert.equal(metrics.EV, 2000);
    },
  },

  {
    name: 'calculate - debe calcular AC correctamente',
    fn: () => {
      const project = {
        tasks: [
          DataModel.createTask({ id: 't1', actualCost: 1200, isSummary: false }),
          DataModel.createTask({ id: 't2', actualCost: 800, isSummary: false }),
        ],
        baselines: [],
        statusDate: '2026-01-15',
      };
      const metrics = EVMEngine.calculate(project);
      assert.equal(metrics.AC, 2000);
    },
  },

  {
    name: 'calculate - debe calcular SV y CV correctamente',
    fn: () => {
      const project = {
        tasks: [
          DataModel.createTask({ 
            id: 't1', 
            plannedCost: 1000, 
            actualCost: 1200, 
            percentComplete: 80,
            startDate: '2026-01-01',
            endDate: '2026-01-10',
            isSummary: false 
          }),
        ],
        baselines: [],
        statusDate: '2026-01-15',
      };
      const metrics = EVMEngine.calculate(project);
      assert.equal(metrics.EV, 800);
      assert.equal(metrics.AC, 1200);
      assert.equal(metrics.SV, -200);
      assert.equal(metrics.CV, -400);
    },
  },

  {
    name: 'calculate - debe calcular SPI y CPI correctamente',
    fn: () => {
      const project = {
        tasks: [
          DataModel.createTask({ 
            id: 't1', 
            plannedCost: 1000, 
            actualCost: 800, 
            percentComplete: 100,
            startDate: '2026-01-01',
            endDate: '2026-01-10',
            isSummary: false 
          }),
        ],
        baselines: [],
        statusDate: '2026-01-15',
      };
      const metrics = EVMEngine.calculate(project);
      assert.equal(metrics.EV, 1000);
      assert.equal(metrics.AC, 800);
      assert.equal(metrics.PV, 1000);
      assert.equal(metrics.SPI, 1.0);
      assert.equal(metrics.CPI, 1.25);
    },
  },

  {
    name: 'calculate - debe manejar división por cero en SPI',
    fn: () => {
      const project = {
        tasks: [
          DataModel.createTask({ 
            id: 't1', 
            plannedCost: 1000, 
            actualCost: 500, 
            percentComplete: 50,
            startDate: '2026-06-01',
            endDate: '2026-06-10',
            isSummary: false 
          }),
        ],
        baselines: [],
        statusDate: '2026-01-15',
      };
      const metrics = EVMEngine.calculate(project);
      assert.equal(metrics.PV, 0);
      assert.equal(metrics.SPI, 0);
    },
  },

  {
    name: 'calculate - debe calcular EAC, ETC, VAC correctamente',
    fn: () => {
      const project = {
        tasks: [
          DataModel.createTask({ 
            id: 't1', 
            plannedCost: 1000, 
            actualCost: 600, 
            percentComplete: 50,
            startDate: '2026-01-01',
            endDate: '2026-01-20',
            isSummary: false 
          }),
        ],
        baselines: [],
        statusDate: '2026-01-10',
      };
      const metrics = EVMEngine.calculate(project);
      assert.equal(metrics.BAC, 1000);
      assert.equal(metrics.EV, 500);
      assert.equal(metrics.AC, 600);
      assert.closeTo(metrics.CPI, 0.833, 0.01);
      assert.closeTo(metrics.EAC, 1200, 1);
      assert.closeTo(metrics.ETC, 600, 1);
      assert.closeTo(metrics.VAC, -200, 1);
    },
  },

  {
    name: 'calculate - debe calcular TCPI correctamente',
    fn: () => {
      const project = {
        tasks: [
          DataModel.createTask({ 
            id: 't1', 
            plannedCost: 1000, 
            actualCost: 600, 
            percentComplete: 50,
            isSummary: false 
          }),
        ],
        baselines: [],
        statusDate: '2026-01-10',
      };
      const metrics = EVMEngine.calculate(project);
      assert.equal(metrics.TCPI_BAC, 1.25);
    },
  },

  {
    name: 'calculatePV - debe calcular PV para tarea completamente pasada',
    fn: () => {
      const tasks = [
        DataModel.createTask({ 
          id: 't1', 
          plannedCost: 1000,
          startDate: '2026-01-01',
          endDate: '2026-01-10',
          isSummary: false 
        }),
      ];
      const statusDate = new Date('2026-01-15T00:00:00');
      const pv = EVMEngine.calculatePV(tasks, null, statusDate, {});
      assert.equal(pv, 1000);
    },
  },

  {
    name: 'calculatePV - debe calcular PV para tarea parcialmente en progreso',
    fn: () => {
      const tasks = [
        DataModel.createTask({ 
          id: 't1', 
          plannedCost: 1000,
          startDate: '2026-01-01',
          endDate: '2026-01-11',
          isSummary: false 
        }),
      ];
      const statusDate = new Date('2026-01-06T00:00:00');
      const pv = EVMEngine.calculatePV(tasks, null, statusDate, {});
      assert.equal(pv, 500);
    },
  },

  {
    name: 'calculatePV - debe retornar 0 para tareas futuras',
    fn: () => {
      const tasks = [
        DataModel.createTask({ 
          id: 't1', 
          plannedCost: 1000,
          startDate: '2026-06-01',
          endDate: '2026-06-10',
          isSummary: false 
        }),
      ];
      const statusDate = new Date('2026-01-15T00:00:00');
      const pv = EVMEngine.calculatePV(tasks, null, statusDate, {});
      assert.equal(pv, 0);
    },
  },

  {
    name: 'getStatus - debe retornar green para SPI >= 0.95',
    fn: () => {
      assert.equal(EVMEngine.getStatus(1.0, 'SPI'), 'green');
      assert.equal(EVMEngine.getStatus(0.95, 'SPI'), 'green');
    },
  },

  {
    name: 'getStatus - debe retornar yellow para SPI entre 0.8 y 0.95',
    fn: () => {
      assert.equal(EVMEngine.getStatus(0.85, 'SPI'), 'yellow');
    },
  },

  {
    name: 'getStatus - debe retornar red para SPI < 0.8',
    fn: () => {
      assert.equal(EVMEngine.getStatus(0.75, 'SPI'), 'red');
    },
  },

  {
    name: 'interpret - debe interpretar correctamente el estado del proyecto',
    fn: () => {
      const metrics = {
        SPI: 1.1,
        CPI: 0.9,
        EAC: 1100,
        BAC: 1000,
      };
      const interpretations = EVMEngine.interpret(metrics);
      assert.arrayContains(interpretations, 'El proyecto esta adelantado en cronograma');
      assert.arrayContains(interpretations, 'El proyecto esta por encima del presupuesto');
    },
  },
]);
