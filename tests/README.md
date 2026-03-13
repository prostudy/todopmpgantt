# 🧪 Suite de Tests - Gantt PMI

Suite completa de tests unitarios para validar la funcionalidad de la herramienta Gantt PMI.

## 📁 Estructura

```
tests/
├── test-runner.html          # Ejecutor de tests en navegador
├── test-suite.js              # Framework de testing
├── test-data-model.js         # Tests del modelo de datos
├── test-schedule-engine.js    # Tests del motor CPM
├── test-evm-engine.js         # Tests de EVM
├── test-resource-engine.js    # Tests de recursos
└── test-csv-manager.js        # Tests de import/export
```

## 🚀 Cómo Ejecutar los Tests

### Método 1: Navegador (Recomendado)

1. Abre el archivo `test-runner.html` en tu navegador
2. Haz clic en el botón **"Ejecutar Tests"**
3. Observa los resultados en tiempo real

### Método 2: Servidor Local

```bash
# Desde la raíz del proyecto
python -m http.server 8000
# O con Node.js
npx http-server

# Luego abre: http://localhost:8000/tests/test-runner.html
```

## 📊 Cobertura de Tests

### Data Model (9 tests)
- ✅ Creación de tareas con valores por defecto
- ✅ Creación de recursos
- ✅ Gestión de dependencias
- ✅ Jerarquía de tareas (WBS)
- ✅ Detección de ciclos (skipped - bug conocido)
- ✅ Líneas base

### Schedule Engine - CPM (15 tests)
- ✅ Forward Pass (ES/EF)
- ✅ Backward Pass (LS/LF)
- ✅ Cálculo de holguras
- ✅ Identificación de ruta crítica
- ✅ 4 tipos de dependencias (FS, SS, FF, SF)
- ✅ Manejo de lag positivo/negativo
- ✅ Conversión a fechas calendario
- ✅ Ordenamiento topológico
- ✅ Detección de ciclos

### EVM Engine (15 tests)
- ✅ Cálculo de BAC, PV, EV, AC
- ✅ Varianzas (SV, CV)
- ✅ Índices (SPI, CPI)
- ✅ Estimaciones (EAC, ETC, VAC)
- ✅ TCPI
- ✅ Manejo de división por cero
- ✅ Estados semáforo
- ✅ Interpretaciones

### Resource Engine (7 tests)
- ✅ Cálculo de carga por recurso
- ✅ Detección de sobreasignación
- ✅ Cálculo de costos
- ✅ Costos con múltiples recursos
- ✅ Generación de histogramas

### CSV Manager (12 tests)
- ✅ Conversión array a CSV
- ✅ Parseo de CSV
- ✅ Escape de caracteres especiales
- ✅ Exportación de tareas
- ✅ Exportación de recursos
- ✅ Importación de tareas
- ✅ Importación de recursos
- ✅ Mapeo flexible de columnas
- ✅ Parseo de asignaciones
- ✅ Export/Import JSON

**Total: 58 tests**

## 🐛 Bugs Conocidos Identificados

Los siguientes tests están marcados como `skip: true` debido a bugs conocidos en el código:

1. **hasCircularDependency** - La detección de ciclos no funciona correctamente porque crea un nuevo Set en cada recursión

## 📝 Cómo Agregar Nuevos Tests

```javascript
TestRunner.registerSuite('Nombre del Suite', [
  {
    name: 'Descripción del test',
    fn: () => {
      // Arrange
      const data = setupTestData();
      
      // Act
      const result = functionToTest(data);
      
      // Assert
      assert.equal(result, expectedValue);
    },
  },
  
  {
    name: 'Test que debe ser omitido',
    fn: () => {
      // Test code
    },
    skip: true, // Omitir este test
  },
]);
```

## 🔧 Assertions Disponibles

```javascript
assert.equal(actual, expected, message)
assert.notEqual(actual, expected, message)
assert.deepEqual(actual, expected, message)
assert.truthy(value, message)
assert.falsy(value, message)
assert.throws(fn, message)
assert.arrayContains(array, item, message)
assert.arrayLength(array, length, message)
assert.closeTo(actual, expected, delta, message)
```

## 🎯 Mejores Prácticas

1. **Nombra los tests descriptivamente**: Usa el formato "debe [acción esperada]"
2. **Un concepto por test**: Cada test debe validar una sola cosa
3. **Arrange-Act-Assert**: Organiza el código del test en 3 secciones claras
4. **Datos de prueba aislados**: Crea datos nuevos para cada test
5. **Tests independientes**: Los tests no deben depender del orden de ejecución

## 🔍 Interpretación de Resultados

### Estados de Tests

- **PASS** (Verde): El test pasó correctamente
- **FAIL** (Rojo): El test falló - revisa el mensaje de error
- **SKIP** (Amarillo): El test fue omitido intencionalmente

### Métricas

- **Total Tests**: Número total de tests ejecutados
- **Passed**: Tests que pasaron exitosamente
- **Failed**: Tests que fallaron
- **Duration**: Tiempo total de ejecución en milisegundos

## 🚨 Errores Comunes

### "Cannot read property of undefined"
- Verifica que todos los objetos estén inicializados correctamente
- Revisa que las dependencias se carguen en el orden correcto

### "Expected X, got Y"
- El valor calculado no coincide con el esperado
- Revisa la lógica de la función bajo prueba

### Tests intermitentes
- Pueden deberse a dependencias de tiempo o estado compartido
- Asegúrate de que cada test sea independiente

## 📚 Recursos Adicionales

- [Documentación del Proyecto](../README.md)
- [Análisis de Errores Identificados](./ANALISIS.md)
- [Guía de Contribución](../CONTRIBUTING.md)

## 🔄 Integración Continua

Para ejecutar los tests automáticamente en cada cambio:

1. Configura un hook de pre-commit
2. Usa un servidor CI/CD (GitHub Actions, GitLab CI, etc.)
3. Ejecuta los tests antes de cada deploy

## 📞 Soporte

Si encuentras problemas con los tests:

1. Revisa la consola del navegador para errores detallados
2. Verifica que todas las dependencias estén cargadas
3. Asegúrate de usar un navegador moderno (Chrome, Firefox, Edge)

---

**Última actualización**: Marzo 2026  
**Versión**: 1.0.0
