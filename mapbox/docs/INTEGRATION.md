# 🔧 Guía de Integración - Mining Map Component

Esta guía detalla cómo integrar el componente de mapa minero en diferentes frameworks y tecnologías fullstack.

## 🎯 Preparación de Assets

Antes de integrar en cualquier framework, prepara estos archivos:

### 1. Extraer JavaScript Core

Crea `mining-map-core.js`:

```javascript
// mining-map-core.js - Lógica principal del mapa
import mapboxgl from 'mapbox-gl';
import proj4 from 'proj4';

export class MiningMapCore {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      center: [-70.7376, -33.1193],
      zoom: 15,
      bounds: [[-70.762292, -33.136471], [-70.708471, -33.111063]],
      tileServerUrl: 'http://localhost:8081',
      ...options
    };
    this.map = null;
    this.gisManager = null;
  }

  async initialize() {
    // Configurar token de Mapbox
    mapboxgl.accessToken = await this.getMapboxToken();
    
    // Crear mapa
    this.map = new mapboxgl.Map({
      container: this.containerId,
      style: this.createMapStyle(),
      center: this.options.center,
      zoom: this.options.zoom,
      maxBounds: this.options.bounds
    });

    // Agregar controles
    this.map.addControl(new mapboxgl.NavigationControl());
    this.map.addControl(new mapboxgl.ScaleControl());

    // Cargar datos cuando el mapa esté listo
    this.map.on('load', () => {
      this.loadGISData();
      this.setupEvents();
    });

    return this.map;
  }

  createMapStyle() {
    return {
      version: 8,
      sources: {},
      layers: [{
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#f0f0f0' }
      }]
    };
  }

  async getMapboxToken() {
    try {
      const response = await fetch('/api/mapbox-token');
      const data = await response.json();
      return data.token;
    } catch (error) {
      // Fallback para desarrollo
      return 'pk.your-development-token';
    }
  }

  async loadGISData() {
    try {
      // Cargar ortomosaico
      this.addOrtomosaicoLayer();
      
      // Cargar polígonos y sectores
      const [polygons, sectors] = await Promise.all([
        this.loadPolygonsData(),
        this.loadSectorsData()
      ]);
      
      this.addPolygonLayers(polygons);
      this.addSectorLayers(sectors);
      
    } catch (error) {
      console.error('Error cargando datos GIS:', error);
    }
  }

  addOrtomosaicoLayer() {
    this.map.addSource('ortomosaico', {
      type: 'raster',
      tiles: [`${this.options.tileServerUrl}/data/mapbase/{z}/{x}/{y}.jpg`],
      tileSize: 256
    });

    this.map.addLayer({
      id: 'raster-layer',
      type: 'raster',
      source: 'ortomosaico'
    });
  }

  addPolygonLayers(polygonsData) {
    this.map.addSource('poligonos', {
      type: 'geojson',
      data: polygonsData
    });

    // Contornos (ocultos por defecto)
    this.map.addLayer({
      id: 'polygons-stroke',
      type: 'line',
      source: 'poligonos',
      layout: { visibility: 'none' },
      paint: {
        'line-color': '#ff7f00',
        'line-width': 2,
        'line-opacity': 0.8
      }
    });

    // Etiquetas (ocultas por defecto)
    this.map.addLayer({
      id: 'polygons-labels',
      type: 'symbol',
      source: 'poligonos',
      filter: ['!=', ['get', 'tipo'], 'Otros'],
      layout: {
        visibility: 'none',
        'text-field': ['get', 'tipo'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 14,
        'text-anchor': 'center'
      },
      paint: {
        'text-color': '#ff7f00',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    });
  }

  addSectorLayers(sectorsData) {
    this.map.addSource('sectores', {
      type: 'geojson',
      data: sectorsData
    });

    // Relleno de sectores
    this.map.addLayer({
      id: 'sectors-fill',
      type: 'fill',
      source: 'sectores',
      paint: {
        'fill-color': 'rgba(59, 130, 246, 0.2)',
        'fill-opacity': 0.6
      }
    });

    // Contornos de sectores
    this.map.addLayer({
      id: 'sectors-stroke',
      type: 'line',
      source: 'sectores',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 1,
        'line-opacity': 0.8
      }
    });
  }

  setupEvents() {
    // Eventos de cursor
    this.map.on('mouseenter', ['polygons-stroke', 'sectors-fill'], () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', ['polygons-stroke', 'sectors-fill'], () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  // Método para filtrar por muro
  filterByMuro(muroType) {
    if (muroType !== 'todos') {
      this.map.setLayoutProperty('polygons-stroke', 'visibility', 'visible');
      this.map.setLayoutProperty('polygons-labels', 'visibility', 'visible');
      this.map.setFilter('polygons-stroke', ['==', ['get', 'tipo'], muroType]);
      this.map.setFilter('polygons-labels', ['==', ['get', 'tipo'], muroType]);
      
      // Navegar a coordenadas específicas
      this.flyToMuro(muroType);
    } else {
      this.map.setLayoutProperty('polygons-stroke', 'visibility', 'none');
      this.map.setLayoutProperty('polygons-labels', 'visibility', 'none');
      this.map.fitBounds(this.options.bounds, { padding: 50, duration: 1000 });
    }
  }

  flyToMuro(muroType) {
    const muroBounds = {
      MP: { southwest: [336060.6, 6333765.9], northeast: [338308.8, 6335338.4] },
      ME: { southwest: [339617.2, 6333366.6], northeast: [340188.5, 6334496.9] },
      MO: { southwest: [337253.4, 6332956.2], northeast: [338891.7, 6334128.9] }
    };

    if (muroBounds[muroType]) {
      const bounds = muroBounds[muroType];
      const sw = this.utmToWgs84(bounds.southwest[0], bounds.southwest[1]);
      const ne = this.utmToWgs84(bounds.northeast[0], bounds.northeast[1]);
      this.map.fitBounds([sw, ne], { padding: 50, duration: 1000 });
    }
  }

  utmToWgs84(x, y) {
    const utm19s = '+proj=utm +zone=19 +south +datum=WGS84 +units=m +no_defs';
    const wgs84 = '+proj=longlat +datum=WGS84 +no_defs';
    return proj4(utm19s, wgs84, [x, y]);
  }

  async loadPolygonsData() {
    // Implementar carga desde API o archivos estáticos
    const response = await fetch('/api/polygons');
    return response.json();
  }

  async loadSectorsData() {
    // Implementar carga desde API o archivos estáticos
    const response = await fetch('/api/sectors');
    return response.json();
  }

  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
```

