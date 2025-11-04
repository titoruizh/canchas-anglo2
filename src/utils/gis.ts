// Manejo de datos GIS (adaptado desde el subproyecto mapbox)

interface PolygonGeometry { type: string; coordinates: any; }
interface SectorGeometry { type: string; coordinates: any; }

export interface PolygonFeature { id: string; type: 'MP'|'MO'|'ME'|'otros'; sector?: string; geometry: PolygonGeometry; properties: Record<string, any>; }
export interface SectorFeature { id: string; sector: string; muro: string; geometry: SectorGeometry; properties: Record<string, any>; }

export class GISDataManager {
  private polygonData: PolygonFeature[] = [];
  private sectorData: SectorFeature[] = [];

  async loadPolygonData(geojsonPath: string): Promise<void> {
    try {
      const response = await fetch(geojsonPath);
      const geojson: any = await response.json();
      this.polygonData = geojson.features.map((feature: any, index: number) => ({ id: feature.properties?.id || `polygon_${index}`, type: feature.properties?.tipo || 'otros', geometry: feature.geometry, properties: feature.properties || {} }));
    } catch (error) { console.error('Error loading polygon data:', error); }
  }

  async loadSectorData(geojsonPath: string): Promise<void> {
    try {
      const response = await fetch(geojsonPath);
      const geojson: any = await response.json();
      this.sectorData = geojson.features.map((feature: any, index: number) => ({ id: feature.properties?.id || `sector_${index}`, sector: feature.properties?.sector || `S${index}`, muro: feature.properties?.muro || 'unknown', geometry: feature.geometry, properties: feature.properties || {} }));
    } catch (error) { console.error('Error loading sector data:', error); }
  }

  getPolygonsByType(type?: string): PolygonFeature[] { if (!type) return this.polygonData; return this.polygonData.filter(p => p.type === type); }
  getSectorsByMuro(muro?: string): SectorFeature[] { if (!muro) return this.sectorData; return this.sectorData.filter(s => s.muro === muro); }

  getPolygonsAsGeoJSON(): any { return { type: 'FeatureCollection', features: this.polygonData.map(p => ({ type: 'Feature', properties: { ...p.properties, tipo: p.type, id: p.id }, geometry: p.geometry })) }; }

  getSectorsAsGeoJSON(): any { return { type: 'FeatureCollection', features: this.sectorData.map(s => ({ type: 'Feature', properties: { ...s.properties, sector: s.sector, muro: s.muro, id: s.id }, geometry: s.geometry })) }; }
}

export class RasterManager {
  static createRasterSource(imageUrl: string, bounds: [number, number, number, number]) {
    return { type: 'image' as const, url: imageUrl, coordinates: [ [bounds[0], bounds[3]], [bounds[2], bounds[3]], [bounds[2], bounds[1]], [bounds[0], bounds[1]] ] };
  }

  static createTileSource(tileUrl: string, minzoom: number = 0, maxzoom: number = 18) {
    return { type: 'raster' as const, tiles: [tileUrl], tileSize: 256, minzoom, maxzoom };
  }
}
