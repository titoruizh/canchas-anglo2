# Documentación de Páginas Principales

## 📄 index.astro - Dashboard Principal

### Descripción
Página principal del sistema que muestra el dashboard de gestión de canchas con todas las funcionalidades disponibles según el rol del usuario.

### Ubicación
`src/pages/index.astro`

### Características Principales

1. **Dashboard Interactivo**
   - Lista de canchas con filtros por estado
   - Visualización de estadísticas
   - Acciones según rol del usuario
   - Timeline de historial de canchas

2. **Componentes Visuales**
   - Header con gradiente y partículas animadas (canvas)
   - Tarjetas de canchas con información detallada
   - Gráficos de perfil (Chart.js)
   - Modales para acciones y detalles

3. **Funcionalidades por Rol**
   - **ANGLO**: Crear canchas, enviar a Besalco, cerrar
   - **BESALCO**: Finalizar trabajos, subir evidencia
   - **LINKAPSIS**: Validar espesores, rechazar
   - **LLAYLLAY**: Validar densidad, rechazar
   - **ADMIN**: Acceso completo + gestión de usuarios

### Estructura del Archivo

```astro
---
// 1. Imports
import AuthGuard from "../components/AuthGuard.astro";

// 2. Protección de ruta
---

<AuthGuard />

<!-- 3. HTML -->
<html lang="es">
  <head>
    <!-- Meta tags y recursos -->
    <!-- Chart.js para gráficos -->
  </head>
  <body>
    <!-- Header con animación de partículas -->
    <!-- Container principal -->
    <!-- Secciones del dashboard -->
  </body>
</html>

<!-- 4. Estilos -->
<style>
  /* Estilos del dashboard */
</style>

<!-- 5. Scripts del cliente -->
<script>
  // Lógica de interacción
</script>
```

### APIs Utilizadas

- `GET /api/canchas` - Obtener lista de canchas
- `POST /api/canchas/[id]/accion` - Ejecutar acciones
- `GET /api/canchas/[id]/timeline` - Obtener historial
- `GET /api/empresas` - Obtener lista de empresas
- `GET /api/pks` - Obtener PKs georreferenciados

### Estados de Canchas

El dashboard maneja los siguientes estados:

```
Creada → En Proceso → Finalizada → Validada (Linkapsis) 
       → Validada (LlayLlay) → Cerrada

O en caso de rechazo:
Validada → Rechazada → En Proceso (revancha)
```

Ver: [docs/flujos/FLUJO_ESTADOS_NUEVO.md](../flujos/FLUJO_ESTADOS_NUEVO.md)

### Componentes Clave

#### 1. Filtros de Canchas
```javascript
// Filtros disponibles
- Por estado (Creada, En Proceso, Finalizada, etc.)
- Por empresa (según rol)
- Búsqueda por nombre/número
```

#### 2. Tarjetas de Cancha
```javascript
// Información mostrada
- ID y nombre
- Estado actual
- Empresa asignada
- PKs (inicio y fin)
- Fechas relevantes
- Botones de acción
```

#### 3. Modal de Timeline
```javascript
// Historial completo de la cancha
- Fecha y hora de cada cambio
- Usuario que realizó la acción
- Estado anterior y nuevo
- Observaciones
```

#### 4. Modal de PKs Georreferenciados
```javascript
// Visualización de PKs
- Lista de PKs en el rango
- Coordenadas (UTM y WGS84)
- Link al mapa de Mapbox
```

### Funciones JavaScript Principales

#### `loadCanchas()`
Carga las canchas desde la API y actualiza el DOM.

```javascript
async function loadCanchas() {
  const response = await fetch('/api/canchas');
  const canchas = await response.json();
  renderCanchas(canchas);
}
```

#### `executeAction(canchaId, accion)`
Ejecuta una acción sobre una cancha.

```javascript
async function executeAction(canchaId, accion) {
  const response = await fetch(`/api/canchas/${canchaId}/accion`, {
    method: 'POST',
    body: JSON.stringify({ accion, observaciones: '...' })
  });
  // Recargar canchas
}
```

#### `showTimeline(canchaId)`
Muestra el historial de una cancha en un modal.

