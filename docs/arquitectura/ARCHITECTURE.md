# Arquitectura del Sistema - Canchas AngloAmerican

## 🎯 Visión General

Sistema de gestión de canchas georreferenciadas con flujo de trabajo multi-empresa, validaciones, y trazabilidad completa.

## 🏛️ Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Astro)                      │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐   │
│  │  Pages   │  │Components│  │  Utils & Libraries  │   │
│  │  .astro  │  │  .astro  │  │   (mapbox, auth)    │   │
│  └──────────┘  └──────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   API LAYER (Astro)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │   Auth   │  │ Canchas  │  │  PKs / Revanchas    │  │
│  │   API    │  │   API    │  │      API            │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Supabase PostgreSQL)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Usuarios │  │ Canchas  │  │     PKs/Revanchas   │  │
│  │  Roles   │  │Historial │  │    Validaciones     │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
│                                                          │
│  Triggers | RLS Policies | Functions                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 SERVICIOS EXTERNOS                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  Mapbox  │  │TileServer│  │       Vercel        │  │
│  │   Maps   │  │  (WMTS)  │  │     (Deploy)        │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 📁 Estructura del Proyecto

```
canchas-anglo2/
├── src/
│   ├── pages/              # Rutas de la aplicación (Astro routing)
│   │   ├── index.astro     # Dashboard principal
│   │   ├── login.astro     # Autenticación
│   │   ├── mapbox-window.astro  # Ventana de mapas
│   │   ├── api/            # Endpoints API
│   │   └── admin/          # Páginas de administración
│   ├── components/         # Componentes reutilizables
│   │   ├── AuthGuard.astro # Protección de rutas
│   │   └── MiningMap.astro # Componente principal de mapas
│   ├── lib/                # Librerías y configuración
│   │   ├── supabase.ts     # Cliente Supabase
│   │   └── api.js          # Funciones de API
│   ├── utils/              # Utilidades
│   │   ├── authStore.ts    # Store de autenticación
│   │   ├── mapbox.ts       # Funciones Mapbox
│   │   ├── gis.ts          # Operaciones GIS
│   │   └── pks.js          # Lógica de PKs
│   ├── scripts/            # Scripts del cliente
│   └── styles/             # Estilos globales
├── public/                 # Archivos estáticos
│   ├── mapbase.mbtiles     # Base de mapas offline
│   └── mapbox-gis/         # GeoJSON y configuración
├── docs/                   # Documentación completa
└── package.json            # Dependencias y scripts
```

## 🔄 Flujos Principales

### 1. Flujo de Autenticación
Ver: [docs/flujos/autenticacion.md](flujos/autenticacion.md)

1. Usuario ingresa credenciales
2. API valida contra Supabase
3. Se genera sesión y se almacena rol
4. AuthGuard protege rutas según rol

### 2. Flujo de Canchas
Ver: [docs/flujos/FLUJO_ESTADOS_NUEVO.md](flujos/FLUJO_ESTADOS_NUEVO.md)

Estados: `Creada` → `En Proceso` → `Finalizada` → `Validada` → `Cerrada`

### 3. Flujo de Revanchas
Ver: [docs/arquitectura/SISTEMA_REVANCHAS_COMPLETO.md](arquitectura/SISTEMA_REVANCHAS_COMPLETO.md)

Canchas rechazadas vuelven a Besalco para rehacer el trabajo.

### 4. Flujo de PKs Georreferenciados
Ver: [docs/diseno/PKS_GEORREFERENCIADOS_README.md](diseno/PKS_GEORREFERENCIADOS_README.md)

Sistema de postes kilométricos con coordenadas y validación geoespacial.

## 🔐 Sistema de Roles y Permisos

| Rol | Empresa | Permisos |
|-----|---------|----------|
| `ANGLO` | AngloAmerican | Crear canchas, cerrar, visualizar todo |
| `BESALCO` | Besalco | Ver asignadas, finalizar, subir evidencia |
| `LINKAPSIS` | Linkapsis | Validar espesores, rechazar |
| `LLAYLLAY` | LlayLlay | Validar densidad, rechazar |
| `ADMIN` | Sistema | Acceso total, gestión de usuarios |

Ver: [docs/arquitectura/SISTEMA_USUARIOS_COMPLETO.md](arquitectura/SISTEMA_USUARIOS_COMPLETO.md)

