# Integración del Visor Mapbox

## Estado: ✅ COMPLETADO

Se ha integrado exitosamente el visor Mapbox desde la subcarpeta `mapbox/` en la aplicación principal.

## Qué se integró:

1. **Componente `MiningMap.astro`** - Copiado en `src/components/`
2. **Utilidades GIS** - Copidas en `src/utils/` (mapbox.ts, gis.ts)
3. **Assets estáticos** - GeoJSON y token en `public/mapbox-gis/`
4. **Página del visor** - Nueva página en `/mapbox-window`
5. **Botón de integración** - Botón "Abrir Visor Mapbox" en la página principal

## Cómo usar:

1. **Iniciar servidor de desarrollo:**
   ```bash
   pnpm run dev
   ```
   
2. **Abrir aplicación:**
   ```
   http://localhost:4324/
   ```

3. **Usar el visor:**
   - Hacer clic en el botón "Abrir Visor Mapbox" 
   - Se abrirá una ventana popup con el mapa

## Configuración del TileServer GL (Opcional):

Para ver el ortomosaico completo, ejecutar TileServer GL:

```bash
# Desde la carpeta mapbox/
cd mapbox
npx tileserver-gl-light public/mapbase.mbtiles --port 8081
```

Esto servirá los tiles del ortomosaico en `http://localhost:8081`

## Archivos modificados/creados:

### Nuevos archivos:
- `src/components/MiningMap.astro`
- `src/utils/mapbox.ts`
- `src/utils/gis.ts`
- `src/pages/mapbox-window.astro`
- `public/mapbox-gis/token.txt`
- `public/mapbox-gis/poligonos.geojson`
- `public/mapbox-gis/sectores.geojson`

### Archivos modificados:
- `package.json` - Agregadas dependencias mapbox-gl y proj4
- `src/pages/index.astro` - Agregado botón para abrir visor

## Características:

- ✅ Conversión automática de coordenadas UTM 19S a WGS84
- ✅ Carga de polígonos y sectores desde GeoJSON
- ✅ Ortomosaico base (requiere TileServer GL)
- ✅ Controles de navegación Mapbox
- ✅ Token de Mapbox incluido
- ✅ Ventana popup independiente
- ✅ Sin dependencias del subproyecto original

## Próximos pasos:

El visor está listo para usar. Posteriormente puedes:
- Agregar filtros y condiciones para mostrar el botón
- Integrar datos dinámicos desde el backend
- Personalizar estilos y capas del mapa