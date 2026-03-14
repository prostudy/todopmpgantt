# TodoPMP Gantt

**Cronograma Profesional Gratuito para Gestion de Proyectos**

[![TodoPMP](https://img.shields.io/badge/TodoPMP-Gantt-0ea5e9?style=for-the-badge)](https://todopmp.com/gantt)
[![Licencia](https://img.shields.io/badge/Licencia-Gratuito-22c55e?style=for-the-badge)](https://todopmp.com)
[![Tests](https://img.shields.io/badge/Tests-94%20passed-22c55e?style=for-the-badge)](#tests)

Herramienta web gratuita de gestion de proyectos con diagrama de Gantt, ruta critica (CPM), valor ganado (EVM), gestion de recursos y exportacion CSV/JSON. Diseñada para estudiantes y profesionales de administracion de proyectos siguiendo las mejores practicas del PMI y PMBOK.

**No requiere instalacion, registro, servidor ni licencias.**

---

## Capturas de Pantalla

| WBS / Tareas | Diagrama de Gantt | EVM Dashboard |
|:---:|:---:|:---:|
| Tabla editable con CPM | Grafico SVG interactivo | KPI cards con semaforo |

---

## Caracteristicas Principales

### Gestion de Cronograma
- **Diagrama de Gantt** interactivo con renderizado SVG
- **Ruta Critica (CPM)** con forward/backward pass automatico
- **4 tipos de dependencias**: FS (Fin-Inicio), SS (Inicio-Inicio), FF (Fin-Fin), SF (Inicio-Fin)
- **Lag/Lead** en dependencias (positivo y negativo)
- **Hitos** (milestones) con duracion cero
- **Holgura Total y Libre** calculadas automaticamente
- Escala temporal configurable: dias, semanas o meses
- Linea de hoy y linea base superpuesta

### Estructura de Desglose del Trabajo (WBS/EDT)
- Jerarquia multinivel con codigos WBS automaticos (1, 1.1, 1.1.1...)
- Tareas resumen que agregan duracion, costo y % avance
- Indentacion/des-indentacion con un clic
- Colapsar/expandir niveles

### Valor Ganado (EVM)
- **12 metricas**: BAC, PV, EV, AC, SV, CV, SPI, CPI, EAC, ETC, VAC, TCPI
- Dashboard con KPI cards y semaforo de colores (verde/amarillo/rojo)
- **Curva S** con PV, EV y AC
- Interpretaciones automaticas en lenguaje natural
- Barra de progreso visual (avance vs gasto)

### Gestion de Recursos
- Recursos tipo Trabajo y Material
- Costo por hora configurable
- Asignacion de recursos a tareas con porcentaje de dedicacion
- **Calculo automatico de costos** desde asignaciones de recursos
- Deteccion de **sobreasignacion** con alertas
- **Nivelacion de recursos** automatica
- **Histograma** de carga por recurso

### Linea Base
- Guardar multiples lineas base (snapshots)
- Comparacion visual entre plan actual y linea base
- Variacion en dias por tarea

### Importacion / Exportacion
- **CSV**: importar y exportar tareas y recursos
- **JSON**: guardar y cargar proyectos completos
- **PNG**: exportar imagen del diagrama de Gantt
- **CSV de EVM**: exportar metricas de valor ganado
- Compatible con datos de MS Project y GanttProject

---

## Inicio Rapido

### Opcion 1: Abrir directamente
1. Descarga o clona el repositorio
2. Abre `https://todopmp.com/gantt` en tu navegador (Chrome, Firefox, Edge, Safari)
3. Listo - no necesitas servidor

### Opcion 2: Servidor local (opcional)
```bash
cd gantt-pmi
python3 -m http.server 8080
```
Luego abre `http://localhost:8080` en tu navegador.

### Opcion 3: Demo rapido
1. Abre `https://todopmp.com/gantt`
2. Haz clic en el boton **Demo** en la barra de herramientas
3. Explora el proyecto de ejemplo precargado

---

## Estructura del Proyecto

```
gantt-pmi/
├── index.html                  # Aplicacion principal
├── og-image.html               # Plantilla imagen OpenGraph
├── README.md                   # Este archivo
├── MANUAL_USUARIO.md           # Manual de usuario completo
│
├── css/
│   └── styles.css              # Design system (Navy/Teal/Coral)
│
├── js/
│   ├── app.js                  # Aplicacion Vue 3 principal
│   ├── data-model.js           # Modelos: Task, Resource, Project, Baseline
│   ├── schedule-engine.js      # CPM: forward/backward pass, holguras
│   ├── evm-engine.js           # Valor Ganado: PV, EV, AC, SPI, CPI, etc.
│   ├── resource-engine.js      # Nivelacion, histograma, sobreasignacion
│   ├── csv-manager.js          # Import/export CSV y JSON
│   └── gantt-renderer.js       # Renderizado SVG del diagrama Gantt
│
├── ejemplos/
│   ├── panaderia_valor_ganado.json     # Proyecto panaderia con EVM
│   ├── panaderia_valor_ganado.csv      # Exportacion CSV panaderia
│   ├── red_actividades_2recursos.json  # Red de actividades con 2 recursos
│   ├── red_actividades_2recursos.csv   # Exportacion CSV red actividades
│   ├── LEEME_panaderia.txt             # Guia del ejemplo panaderia
│   └── LEEME_red_actividades.txt       # Guia del ejemplo red actividades
│
├── tests/
│   ├── test-runner.html        # Pagina para ejecutar tests
│   ├── test-suite.js           # Suite principal (94 tests)
│   ├── test-data-model.js      # Tests del modelo de datos
│   ├── test-schedule-engine.js # Tests del motor CPM
│   ├── test-evm-engine.js      # Tests de valor ganado
│   ├── test-resource-engine.js # Tests de recursos
│   ├── test-csv-manager.js     # Tests de import/export
│   └── README.md               # Documentacion de tests
│
└── img/
    └── todopmp-gantt-og.png    # Imagen para redes sociales
```

---

## Arquitectura Tecnica

| Componente | Tecnologia |
|---|---|
| **Frontend** | HTML5 + CSS3 + JavaScript ES6+ |
| **Framework** | Vue.js 3 (CDN, Composition API) |
| **Graficos** | SVG nativo (diagrama Gantt y Curva S) |
| **Fuentes** | Google Fonts (Inter + JetBrains Mono) |
| **Persistencia** | localStorage del navegador |
| **Exportacion** | html2canvas (PNG), Blob API (CSV/JSON) |
| **Backend** | Ninguno - 100% client-side |
| **Tests** | Suite propia (94 unit tests) |

### Motores de Calculo

- **ScheduleEngine**: Implementa CPM completo con forward pass, backward pass, calculo de holguras, deteccion de ruta critica, y soporte para los 4 tipos de dependencias con lag/lead.
- **EVMEngine**: Calcula las 12 metricas de valor ganado, genera datos para la curva S, e interpreta resultados en lenguaje natural.
- **ResourceEngine**: Calcula carga de recursos por dia, detecta sobreasignaciones, nivela recursos automaticamente, y genera datos para histogramas.
- **CSVManager**: Parsea y genera CSV con soporte para caracteres especiales, validacion de datos, y round-trip sin perdida de informacion.

---

## Tests

El proyecto incluye **94 unit tests** organizados en 5 modulos:

| Modulo | Tests | Cobertura |
|---|---|---|
| Data Model | 15 | createTask, createResource, createProject, WBS, baselines |
| Schedule Engine | 30 | CPM, forward/backward pass, holguras, dependencias, hitos |
| EVM Engine | 20 | Metricas, curva S, interpretaciones, edge cases |
| Resource Engine | 14 | Costos, nivelacion, histograma, sobreasignacion |
| CSV Manager | 15 | Import/export, round-trip, caracteres especiales, JSON |

### Ejecutar tests
Abre `tests/test-runner.html` en tu navegador y haz clic en **Ejecutar Tests**.

---

## Ejemplos Incluidos

### 1. Panaderia - Ejemplo EVM
Proyecto de produccion de 10 panes con un panadero. Ideal para practicar:
- Seguimiento de avance con valor ganado
- Interpretacion de SPI y CPI
- Curva S

### 2. Red de Actividades con 2 Recursos
Proyecto con 5 actividades, 2 recursos con diferentes costos/hora ($1.25 y $2.50), y hitos. Ideal para practicar:
- Ruta critica con multiples caminos
- Calculo automatico de costos desde recursos
- Nivelacion de recursos

---

## Navegadores Soportados

| Navegador | Version Minima |
|---|---|
| Chrome | 80+ |
| Firefox | 78+ |
| Safari | 14+ |
| Edge | 80+ |

---

## Creditos

Desarrollado por **[TodoPMP](https://todopmp.com)** para la comunidad de gestion de proyectos.

- Sitio web: [todopmp.com](https://todopmp.com)
- Procesos PMBOK: [todopmp.com/procesos-pmbok](https://todopmp.com/procesos-pmbok/)

---

## Licencia

Herramienta gratuita para uso educativo y profesional. No requiere licencia.
