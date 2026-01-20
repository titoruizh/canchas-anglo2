# Plan de Implementación: Refactorización de Tabla de Canchas

## Objetivo
Extraer la lógica de renderizado, paginación y acciones de la tabla de canchas desde `index.astro` hacia un `TableManager` robusto y un componente `CanchasTable.astro`. Esto eliminará la deuda técnica (código spaghetti, listeners frágiles) y mejorará la mantenibilidad.

## Contexto
Actualmente, `index.astro` maneja directamente el DOM de la tabla (`innerHTML`), la paginación global y la generación de botones de acción mediante condicionales complejos anidados (`generarBotonesAccion`).

## Cambios Propuestos

### 1. Nueva Clase `src/utils/TableManager.ts`
Implementar una clase que centralice el estado y la lógica de la tabla.

- **Estado Interno:**
  - `paginaActual`: number
  - `elementosPorPagina`: number
  - `datos`: Cancha[] (Total)
  - `datosFiltrados`: Cancha[] (Vista actual)
  
- **Métodos Principales:**
  - `constructor(containerId, options)`: Inicializa referencias y event delegation.
  - `setData(canchas)`: Recibe nuevos datos (desde FilterManager) y resetea a pág 1.
  - `render()`: Genera el HTML de las filas y botones de paginación.
  - `prevPage()`, `nextPage()`, `goToPage(n)`: Control de paginación.
  - `updateActions()`: (Opcional) Si se mantiene la carga diferida, o integrar en render.
  
- **Estrategia de Acciones (Refactor):**
  - Mover la lógica de `generarBotonesAccion` a un método privado o clase helper `ActionBuilder`.
  - Usar un mapa de estrategias o configuración en lugar de `if/else` anidados si es posible, o al menos limpiar la lógica.
  
- **Manejo de Eventos (Event Delegation):**
  - Un solo listener en `tbody` para clicks (`.btn-accion`, Checkbox) y doble clicks (Row Zoom).

### 2. Nuevo Componente `src/components/dashboard/CanchasTable.astro`
Crear un componente .astro que sirva de esqueleto HTML.

- **Contenido:**
  - `.table-container`
  - `<thead>` con las columnas fijas.
  - `<tbody id="canchas-tbody">` vacío para montaje.
  - `.pagination-container` para controles.
  - CSS extraído de `index.astro` (scoped).

### 3. Limpieza y Modificación de `src/pages/index.astro`
- **Eliminar:**
  - `renderizarCanchas`, `renderizarPaginaCanchas`.
  - `generarBotonesAccion`, `actualizarAcciones`.
  - `configurarPaginacion`, `agregarEventListeners*`.
  - Variables globales dispersas.
- **Integrar:**
  - Importar `TableManager`.
  - Instanciar en `initManagers`: `tableManager = new TableManager(...)`.
  - En `FilterManager.onFilterUpdate`: llamar a `tableManager.setData(canchas)`.

## Plan de Verificación

1.  **Renderizado Inicial:** Verificar carga de datos al inicio.
2.  **Paginación:** Probar botones Anterior, Siguiente y límites.
3.  **Filtrado:** Cambiar filtros (Widget, Fecha) y verificar actualización de tabla.
4.  **Acciones por Rol:**
    - Loguear como **Besalco** -> Verificar botón "Recepcionar" / "Gestionar".
    - Loguear como **Anglo** -> Verificar botón "Cerrar" / "PDF".
5.  **Interacción Mapa:**
    - Click botón mapa -> Abre modal.
    - Doble click fila -> Zoom en dashboard.
6.  **Selección:** Verificar comportamiento de checkboxes.

## Notas Técnicas
- **Preservar IDs:** Mantener `canchas-tbody` y IDs de paginación para facilitar la migración, o actualizarlos conscientemente.
- **Dependencias:** `TableManager` necesitará acceso a funciones de apertura de modales (`abrirModalBesalco`, etc.). Estas funciones siguen en `index.astro`?
  - *Riesgo:* Las funciones de apertura de modales (`abrirModal...`) son globales en `index.astro`.
  - *Mitigación:* Pasar estas funciones como callbacks en el constructor de `TableManager`, o moverlas a un `ModalManager` (futuro). Por ahora, callbacks.
