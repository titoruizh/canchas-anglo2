# Documentación: Tabla de Canchas

La tabla de canchas es el componente central del dashboard (`src/pages/index.astro`) donde se visualizan los registros filtrados y se ejecutan las acciones principales del flujo de trabajo.

## 1. Estructura del Componente

El componente se ubica dentro de un contenedor `.table-container` y consta de tres partes principales:

1.  **Cabecera (`<thead>`):** Define las columnas estáticas.
2.  **Cuerpo (`<tbody id="canchas-tbody">`):** Contenedor vacío donde JavaScript inyecta las filas dinámicamente.
3.  **Paginación (`.pagination-container`):** Controles para navegar entre páginas de resultados.

### Columnas

| Columna | Descripción | Elemento HTML |
| :--- | :--- | :--- |
| **Selección** | Checkbox para selección masiva de filas. | `<input type="checkbox">` |
| **Nombre** | Identificador único de la cancha (Muro + Sector). | `<strong>` |
| **Estado** | Estado actual del flujo (ej: "En Espera", "Validada"). | `<span class="estado ...">` |
| **Empresa** | Empresa responsable de la etapa actual. | `<span class="empresa-actual ...">` |
| **Fecha** | Fecha de creación del registro. | Texto (`dd/mm/aaaa`) |
| **Mapa** | Botón para visualizar la ubicación geoespacial. | Botón `🗺️` |
| **Acciones** | Botones contextuales según el rol del usuario. | `<div class="actions">` |

---

## 2. Lógica de Renderizado

El ciclo de vida de la tabla está controlado por la función `renderizarCanchas(canchas)`, la cual actualiza la variable global `canchasFiltradas` y reinicia la paginación a la página 1.

### Paginación
*   **Configuración:** 15 filas por página (`filasPorPagina = 15`).
*   **Lógica:** `renderizarPaginaCanchas()` calcula el slice del array `canchasFiltradas` correspondiente a la página actual.
*   **Controles:** Botones para Primera, Anterior, Siguiente y Última página.

### Generación de Filas
Cada fila se genera como un *Template String* en JavaScript, asignando clases CSS dinámicas para los estados y empresas:

*   **Estados:** `.estado-en-espera`, `.estado-validada`, `.estado-en-proceso`, etc.
*   **Empresas:** `.empresa-besalco`, `.empresa-linkapsis`, `.empresa-angloamerican`, etc.

---

## 3. Botones de Acción (`.actions`)

La columna de "Acciones" se puebla de manera diferida. Una vez que las filas HTML son insertadas en el DOM, se llama a `actualizarAcciones()`.

Esta función:
1.  Itera sobre cada fila renderizada.
2.  Ejecuta `generarBotonesAccion(canchaId, estado, empresaActual)`.
3.  Determina qué botones mostrar basándose en:
    *   La **Empresa Logueada** (Usuario actual).
    *   El **Estado** de la cancha.
    *   La **Empresa Responsable** de la cancha.

### Matriz de Acciones (Ejemplos)

| Usuario Logueado | Estado Cancha | Empresa Cancha | Botón Visible | Acción |
| :--- | :--- | :--- | :--- | :--- |
| **Besalco** | En Espera | Besalco | `📋 Recepcionar Trabajo` | Abre modal de recepción. |
| **Besalco** | En Proceso | Besalco | `🛠️ Gestionar` | Abre formulario de validación. |
| **Linkapsis** | En Proceso | Linkapsis | `📏 Gestionar` | Abre formulario de espesores. |
| **AngloAmerican** | Creada | - | `📤 Enviar a Besalco` | Asigna flujo inicial. |
| **AngloAmerican** | Validada | - | `🔒 Cerrar Cancha` | Finaliza el ciclo. |
| **Todos** | Cerrada/Finalizada | - | `📄 PDF` | Exporta reporte final. |

---

## 4. Interactividad

*   **Doble Click:** Hacer doble click en cualquier parte de la fila hace zoom a la cancha en el mapa del dashboard (`hacerZoomEnMapaDashboard`).
*   **Botón Mapa:** El botón `🗺️` abre un modal dedicado con la vista geoespacial de la cancha específica.
*   **Checkboxes:** Permiten la selección múltiple para acciones en lote (como visualizar timeline masivo o borrado).