### 2. Estilos CSS

Crea `mining-map.css`:

```css
/* mining-map.css */
@import 'mapbox-gl/dist/mapbox-gl.css';

.mining-map-container {
  position: relative;
  width: 100%;
  height: 500px;
  max-width: 800px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.mining-map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mining-map-control-panel {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.mining-map-control-group {
  margin-bottom: 16px;
}

.mining-map-control-group:last-child {
  margin-bottom: 0;
}

.mining-map-control-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mining-map-control-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mining-map-control-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.mining-map-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 24px 32px;
  border-radius: 12px;
  z-index: 1001;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-weight: 500;
  color: #374151;
}

.mining-map-error {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  z-index: 1001;
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
  font-weight: 500;
  max-width: 400px;
  text-align: center;
}
```

## ⚛️ React Integration

### Componente React

```jsx
// components/MiningMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import { MiningMapCore } from '../utils/mining-map-core';
import '../styles/mining-map.css';

const MiningMap = ({ 
  className = '',
  onMapLoad = () => {},
  onError = () => {},
  ...props 
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMuro, setSelectedMuro] = useState('todos');

  useEffect(() => {
    if (map.current) return; // Evitar inicializar múltiples veces

    const initializeMap = async () => {
      try {
        setLoading(true);
        setError(null);

        const mapCore = new MiningMapCore(mapContainer.current, props);
        const mapInstance = await mapCore.initialize();
        
        map.current = {
          instance: mapInstance,
          core: mapCore
        };

        onMapLoad(mapInstance);
        setLoading(false);
      } catch (err) {
        console.error('Error inicializando mapa:', err);
        setError(err.message);
        setLoading(false);
        onError(err);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (map.current) {
        map.current.core.destroy();
        map.current = null;
      }
    };
  }, []);

  const handleMuroFilter = (event) => {
    const muroType = event.target.value;
    setSelectedMuro(muroType);
    
    if (map.current) {
      map.current.core.filterByMuro(muroType);
    }
  };

  return (
    <div className={`mining-map-container ${className}`}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      
      <div className="mining-map-controls">
        <div className="mining-map-control-panel">
          <div className="mining-map-control-group">
            <label className="mining-map-control-label">
              Filtro de Muros
            </label>
            <select 
              className="mining-map-control-select"
              value={selectedMuro}
              onChange={handleMuroFilter}
            >
              <option value="todos">Todos los Muros</option>
              <option value="MP">MP</option>
              <option value="MO">MO</option>
              <option value="ME">ME</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="mining-map-loading">
          Cargando mapa...
        </div>
      )}

      {error && (
        <div className="mining-map-error">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default MiningMap;
```

