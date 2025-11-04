# 🗺️ Mining Map Component - Las Tórtolas# Sistema de Mapas para Minería - Astro + Mapbox



Un componente de mapa profesional construido con **Astro** y **Mapbox GL JS** para visualización de datos mineros con ortomosaicos y polígonos vectoriales. Diseñado para fácil integración en aplicaciones fullstack.Una aplicación web para visualización de datos geoespaciales en operaciones mineras, desarrollada con Astro y Mapbox GL JS.



## ✨ Características## 🚀 Características



- 🗺️ **Visualización de ortomosaicos** con TileServer GL- **Mapa interactivo** con Mapbox GL JS

- 📍 **Sistema de coordenadas UTM 19S** con conversión automática- **Visualización de ortomosaicos** de drones

- 🏗️ **Filtrado por muros** (MP, MO, ME) con navegación automática- **Polígonos de muros** (MP, MO, ME, otros)

- 🎨 **Diseño profesional** con glass-morphism y gradientes modernos- **Sectores identificados** (ej: MP_S7)

- 📱 **Responsive design** optimizado para web- **Sistema de coordenadas** WGS 84 UTM 19S

- 🔧 **Fácil integración** en proyectos React, Vue, Next.js y otros frameworks- **Controles interactivos** para filtros y capas

- 📊 **Datos vectoriales** disponibles para backend APIs- **Información detallada** al hacer clic en elementos



## 🚀 Instalación Rápida## � Estructura del Proyecto



### 1. Requisitos Previos```

src/

```bash├── components/

Node.js >= 18.0.0│   └── MiningMap.astro      # Componente principal del mapa

pnpm (recomendado) o npm├── gis/                     # Datos geoespaciales

```│   ├── token.txt           # Token de Mapbox

│   ├── Poligonos.gpkg      # Polígonos de muros (convertir a GeoJSON)

### 2. Clonar e Instalar│   ├── Poligonos_Sectores.gpkg # Sectores (convertir a GeoJSON)

│   └── orthomosaic.*       # Imagen ortomosaico

```bash├── pages/

git clone <your-repo>│   └── index.astro         # Página principal

cd mapbox└── utils/

pnpm install    ├── mapbox.ts           # Utilidades de Mapbox

```    └── gis.ts              # Manejo de datos GIS

```

### 3. Configurar Mapbox Token

## 🛠️ Instalación y Configuración

Crear archivo `src/gis/token.txt` con tu token de Mapbox:

### 1. Instalar dependencias

```txt

pk.eyJ1IjoieW91ci11c2VyIiwiYSI6InlvdXItdG9rZW4ifQ...```bash

```pnpm install

```

### 4. Configurar Datos GIS

### 2. Configurar datos GIS

Colocar archivos en `src/gis/`:

- `Poligonos.gpkg` - Polígonos de murosLos archivos GPKG deben convertirse a GeoJSON para uso web:

- `Poligonos_Sectores.gpkg` - Polígonos de sectores

```bash

### 5. Configurar Ortomosaico# Convertir polígonos de muros

ogr2ogr -f GeoJSON src/gis/poligonos.geojson src/gis/Poligonos.gpkg

Colocar archivo MBTiles en `public/`:

- `mapbase.mbtiles` - Archivo de tiles del ortomosaico# Convertir sectores

ogr2ogr -f GeoJSON src/gis/sectores.geojson src/gis/Poligonos_Sectores.gpkg

### 6. Iniciar Servidores```



Terminal 1 - TileServer:### 3. Optimizar imagen ortomosaico

```bash

npx tileserver-gl-light public/mapbase.mbtiles --port 8081Para reducir el uso de ancho de banda y costos:

```

#### Opción A: Convertir a tiles XYZ

Terminal 2 - Astro Dev:```bash

```bash# Usando GDAL para crear tiles

pnpm devgdal2tiles.py -z 10-18 your_orthomosaic.tif tiles/

``````



## 🏗️ Arquitectura del Proyecto#### Opción B: Optimizar imagen única

```bash

```# Reducir resolución y convertir a JPEG optimizado

src/gdalwarp -tr 0.5 0.5 -of GTiff input.tif temp.tif

├── components/gdal_translate -of JPEG -co QUALITY=85 temp.tif orthomosaic.jpg

│   └── MiningMap.astro          # Componente principal del mapa```

├── gis/

│   ├── token.txt                # Token de Mapbox#### Opción C: Cloud Optimized GeoTIFF (COG)