```javascript
async function showTimeline(canchaId) {
  const response = await fetch(`/api/canchas/${canchaId}/timeline`);
  const historial = await response.json();
  renderTimeline(historial);
}
```

### Seguridad

- Protegido por `AuthGuard` - requiere autenticación
- Las acciones se validan según el rol del usuario
- Tokens de sesión verificados en cada petición API

### Mejoras Futuras

- [ ] Paginación en lista de canchas
- [ ] Búsqueda avanzada con múltiples filtros
- [ ] Exportación de datos a Excel/CSV
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Dashboard con métricas y KPIs

### Referencias

- [AuthGuard Component](../componentes/AuthGuard.md)
- [API Canchas](../api/canchas.md)
- [Flujo de Estados](../flujos/FLUJO_ESTADOS_NUEVO.md)

---

## 🔐 login.astro - Página de Autenticación

> **Documentación Completa**: Para ver todos los detalles de implementación, animaciones y flujos, ver **[LOGIN_COMPLETO.md](LOGIN_COMPLETO.md)**.

### Descripción
Página de login con selección de empresa y autenticación de usuarios.

### Ubicación
`src/pages/login.astro`

### Características Principales

1. **Vista de Selección de Empresa**
   - Grid de logos de empresas
   - Animaciones al hover
   - Background con partículas (canvas)

2. **Vista de Login**
   - Formulario de usuario/contraseña
   - Validación de credenciales
   - Mensajes de error
   - Botón para volver

3. **Experiencia de Usuario**
   - Transiciones suaves entre vistas
   - Animaciones de fade-in
   - Diseño responsive
   - Feedback visual de estados

### Estructura

```astro
---
// 1. Imports de logos
import imgAnglo from "../img_companies/AngloAmerican_1.png";
import imgBesalco from "../img_companies/Besalco_1.png";
// ...

// 2. Mapeo de logos
const logosMap = {
  "anglo american": imgAnglo.src,
  "besalco": imgBesalco.src,
  // ...
};
---

<html>
  <!-- Vista 1: Selección de empresa -->
  <div id="company-selection-view">
    <!-- Grid de empresas -->
  </div>

  <!-- Vista 2: Formulario de login -->
  <div id="login-form-view" class="hidden">
    <!-- Formulario -->
  </div>
</html>

<script>
  // Lógica de autenticación
</script>
```

### Flujo de Autenticación

```
1. Usuario selecciona empresa
   ↓
2. Se muestra formulario de login
   ↓
3. Usuario ingresa credenciales
   ↓
4. POST /api/auth/login
   ↓
5. Si OK → Redirect a /
   Si Error → Mostrar mensaje
```

### APIs Utilizadas

- `POST /api/auth/login`
  ```json
  {
    "username": "usuario",
    "password": "contraseña"
  }
  ```

  Response:
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "nombre": "Usuario",
      "rol": "ANGLO",
      "empresa": "AngloAmerican"
    }
  }
  ```

### Empresas Disponibles

| Empresa | Logo | Roles |
|---------|------|-------|
| AngloAmerican | imgAnglo | ANGLO, ADMIN |
| Besalco | imgBesalco | BESALCO |
| Linkapsis | imgLinkapsis | LINKAPSIS |
| LlayLlay | imgLlayLlay | LLAYLLAY |

### Funciones JavaScript

#### `selectCompany(companyName)`
Maneja la selección de empresa y muestra el formulario.

```javascript
function selectCompany(companyName) {
  selectedCompanyGlobal = companyName;
  showLoginForm();
}
```

#### `handleLogin(e)`
Procesa el login del usuario.

```javascript
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  
  if (response.ok) {
    window.location.href = '/';
  } else {
    showError('Credenciales inválidas');
  }
}
```

### Animaciones Canvas

La página incluye un canvas animado en el background:

```javascript
function animateBackground() {
  // Partículas flotantes
  // Gradientes dinámicos
  // Efecto parallax sutil
}
```

### Seguridad

- No se almacenan contraseñas en localStorage
- Las sesiones se manejan con cookies httpOnly
- CSRF protection en endpoints
- Rate limiting en API de login (futuro)

### Testing Manual

1. Ir a `/login`
2. Seleccionar empresa
3. Ingresar credenciales de prueba
4. Verificar redirect a dashboard
5. Verificar mensaje de error con credenciales inválidas

### Usuarios de Prueba

Ver: [docs/database/usuarios_demo.md](../database/usuarios_demo.md)

### Mejoras Futuras

- [ ] Login con SSO
- [ ] Recuperación de contraseña
- [ ] 2FA (Two-Factor Authentication)
- [ ] Recordar sesión (remember me)
- [ ] Logs de intentos de login

### Referencias

- [API Auth](../api/auth.md)
- [AuthGuard](../componentes/AuthGuard.md)
- [Sistema de Usuarios](../arquitectura/SISTEMA_USUARIOS_COMPLETO.md)

---

## 🗺️ mapbox-window.astro - Ventana de Mapas

### Descripción
Ventana emergente que muestra mapas interactivos con Mapbox GL JS, polígonos, sectores y PKs georreferenciados.

### Ubicación
`src/pages/mapbox-window.astro`

### Características Principales

1. **Mapa Interactivo**
   - Mapbox GL JS con tiles propios
   - Controles de zoom y navegación
   - Herramientas de dibujo
   - Medición de distancias

2. **Capas GIS**
   - Polígonos de sectores
   - Marcadores de PKs
   - Áreas de canchas
   - Rutas y trazados

3. **Funcionalidades**
   - Búsqueda de PKs
   - Filtrado de capas
   - Exportación de datos
   - Mediciones geoespaciales

### Estructura

```astro
---
import { getMapboxToken } from '../utils/mapbox';
---