### Hook Personalizado

```jsx
// hooks/useMiningMap.js
import { useEffect, useRef, useState } from 'react';
import { MiningMapCore } from '../utils/mining-map-core';

export const useMiningMap = (options = {}) => {
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const initializeMap = async () => {
    if (!mapContainer.current) return;

    try {
      setLoading(true);
      setError(null);

      const mapCore = new MiningMapCore(mapContainer.current, options);
      const mapInstance = await mapCore.initialize();
      
      setMap({
        instance: mapInstance,
        core: mapCore
      });

      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  const filterByMuro = (muroType) => {
    if (map) {
      map.core.filterByMuro(muroType);
    }
  };

  const destroy = () => {
    if (map) {
      map.core.destroy();
      setMap(null);
    }
  };

  useEffect(() => {
    return () => destroy();
  }, []);

  return {
    mapContainer,
    map: map?.instance,
    loading,
    error,
    initializeMap,
    filterByMuro,
    destroy
  };
};
```

### Uso en Next.js

```jsx
// pages/mapa.js
import dynamic from 'next/dynamic';
import { useState } from 'react';

// Importación dinámica para evitar SSR
const MiningMap = dynamic(() => import('../components/MiningMap'), {
  ssr: false,
  loading: () => <div>Cargando mapa...</div>
});

export default function MapaPage() {
  const [mapData, setMapData] = useState(null);

  const handleMapLoad = (mapInstance) => {
    console.log('Mapa cargado:', mapInstance);
    setMapData(mapInstance);
  };

  const handleError = (error) => {
    console.error('Error en el mapa:', error);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Mapa Las Tórtolas</h1>
      <MiningMap 
        onMapLoad={handleMapLoad}
        onError={handleError}
        center={[-70.7376, -33.1193]}
        zoom={15}
      />
    </div>
  );
}

// API Route: pages/api/mapbox-token.js
export default function handler(req, res) {
  res.status(200).json({ 
    token: process.env.MAPBOX_ACCESS_TOKEN 
  });
}
```

## 🖖 Vue.js Integration

### Componente Vue 3

```vue
<!-- components/MiningMap.vue -->
<template>
  <div class="mining-map-container" :class="className">
    <div ref="mapContainer" style="width: 100%; height: 100%;"></div>
    
    <div class="mining-map-controls">
      <div class="mining-map-control-panel">
        <div class="mining-map-control-group">
          <label class="mining-map-control-label">
            Filtro de Muros
          </label>
          <select 
            class="mining-map-control-select"
            v-model="selectedMuro"
            @change="handleMuroFilter"
          >
            <option value="todos">Todos los Muros</option>
            <option value="MP">MP</option>
            <option value="MO">MO</option>
            <option value="ME">ME</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="loading" class="mining-map-loading">
      Cargando mapa...
    </div>

    <div v-if="error" class="mining-map-error">
      Error: {{ error }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { MiningMapCore } from '../utils/mining-map-core';
import '../styles/mining-map.css';

export default {
  name: 'MiningMap',
  props: {
    className: {
      type: String,
      default: ''
    },
    center: {
      type: Array,
      default: () => [-70.7376, -33.1193]
    },
    zoom: {
      type: Number,
      default: 15
    }
  },
  emits: ['map-load', 'error'],
  setup(props, { emit }) {
    const mapContainer = ref(null);
    const map = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const selectedMuro = ref('todos');

    const initializeMap = async () => {
      try {
        loading.value = true;
        error.value = null;

        const mapCore = new MiningMapCore(mapContainer.value, {
          center: props.center,
          zoom: props.zoom
        });
        
        const mapInstance = await mapCore.initialize();
        
        map.value = {
          instance: mapInstance,
          core: mapCore
        };

        emit('map-load', mapInstance);
        loading.value = false;
      } catch (err) {
        console.error('Error inicializando mapa:', err);
        error.value = err.message;
        loading.value = false;
        emit('error', err);
      }
    };

    const handleMuroFilter = () => {
      if (map.value) {
        map.value.core.filterByMuro(selectedMuro.value);
      }
    };

    onMounted(() => {
      initializeMap();
    });

    onUnmounted(() => {
      if (map.value) {
        map.value.core.destroy();
      }
    });

    return {
      mapContainer,
      loading,
      error,
      selectedMuro,
      handleMuroFilter
    };
  }
};
</script>
```

