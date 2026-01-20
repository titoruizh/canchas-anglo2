# Plan de Refactorización: Widgets de Estado

## Contexto
Actualmente, los Widgets de Estado (contadores circulares) y su lógica residen en `index.astro`, mezclados con el resto de la aplicación. Se requiere extraerlos a un componente independiente `src/components/dashboard/WidgetsEstados.astro` y documentar su interacción.

## Objetivos
1.  **Extraer UI:** Mover HTML y CSS de `.dashboard-estados-section` a un nuevo componente.
2.  **Extraer Lógica:** Mover funciones `actualizarWidgetsEstado`, `animateWidgetNumber` y manejo de eventos.
3.  **Mantener Funcionalidad:** Asegurar que `FilterManager` siga actualizando los widgets correctamente.
4.  **Preservar Interacción:** Mantener el filtrado por doble click (`dblclick`).

## User Review Required
> [!IMPORTANT]
> La lógica de actualización depende de `FilterManager`. El nuevo componente deberá exponer métodos públicos o suscribirse al manager. Se optará por exponer métodos en `window` temporalmente o pasar el manager si es posible, para minimizar la disrupción en `index.astro`.

## Proposed Changes

### Componentes Nuevos
#### [NEW] `src/components/dashboard/WidgetsEstados.astro`
- Contendrá el HTML de la sección `.dashboard-estados-section`.
- Contendrá el CSS específico (extraído de `index.astro`).
- Contendrá `<script>` con la lógica de UI:
    - `animateWidgetNumber`
    - `renderWidgets` (o similar)
    - Event listeners para `dblclick`.

### Archivos Modificados
#### [MODIFY] `src/pages/index.astro`
- Eliminar bloque HTML de widgets.
- Importar `<WidgetsEstados />`.
- Eliminar CSS redundante.
- Delegar la actualización de widgets al nuevo componente (vía evento o función global expuesta).

#### [MODIFY] `src/utils/FilterManager.ts`
- Verificar si requiere ajustes (probablemente no, si la interfaz de actualización se mantiene compatible).

## Verification Plan
1.  **Visual:** Verificar que los widgets se renderizan correctamente.
2.  **Datos:** Cambiar filtros (Fecha/Vista) y observar cambios en los números.
3.  **Interacción:** Doble click en un widget -> la tabla debe filtrarse por ese estado.
4.  **Consola:** Verificar ausencia de errores de JS.
