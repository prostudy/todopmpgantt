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

  // ======= TESTS NUEVOS =======

  {
    name: 'parseCSV - debe manejar lineas vacias',
    fn: () => {
      const csv = 'Name,Age\nJohn,30\n\nJane,25\n';
      const parsed = CSVManager.parseCSV(csv);
      // Debe parsear sin errores (puede incluir filas vacias)
      assert.truthy(parsed.length >= 3, 'Debe parsear al menos header + 2 filas');
    },
  },

  {
    name: 'parseCSV - debe manejar caracteres especiales (acentos, ñ)',
    fn: () => {
      const csv = 'Nombre,Descripción\nDiseño,Tarea con ñ y acentós';
      const parsed = CSVManager.parseCSV(csv);
      assert.equal(parsed[1][0], 'Diseño');
      assert.truthy(parsed[1][1].includes('ñ'), 'Debe preservar ñ');
    },
  },

  {
    name: 'exportTasks + importTasks - round trip debe preservar datos',
    fn: () => {
      const project = {
        tasks: [
          DataModel.createTask({
            id: 't1',
            name: 'Analisis',
            duration: 10,
            plannedCost: 500,
            wbsCode: '1',
            isSummary: false,
          }),
          DataModel.createTask({
            id: 't2',
            name: 'Desarrollo',
            duration: 20,
            plannedCost: 1000,
            wbsCode: '2',
            isSummary: false,
          }),
        ],
        resources: [],
      };
      const csv = CSVManager.exportTasks(project);
      const imported = CSVManager.importTasks(csv, { resources: [] });
      assert.arrayLength(imported.tasks, 2);
      assert.equal(imported.tasks[0].name, 'Analisis');
      assert.equal(imported.tasks[0].duration, 10);
      assert.equal(imported.tasks[1].name, 'Desarrollo');
      assert.equal(imported.tasks[1].duration, 20);
    },
  },

  {
    name: 'parseResourceString - string vacio debe retornar array vacio',
    fn: () => {
      const project = { resources: [] };
      const assignments = CSVManager.parseResourceString('', project);
      assert.arrayLength(assignments, 0);
    },
  },

  {
    name: 'parseResourceString - recurso no existente debe ignorarse',
    fn: () => {
      const r1 = DataModel.createResource({ id: 'r1', name: 'Developer' });
      const project = { resources: [r1] };
      const assignments = CSVManager.parseResourceString('Inexistente[100%]', project);
      assert.arrayLength(assignments, 0, 'Recurso no encontrado debe ignorarse');
    },
  },

  {
    name: 'exportProjectJSON + importProjectJSON - round trip completo',
    fn: () => {
      const project = DataModel.createProject({ name: 'Round Trip Test' });
      project.tasks.push(DataModel.createTask({ id: 't1', name: 'Tarea 1', duration: 5, plannedCost: 100 }));
      project.resources.push(DataModel.createResource({ id: 'r1', name: 'Recurso 1', costPerHour: 50 }));
      const json = CSVManager.exportProjectJSON(project);
      const imported = CSVManager.importProjectJSON(json);
      assert.equal(imported.name, 'Round Trip Test');
      assert.arrayLength(imported.tasks, 1);
      assert.arrayLength(imported.resources, 1);
      assert.equal(imported.tasks[0].name, 'Tarea 1');
      assert.equal(imported.resources[0].costPerHour, 50);
    },
  },
]);
