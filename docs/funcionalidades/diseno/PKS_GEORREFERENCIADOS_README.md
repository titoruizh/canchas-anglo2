# Sistema de PKs Georreferenciados y Visualización de Revanchas

## 📋 Descripción General

Sistema completo para georreferenciar puntos kilométricos (PKs) del tranque y visualizar mediciones de revanchas en un mapa interactivo Mapbox con clasificación por colores según estado de alerta.

## 🎯 Objetivos Cumplidos

✅ **138 PKs georreferenciados** con coordenadas UTM Zona 19S convertidas a WGS84  
✅ **Visualización en mapa** con colores según estado (verde/amarillo/rojo)  
✅ **Toggle interactivo** para mostrar/ocultar revanchas  
✅ **Zoom automático** para ver todos los puntos  
✅ **Normalización inteligente** de formatos de PK irregulares  
✅ **100% de coincidencias** entre mediciones y coordenadas

---

## 📊 Datos del Sistema

### Distribución de PKs por Muro

| Muro | Total PKs | Rango |
|------|-----------|-------|
| **Principal** | 73 | 0+000 a 1+434 |
| **Este** | 29 | 0+000 a 0+551 |
| **Oeste** | 36 | 0+000 a 0+690 |
| **TOTAL** | **138** | |

### Colores de Clasificación

#### Revancha
- 🟢 **Verde**: ≥ 3.5 m (óptimo)
- 🟡 **Amarillo**: 3.0 - 3.5 m (precaución)
- 🔴 **Rojo**: < 3.0 m (alerta)

#### Ancho
- 🟢 **Verde**: ≥ 18.0 m
- 🟡 **Amarillo**: 15.0 - 18.0 m
- 🔴 **Rojo**: < 15.0 m

#### Distancia Geomembrana
- 🟢 **Verde**: ≥ 1.0 m
- 🟡 **Amarillo**: 0.5 - 1.0 m
- 🔴 **Rojo**: < 0.5 m

---

## 🗄️ Componentes de Base de Datos

### 1. Tabla `pks_maestro`
Almacena los 138 puntos fijos georreferenciados con:
- Coordenadas UTM Zona 19S (utm_x, utm_y)
- Coordenadas WGS84 (lon, lat)
- Identificación única por (muro, pk)

### 2. Función `normalizar_pk()`
Maneja formatos irregulares de PKs redondeando decimales:
```sql
0+550.800 → 0+551
0+689.88  → 0+690
0+000.00  → 0+000
1+433.85  → 1+434
```

### 3. Vista `vista_revanchas_georreferenciadas`
Vista principal que une `revanchas_mediciones` con `pks_maestro` usando JOIN inteligente:
```sql
LEFT JOIN pks_maestro p ON (
    normalizar_pk(rm.pk) = p.pk 
    AND ra.muro = p.muro
)
```

Incluye:
- Todas las mediciones (coronamiento, revancha, lama, ancho, etc.)
- Coordenadas georreferenciadas (lon, lat, utm_x, utm_y)
- Clasificación por colores (color_revancha, color_ancho, color_dist_geo)
- Indicador `tiene_coordenadas` (TRUE/FALSE)

### 4. Vista `vista_ultimas_revanchas_geo`
Solo las mediciones más recientes de cada PK por muro.  
**IMPORTANTE**: Agrupa por `(archivo_muro, sector, pk)` para evitar duplicados entre muros.

### 5. Vista `vista_resumen_revanchas_geo`
Estadísticas agregadas por muro y fecha:
- Total puntos y puntos georreferenciados
- Conteo de alertas (rojas/amarillas)
- Promedios, mínimos y máximos
- Bounding box (lon_min, lon_max, lat_min, lat_max)

---

## 🛠️ Componentes Frontend

### API Endpoints

#### `GET /api/pks`
Retorna PKs maestro con filtros:
- `?muro=Principal` - Filtrar por muro
- `?activo=true` - Solo PKs activos
- `?formato=geojson` - Formato GeoJSON FeatureCollection

#### `GET /api/revanchas/georreferenciadas`
Retorna mediciones georreferenciadas:
- `?soloUltimas=true` - Solo mediciones más recientes (usa `vista_ultimas_revanchas_geo`)
- `?muro=Principal` - Filtrar por muro
- `?fechaDesde=2024-01-01` - Filtro fecha inicio
- `?fechaHasta=2024-12-31` - Filtro fecha fin
- `?formato=geojson` - Formato GeoJSON con Point geometries
- `?limite=1000` - Máximo de resultados

### Visualización en Mapa

**Archivo**: `src/pages/index.astro`
- Toggle "Revanchas" para activar/desactivar visualización
- Integración con filtro de muro
- Comunicación con iframe vía `postMessage`

**Archivo**: `src/components/MiningMap.astro`
- Listener de mensajes: `mostrar-revanchas` / `ocultar-revanchas`
- Capas Mapbox:
  - `revanchas-circles`: Círculos con colores según estado
  - `revanchas-labels`: Etiquetas de PKs (visible zoom ≥15)
- Popups interactivos con detalles de medición
- **Zoom automático** a todos los puntos al cargar

---

## 📝 Proceso de Implementación

### Problema 1: Formatos de PK irregulares
**Síntoma**: Solo 63/65 mediciones georreferenciadas  
**Causa**: PKs con decimales irregulares (0+550.800, 0+689.88)  
**Solución**: Función `normalizar_pk()` con redondeo inteligente

### Problema 2: Sector numérico vs texto
**Síntoma**: 0 coordenadas inicialmente  
**Causa**: Función `extraer_muro_de_sector()` esperaba texto (ME-1), pero sector es numérico (1,2,3)  
**Solución**: Cambiar JOIN a usar `ra.muro` directamente

