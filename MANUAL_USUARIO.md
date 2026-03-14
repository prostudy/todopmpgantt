# Manual de Usuario - TodoPMP Gantt

**Version 1.0 | TodoPMP.com**

---

## Tabla de Contenidos

1. [Introduccion](#1-introduccion)
2. [Interfaz de Usuario](#2-interfaz-de-usuario)
3. [Primeros Pasos](#3-primeros-pasos)
4. [Gestion de Tareas (WBS)](#4-gestion-de-tareas-wbs)
5. [Dependencias entre Tareas](#5-dependencias-entre-tareas)
6. [Diagrama de Gantt](#6-diagrama-de-gantt)
7. [Gestion de Recursos](#7-gestion-de-recursos)
8. [Valor Ganado (EVM)](#8-valor-ganado-evm)
9. [Lineas Base](#9-lineas-base)
10. [Importar y Exportar](#10-importar-y-exportar)
11. [Configuracion del Proyecto](#11-configuracion-del-proyecto)
12. [Preguntas Frecuentes](#12-preguntas-frecuentes)
13. [Glosario PMI](#13-glosario-pmi)

---

## 1. Introduccion

### Que es TodoPMP Gantt?

TodoPMP Gantt es una herramienta web gratuita para crear y gestionar cronogramas de proyectos profesionales. Esta diseñada siguiendo las mejores practicas del **Project Management Institute (PMI)** y el **PMBOK Guide**, lo que la hace ideal para:

- Estudiantes de diplomados y maestrias en administracion de proyectos
- Preparacion para la certificacion PMP
- Profesionales que necesitan una herramienta ligera sin costo de licencias
- Profesores que necesitan una herramienta accesible para sus alumnos

### Que puede hacer?

| Funcionalidad | Descripcion |
|---|---|
| **Diagrama de Gantt** | Visualiza tu proyecto con barras temporales, dependencias y ruta critica |
| **Ruta Critica (CPM)** | Calculo automatico del camino mas largo del proyecto |
| **Valor Ganado (EVM)** | Analisis completo con 12 metricas: SPI, CPI, EAC, ETC, VAC, TCPI |
| **WBS/EDT** | Estructura jerarquica con codigos WBS automaticos |
| **Recursos** | Asignacion, costos automaticos, histograma y nivelacion |
| **Lineas Base** | Guarda snapshots para comparar el avance vs el plan original |
| **Import/Export** | CSV, JSON y PNG para compartir y respaldar |

### Requisitos

- Un navegador web moderno (Chrome, Firefox, Edge o Safari)
- No requiere instalacion, registro, internet permanente ni licencias

---

## 2. Interfaz de Usuario

TodoPMP Gantt tiene un diseño profesional con 4 areas principales:

### 2.1 Sidebar (Panel Lateral Izquierdo)

El sidebar oscuro a la izquierda te permite navegar entre las 5 vistas principales:

| Vista | Icono | Descripcion |
|---|---|---|
| **WBS / Tareas** | &#9776; | Tabla principal para crear y editar tareas |
| **Gantt** | &#9655; | Diagrama de Gantt visual |
| **Recursos** | &#9823; | Gestion de recursos del proyecto |
| **EVM Dashboard** | &#9733; | Panel de valor ganado con KPIs |
| **Linea Base** | &#9878; | Gestion de lineas base |

En la parte inferior del sidebar encontraras un enlace a los **40 Procesos del PMBOK 8** en todopmp.com.

### 2.2 Barra de Herramientas (Toolbar)

La barra superior contiene:

- **Nombre del proyecto** - Campo editable para nombrar tu proyecto
- **Nuevo** - Crear un proyecto vacio
- **Demo** - Cargar un proyecto de ejemplo
- **Importar CSV/JSON** - Cargar un proyecto desde archivo
- **Exportar CSV** - Guardar tareas en formato CSV
- **Guardar JSON** - Guardar proyecto completo
- **Recalcular** - Forzar recalculo de CPM, costos y EVM
- **Config** - Configuracion del proyecto
- **Fecha Estado** - Fecha de corte para el analisis EVM

### 2.3 Area de Contenido

El area central muestra el contenido de la vista seleccionada en el sidebar.

### 2.4 Barra de Estado (Status Bar)

La barra inferior muestra informacion clave en tiempo real:
- Numero de tareas y tareas criticas
- Numero de recursos
- Presupuesto total y gasto actual
- Fecha de inicio, fin y duracion del proyecto

---

## 3. Primeros Pasos

### 3.1 Crear un Nuevo Proyecto

1. Abre `todopmp.com/gantt` en tu navegador
2. Haz clic en **Nuevo** para crear un proyecto limpio
3. Escribe el nombre de tu proyecto en el campo de la barra de herramientas
4. Haz clic en **Config** para establecer la fecha de inicio y dias laborales

### 3.2 Cargar el Proyecto Demo

Si es tu primera vez, te recomendamos cargar el proyecto demo:

1. Haz clic en **Demo**
2. Se cargara un proyecto de ejemplo con tareas, recursos y datos de EVM
3. Navega por las 5 vistas para familiarizarte con la herramienta

### 3.3 Importar un Proyecto Existente

1. Haz clic en **Importar CSV/JSON**
2. Selecciona un archivo `.json` (proyecto completo) o `.csv` (solo tareas)
3. El proyecto se cargara automaticamente

> **Nota:** En la carpeta `ejemplos/` encontraras proyectos de ejemplo listos para importar.

---

## 4. Gestion de Tareas (WBS)

### 4.1 Agregar Tareas

- **+ Tarea**: Agrega una nueva tarea al final de la lista
- **+ Hito**: Agrega un hito (duracion = 0, marcado con diamante naranja)
- **+Sub**: Agrega una sub-tarea debajo de la tarea seleccionada

### 4.2 Editar Tareas

Todos los campos son editables directamente en la tabla:

| Campo | Descripcion | Ejemplo |
|---|---|---|
| **Nombre** | Nombre descriptivo de la tarea | "Diseño de interfaz" |
| **Dur.** | Duracion en dias laborales | 5 |
| **Predecesores** | Tareas que deben completarse antes | "2,3FS+1" |
| **Recursos** | Clic para asignar recursos | "Ana, Carlos" |
| **Costo Plan** | Costo planificado (manual o automatico) | 5000 |
| **Costo Real** | Costo real incurrido | 4800 |
| **%** | Porcentaje de avance (0-100) | 75 |

> **Nota:** Los campos Inicio, Fin, HT (Holgura Total), HL (Holgura Libre) y RC (Ruta Critica) se calculan automaticamente.

### 4.3 Organizar la Jerarquia WBS

Usa los botones de accion en cada fila:

| Boton | Accion |
|---|---|
| **+Sub** | Agregar sub-tarea |
| **&#8594;** | Indentar (convertir en hijo del anterior) |
| **&#8592;** | Des-indentar (subir un nivel) |
| **&#8593;** | Mover arriba |
| **&#8595;** | Mover abajo |
| **X** | Eliminar tarea |

Cuando una tarea tiene sub-tareas, se convierte automaticamente en **tarea resumen**:
- Su duracion se calcula desde las sub-tareas
- Su costo es la suma de los costos de las sub-tareas
- Su porcentaje de avance es el promedio ponderado
- No se puede editar directamente (los campos aparecen deshabilitados)

### 4.4 Codigos WBS

Los codigos WBS se asignan automaticamente:
- **1** - Primera tarea de nivel 1
- **1.1** - Primera sub-tarea de la tarea 1
- **1.1.1** - Sub-sub-tarea
- **2** - Segunda tarea de nivel 1

### 4.5 Colores de Filas

| Color | Significado |
|---|---|
| **Fondo rosado + borde naranja** | Tarea en ruta critica |
| **Fondo gris claro + texto bold** | Tarea resumen |
| **Fondo blanco/alterno** | Tarea normal |
| **Diamante naranja** | Hito |

---

## 5. Dependencias entre Tareas

### 5.1 Formato de Predecesores

Las dependencias se escriben en el campo **Predecesores** con el siguiente formato:

```
#Fila[Tipo][+/-Lag]
```

| Componente | Descripcion | Ejemplo |
|---|---|---|
| **#Fila** | Numero de fila de la tarea predecesora | `3` |
| **Tipo** | Tipo de dependencia (opcional, default: FS) | `FS`, `SS`, `FF`, `SF` |
| **Lag** | Dias de espera o adelanto (opcional) | `+2`, `-1` |

### 5.2 Tipos de Dependencias

| Tipo | Nombre | Significado |
|---|---|---|
| **FS** | Finish-to-Start | La tarea B inicia cuando A termina (mas comun) |
| **SS** | Start-to-Start | B inicia cuando A inicia |
| **FF** | Finish-to-Finish | B termina cuando A termina |
| **SF** | Start-to-Finish | B termina cuando A inicia (poco comun) |

### 5.3 Ejemplos

| Entrada | Significado |
|---|---|
| `3` | Despues de la tarea 3 (FS, sin lag) |
| `3FS` | Igual que arriba (FS explicito) |
| `3FS+2` | Despues de tarea 3, mas 2 dias de espera |
| `3FS-1` | Despues de tarea 3, con 1 dia de adelanto (lead) |
| `2,5SS` | Despues de tarea 2 (FS) y al mismo tiempo que tarea 5 (SS) |
| `4FF+1` | Termina 1 dia despues de que termina la tarea 4 |

### 5.4 Ruta Critica

Despues de definir las dependencias, haz clic en **Recalcular**. El sistema:

1. Ejecuta el **Forward Pass** (calcula ES/EF de todas las tareas)
2. Ejecuta el **Backward Pass** (calcula LS/LF de todas las tareas)
3. Calcula la **Holgura Total** (LF - EF) y **Holgura Libre**
4. Marca como **criticas** las tareas con holgura total = 0

Las tareas criticas aparecen resaltadas en **rojo/rosado** en la tabla y en el diagrama de Gantt.

---

## 6. Diagrama de Gantt

### 6.1 Vista General

El diagrama de Gantt muestra visualmente:
- **Barras azules/verdes**: Tareas normales
- **Barras rojas**: Tareas en ruta critica
- **Barras oscuras superiores**: Tareas resumen
- **Diamantes naranjas**: Hitos
- **Flechas**: Dependencias entre tareas
- **Linea vertical**: Fecha de hoy

### 6.2 Controles

| Control | Funcion |
|---|---|
| **Escala** | Cambiar entre Dias, Semanas o Meses |
| **Actualizar** | Regenerar el diagrama |
| **Exportar PNG** | Descargar imagen del Gantt |

### 6.3 Escala Temporal

- **Dias**: Muestra cada dia individual (ideal para proyectos cortos)
- **Semanas**: Agrupa por semanas (proyectos de 1-3 meses)
- **Meses**: Vista mensual (proyectos largos)

### 6.4 Exportar Imagen

Haz clic en **Exportar PNG** para descargar una imagen del diagrama. Util para:
- Incluir en presentaciones
- Entregar como tarea en clase
- Compartir con el equipo

---

## 7. Gestion de Recursos

### 7.1 Crear Recursos

1. Ve a la vista **Recursos** en el sidebar
2. Haz clic en **+ Recurso**
3. Completa los campos:
   - **Nombre**: Nombre del recurso (ej: "Ana Garcia")
   - **Tipo**: Trabajo (personas) o Material (insumos)
   - **Costo por Hora**: Tarifa horaria en dolares
   - **Disponibilidad Maxima**: Porcentaje (100% = tiempo completo)

### 7.2 Asignar Recursos a Tareas

1. En la vista **WBS / Tareas**, haz clic en los `...` de la columna **Recursos**
2. Se abre un dialogo con todos los recursos disponibles
3. Marca la casilla del recurso que quieres asignar
4. Ajusta el porcentaje de **Unidades** (100% = dedicacion completa)
5. Cierra el dialogo

### 7.3 Calculo Automatico de Costos

Cuando una tarea tiene recursos asignados, el **Costo Plan** se calcula automaticamente:

```
Costo = Suma de (Costo/Hora x Horas/Dia x Duracion x Unidades%) por cada recurso
```

> **Nota:** Si una tarea tiene recursos asignados, el campo Costo Plan aparece deshabilitado y muestra "Calculado desde recursos" al pasar el cursor.

### 7.4 Sobreasignacion

Si un recurso esta asignado a mas tareas de las que puede manejar al mismo tiempo, aparece una alerta:

- Se muestra una tabla con el recurso, fecha, carga actual y carga maxima
- Puedes hacer clic en **Nivelar Recursos** para resolver automaticamente los conflictos

### 7.5 Histograma de Recursos

El histograma muestra la carga de cada recurso a lo largo del tiempo:
- **Barras azules**: Carga normal
- **Barras rojas**: Sobreasignacion (supera el maximo)

### 7.6 Nivelacion de Recursos

El boton **Nivelar Recursos** retrasa automaticamente las tareas no criticas para resolver conflictos de sobreasignacion, sin afectar la ruta critica del proyecto.

---

## 8. Valor Ganado (EVM)

### 8.1 Que es el Valor Ganado?

El Analisis de Valor Ganado (EVM) es una tecnica del PMI que compara:
- **Lo que planeaste hacer** (PV - Valor Planificado)
- **Lo que realmente hiciste** (EV - Valor Ganado)
- **Lo que realmente costo** (AC - Costo Real)

### 8.2 Configurar EVM

Para que el analisis funcione, necesitas:

1. **Fecha de Inicio**: Configurada en Config
2. **Fecha de Estado**: Fecha de corte para el analisis (en la barra de herramientas)
3. **Costo Planificado**: En cada tarea (manual o calculado desde recursos)
4. **Costo Real**: Lo que realmente has gastado en cada tarea
5. **% Avance**: El porcentaje completado de cada tarea
6. Haz clic en **Recalcular**

### 8.3 Metricas del Dashboard

#### Metricas Basicas

| Metrica | Formula | Significado |
|---|---|---|
| **BAC** | Suma de costos plan | Presupuesto total del proyecto |
| **PV** | Costo plan de tareas que deberian estar completas | Cuanto deberia haber avanzado |
| **EV** | BAC x % completado ponderado | Cuanto realmente he avanzado (en valor) |
| **AC** | Suma de costos reales | Cuanto he gastado realmente |

#### Varianzas

| Metrica | Formula | Bueno si... |
|---|---|---|
| **SV** | EV - PV | Positivo (adelantado) |
| **CV** | EV - AC | Positivo (bajo presupuesto) |

#### Indices de Desempeño

| Metrica | Formula | Bueno si... |
|---|---|---|
| **SPI** | EV / PV | Mayor a 1.0 (adelantado) |
| **CPI** | EV / AC | Mayor a 1.0 (ahorrando) |

#### Proyecciones

| Metrica | Formula | Significado |
|---|---|---|
| **EAC** | BAC / CPI | Cuanto costara al final |
| **ETC** | EAC - AC | Cuanto falta por gastar |
| **VAC** | BAC - EAC | Varianza al terminar (+ = ahorro) |
| **TCPI** | (BAC - EV) / (BAC - AC) | Eficiencia necesaria para terminar en presupuesto |

### 8.4 Semaforo de Colores

| Color | Significado |
|---|---|
| **Verde** | Buen desempeño (SPI/CPI >= 1.0) |
| **Amarillo** | Alerta (SPI/CPI entre 0.8 y 1.0) |
| **Rojo** | Problema (SPI/CPI < 0.8) |
| **Gris** | Metrica informativa (BAC, EAC, ETC, VAC, TCPI) |

### 8.5 Curva S

La curva S muestra tres lineas:
- **Azul (PV)**: Plan original - como deberia avanzar el gasto
- **Verde (EV)**: Valor ganado - cuanto trabajo se ha completado en terminos de valor
- **Roja (AC)**: Costo real - cuanto se ha gastado realmente

**Interpretacion visual:**
- Si la linea verde esta debajo de la azul: el proyecto esta atrasado
- Si la linea roja esta encima de la verde: se esta gastando de mas

### 8.6 Exportar Metricas

Haz clic en **Exportar CSV** dentro del dashboard EVM para descargar todas las metricas en formato CSV.

---

## 9. Lineas Base

### 9.1 Que es una Linea Base?

Una linea base es una "foto" del plan del proyecto en un momento dado. Sirve para comparar el plan original contra el estado actual y medir desviaciones.

### 9.2 Guardar Linea Base

1. Ve a la vista **Linea Base**
2. Haz clic en **Guardar Linea Base**
3. Ingresa un nombre descriptivo (ej: "Plan Original", "Revision Marzo")
4. La linea base se guarda con fecha, tareas y presupuesto

### 9.3 Comparar con Linea Base

La tabla de comparacion muestra por cada tarea:
- Fecha de inicio planificada vs linea base
- Fecha de fin planificada vs linea base
- Variacion en dias (verde = adelantada, rojo = atrasada)

### 9.4 Gestionar Lineas Base

- **Activar**: Si tienes varias lineas base, puedes seleccionar cual usar como referencia
- **Eliminar**: Borrar una linea base que ya no necesitas
- La primera linea base se marca como **(ACTIVA)** por defecto

---

## 10. Importar y Exportar

### 10.1 Guardar Proyecto (JSON)

**Guardar JSON** guarda el proyecto completo incluyendo:
- Todas las tareas con sus propiedades
- Todos los recursos
- Lineas base
- Configuracion del proyecto

Este es el formato recomendado para respaldar tu trabajo.

### 10.2 Exportar Tareas (CSV)

**Exportar CSV** genera un archivo con las columnas:
```
WBS, Nombre, Duracion, Inicio, Fin, Predecesores, Costo Planificado, Costo Real, % Completado
```

Util para importar en Excel, Google Sheets o MS Project.

### 10.3 Importar Proyecto

Haz clic en **Importar CSV/JSON** y selecciona:
- **Archivo .json**: Carga el proyecto completo
- **Archivo .csv**: Carga solo las tareas (el formato debe coincidir con el de exportacion)

### 10.4 Importar/Exportar Recursos (CSV)

En la vista Recursos:
- **Importar Recursos CSV**: Carga recursos desde CSV
- **Exportar CSV**: Descarga la lista de recursos

### 10.5 Exportar Imagen del Gantt (PNG)

En la vista Gantt, haz clic en **Exportar PNG** para descargar una imagen del diagrama.

---

## 11. Configuracion del Proyecto

Haz clic en **Config** en la barra de herramientas para acceder a:

| Opcion | Descripcion | Default |
|---|---|---|
| **Fecha de Inicio** | Fecha de inicio del proyecto | Hoy |
| **Fecha de Estado** | Fecha de corte para EVM | Hoy |
| **Horas por Dia** | Horas laborales por dia | 8 |
| **Dias Laborales** | Dias de la semana que se trabajan | Lun-Vie |

> **Importante:** Despues de cambiar la configuracion, el sistema recalcula automaticamente todas las fechas, costos y metricas.

### 11.1 Dias Laborales

Puedes personalizar que dias de la semana son laborales:
- Por defecto: Lunes a Viernes
- Puedes activar Sabado y/o Domingo
- Las fechas de inicio y fin de las tareas respetan estos dias

### 11.2 Guardado Automatico

TodoPMP Gantt guarda automaticamente tu proyecto en el **localStorage** del navegador. Esto significa que:
- Si cierras y vuelves a abrir la pagina, tu proyecto estara ahi
- Si limpias los datos del navegador, perderas el proyecto
- **Recomendacion**: Usa **Guardar JSON** regularmente para tener un respaldo en archivo

---

## 12. Preguntas Frecuentes

### Puedo usar TodoPMP Gantt sin internet?
Si. Una vez que hayas abierto la pagina, puedes desconectarte de internet y seguir trabajando. Solo necesitas internet para cargar las fuentes de Google Fonts y Vue.js la primera vez (o puedes descargar estos archivos localmente).

### Como comparto mi proyecto con otra persona?
Usa **Guardar JSON** para descargar el archivo del proyecto, y enviale ese archivo. La otra persona puede abrirlo con **Importar CSV/JSON**.

### Puedo abrir archivos de MS Project?
No directamente. Pero puedes exportar desde MS Project a CSV y luego importar ese CSV en TodoPMP Gantt (puede requerir ajustes en las columnas).

### Las tareas resumen no me dejan editar campos. Por que?
Las tareas resumen calculan sus valores desde las sub-tareas. Para cambiar la duracion o costo de una tarea resumen, modifica sus sub-tareas.

### El costo planificado aparece deshabilitado. Por que?
Si la tarea tiene recursos asignados, el costo se calcula automaticamente desde los recursos. Para editar el costo manualmente, primero desasigna los recursos.

### Como reseteo todo y empiezo de cero?
Haz clic en **Nuevo** para crear un proyecto vacio. Si quieres eliminar tambien los datos del localStorage, abre las DevTools del navegador (F12) y ejecuta `localStorage.clear()`.

### Puedo usar TodoPMP Gantt en mi celular?
Si. La interfaz es responsive: en pantallas pequenas, el sidebar se convierte en tabs horizontales en la parte superior.

### Como se calcula la ruta critica?
Se usa el **Metodo de Ruta Critica (CPM)**:
1. Forward Pass: Calcula las fechas mas tempranas (ES/EF)
2. Backward Pass: Calcula las fechas mas tardias (LS/LF)
3. Holgura = LF - EF
4. Ruta Critica = tareas con holgura = 0

---

## 13. Glosario PMI

| Termino | Definicion |
|---|---|
| **WBS** | Work Breakdown Structure (Estructura de Desglose del Trabajo) |
| **CPM** | Critical Path Method (Metodo de Ruta Critica) |
| **EVM** | Earned Value Management (Gestion de Valor Ganado) |
| **BAC** | Budget at Completion (Presupuesto a la Conclusion) |
| **PV** | Planned Value (Valor Planificado) |
| **EV** | Earned Value (Valor Ganado) |
| **AC** | Actual Cost (Costo Real) |
| **SV** | Schedule Variance (Varianza del Cronograma) |
| **CV** | Cost Variance (Varianza del Costo) |
| **SPI** | Schedule Performance Index (Indice de Desempeño del Cronograma) |
| **CPI** | Cost Performance Index (Indice de Desempeño del Costo) |
| **EAC** | Estimate at Completion (Estimado a la Conclusion) |
| **ETC** | Estimate to Complete (Estimado para Completar) |
| **VAC** | Variance at Completion (Varianza a la Conclusion) |
| **TCPI** | To-Complete Performance Index (Indice de Desempeño para Completar) |
| **ES** | Early Start (Inicio Temprano) |
| **EF** | Early Finish (Fin Temprano) |
| **LS** | Late Start (Inicio Tardio) |
| **LF** | Late Finish (Fin Tardio) |
| **FS** | Finish-to-Start (Fin a Inicio) |
| **SS** | Start-to-Start (Inicio a Inicio) |
| **FF** | Finish-to-Finish (Fin a Fin) |
| **SF** | Start-to-Finish (Inicio a Fin) |
| **Lag** | Tiempo de espera entre tareas dependientes |
| **Lead** | Adelanto (lag negativo) entre tareas dependientes |
| **Holgura Total** | Tiempo que una tarea puede retrasarse sin afectar la fecha de fin del proyecto |
| **Holgura Libre** | Tiempo que una tarea puede retrasarse sin afectar el inicio de sus sucesoras |
| **Hito** | Evento significativo con duracion cero |
| **Linea Base** | Snapshot aprobado del plan del proyecto para comparacion |

---

**TodoPMP Gantt** | [todopmp.com](https://todopmp.com) | Herramienta gratuita para gestion de proyectos
