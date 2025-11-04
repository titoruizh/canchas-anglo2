# Script PowerShell para convertir datos GPKG a GeoJSON y optimizar ortomosaicos
# Requiere GDAL/OGR instalado

Write-Host "🗺️  Convirtiendo datos GIS para aplicación web..." -ForegroundColor Cyan

# Directorio de datos GIS
$GISDir = "src\gis"

# Verificar que existen los archivos GPKG
if (-not (Test-Path "$GISDir\Poligonos.gpkg")) {
    Write-Host "❌ Error: No se encontró Poligonos.gpkg en $GISDir" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$GISDir\Poligonos_Sectores.gpkg")) {
    Write-Host "❌ Error: No se encontró Poligonos_Sectores.gpkg en $GISDir" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Archivos GPKG encontrados" -ForegroundColor Green

# Convertir polígonos de muros a GeoJSON
Write-Host "🔄 Convirtiendo polígonos de muros..." -ForegroundColor Yellow
& ogr2ogr -f GeoJSON -t_srs EPSG:4326 "$GISDir\poligonos.geojson" "$GISDir\Poligonos.gpkg"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Polígonos convertidos exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al convertir polígonos" -ForegroundColor Red
}

# Convertir sectores a GeoJSON
Write-Host "🔄 Convirtiendo sectores..." -ForegroundColor Yellow
& ogr2ogr -f GeoJSON -t_srs EPSG:4326 "$GISDir\sectores.geojson" "$GISDir\Poligonos_Sectores.gpkg"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Sectores convertidos exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al convertir sectores" -ForegroundColor Red
}

# Buscar archivos de imagen
Write-Host "🔍 Buscando archivos de imagen..." -ForegroundColor Yellow

$RasterFile = $null
$extensions = @("tif", "tiff", "ecw", "jpg", "jpeg", "png")

foreach ($ext in $extensions) {
    $testFile = "$GISDir\orthomosaic.$ext"
    if (Test-Path $testFile) {
        $RasterFile = $testFile
        break
    }
    
    # Buscar cualquier archivo con esa extensión
    $files = Get-ChildItem "$GISDir\*.$ext" -ErrorAction SilentlyContinue
    if ($files) {
        $RasterFile = $files[0].FullName
        break
    }
}

if ($RasterFile) {
    Write-Host "✅ Imagen encontrada: $RasterFile" -ForegroundColor Green
    
    # Obtener información del raster
    Write-Host "📊 Información del raster:" -ForegroundColor Cyan
    & gdalinfo "$RasterFile" | Select-String -Pattern "(Size is|Pixel Size|Corner Coordinates|PROJCS)"
    
    # Crear versión optimizada para web
    Write-Host "🔄 Optimizando imagen para web..." -ForegroundColor Yellow
    
    # JPEG optimizado
    & gdal_translate -of JPEG -co QUALITY=85 -outsize 50% 50% "$RasterFile" "$GISDir\orthomosaic_web.jpg"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Imagen optimizada creada: orthomosaic_web.jpg" -ForegroundColor Green
        
        # Mostrar tamaños de archivo
        $originalSize = (Get-Item "$RasterFile").Length
        $optimizedSize = (Get-Item "$GISDir\orthomosaic_web.jpg").Length
        
        Write-Host "📦 Tamaño original: $([math]::Round($originalSize / 1MB, 2)) MB" -ForegroundColor Cyan
        Write-Host "📦 Tamaño optimizado: $([math]::Round($optimizedSize / 1MB, 2)) MB" -ForegroundColor Cyan
        Write-Host "📦 Reducción: $([math]::Round((1 - $optimizedSize / $originalSize) * 100, 1))%" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Error al optimizar imagen" -ForegroundColor Red
    }
    
    # Extraer bounds para configuración del mapa
    Write-Host "📍 Extrayendo límites geográficos..." -ForegroundColor Yellow
    & gdalinfo "$RasterFile" | Select-String -Pattern "Corner Coordinates:" -Context 0,4 | Out-File "$GISDir\bounds.txt"
    
} else {
    Write-Host "⚠️  No se encontró archivo de imagen raster" -ForegroundColor Yellow
    Write-Host "   Coloca tu ortomosaico en $GISDir\ con nombre 'orthomosaic.*'" -ForegroundColor Yellow
}

# Crear archivos de ejemplo si no existen datos reales
if (-not (Test-Path "$GISDir\poligonos.geojson")) {
    Write-Host "🔧 Creando datos de ejemplo para polígonos..." -ForegroundColor Yellow
    
    $examplePolygons = @'
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
'@
    
    $examplePolygons | Out-File "$GISDir\poligonos.geojson" -Encoding UTF8
    Write-Host "✅ Datos de ejemplo creados para polígonos" -ForegroundColor Green
}

if (-not (Test-Path "$GISDir\sectores.geojson")) {
    Write-Host "🔧 Creando datos de ejemplo para sectores..." -ForegroundColor Yellow
    
    $exampleSectors = @'
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
'@
    
    $exampleSectors | Out-File "$GISDir\sectores.geojson" -Encoding UTF8
    Write-Host "✅ Datos de ejemplo creados para sectores" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Conversión completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Siguiente pasos:" -ForegroundColor Cyan
Write-Host "1. Ejecuta 'pnpm dev' para iniciar el servidor de desarrollo" -ForegroundColor White
Write-Host "2. Abre http://localhost:4321 en tu navegador" -ForegroundColor White
Write-Host "3. Reemplaza los datos de ejemplo con tus datos reales" -ForegroundColor White
Write-Host "4. Ajusta las coordenadas del centro del mapa en src\utils\mapbox.ts" -ForegroundColor White
Write-Host ""
Write-Host "💡 Para optimizar más tu ortomosaico:" -ForegroundColor Yellow
Write-Host "   - Usa gdal2tiles.py para crear tiles XYZ" -ForegroundColor White
Write-Host "   - Considera usar Cloud Optimized GeoTIFF (COG)" -ForegroundColor White
Write-Host "   - Implementa múltiples niveles de resolución" -ForegroundColor White