│   ├── Poligonos.gpkg          # Datos de polígonos de muros```bash

│   └── Poligonos_Sectores.gpkg # Datos de sectores# Crear COG optimizado para web

├── pages/gdal_translate -of COG -co COMPRESS=JPEG -co QUALITY=85 input.tif output_cog.tif

│   └── index.astro             # Página principal```

└── utils/

    └── gisDataManager.js       # Manejo de datos GIS### 4. Configurar variables de entorno



public/Copia el archivo de ejemplo:

└── mapbase.mbtiles             # Tiles del ortomosaico```bash

```cp .env.example .env.local

```

## 🎮 Uso del Componente

Edita `.env.local` con tus configuraciones específicas.

### Integración Básica

## 🚀 Desarrollo

```astro

---```bash

// En tu archivo .astro# Iniciar servidor de desarrollo

import MiningMap from '../components/MiningMap.astro';pnpm dev

---

# Construir para producción

<div class="map-wrapper">pnpm build

  <MiningMap />

</div># Previsualizar build de producción

```pnpm preview

```

### Personalización de Estilos

## 🗺️ Configuración del Mapa

```css

.map-wrapper {### Sistema de Coordenadas

  max-width: 1200px;

  margin: 0 auto;La aplicación está configurada para **WGS 84 UTM Zone 19S (EPSG:32719)**:

  padding: 20px;- Zona UTM: 19

}- Hemisferio: Sur

```- Todos los datos deben estar en este sistema



## ⚙️ Configuración### Tipos de Muros



### Coordenadas y BoundsLos polígonos se clasifican por tipo:

- **MP**: Muro Principal (rojo)

El mapa está configurado para Las Tórtolas, Chile:- **MO**: Muro Oeste (verde)

- **ME**: Muro Este (azul)

```javascript- **Otros**: Otros muros (amarillo)

const MAP_CONFIG = {

  center: [-70.7376, -33.1193],  // Centro del mapa### Sectores

  zoom: 15,                      // Zoom inicial

  bounds: [Los sectores se identifican con formato `{MURO}_{SECTOR}`, ejemplo:

    [-70.762292, -33.136471],    // Suroeste- MP_S7: Sector 7 del Muro Principal

    [-70.708471, -33.111063]     // Noreste- MO_S3: Sector 3 del Muro Oeste

  ]

};## 📊 Datos Esperados

```

### Polígonos (poligonos.geojson)

### Bounds de Muros en UTM```json

{

```javascript  "type": "FeatureCollection",

const MURO_BOUNDS_UTM = {  "features": [

  MP: { southwest: [336060.6, 6333765.9], northeast: [338308.8, 6335338.4] },    {

  ME: { southwest: [339617.2, 6333366.6], northeast: [340188.5, 6334496.9] },      "type": "Feature",

  MO: { southwest: [337253.4, 6332956.2], northeast: [338891.7, 6334128.9] }      "properties": {

};        "tipo": "MP",

```        "id": "mp_001"

      },

## 🔧 Integración en Otros Frameworks      "geometry": {

        "type": "Polygon",

### React/Next.js        "coordinates": [...]

      }

```jsx    }

import { useEffect, useRef } from 'react';  ]

}

function MiningMapWrapper() {```

  const mapRef = useRef();

### Sectores (sectores.geojson)

  useEffect(() => {```json

    // Copiar el código JavaScript del componente MiningMap.astro{

    // Adaptar las referencias DOM y ciclo de vida  "type": "FeatureCollection",

  }, []);  "features": [

    {

  return <div ref={mapRef} className="mining-map-container" />;      "type": "Feature",

}      "properties": {

```        "sector": "MP_S7",

        "muro": "MP",

### Vue.js        "id": "sector_001"

      },

```vue      "geometry": {

<template>        "type": "Polygon",

  <div ref="mapContainer" class="mining-map-container"></div>        "coordinates": [...]

</template>      }

    }

<script>  ]

export default {}

  mounted() {```

    // Copiar el código JavaScript del componente MiningMap.astro

    // Adaptar las referencias DOM y ciclo de vida## 💰 Optimización de Costos Mapbox

  }

}### Plan Gratuito

</script>- 50,000 map views/mes

```- Estilos básicos incluidos



## 🌐 API de Datos### Recomendaciones para reducir costos:

1. **Usar tiles locales** para ortomosaicos

### Endpoints Disponibles2. **Optimizar imágenes** (reducir resolución a 0.5-1m)

3. **Implementar caché** de tiles

Cuando integres en tu backend, considera estos endpoints:4. **Usar CDN** para archivos estáticos



```javascript## 🔧 Próximos Pasos para Fullstack