<html>
  <head>
    <!-- Mapbox GL JS -->
    <link href='https://api.mapbox.com/mapbox-gl-js/v3.8.0/mapbox-gl.css' rel='stylesheet' />
    <script src='https://api.mapbox.com/mapbox-gl-js/v3.8.0/mapbox-gl.js'></script>
    
    <!-- Mapbox Draw -->
    <link href='@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css' rel='stylesheet' />
  </head>
  
  <body>
    <div id="map"></div>
    <!-- Controles y UI -->
  </body>
</html>

<script>
  // Inicialización del mapa
  // Carga de capas
  // Event handlers
</script>
```

### Inicialización del Mapa

```javascript
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

// Obtener token
const token = await fetch('/mapbox-gis/token.txt').then(r => r.text());
mapboxgl.accessToken = token.trim();

// Crear mapa
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-v9',
  center: [-70.73, -33.13], // Centro de la zona
  zoom: 14
});

// Agregar controles
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new MapboxDraw());
```

### Capas del Mapa

#### 1. TileServer (Base)
```javascript
map.addSource('tileserver', {
  type: 'raster',
  tiles: ['http://localhost:8080/styles/basic/{z}/{x}/{y}.png'],
  tileSize: 256
});
```

#### 2. Polígonos de Sectores
```javascript
map.addSource('sectores', {
  type: 'geojson',
  data: '/mapbox-gis/sectores.geojson'
});

map.addLayer({
  id: 'sectores-fill',
  type: 'fill',
  source: 'sectores',
  paint: {
    'fill-color': '#088',
    'fill-opacity': 0.3
  }
});
```

#### 3. PKs Georreferenciados
```javascript
const pksData = await fetch('/api/pks').then(r => r.json());

pksData.forEach(pk => {
  new mapboxgl.Marker()
    .setLngLat([pk.longitud_wgs84, pk.latitud_wgs84])
    .setPopup(new mapboxgl.Popup().setHTML(`
      <h3>PK ${pk.nombre}</h3>
      <p>KM: ${pk.kilometraje}</p>
    `))
    .addTo(map);
});
```

### Conversión de Coordenadas

El mapa utiliza `utils/mapbox.ts` para conversión UTM ↔ WGS84:

```typescript
import { utmToWgs84, convertGeometry } from '../utils/mapbox';

// Convertir coordenadas UTM a WGS84
const [lng, lat] = utmToWgs84(easting, northing);

// Convertir geometría completa
const convertedGeometry = convertGeometry(utmGeometry);
```

Ver: [docs/componentes/mapbox-utils.md](mapbox-utils.md)

### Herramientas de Dibujo

```javascript
const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    polygon: true,
    line_string: true,
    point: true,
    trash: true
  }
});

