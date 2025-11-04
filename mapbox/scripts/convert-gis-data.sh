#!/bin/bash

# Script para convertir datos GPKG a GeoJSON y optimizar ortomosaicos
# Requiere GDAL/OGR instalado

echo "🗺️  Convirtiendo datos GIS para aplicación web..."

# Directorio de datos GIS
GIS_DIR="src/gis"

# Verificar que existen los archivos GPKG
if [ ! -f "$GIS_DIR/Poligonos.gpkg" ]; then
    echo "❌ Error: No se encontró Poligonos.gpkg en $GIS_DIR"
    exit 1
fi

if [ ! -f "$GIS_DIR/Poligonos_Sectores.gpkg" ]; then
    echo "❌ Error: No se encontró Poligonos_Sectores.gpkg en $GIS_DIR"
    exit 1
fi

echo "✅ Archivos GPKG encontrados"

# Convertir polígonos de muros a GeoJSON
echo "🔄 Convirtiendo polígonos de muros..."
ogr2ogr -f GeoJSON \
    -t_srs EPSG:4326 \
    "$GIS_DIR/poligonos.geojson" \
    "$GIS_DIR/Poligonos.gpkg"

if [ $? -eq 0 ]; then
    echo "✅ Polígonos convertidos exitosamente"
else
    echo "❌ Error al convertir polígonos"
fi

# Convertir sectores a GeoJSON
echo "🔄 Convirtiendo sectores..."
ogr2ogr -f GeoJSON \
    -t_srs EPSG:4326 \
    "$GIS_DIR/sectores.geojson" \
    "$GIS_DIR/Poligonos_Sectores.gpkg"

if [ $? -eq 0 ]; then
    echo "✅ Sectores convertidos exitosamente"
else
    echo "❌ Error al convertir sectores"
fi

# Buscar archivos de imagen (TIF, ECW, etc.)
echo "🔍 Buscando archivos de imagen..."

RASTER_FILE=""
for ext in tif tiff ecw jpg jpeg png; do
    if [ -f "$GIS_DIR/orthomosaic.$ext" ]; then
        RASTER_FILE="$GIS_DIR/orthomosaic.$ext"
        break
    fi
    
    # Buscar cualquier archivo con esa extensión
    for file in $GIS_DIR/*.$ext; do
        if [ -f "$file" ]; then
            RASTER_FILE="$file"
            break 2
        fi
    done
done

if [ -n "$RASTER_FILE" ]; then
    echo "✅ Imagen encontrada: $RASTER_FILE"
    
    # Obtener información del raster
    echo "📊 Información del raster:"
    gdalinfo "$RASTER_FILE" | grep -E "(Size is|Pixel Size|Corner Coordinates|PROJCS)"
    
    # Crear versión optimizada para web
    echo "🔄 Optimizando imagen para web..."
    
    # Opción 1: JPEG optimizado
    gdal_translate \
        -of JPEG \
        -co QUALITY=85 \
        -outsize 50% 50% \
        "$RASTER_FILE" \
        "$GIS_DIR/orthomosaic_web.jpg"
    
    if [ $? -eq 0 ]; then
        echo "✅ Imagen optimizada creada: orthomosaic_web.jpg"
        
        # Mostrar tamaños de archivo
        original_size=$(du -h "$RASTER_FILE" | cut -f1)
        optimized_size=$(du -h "$GIS_DIR/orthomosaic_web.jpg" | cut -f1)
        echo "📦 Tamaño original: $original_size"
        echo "📦 Tamaño optimizado: $optimized_size"
    else
        echo "❌ Error al optimizar imagen"
    fi
    
    # Crear archivo world para georreferenciación
    echo "🗺️  Creando archivo de georreferenciación..."
    gdal_translate \
        -of VRT \
        "$RASTER_FILE" \
        "$GIS_DIR/orthomosaic_info.vrt"
    
    # Extraer bounds para configuración del mapa
    echo "📍 Extrayendo límites geográficos..."
    gdalinfo "$RASTER_FILE" | grep -A 4 "Corner Coordinates:" > "$GIS_DIR/bounds.txt"
    
else
    echo "⚠️  No se encontró archivo de imagen raster"
    echo "   Coloca tu ortomosaico en $GIS_DIR/ con nombre 'orthomosaic.*'"
fi

# Crear archivos de ejemplo si no existen datos reales
if [ ! -f "$GIS_DIR/poligonos.geojson" ]; then
    echo "🔧 Creando datos de ejemplo para polígonos..."
    cat > "$GIS_DIR/poligonos.geojson" << 'EOF'
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "tipo": "MP",
        "id": "mp_001",
        "descripcion": "Muro Principal - Sector Norte"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-69.505, -23.495],
          [-69.495, -23.495],
          [-69.495, -23.505],
          [-69.505, -23.505],
          [-69.505, -23.495]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "tipo": "MO",
        "id": "mo_001",
        "descripcion": "Muro Oeste - Sector Central"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-69.515, -23.495],
          [-69.505, -23.495],
          [-69.505, -23.505],
          [-69.515, -23.505],
          [-69.515, -23.495]
        ]]
      }
    }
  ]
}
EOF
    echo "✅ Datos de ejemplo creados para polígonos"
fi

if [ ! -f "$GIS_DIR/sectores.geojson" ]; then
    echo "🔧 Creando datos de ejemplo para sectores..."
    cat > "$GIS_DIR/sectores.geojson" << 'EOF'
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "sector": "MP_S7",
        "muro": "MP",
        "id": "sector_001",
        "descripcion": "Sector 7 del Muro Principal"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-69.503, -23.497],
          [-69.497, -23.497],
          [-69.497, -23.503],
          [-69.503, -23.503],
          [-69.503, -23.497]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "sector": "MO_S3",
        "muro": "MO",
        "id": "sector_002",
        "descripcion": "Sector 3 del Muro Oeste"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-69.513, -23.497],
          [-69.507, -23.497],
          [-69.507, -23.503],
          [-69.513, -23.503],
          [-69.513, -23.497]
        ]]
      }
    }
  ]
}
EOF
    echo "✅ Datos de ejemplo creados para sectores"
fi

echo ""
echo "🎉 Conversión completada!"
echo ""
echo "📋 Siguiente pasos:"
echo "1. Ejecuta 'pnpm dev' para iniciar el servidor de desarrollo"
echo "2. Abre http://localhost:4321 en tu navegador"
echo "3. Reemplaza los datos de ejemplo con tus datos reales"
echo "4. Ajusta las coordenadas del centro del mapa en src/utils/mapbox.ts"
echo ""
echo "💡 Para optimizar más tu ortomosaico:"
echo "   - Usa gdal2tiles.py para crear tiles XYZ"
echo "   - Considera usar Cloud Optimized GeoTIFF (COG)"
echo "   - Implementa múltiples niveles de resolución"