## 🗺️ Sistema de Mapas

### Componentes GIS

1. **Mapbox GL JS**: Renderización de mapas interactivos
2. **TileServer**: Servidor de tiles propio (WMTS)
3. **GeoJSON**: Polígonos y sectores
4. **Proj4**: Conversión de coordenadas

Ver: [docs/integraciones/MAPBOX_INTEGRATION.md](integraciones/MAPBOX_INTEGRATION.md)

### Capas del Mapa

- Capa base (mbtiles offline)
- Polígonos de sectores
- Marcadores de PKs
- Áreas de canchas

## 🗄️ Base de Datos

### Tablas Principales

**Core:**
- `empresas` - Catálogo de empresas
- `usuarios` - Usuarios del sistema
- `roles` - Roles y permisos

**Canchas:**
- `canchas` - Datos principales
- `estados_cancha` - Catálogo de estados
- `historial_cancha` - Trazabilidad
- `validaciones` - Validaciones/rechazos

**PKs y Revanchas:**
- `pks_georreferenciados` - Sistema de PKs
- `revanchas` - Rechazos y retrabajos

Ver: [docs/database/](database/) para esquemas completos y migraciones.

## 🔧 APIs y Endpoints

### Autenticación
- `POST /api/auth/login` - Login de usuario
- `POST /api/auth/verify-password` - Verificar contraseña

### Canchas
- `GET /api/canchas` - Listar canchas
- `GET /api/canchas/[id]` - Detalle de cancha
- `POST /api/canchas/[id]/accion` - Ejecutar acción en cancha
- `GET /api/canchas/[id]/timeline` - Historial de cancha
- `GET /api/canchas/[id]/generar-pdf` - Generar reporte PDF

### PKs
- `GET /api/pks` - Listar PKs georreferenciados

### Revanchas
- `GET /api/revanchas` - Listar revanchas
- `GET /api/revanchas/georreferenciadas` - Revanchas con coordenadas

Ver: [docs/api/](api/) para documentación completa de endpoints.

## 🚀 Deploy y Entornos

### Desarrollo
```bash
pnpm dev  # http://localhost:4321
```

### Producción
- **Frontend**: Vercel (auto-deploy desde main)
- **TileServer**: Docker en servidor propio
- **Backend**: Supabase Cloud

Ver: [docs/integraciones/TILESERVER_DEPLOY.md](integraciones/TILESERVER_DEPLOY.md)

## 🎨 Patrones de Diseño

### Frontend
- **SSR First**: Renderizado en servidor por defecto
- **Client Islands**: Hidratación parcial para componentes interactivos
- **Progressive Enhancement**: Funcional sin JavaScript

### Backend
- **Row Level Security (RLS)**: Seguridad a nivel de fila en Supabase
- **Database Triggers**: Automatización de historial y validaciones
- **API REST**: Endpoints simples y predecibles

## 📊 Trazabilidad y Auditoría

Cada acción genera registro en:
1. `historial_cancha` - Cambios de estado
2. `validaciones` - Validaciones y rechazos
3. Timestamps automáticos

Ver: [docs/database/DOCUMENTACION_TIMELINE.sql](database/DOCUMENTACION_TIMELINE.sql)

## 🔍 Monitoreo y Logs

- Supabase Dashboard: Logs de queries y errores
- Vercel Analytics: Performance del frontend
- Browser Console: Errores del cliente

## 🔒 Seguridad

- Autenticación basada en sesión
- RLS policies en todas las tablas
- Validación de roles en cada endpoint
- CORS configurado para dominios específicos
- Sanitización de inputs

## 📈 Escalabilidad

### Consideraciones Actuales
- PostgreSQL puede manejar miles de canchas
- Mapbox soporta millones de features
- Vercel escala automáticamente

### Optimizaciones Futuras
- Cache de queries frecuentes
- Lazy loading de mapas
- Paginación en listados grandes
- CDN para assets estáticos

## 🛠️ Tecnologías y Versiones

- **Astro**: 5.15.1
- **Supabase JS**: 2.76.1
- **Mapbox GL**: 3.8.0
- **Node.js**: 18+
- **PostgreSQL**: 15 (Supabase)

## 📚 Referencias

- [Documentación de Astro](https://docs.astro.build)
- [Documentación de Supabase](https://supabase.com/docs)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [WMTS Standard](https://www.ogc.org/standards/wmts)