map.addControl(draw);

// Eventos de dibujo
map.on('draw.create', (e) => {
  const features = e.features;
  console.log('Nueva geometría:', features);
});
```

### Medición de Distancias

```javascript
function measureDistance(point1, point2) {
  // Usar Turf.js para cálculos geoespaciales
  const distance = turf.distance(point1, point2, { units: 'meters' });
  return distance;
}
```

### Exportación de Datos

```javascript
function exportGeoJSON() {
  const features = draw.getAll();
  const geojson = JSON.stringify(features, null, 2);
  
  // Descargar archivo
  const blob = new Blob([geojson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'export.geojson';
  a.click();
}
```

### Configuración de Coordenadas

Sistema UTM Zona 19S (EPSG:32719):

```typescript
export const COORDINATE_SYSTEM = {
  utmZone: 19,
  hemisphere: 'S',
  epsg: 'EPSG:32719',
  bounds: {
    west: -70.76,
    south: -33.16,
    east: -70.70,
    north: -33.10
  }
};
```

### Performance

- Lazy loading de tiles
- Clustering de marcadores (si hay muchos PKs)
- Throttling de eventos de movimiento
- Cache de GeoJSON

### Integración con TileServer

Ver: [docs/integraciones/TILESERVER_DEPLOY.md](../integraciones/TILESERVER_DEPLOY.md)

### Referencias

- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)
- [Mapbox Draw](https://github.com/mapbox/mapbox-gl-draw)
- [Mapbox Utils](mapbox-utils.md)
- [PKs Georreferenciados](../diseno/PKS_GEORREFERENCIADOS_README.md)

---

Para documentación de componentes específicos, ver:
- [AuthGuard.astro](AuthGuard.md)
- [MiningMap.astro](MiningMap.md)

### src/pages/admin/usuarios.astro - Gesti�n de Usuarios

P�gina administrativa para la gesti�n de cuentas de usuario.

- **Funcionalidades:**
    - Listado de usuarios con filtros por empresa y estado.
    - Creaci�n, edici�n y desactivaci�n de usuarios.
    - Asignaci�n de roles y empresas.
- **Seguridad:** Protegida por el componente <AuthGuard />.
- **UI:** Mantiene la consistencia visual con el resto de la aplicaci�n (header con part�culas, tablas estilizadas).
- **Documentaci�n Detallada:** Ver [Gesti�n de Usuarios](../funcionalidades/GESTION_USUARIOS.md).



## Funcionalidades Linkapsis (en index.astro)

###  Subir Revanchas
Permite la carga masiva de revanchas mediante Excel.
- **Modal**: #modal-subir-revanchas
- **Ver m�s**: [SUBIR_REVANCHAS.md](../funcionalidades/SUBIR_REVANCHAS.md)

###  Subir Canchas
Permite la carga masiva/manual de canchas y muestras.
- **Modal**: #modal-subir-canchas
- **Ver m�s**: [SUBIR_CANCHAS.md](../funcionalidades/SUBIR_CANCHAS.md)

### Componentes de Filtros y Estadísticas
Para detalles sobre la implementación de filtros (fecha, estados) y KPIs, ver [FILTROS_Y_ESTADISTICAS.md](../funcionalidades/FILTROS_Y_ESTADISTICAS.md)

### Componente Tabla de Canchas
Para detalles sobre la renderización de la tabla, columnas y botones de acción, ver [TABLA_CANCHAS.md](../funcionalidades/TABLA_CANCHAS.md)

### Widgets de Estado (Dashboard)
Para detalles sobre los widgets circulares y el filtrado por estado, ver [WIDGETS_ESTADO.md](../funcionalidades/WIDGETS_ESTADO.md)

### Componente de Mapa y Georreferencia
Para detalles sobre la integración de Mapbox, ortomosaicos y visualización de revanchas, ver [VISTA_MAPA.md](../funcionalidades/VISTA_MAPA.md)

### Documentación Técnica Adicional
- [ Autenticación y Seguridad](../funcionalidades/AUTENTICACION.md)
- [ Utilidades GIS y Mapbox](../funcionalidades/GIS_UTILS.md)
