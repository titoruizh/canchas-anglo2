# Documentación: Widgets de Estado

La sección "Estados de Canchas" es un componente visual interactivo ubicado debajo de la tabla principal, diseñado para proporcionar una visión rápida de la distribución de canchas y permitir un filtrado específico por estado.

## 1. Estructura y Diseño

El componente se organiza horizontalmente en el contenedor `.dashboard-estados` y consta de 6 widgets circulares, uno por cada estado posible del flujo de trabajo.

### Componentes del Widget (`.estado-widget`)

Cada widget se compone de:
1.  **Círculo (`.widget-circle`):** Elemento visual principal que contiene el número. Su color está determinado por la clase de estado (ej: `.widget-validada`).
2.  **Contador (`.widget-number`):** Muestra la cantidad de canchas en ese estado específico **dentro de la vista actual filtrada**.
3.  **Etiqueta (`.widget-label`):** Nombre legible del estado (ej: "Validada", "En Proceso").

### Código de Colores

| Estado | Clase CSS | Color Principal | Significado |
| :--- | :--- | :--- | :--- |
| **Creada** | `.widget-creada` | 🔵 Azul | Inicio del ciclo. |
| **En Espera** | `.widget-en-espera` | 🟡 Amarillo | Pendiente de acción (recepción). |
| **En Proceso** | `.widget-en-proceso` | 🟡 Amarillo (Borde Verde) | Trabajo activo en curso. |
| **Validada** | `.widget-validada` | 🟢 Verde | Trabajo completado y aprobado. |
| **Rechazada** | `.widget-rechazada-en-espera` | 🔴 Rojo | Trabajo devuelto para corrección. |
| **Cerrada** | `.widget-cerrada` | ⚫ Gris Oscuro | Ciclo finalizado. |

---

## 2. Interactividad y Filtrado

### Filtrado por Doble Click
Los widgets funcionan como filtros toggle. La interacción principal no es un click simple, sino un **doble click** (`dblclick event`).

*   **Activar Filtro:** Al hacer doble click en un widget, la tabla se actualiza para mostrar **únicamente** las canchas en ese estado.
    *   *Visual:* El widget seleccionado se agranda (`.selected`) y los demás se atenúan (`.dimmed`).
*   **Desactivar Filtro:** Al hacer doble click nuevamente en el mismo widget activo, se elimina el filtro y se muestran todos los estados de nuevo.

Función JavaScript asociada: `filtrarPorEstadoWidget(estadoNombre)`.

### Efectos Visuales (CSS)
*   **Hover:** Elevación (`translateY`) y escala ligera.
*   **Dimmed:** Cuando hay un filtro activo, los widgets no seleccionados pierden opacidad y color (`grayscale`), indicando que están excluidos de la vista actual.

---

## 3. Lógica de Datos

Los contadores de los widgets NO muestran siempre el total absoluto de la base de datos. Respetan los filtros previos aplicados.

Funcionalidad: `actualizarContadorResultados()`

1.  La función recibe las `canchasFiltradas` (ya procesadas por filtros de "Mis Acciones", fecha, etc.).
2.  Itera sobre estas canchas y agrupa por `estado_actual`.
3.  Anima los números (`animateNumber()`) desde el valor anterior al nuevo valor calculado.

**Implicancia:** Si filtras por "Fecha: Hoy", los widgets mostrarán 0 en estados antiguos, reflejando solo la actividad del día actual.

## 4. Referencias Cruzadas
*   Relacionado con [Filtros y Estadísticas](./FILTROS_Y_ESTADISTICAS.md) para entender el flujo de datos.
*   Relacionado con [Tabla de Canchas](./TABLA_CANCHAS.md) para ver los resultados del filtrado.
