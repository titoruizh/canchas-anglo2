# Funcionalidad: Crear Cancha

Esta funcionalidad permite a los usuarios (específicamente de **AngloAmerican**) registrar nuevas canchas en el sistema. El proceso incluye la definición de metadatos básicos y la delimitación geográfica del área de la cancha mediante una herramienta de dibujo en el mapa.

## Descripción General

- **Acceso:** Botón "🏗️ Crear Cancha" en el header del Dashboard.
- **Restricción:** Visible y funcional solo para usuarios con rol de administrador de **AngloAmerican**.
- **Componente Principal:** Modal `#createCanchaModal` en `src/pages/index.astro`.

## Flujo de Trabajo

1.  **Apertura del Modal:**
    *   El usuario hace clic en el botón.
    *   Se ejecuta la función `abrirModalCrearCancha()`.
    *   Se resetean los formularios y variables de estado.

2.  **Ingreso de Datos:**
    *   **Muro:** Selección del muro (Principal, Este, Oeste).
    *   **Sector:** Selección dinámica del sector dependiente del muro seleccionado.
    *   **Nombre Detalle:** Input de texto libre para identificar la cancha (ej: "TEST1").

3.  **Dibujo de Polígono:**
    *   El usuario debe presionar "🗺️ Dibujar Área en Mapa".
    *   Se abre un iframe con `mapbox-window?drawing=true`.
    *   El usuario dibuja el polígono en el mapa.
    *   Al finalizar, el iframe envía un mensaje `polygon-drawn` con las coordenadas (`poligonoCoordinadas`).

4.  **Confirmación:**
    *   El botón "✅ Crear Cancha" se habilita solo cuando el formulario está completo y el polígono dibujado.
    *   Al confirmar, se llama a `crearCanchaConPoligono()`.

## Aspectos Técnicos

### Frontend (`index.astro`)

*   **Identificadores Clave:**
    *   Botón de apertura: `btn-abrir-modal-crear`
    *   Modal: `createCanchaModal`
    *   Formulario: `muro-select`, `sector-select`, `nombre-detalle-input`
    *   Contenedor Mapa: `drawingMapContainer`

*   **Eventos:**
    *   `message`: Escucha eventos desde el iframe de Mapbox para recibir las coordenadas (`event.data.type === 'polygon-drawn'`).

### Interacción con API

Se realiza una petición `POST` al endpoint `/api/canchas` con el siguiente payload JSON:

```json
{
  "muro": "MP",
  "sector": "S1",
  "nombreDetalle": "NombreCancha",
  "poligonoCoordinadas": [
    [-70.123, -33.123],
    [-70.124, -33.124],
    ...
  ]
}
```

### Validaciones

*   Todos los campos son obligatorios.
*   El polígono debe ser válido y cerrado.
*   El usuario debe tener sesión activa y permisos adecuados.
