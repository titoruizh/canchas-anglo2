# Documentación: Utilidades GIS y Mapbox

Este documento detalla los módulos de bajo nivel encargados de la manipulación de datos espaciales, sistemas de coordenadas y la integración con el motor de Mapbox. Estos servicios son utilizados principalmente por `MiningMap.astro`.

## 1. Módulo de Datos Espaciales (`src/utils/gis.ts`)

La clase `GISDataManager` actúa como una capa de abstracción para cargar, procesar y servir datos geoespaciales desde archivos GeoJSON estáticos.

### Funciones Principales
*   **Carga de Datos:** `loadPolygonData` y `loadSectorData` consumen archivos GeoJSON locales.
*   **Normalización:** Estandariza las propiedades de los *features* (ID, tipo, muro, sector).
*   **Filtrado:**
    *   `getPolygonsByType(type)`: Obtiene geometrías de MP, ME, MO.
    *   `getSectorsByMuro(muro)`: Filtra sectores asociados a un muro específico.
*   **Exportación:** Métodos `getXYAsGeoJSON()` retornan estructuras listas para ser consumidas por `mapboxgl.addSource()`.

## 2. Utilidades Mapbox (`src/utils/mapbox.ts`)

Este módulo contiene la lógica matemática y de configuración crítica para el correcto posicionamiento de los elementos en el mapa.

### Sistema de Coordenadas
La faena utiliza **WGS84 / UTM zone 19S (EPSG:32719)**. Mapbox requiere **WGS84 Lat/Lon (EPSG:4326)**.

*   `utmToWgs84(easting, northing)`: Función crítica de transformación.
    *   **Primario:** Intenta usar la librería `proj4` si está disponible.
    *   **Fallback:** Implementa un algoritmo manual matemático de conversión UTM->WGS84 si la librería falla.

### Transformación de Geometrías
Debido a que los GeoJSON de origen suelen estar en UTM (metros), es necesario convertir recursivamente todas las coordenadas antes de pasarlas al mapa.

*   `convertGeometry(geometry)`: Detecta el tipo (Point, Polygon, MultiPolygon) y aplica la conversión a todos los anillos de coordenadas.
*   `convertCoordinateArray(coords)`: Helper recursivo para procesar arrays anidados de coordenadas.

### Cálculo de Límites
*   `calculateBounds(features)`: Itera sobre todas las geometrías para encontrar la caja delimitadora (Bounding Box `[minX, minY, maxX, maxY]`) que permite al mapa hacer `fitBounds` y encuadrar todo el contenido automáticamente.

### Seguridad
*   `getMapboxToken()`: Recupera el token de acceso desde un archivo estático protegido, evitando hardcodear credenciales en el bundle de JS.

## 3. Ejemplo de Uso

```typescript
import { GISDataManager } from "../utils/gis.js";
import { convertGeometry } from "../utils/mapbox.js";

// 1. Instanciar Gestor
const gis = new GISDataManager();
await gis.loadPolygonData("/data/poligonos.geojson");

// 2. Obtener datos crudos
const rawFeatures = gis.getPolygonsByType("MP");

// 3. Convertir coordenadas UTM -> LatLon para Mapbox
const mapboxFeatures = rawFeatures.map(f => ({
  ...f,
  geometry: convertGeometry(f.geometry) 
}));
```