### Composable Vue

```js
// composables/useMiningMap.js
import { ref, onUnmounted } from 'vue';
import { MiningMapCore } from '../utils/mining-map-core';

export function useMiningMap(options = {}) {
  const mapContainer = ref(null);
  const map = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const initializeMap = async () => {
    if (!mapContainer.value) return;

    try {
      loading.value = true;
      error.value = null;

      const mapCore = new MiningMapCore(mapContainer.value, options);
      const mapInstance = await mapCore.initialize();
      
      map.value = {
        instance: mapInstance,
        core: mapCore
      };

      loading.value = false;
      return mapInstance;
    } catch (err) {
      error.value = err;
      loading.value = false;
      throw err;
    }
  };

  const filterByMuro = (muroType) => {
    if (map.value) {
      map.value.core.filterByMuro(muroType);
    }
  };

  const destroy = () => {
    if (map.value) {
      map.value.core.destroy();
      map.value = null;
    }
  };

  onUnmounted(() => {
    destroy();
  });

  return {
    mapContainer,
    map: computed(() => map.value?.instance),
    loading: readonly(loading),
    error: readonly(error),
    initializeMap,
    filterByMuro,
    destroy
  };
}
```

## 🅰️ Angular Integration

### Componente Angular

```typescript
// mining-map.component.ts
import { 
  Component, 
  ElementRef, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit, 
  OnDestroy, 
  ViewChild,
  AfterViewInit 
} from '@angular/core';
import { MiningMapCore } from '../utils/mining-map-core';

@Component({
  selector: 'app-mining-map',
  template: `
    <div class="mining-map-container" [ngClass]="className">
      <div #mapContainer style="width: 100%; height: 100%;"></div>
      
      <div class="mining-map-controls">
        <div class="mining-map-control-panel">
          <div class="mining-map-control-group">
            <label class="mining-map-control-label">
              Filtro de Muros
            </label>
            <select 
              class="mining-map-control-select"
              [(ngModel)]="selectedMuro"
              (change)="handleMuroFilter()"
            >
              <option value="todos">Todos los Muros</option>
              <option value="MP">MP</option>
              <option value="MO">MO</option>
              <option value="ME">ME</option>
            </select>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="mining-map-loading">
        Cargando mapa...
      </div>

      <div *ngIf="error" class="mining-map-error">
        Error: {{ error }}
      </div>
    </div>
  `,
  styleUrls: ['../styles/mining-map.css']
})
export class MiningMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  @Input() className: string = '';
  @Input() center: [number, number] = [-70.7376, -33.1193];
  @Input() zoom: number = 15;
  
  @Output() mapLoad = new EventEmitter<any>();
  @Output() mapError = new EventEmitter<Error>();

  public loading = true;
  public error: string | null = null;
  public selectedMuro = 'todos';
  
  private map: { instance: any; core: MiningMapCore } | null = null;

  ngOnInit() {}

  ngAfterViewInit() {
    this.initializeMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.core.destroy();
    }
  }

  private async initializeMap() {
    try {
      this.loading = true;
      this.error = null;

      const mapCore = new MiningMapCore(this.mapContainer.nativeElement, {
        center: this.center,
        zoom: this.zoom
      });
      
      const mapInstance = await mapCore.initialize();
      
      this.map = {
        instance: mapInstance,
        core: mapCore
      };

      this.mapLoad.emit(mapInstance);
      this.loading = false;
    } catch (err: any) {
      console.error('Error inicializando mapa:', err);
      this.error = err.message;
      this.loading = false;
      this.mapError.emit(err);
    }
  }

  public handleMuroFilter() {
    if (this.map) {
      this.map.core.filterByMuro(this.selectedMuro);
    }
  }
}
```

### Servicio Angular

