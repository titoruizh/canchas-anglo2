# Documentación: Vista de Mapa y Georreferencia

El sistema integra un visor geoespacial avanzado basado en **Mapbox GL JS**, enriquecido con ortomosaicos personalizados y capas de datos operacionales (sectores, polígonos y puntos de control/revanchas).

## 1. Arquitectura del Mapa

El mapa se implementa a través de un componente encapsulado `MiningMap.astro` que se carga usualmente dentro de un iframe (`src/pages/mapbox-window.astro`) para aislamiento de estilos y rendimiento.

### Tecnologías Clave
*   **Motor:** Mapbox GL JS v3.8.0.
*   **Gestión de Tiles:** TileServer GL (servidor local en puerto 8081).
*   **Formato de Datos:** GeoJSON para vectores (polígonos, puntos) y Raster Tiles para la imagen base.

---

## 2. Capas y Visualización

El mapa se compone de múltiples capas superpuestas (de abajo hacia arriba):

1.  **Fondo (Background):** Color gris neutro `#f0f0f0`.
2.  **Ortomosaico (`raster-layer`):**
    *   **Fuente:** `http://localhost:8081/data/mapbase/{z}/{x}/{y}.jpg`
    *   **Zoom:** 10 a 20.
    *   **Descripción:** Imagen aérea de alta resolución de la faena minera.
3.  **Sectores (`sectors-stroke`):**
    *   Líneas discontinuas blancas que delimitan las grandes zonas (S1, S2, etc.).
4.  **Polígonos de Canchas (`polygons-stroke`):**
    *   Líneas naranjas (`#ff7f00`) que muestran los perímetros de las canchas.
    *   **Visibilidad:** Se activan dinámicamente al filtrar por Muro.
5.  **Etiquetas (`*-labels`):**
    *   Nombres de sectores y muros con halo para legibilidad sobre el mapa satelital.

---

## 3. Funcionalidad: Filtro de Muros

El mapa permite "bloquear" la vista en áreas específicas de la mina (Muros) para facilitar la operación.

*   **Muro Principal (MP)**
*   **Muro Este (ME)**
*   **Muro Oeste (MO)**

**Comportamiento:**
Al seleccionar un muro, el mapa:
1.  Hace zoom suave (`flyTo`) a los límites (Bounds) predefinidos de ese muro.
2.  Restringe la navegación (`maxBounds`) para que el usuario no se pierda.
3.  Filtra las capas vectoriales para mostrar solo los polígonos pertenecientes a ese muro.

---

## 4. Funcionalidad: Toggle de Revanchas

En el dashboard principal (`index.astro`), existe un interruptor "Ver Revanchas" que proyecta puntos de control georreferenciados sobre el mapa.

### Flujo de Datos
1.  **Activación:** Usuario activa el toggle `#toggle-revanchas`.
2.  **Consulta API:** `GET /api/revanchas/georreferenciadas?formato=geojson`.
    *   Filtra por el Muro actualmente seleccionado en el mapa.
    *   Devuelve un `FeatureCollection` de puntos.
3.  **Comunicación Inter-Ventana:**
    *   El dashboard envía un mensaje `postMessage` al iframe del mapa con tipo `mostrar-revanchas`.
4.  **Renderizado:**
    *   El componente `MiningMap` recibe el mensaje.
    *   Dibuja círculos interactivos en las coordenadas `[lon, lat]`.
    *   **Interactividad:** Al pasar el mouse, muestra un popup con metadatos (PK, valores de revancha, fecha).

### Backend (`api/revanchas/georreferenciadas.ts`)
Endpoint optimizado que consulta la vista `vista_revanchas_georreferenciadas` de Supabase. Filtra registros que tengan explícitamente `tiene_coordenadas = true`.

---

## 5. Referencias Técnicas
*   **Frontend:** `src/components/MiningMap.astro` (Lógica Mapbox), `src/pages/index.astro` (Controlador Toggle).
*   **Backend:** `src/pages/api/revanchas/georreferenciadas.ts`.
*   **Infraestructura:** Requiere TileServer GL corriendo localmente para servir el ortomosaico.
