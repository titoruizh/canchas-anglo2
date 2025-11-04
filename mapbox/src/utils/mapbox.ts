// Utilidades para Mapbox y manejo de datos GIS
import proj4 from 'proj4';

// Definir proyecciones
const utm19s = '+proj=utm +zone=19 +south +datum=WGS84 +units=m +no_defs';
const wgs84 = '+proj=longlat +datum=WGS84 +no_defs';

/**
 * Lee el token de Mapbox desde el archivo token.txt
 */
export async function getMapboxToken(): Promise<string> {
  try {
    const response = await fetch('/src/gis/token.txt');
    const token = await response.text();
    return token.trim();
  } catch (error) {
    console.error('Error loading Mapbox token:', error);
    throw new Error('No se pudo cargar el token de Mapbox');
  }
}

/**
 * Configuración del sistema de coordenadas
 * WGS 84 UTM Zone 19S (EPSG:32719) para relave Las Tórtolas
 */
export const COORDINATE_SYSTEM = {
  // Zona UTM 19S
  utmZone: 19,
  hemisphere: 'S',
  epsg: 'EPSG:32719',
  // Límites para área Las Tórtolas, sur de Santiago
  bounds: {
    west: -70.76,
    south: -33.16,
    east: -70.70,
    north: -33.10
  }
};

/**
 * Convierte coordenadas UTM 19S a WGS84 usando proj4
 */
export function utmToWgs84(easting: number, northing: number): [number, number] {
  try {
    const [lng, lat] = proj4(utm19s, wgs84, [easting, northing]);
    return [lng, lat];
  } catch (error) {
    console.error('Error converting coordinates:', error);
    // Fallback a conversión manual más precisa
    return utmToWgs84Manual(easting, northing);
  }
}

/**
 * Conversión manual UTM 19S a WGS84 (más precisa que la anterior)
 */
function utmToWgs84Manual(easting: number, northing: number): [number, number] {
  // Parámetros para UTM Zona 19S
  const a = 6378137.0; // Semi-eje mayor WGS84
  const e2 = 0.00669437999014; // Primera excentricidad al cuadrado
  const k0 = 0.9996; // Factor de escala
  const E0 = 500000; // Falso este
  const N0 = 10000000; // Falso norte para hemisferio sur
  const lambda0 = -69 * Math.PI / 180; // Meridiano central zona 19 (-69°)
  
  // Calcular coordenadas relativas
  const x = easting - E0;
  const y = N0 - northing; // Para hemisferio sur
  
  // Parámetros elipsoidales
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const M = y / k0;
  
  // Latitud de footprint
  const mu = M / (a * (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256));
  
  const phi1 = mu + 
    (3*e1/2 - 27*e1*e1*e1/32) * Math.sin(2*mu) +
    (21*e1*e1/16 - 55*e1*e1*e1*e1/32) * Math.sin(4*mu) +
    (151*e1*e1*e1/96) * Math.sin(6*mu);
    
  // Cálculos para obtener latitud final
  const rho1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(phi1) * Math.sin(phi1), 1.5);
  const nu1 = a / Math.sqrt(1 - e2 * Math.sin(phi1) * Math.sin(phi1));
  
  const T1 = Math.tan(phi1) * Math.tan(phi1);
  const C1 = e2 * Math.cos(phi1) * Math.cos(phi1) / (1 - e2);
  const R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(phi1) * Math.sin(phi1), 1.5);
  const D = x / (nu1 * k0);
  
  // Latitud
  const lat = phi1 - (nu1 * Math.tan(phi1) / R1) * 
    (D*D/2 - (5 + 3*T1 + 10*C1 - 4*C1*C1 - 9*e2) * D*D*D*D/24 +
     (61 + 90*T1 + 298*C1 + 45*T1*T1 - 252*e2 - 3*C1*C1) * D*D*D*D*D*D/720);
  
  // Longitud
  const lng = lambda0 + (D - (1 + 2*T1 + C1) * D*D*D/6 +
    (5 - 2*C1 + 28*T1 - 3*C1*C1 + 8*e2 + 24*T1*T1) * D*D*D*D*D/120) / Math.cos(phi1);
  
  // Convertir a grados y cambiar signo de latitud para hemisferio sur
  return [lng * 180 / Math.PI, -lat * 180 / Math.PI];
}

/**
 * Convierte un arreglo de coordenadas UTM a WGS84
 */
export function convertCoordinateArray(coords: number[][]): number[][] {
  return coords.map(coord => {
    if (coord.length >= 2) {
      const [lng, lat] = utmToWgs84(coord[0], coord[1]);
      return coord.length === 3 ? [lng, lat, coord[2]] : [lng, lat];
    }
    return coord;
  });
}

/**
 * Convierte geometría GeoJSON desde UTM a WGS84
 */
export function convertGeometry(geometry: any): any {
  if (!geometry || !geometry.coordinates) return geometry;
  
  const converted = { ...geometry };
  
  switch (geometry.type) {
    case 'Point':
      converted.coordinates = utmToWgs84(geometry.coordinates[0], geometry.coordinates[1]);
      break;
      
    case 'LineString':
      converted.coordinates = convertCoordinateArray(geometry.coordinates);
      break;
      
    case 'Polygon':
      converted.coordinates = geometry.coordinates.map((ring: number[][]) => 
        convertCoordinateArray(ring)
      );
      break;
      
    case 'MultiPolygon':
      converted.coordinates = geometry.coordinates.map((polygon: number[][][]) =>
        polygon.map((ring: number[][]) => convertCoordinateArray(ring))
      );
      break;
      
    default:
      console.warn('Tipo de geometría no soportado:', geometry.type);
  }
  
  return converted;
}

/**
 * Calcula los límites (bounds) de un conjunto de features
 */
export function calculateBounds(features: any[]): [number, number, number, number] {
  if (!features || features.length === 0) {
    return [-70.76, -33.16, -70.70, -33.10]; // Bounds por defecto para Las Tórtolas
  }
  
  let minLng = Infinity, minLat = Infinity;
  let maxLng = -Infinity, maxLat = -Infinity;
  
  features.forEach(feature => {
    if (!feature.geometry || !feature.geometry.coordinates) return;
    
    const coords = feature.geometry.coordinates;
    
    const processCoords = (coordArray: any) => {
      if (typeof coordArray[0] === 'number') {
        // Es una coordenada [lng, lat]
        const [lng, lat] = coordArray;
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      } else {
        // Es un arreglo de coordenadas
        coordArray.forEach((subCoord: any) => processCoords(subCoord));
      }
    };
    
    processCoords(coords);
  });
  
  // Agregar un pequeño padding
  const padding = 0.002;
  return [
    minLng - padding, // west
    minLat - padding, // south
    maxLng + padding, // east
    maxLat + padding  // north
  ];
}

/**
 * Configuración de estilos de mapa predefinidos
 */
export const MAP_STYLES = {
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  streets: 'mapbox://styles/mapbox/streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11'
};

/**
 * Configuración de colores para diferentes tipos de muros/sectores
 */
export const POLYGON_STYLES = {
  MP: { color: '#ff0000', opacity: 0.7 }, // Rojo para MP
  MO: { color: '#00ff00', opacity: 0.7 }, // Verde para MO  
  ME: { color: '#0000ff', opacity: 0.7 }, // Azul para ME
  Otros: { color: '#ffff00', opacity: 0.7 }, // Amarillo para otros
  otros: { color: '#ffff00', opacity: 0.7 }, // Amarillo para otros (minúscula)
  sector: { 
    stroke: '#ffffff', 
    strokeWidth: 2, 
    fillOpacity: 0.3 
  }
};