### Problema 3: Vista filtrada incorrectamente
**Síntoma**: Solo 89 revanchas en lugar de 138  
**Causa**: `vista_ultimas_revanchas_geo` agrupaba solo por (sector, pk) sin incluir muro  
**Solución**: Agregar `archivo_muro` al GROUP BY

### Problema 4: Puntos fuera del encuadre
**Síntoma**: Usuario no veía todos los PKs en el mapa  
**Solución**: Implementar zoom automático con `map.fitBounds()` al cargar revanchas

---

## 🚀 Uso del Sistema

### 1. Aplicar migración SQL
Ejecutar el archivo `SISTEMA_PKS_GEORREFERENCIADOS.sql` en Supabase SQL Editor:
```bash
# Crea tabla pks_maestro
# Inserta 138 PKs con conversión UTM→WGS84
# Crea función normalizar_pk()
# Crea 3 vistas georreferenciadas
```

### 2. Subir archivos de revanchas
Usar el modal "Subir Revanchas" en el dashboard:
- Seleccionar Tipo de Muro (Principal/Este/Oeste)
- Subir archivo Excel con columnas: Sector, PK, Coronamiento, Revancha, Lama, Ancho, Geomembrana
- El sistema automáticamente georreferencia con `pks_maestro`

### 3. Visualizar en el mapa
- Activar toggle "Revanchas" en el dashboard
- El mapa automáticamente:
  - Carga las últimas mediciones de cada PK
  - Ajusta el zoom para mostrar todos los puntos
  - Colorea según estado (verde/amarillo/rojo)
  - Muestra etiquetas de PKs al hacer zoom
- Click en cualquier punto para ver detalles completos

---

## 🔍 Queries Útiles

### Ver total de PKs por muro
```sql
SELECT muro, COUNT(*) as total_pks 
FROM pks_maestro 
GROUP BY muro;
```

### Verificar georreferenciación
```sql
SELECT 
    ra.muro,
    COUNT(*) as total_mediciones,
    COUNT(p.id) as con_coordenadas,
    ROUND(COUNT(p.id)::NUMERIC / COUNT(*) * 100, 2) as porcentaje
FROM revanchas_mediciones rm
INNER JOIN revanchas_archivos ra ON rm.archivo_id = ra.id
LEFT JOIN pks_maestro p ON (normalizar_pk(rm.pk) = p.pk AND ra.muro = p.muro)
GROUP BY ra.muro;
```

### Ver últimas revanchas con coordenadas
```sql
SELECT * FROM vista_ultimas_revanchas_geo LIMIT 10;
```

### Ver estadísticas por muro
```sql
SELECT * FROM vista_resumen_revanchas_geo;
```

---

## 📚 Archivos del Sistema

### SQL
- ✅ `SISTEMA_PKS_GEORREFERENCIADOS.sql` - **Migración completa documentada**

### Frontend
- ✅ `src/pages/api/pks/index.ts` - API de PKs maestro
- ✅ `src/pages/api/revanchas/georreferenciadas.ts` - API de revanchas con coordenadas
- ✅ `src/pages/index.astro` - Dashboard con toggle de revanchas
- ✅ `src/components/MiningMap.astro` - Mapa Mapbox con visualización

### Datos
- ✅ `alignment_coordinates.csv` - CSV original con 138 PKs UTM

---

## 🎨 Características Visuales

### Capas del Mapa
1. **revanchas-circles**: Círculos escalables según zoom
   - Radio: 4px (zoom 12) → 16px (zoom 20)
   - Color según `color_revancha`
   - Borde blanco de 2px
   - Opacidad 80%

2. **revanchas-labels**: Etiquetas de PKs
   - Texto: Valor del PK
   - Fuente: Open Sans Bold
   - Tamaño: 10px
   - Halo blanco para legibilidad
   - Visible solo zoom ≥15

### Interactividad
- **Hover**: Cursor cambia a pointer
- **Click**: Popup con:
  - Identificación: Muro, Sector, PK
  - Fecha de medición
  - Tabla con valores: Revancha, Ancho, Coronamiento, Lama
  - Colores según estado
- **Zoom automático**: Al activar toggle, ajusta vista a todos los puntos

---

## ✅ Estado Final

- **138/138 PKs** georreferenciados (100%)
- **138 mediciones** visualizables en mapa (últimas por cada PK)
- **3 muros** operativos: Principal, Este, Oeste
- **0 errores** de georreferenciación
- **Sistema productivo** listo para uso

---

## 🔧 Mantenimiento

### Agregar nuevos PKs
```sql
INSERT INTO pks_maestro (muro, pk, utm_x, utm_y, lon, lat)
VALUES (
    'Principal',
    '1+500',
    337000.000,
    6334000.000,
    (SELECT lon FROM utm_to_wgs84(337000.000, 6334000.000, 19, 'S')),
    (SELECT lat FROM utm_to_wgs84(337000.000, 6334000.000, 19, 'S'))
);
```

### Desactivar PK sin eliminarlo
```sql
UPDATE pks_maestro 
SET activo = FALSE, notas = 'PK desactivado por [razón]'
WHERE muro = 'Principal' AND pk = '1+500';
```

### Verificar normalización
```sql
SELECT 
    pk as original,
    normalizar_pk(pk) as normalizado
FROM revanchas_mediciones
WHERE pk LIKE '%.%'
LIMIT 10;
```

---

**Fecha de creación**: Diciembre 2024  
**Versión**: 1.0  
**Estado**: ✅ Productivo