// Obtener datos de polígonos filtrados

GET /api/polygons?muro=MPPara integrar con Supabase:

GET /api/polygons?sector=A1

1. **Base de datos**: Migrar datos GIS a PostGIS en Supabase

// Obtener coordenadas de muros2. **Autenticación**: Agregar login/logout con Supabase Auth

GET /api/muros/bounds3. **Tiempo real**: Suscripciones a cambios de datos

4. **API**: Endpoints para CRUD de polígonos y sectores

// Obtener información de sectores5. **Storage**: Almacenar ortomosaicos en Supabase Storage

GET /api/sectores

```## 📝 Notas Técnicas



## 📊 Estructura de Datos- **Mapbox GL JS v3.6.0**: Última versión estable

- **Coordenadas**: Conversión automática UTM ↔ Geographic

### Polígonos de Muros- **Responsive**: Diseño adaptable a móviles

- **Performance**: Lazy loading de datos grandes

```json

{## 🐛 Solución de Problemas

  "type": "Feature",

  "properties": {### Error de token

    "tipo": "MP",Verifica que el archivo `src/gis/token.txt` contenga tu token válido de Mapbox.

    "id": "unique-id"

  },### Datos no se cargan

  "geometry": {1. Verifica que los archivos GeoJSON estén en las rutas correctas

    "type": "Polygon",2. Comprueba la consola del navegador para errores

    "coordinates": [[...]]3. Asegúrate de que los datos estén en el sistema de coordenadas correcto

  }

}### Performance lenta

```1. Optimiza las imágenes ortomosaico

2. Usa tiles XYZ en lugar de imágenes completas

### Sectores3. Implementa niveles de detalle (LOD)



```json## � Soporte

{

  "type": "Feature", Para dudas específicas del proyecto o mejoras, revisa:

  "properties": {- Documentación de [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)

    "sector": "A1",- Guía de [Astro](https://docs.astro.build/)

    "nombre": "Sector A1"- Referencias de [GDAL/OGR](https://gdal.org/) para conversión de datos

  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[...]]
  }
}
```

## 🛠️ TileServer GL

### Configuración Básica

```bash
# Instalar globalmente
npm install -g tileserver-gl-light

# Servir MBTiles
tileserver-gl-light mapbase.mbtiles --port 8081

# Con configuración personalizada
tileserver-gl-light --config config.json
```

### URLs de Tiles

```
http://localhost:8081/data/mapbase/{z}/{x}/{y}.jpg
```

## 🎨 Personalización Visual

### Colores del Tema

```css
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --polygon-color: #ff7f00;  /* Naranjo para polígonos */
  --sector-color: #3b82f6;   /* Azul para sectores */
  --glass-background: rgba(255, 255, 255, 0.95);
}
```

### Modificar Estilos de Polígonos

```javascript
const POLYGON_STYLES = {
  muro: {
    stroke: '#ff7f00',  // Color naranjo
    width: 2,
    opacity: 0.8
  },
  sector: {
    fill: 'rgba(59, 130, 246, 0.2)',
    stroke: '#3b82f6',
    width: 1
  }
};
```

## 🚨 Solución de Problemas

### TileServer no inicia

```bash
# Verificar puerto disponible
netstat -an | findstr :8081

# Cambiar puerto
npx tileserver-gl-light public/mapbase.mbtiles --port 8082
```

### Mapa no carga

1. Verificar token de Mapbox en `src/gis/token.txt`
2. Verificar que TileServer esté corriendo
3. Verificar archivos GIS en `src/gis/`
4. Revisar consola del navegador para errores

### Datos GIS no aparecen

1. Verificar formato de archivos `.gpkg`
2. Verificar campos requeridos (`tipo`, `sector`)
3. Verificar coordenadas en sistema correcto

## 📚 Dependencias

```json
{
  "astro": "^5.15.3",
  "mapbox-gl": "^3.16.0", 
  "proj4": "^2.11.0",
  "geojson": "^0.5.0"
}
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear branch de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver `LICENSE` para más información.

## 📞 Soporte

Para integración en proyectos fullstack o consultas técnicas, revisar la documentación técnica en `/docs/`.

---

**Desarrollado para Las Tórtolas Mining Project** 🏗️