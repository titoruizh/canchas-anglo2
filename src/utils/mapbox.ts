// Utilidades para Mapbox y manejo de datos GIS (copiado y adaptado desde el subproyecto mapbox)
import proj4 from 'proj4';

const utm19s = '+proj=utm +zone=19 +south +datum=WGS84 +units=m +no_defs';
const wgs84 = '+proj=longlat +datum=WGS84 +no_defs';

export async function getMapboxToken(): Promise<string> {
  try {
    // En la integración servimos el token desde public/mapbox-gis/token.txt
    const response = await fetch('/mapbox-gis/token.txt');
    const token = await response.text();
    return token.trim();
  } catch (error) {
    console.error('Error loading Mapbox token:', error);
    throw new Error('No se pudo cargar el token de Mapbox');
  }
}

export const COORDINATE_SYSTEM = {
  utmZone: 19,
  hemisphere: 'S',
  epsg: 'EPSG:32719',
  bounds: { west: -70.76, south: -33.16, east: -70.70, north: -33.10 }
};

export function utmToWgs84(easting: number, northing: number): [number, number] {
  try {
    const [lng, lat] = proj4(utm19s, wgs84, [easting, northing]);
    return [lng, lat];
  } catch (error) {
    console.error('Error converting coordinates:', error);
    return utmToWgs84Manual(easting, northing);
  }
}

function utmToWgs84Manual(easting: number, northing: number): [number, number] {
  const a = 6378137.0;
  const e2 = 0.00669437999014;
  const k0 = 0.9996;
  const E0 = 500000;
  const N0 = 10000000;
  const lambda0 = -69 * Math.PI / 180;
  const x = easting - E0;
  const y = N0 - northing;
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const M = y / k0;
  const mu = M / (a * (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256));
  const phi1 = mu + (3*e1/2 - 27*e1*e1*e1/32) * Math.sin(2*mu) + (21*e1*e1/16 - 55*e1*e1*e1*e1/32) * Math.sin(4*mu) + (151*e1*e1*e1/96) * Math.sin(6*mu);
  const rho1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(phi1) * Math.sin(phi1), 1.5);
  const nu1 = a / Math.sqrt(1 - e2 * Math.sin(phi1) * Math.sin(phi1));
  const T1 = Math.tan(phi1) * Math.tan(phi1);
  const C1 = e2 * Math.cos(phi1) * Math.cos(phi1) / (1 - e2);
  const R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(phi1) * Math.sin(phi1), 1.5);
  const D = x / (nu1 * k0);
  const lat = phi1 - (nu1 * Math.tan(phi1) / R1) * (D*D/2 - (5 + 3*T1 + 10*C1 - 4*C1*C1 - 9*e2) * D*D*D*D/24 + (61 + 90*T1 + 298*C1 + 45*T1*T1 - 252*e2 - 3*C1*C1) * D*D*D*D*D*D/720);
  const lng = lambda0 + (D - (1 + 2*T1 + C1) * D*D*D/6 + (5 - 2*C1 + 28*T1 - 3*C1*C1 + 8*e2 + 24*T1*T1) * D*D*D*D*D/120) / Math.cos(phi1);
  return [lng * 180 / Math.PI, -lat * 180 / Math.PI];
}

export function convertCoordinateArray(coords: number[][]): number[][] {
  return coords.map(coord => {
    if (coord.length >= 2) {
      const [lng, lat] = utmToWgs84(coord[0], coord[1]);
      return coord.length === 3 ? [lng, lat, coord[2]] : [lng, lat];
    }
    return coord;
  });
}

export function convertGeometry(geometry: any): any {
  if (!geometry || !geometry.coordinates) return geometry;
  const converted = { ...geometry };
  switch (geometry.type) {
    case 'Point': converted.coordinates = utmToWgs84(geometry.coordinates[0], geometry.coordinates[1]); break;
    case 'LineString': converted.coordinates = convertCoordinateArray(geometry.coordinates); break;
    case 'Polygon': converted.coordinates = geometry.coordinates.map((ring: number[][]) => convertCoordinateArray(ring)); break;
    case 'MultiPolygon': converted.coordinates = geometry.coordinates.map((polygon: number[][][]) => polygon.map((ring: number[][]) => convertCoordinateArray(ring))); break;
    default: console.warn('Tipo de geometría no soportado:', geometry.type);
  }
  return converted;
}

export function calculateBounds(features: any[]): [number, number, number, number] {
  if (!features || features.length === 0) return [-70.76, -33.16, -70.70, -33.10];
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  features.forEach(feature => {
    if (!feature.geometry || !feature.geometry.coordinates) return;
    const coords = feature.geometry.coordinates;
    const processCoords = (coordArray: any) => {
      if (typeof coordArray[0] === 'number') {
        const [lng, lat] = coordArray;
        minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng); minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
      } else coordArray.forEach((sub: any) => processCoords(sub));
    };
    processCoords(coords);
  });
  const padding = 0.002;
  return [minLng - padding, minLat - padding, maxLng + padding, maxLat + padding];
}

export const MAP_STYLES = { satellite: 'mapbox://styles/mapbox/satellite-v9', streets: 'mapbox://styles/mapbox/streets-v12' };

export const POLYGON_STYLES = { MP: { color: '#ff0000', opacity: 0.7 }, MO: { color: '#00ff00', opacity: 0.7 }, ME: { color: '#0000ff', opacity: 0.7 }, Otros: { color: '#ffff00', opacity: 0.7 }, sector: { stroke: '#ffffff', strokeWidth: 2, fillOpacity: 0.3 } };
