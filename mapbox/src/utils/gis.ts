// Manejo de datos GIS - GPKG y raster

export interface PolygonFeature {
  id: string;
  type: 'MP' | 'MO' | 'ME' | 'otros';
  sector?: string;
  geometry: GeoJSON.Geometry;
  properties: Record<string, any>;
}

export interface SectorFeature {
  id: string;
  sector: string;
  muro: string;
  geometry: GeoJSON.Geometry;
  properties: Record<string, any>;
}

/**
 * Clase para manejar datos de polígonos desde GPKG
 * Nota: Para leer GPKG directamente en el navegador, necesitarías
 * convertir a GeoJSON en el servidor o usar herramientas como GDAL
 */
export class GISDataManager {
  private polygonData: PolygonFeature[] = [];
  private sectorData: SectorFeature[] = [];

  /**
   * Carga datos de polígonos desde GeoJSON convertido
   * (Los GPKG deben convertirse a GeoJSON para uso en web)
   */
  async loadPolygonData(geojsonPath: string): Promise<void> {
    try {
      const response = await fetch(geojsonPath);
      const geojson: GeoJSON.FeatureCollection = await response.json();
      
      this.polygonData = geojson.features.map((feature, index) => ({
        id: feature.properties?.id || `polygon_${index}`,
        type: feature.properties?.tipo || 'otros',
        geometry: feature.geometry,
        properties: feature.properties || {}
      }));
    } catch (error) {
      console.error('Error loading polygon data:', error);
    }
  }

  /**
   * Carga datos de sectores desde GeoJSON convertido
   */
  async loadSectorData(geojsonPath: string): Promise<void> {
    try {
      const response = await fetch(geojsonPath);
      const geojson: GeoJSON.FeatureCollection = await response.json();
      
      this.sectorData = geojson.features.map((feature, index) => ({
        id: feature.properties?.id || `sector_${index}`,
        sector: feature.properties?.sector || `S${index}`,
        muro: feature.properties?.muro || 'unknown',
        geometry: feature.geometry,
        properties: feature.properties || {}
      }));
    } catch (error) {
      console.error('Error loading sector data:', error);
    }
  }

  /**
   * Obtiene datos de polígonos filtrados por tipo
   */
  getPolygonsByType(type?: string): PolygonFeature[] {
    if (!type) return this.polygonData;
    return this.polygonData.filter(polygon => polygon.type === type);
  }

  /**
   * Obtiene datos de sectores filtrados por muro
   */
  getSectorsByMuro(muro?: string): SectorFeature[] {
    if (!muro) return this.sectorData;
    return this.sectorData.filter(sector => sector.muro === muro);
  }

  /**
   * Convierte datos a formato GeoJSON para Mapbox
   */
  getPolygonsAsGeoJSON(): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: this.polygonData.map(polygon => ({
        type: 'Feature',
        properties: {
          ...polygon.properties,
          tipo: polygon.type,
          id: polygon.id
        },
        geometry: polygon.geometry
      }))
    };
  }

  /**
   * Convierte sectores a formato GeoJSON para Mapbox
   */
  getSectorsAsGeoJSON(): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: this.sectorData.map(sector => ({
        type: 'Feature',
        properties: {
          ...sector.properties,
          sector: sector.sector,
          muro: sector.muro,
          id: sector.id
        },
        geometry: sector.geometry
      }))
    };
  }
}

/**
 * Utilidades para manejar imágenes raster
 */
export class RasterManager {
  /**
   * Configura una fuente de imagen raster para Mapbox
   * Puede ser un servicio de tiles o una imagen georreferenciada
   */
  static createRasterSource(imageUrl: string, bounds: [number, number, number, number]) {
    return {
      type: 'image' as const,
      url: imageUrl,
      coordinates: [
        [bounds[0], bounds[3]], // top-left
        [bounds[2], bounds[3]], // top-right
        [bounds[2], bounds[1]], // bottom-right
        [bounds[0], bounds[1]]  // bottom-left
      ]
    };
  }

  /**
   * Crea configuración para tiles XYZ locales
   */
  static createTileSource(tileUrl: string, minzoom: number = 0, maxzoom: number = 18) {
    return {
      type: 'raster' as const,
      tiles: [tileUrl],
      tileSize: 256,
      minzoom,
      maxzoom
    };
  }
}