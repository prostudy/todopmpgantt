/**
 * Tests para CSV Manager
 */

TestRunner.registerSuite('CSV Manager', [
  {
    name: 'arrayToCSV - debe convertir array 2D a CSV',
    fn: () => {
      const data = [
        ['Name', 'Age', 'City'],
        ['John', '30', 'NYC'],
        ['Jane', '25', 'LA'],
      ];
      const csv = CSVManager.arrayToCSV(data);
      const lines = csv.split('\n');
      assert.arrayLength(lines, 3);
      assert.equal(lines[0], 'Name,Age,City');
    },
  },

  {
    name: 'arrayToCSV - debe escapar comillas y comas',
    fn: () => {
      const data = [
        ['Name', 'Description'],
        ['Product A', 'Contains, commas'],
        ['Product B', 'Has "quotes"'],
      ];
      const csv = CSVManager.arrayToCSV(data);
      assert.truthy(csv.includes('"Contains, commas"'));
      assert.truthy(csv.includes('"Has ""quotes"""'));
    },
  },

  {
    name: 'parseCSV - debe parsear CSV simple',
    fn: () => {
      const csv = 'Name,Age,City\nJohn,30,NYC\nJane,25,LA';
      const parsed = CSVManager.parseCSV(csv);
      assert.arrayLength(parsed, 3);
      assert.arrayLength(parsed[0], 3);
      assert.equal(parsed[1][0], 'John');
      assert.equal(parsed[2][1], '25');
    },
  },

  {
    name: 'parseCSV - debe manejar campos con comillas',
    fn: () => {
      const csv = 'Name,Description\n"Product A","Contains, commas"\n"Product B","Has ""quotes"""';
      const parsed = CSVManager.parseCSV(csv);
      assert.equal(parsed[1][1], 'Contains, commas');
      assert.equal(parsed[2][1], 'Has "quotes"');
    },
  },

  {
    name: 'exportTasks - debe exportar tareas a CSV',
    fn: () => {
      const project = {
        tasks: [
          DataModel.createTask({ 
            id: 't1', 
            name: 'Task 1', 
            duration: 5,
            plannedCost: 1000,
            wbsCode: '1',
          }),
        ],
        resources: [],
      };
      const csv = CSVManager.exportTasks(project);
      assert.truthy(csv.includes('Task 1'));
      assert.truthy(csv.includes('1000'));
    },
  },

  {
    name: 'exportResources - debe exportar recursos a CSV',
    fn: () => {
      const project = {
        resources: [
          DataModel.createResource({ name: 'Developer', costPerHour: 500, maxUnits: 100 }),
        ],
      };
      const csv = CSVManager.exportResources(project);
      assert.truthy(csv.includes('Developer'));
      assert.truthy(csv.includes('500'));
    },
  },

  {
    name: 'importTasks - debe importar tareas desde CSV',
    fn: () => {
      const csv = 'WBS,Nombre,Duracion\n1,Task 1,5\n2,Task 2,3';
      const project = { resources: [] };
      const result = CSVManager.importTasks(csv, project);
      assert.arrayLength(result.tasks, 2);
      assert.equal(result.tasks[0].name, 'Task 1');
      assert.equal(result.tasks[0].duration, 5);
      assert.equal(result.tasks[1].duration, 3);
    },
  },

  {
    name: 'importResources - debe importar recursos desde CSV',
    fn: () => {
      const csv = 'Nombre,Tipo,Costo por Hora,Unidades Max\nDeveloper,Trabajo,500,100\nTester,Trabajo,300,100';
      const result = CSVManager.importResources(csv);
      assert.arrayLength(result.resources, 2);
      assert.equal(result.resources[0].name, 'Developer');
      assert.equal(result.resources[0].costPerHour, 500);
    },
  },

  {
    name: 'mapColumns - debe mapear columnas flexiblemente',
    fn: () => {
      const headers = ['nombre tarea', 'duracion dias', 'costo plan'];
      const map = CSVManager.mapColumns(headers);
      assert.equal(map.name, 0);
      assert.equal(map.duration, 1);
      assert.equal(map.cost, 2);
    },
  },

  {
    name: 'parseResourceString - debe parsear asignaciones de recursos',
    fn: () => {
      const r1 = DataModel.createResource({ id: 'r1', name: 'Developer' });
      const r2 = DataModel.createResource({ id: 'r2', name: 'Tester' });
      const project = { resources: [r1, r2] };
      const assignments = CSVManager.parseResourceString('Developer[100%]; Tester[50%]', project);
      assert.arrayLength(assignments, 2);
      assert.equal(assignments[0].resourceId, 'r1');
      assert.equal(assignments[0].units, 100);
      assert.equal(assignments[1].resourceId, 'r2');
      assert.equal(assignments[1].units, 50);
    },
  },

  {
    name: 'exportProjectJSON - debe exportar proyecto completo',
    fn: () => {
      const project = DataModel.createProject({ name: 'Test Project' });
      project.tasks.push(DataModel.createTask({ name: 'Task 1' }));
      const json = CSVManager.exportProjectJSON(project);
      const parsed = JSON.parse(json);
      assert.equal(parsed.name, 'Test Project');
      assert.arrayLength(parsed.tasks, 1);
    },
  },

  {
    name: 'importProjectJSON - debe importar proyecto desde JSON',
    fn: () => {
      const original = DataModel.createProject({ name: 'Test Project' });
      original.tasks.push(DataModel.createTask({ name: 'Task 1' }));
      const json = JSON.stringify(original);
      const imported = CSVManager.importProjectJSON(json);
      assert.equal(imported.name, 'Test Project');
      assert.arrayLength(imported.tasks, 1);
    },
  },
]);
