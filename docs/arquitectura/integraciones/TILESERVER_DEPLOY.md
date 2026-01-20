# Despliegue del Tileserver en Render

Este tileserver sirve el archivo `mapbase.mbtiles` para el mapa de la aplicación.

## Deploy en Render

1. **Crear nuevo Web Service en Render:**
   - Ve a https://render.com y crea cuenta (gratis)
   - New → Web Service
   - Conecta tu repo de GitHub

2. **Configuración del servicio:**
   - **Name:** `canchas-anglo-tileserver` (o el que prefieras)
   - **Environment:** Docker
   - **Dockerfile Path:** `Dockerfile.tileserver`
   - **Plan:** Free (suficiente para pruebas)

3. **Advanced Settings:**
   - **Port:** 8081
   - **Health Check Path:** `/` (opcional)

4. **Deploy:**
   - Click "Create Web Service"
   - Espera ~5-10 min (tiene que subir el .mbtiles que es grande)

5. **Obtener URL pública:**
   - Render te dará una URL tipo: `https://canchas-anglo-tileserver.onrender.com`
   - Úsala para actualizar el código frontend

## Alternativa local para desarrollo

```bash
npm install -g tileserver-gl-light
tileserver-gl-light "public/mapbase.mbtiles" --port 8081
```

## Notas

- El archivo `mapbase.mbtiles` pesa bastante, el primer deploy tardará
- El tier Free de Render puede dormir después de inactividad (15 min para despertar)
- Para producción considera el tier Starter ($7/mes, sin sleep)
