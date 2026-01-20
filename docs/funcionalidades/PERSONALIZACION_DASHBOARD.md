# Personalización del Dashboard

## Imagen de Fondo

El dashboard (`src/pages/index.astro`) utiliza una imagen de fondo personalizada con una capa de superposición para mejorar la estética sin comprometer la legibilidad.

### Configuración Actual
*   **Archivo:** `public/img/fondo-dashboard.jpg`
*   **CSS Selector:** `body` en `src/pages/index.astro`
*   **Superposición:** Gradiente lineal blanco (`rgba(255, 255, 255, 0.75)`).
*   **Posición:** `center 20%` (Centrado horizontalmente, desplazado hacia arriba verticalmente para mostrar más "cielo").
*   **Comportamiento:** `scroll` (Se mueve solidariamente con el contenido).

### Cómo Revertir al Fondo Blanco Original
Si se desea eliminar la imagen y volver al estilo plano original, modificar el bloque CSS `body` en `src/pages/index.astro`:

**Código Actual:**
```css
body {
  background: linear-gradient(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.75)),
              url('/img/fondo-dashboard.jpg');
  background-repeat: no-repeat;
  background-size: cover;
  background-attachment: scroll;
  background-position: center 20%;
  background-color: #f5f7fa;
}
```

**Código Original (Reversión):**
```css
body {
  background-color: #f5f7fa; /* Color sólido slate-50 */
  /* Eliminar background-image, size, repeat, attachment, position */
}
```

### Ajustes Comunes
*   **Más/Menos Transparencia:** Ajustar el valor `0.75` en el `rgba`. (0.0 = imagen pura, 1.0 = blanco puro).
*   **Posición Vertical:** Ajustar el porcentaje en `background-position`.
    *   `top` o `0%`: Muestra el borde superior de la imagen.
    *   `center` o `50%`: Muestra el centro.
    *   `bottom` o `100%`: Muestra el borde inferior.