```typescript
// mining-map.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface GISData {
  polygons: any;
  sectors: any;
}

@Injectable({
  providedIn: 'root'
})
export class MiningMapService {
  private gisDataSubject = new BehaviorSubject<GISData | null>(null);
  public gisData$ = this.gisDataSubject.asObservable();

  constructor(private http: HttpClient) {}

  async loadGISData(): Promise<GISData> {
    try {
      const [polygons, sectors] = await Promise.all([
        this.http.get('/api/polygons').toPromise(),
        this.http.get('/api/sectors').toPromise()
      ]);

      const data = { polygons, sectors };
      this.gisDataSubject.next(data);
      return data;
    } catch (error) {
      console.error('Error cargando datos GIS:', error);
      throw error;
    }
  }

  getMapboxToken(): Observable<{ token: string }> {
    return this.http.get<{ token: string }>('/api/mapbox-token');
  }
}
```

## 🔗 API Backend Examples

### Node.js + Express

```javascript
// server/routes/map.js
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

// Endpoint para token de Mapbox
router.get('/mapbox-token', (req, res) => {
  res.json({ token: process.env.MAPBOX_ACCESS_TOKEN });
});

// Endpoint para polígonos
router.get('/polygons', async (req, res) => {
  try {
    const { muro } = req.query;
    
    // Cargar datos desde archivo o base de datos
    const dataPath = path.join(__dirname, '../data/polygons.geojson');
    const data = await fs.readFile(dataPath, 'utf8');
    let polygons = JSON.parse(data);
    
    // Filtrar si se especifica un muro
    if (muro && muro !== 'todos') {
      polygons.features = polygons.features.filter(
        feature => feature.properties.tipo === muro
      );
    }
    
    res.json(polygons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para sectores
router.get('/sectors', async (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../data/sectors.geojson');
    const data = await fs.readFile(dataPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Python + FastAPI

```python
# app/routers/map.py
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import json
import os

router = APIRouter(prefix="/api", tags=["map"])

@router.get("/mapbox-token")
async def get_mapbox_token():
    token = os.getenv("MAPBOX_ACCESS_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="Token no configurado")
    return {"token": token}

@router.get("/polygons")
async def get_polygons(muro: Optional[str] = Query(None)):
    try:
        with open("data/polygons.geojson", "r") as f:
            data = json.load(f)
        
        if muro and muro != "todos":
            data["features"] = [
                feature for feature in data["features"]
                if feature["properties"].get("tipo") == muro
            ]
        
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sectors")
async def get_sectors():
    try:
        with open("data/sectors.geojson", "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## 🗃️ Database Integration

### Supabase + PostGIS

```sql
-- Crear tablas para datos GIS
CREATE TABLE polygons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(10) NOT NULL,
  nombre VARCHAR(100),
  geometry GEOMETRY(POLYGON, 4326) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector VARCHAR(50) NOT NULL,
  muro VARCHAR(10),
  geometry GEOMETRY(POLYGON, 4326) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices espaciales
CREATE INDEX idx_polygons_geometry ON polygons USING GIST (geometry);
CREATE INDEX idx_sectors_geometry ON sectors USING GIST (geometry);
```

```javascript
// utils/supabase-gis.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function getPolygonsFromDB(muroFilter = null) {
  let query = supabase
    .from('polygons')
    .select('*, ST_AsGeoJSON(geometry) as geojson');
  
  if (muroFilter && muroFilter !== 'todos') {
    query = query.eq('tipo', muroFilter);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Convertir a formato GeoJSON
  return {
    type: 'FeatureCollection',
    features: data.map(row => ({
      type: 'Feature',
      properties: {
        id: row.id,
        tipo: row.tipo,
        nombre: row.nombre
      },
      geometry: JSON.parse(row.geojson)
    }))
  };
}
```

## 📱 Mobile Integration

### React Native

```jsx
// components/MiningMapMobile.jsx
import React from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';

const MiningMapMobile = ({ onMapReady }) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script src='https://api.mapbox.com/mapbox-gl-js/v3.16.0/mapbox-gl.js'></script>
      <link href='https://api.mapbox.com/mapbox-gl-js/v3.16.0/mapbox-gl.css' rel='stylesheet' />
      <style>
        body { margin: 0; padding: 0; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // Código del mapa adaptado para mobile
        mapboxgl.accessToken = 'YOUR_TOKEN';
        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [-70.7376, -33.1193],
          zoom: 15
        });
        
        map.on('load', () => {
          window.ReactNativeWebView?.postMessage('map-ready');
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: htmlContent }}
        onMessage={(event) => {
          if (event.nativeEvent.data === 'map-ready') {
            onMapReady();
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});

export default MiningMapMobile;
```

Esta guía proporciona ejemplos completos para integrar el componente de mapa minero en los frameworks más populares, con código listo para usar y mejores prácticas de desarrollo.