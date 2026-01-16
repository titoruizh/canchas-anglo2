# 📚 Índice de Documentación - Canchas AngloAmerican

Bienvenido a la documentación completa del Sistema de Gestión de Canchas Georreferenciadas.

## 🚀 Inicio Rápido

Si eres nuevo en el proyecto, empieza aquí:

1. **[README.md](../README.md)** - Visión general del proyecto
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Entender la arquitectura
3. **[CODE_STANDARDS.md](CODE_STANDARDS.md)** - Estándares de código
4. **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Cómo contribuir

### 🤖 Trabajando con IA

Si usas herramientas de IA (Copilot, ChatGPT, Claude):

- **[AI_GUIDE.md](AI_GUIDE.md)** - Guía completa para trabajar con IA en este proyecto
  - Contexto importante
  - Prompts efectivos
  - Patrones de código
  - Referencias rápidas

## 📁 Estructura de la Documentación

```
docs/
├── INDEX.md (este archivo)
├── ARCHITECTURE.md
├── CODE_STANDARDS.md
├── arquitectura/          # Diseño de sistemas
├── componentes/           # Documentación de componentes
├── api/                   # Endpoints y APIs
├── database/              # Esquemas y migraciones SQL
├── flujos/                # Diagramas de flujo
├── integraciones/         # Mapbox, TileServer, etc.
├── instrucciones/         # Guías paso a paso
└── diseno/                # Diseño de features
```

---

## 🏛️ Arquitectura

Documentos sobre el diseño y estructura del sistema.

### Documentos Principales

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arquitectura completa del sistema
  - Stack tecnológico
  - Estructura de carpetas
  - Patrones de diseño
  - Escalabilidad

### Sistemas Específicos

- **[SISTEMA_USUARIOS_COMPLETO.md](arquitectura/SISTEMA_USUARIOS_COMPLETO.md)**
  - Autenticación y autorización
  - Roles y permisos
  - Gestión de usuarios

- **[SISTEMA_REVANCHAS_COMPLETO.md](arquitectura/SISTEMA_REVANCHAS_COMPLETO.md)**
  - Flujo de rechazos
  - Retrabajos de Besalco
  - Trazabilidad de revanchas

---

## 🔄 Flujos de Trabajo

Diagramas y descripciones de los flujos principales.

- **[FLUJO_ESTADOS_NUEVO.md](flujos/FLUJO_ESTADOS_NUEVO.md)**
  - Estados de canchas
  - Transiciones permitidas
  - Acciones por rol

---

## 🗺️ Integraciones

Integración con servicios externos.

- **[MAPBOX_INTEGRATION.md](integraciones/MAPBOX_INTEGRATION.md)**
  - Configuración de Mapbox GL JS
  - Manejo de tokens
  - Capas y estilos
  - Eventos y controles

- **[TILESERVER_DEPLOY.md](integraciones/TILESERVER_DEPLOY.md)**
  - Deploy de TileServer con Docker
  - Configuración WMTS
  - Generación de tiles
  - Servir tiles personalizados

---

## 🗄️ Base de Datos

Esquemas, migraciones y queries útiles.

### Scripts SQL

- **backup-supabase.sql** - Backup completo de la BD
- **supabase_setup.sql** - Setup inicial de tablas
- **SISTEMA_PKS_GEORREFERENCIADOS.sql** - Sistema de PKs
- **migracion_revanchas_COMPLETA_FINAL.sql** - Migración de revanchas

### Documentación

- **[DOCUMENTACION_TIMELINE.sql](database/DOCUMENTACION_TIMELINE.sql)**
  - Sistema de timeline/historial
  - Triggers automáticos
  - Queries de auditoría

### Queries Útiles

- **[queries_revanchas_utiles.sql](database/queries_revanchas_utiles.sql)**
  - Consultas frecuentes
  - Reports y estadísticas
  - Debugging

### Datos

- **alignment_coordinates.csv** - Coordenadas de alineación

---

## 🧩 Componentes y Páginas

Documentación detallada de cada componente.

### Páginas Principales

- **[paginas.md](componentes/paginas.md)**
  - `index.astro` - Dashboard principal
  - `login.astro` - Autenticación
  - `mapbox-window.astro` - Ventana de mapas

### Componentes

- **AuthGuard.astro** - Protección de rutas
- **MiningMap.astro** - Componente de mapas

### Utilidades

- **[mapbox-utils.md](componentes/mapbox-utils.md)**
  - Conversión de coordenadas UTM ↔ WGS84
  - Funciones GIS
  - Manejo de geometrías

---

## 🔌 API

Documentación de endpoints.

### Autenticación

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/verify-password` - Verificar contraseña

### Canchas

- `GET /api/canchas` - Listar canchas
- `GET /api/canchas/[id]` - Detalle de cancha
- `POST /api/canchas/[id]/accion` - Ejecutar acción
- `GET /api/canchas/[id]/timeline` - Historial
- `GET /api/canchas/[id]/generar-pdf` - Generar reporte
- `POST /api/canchas/[id]/observaciones` - Agregar observación
- `POST /api/canchas/[id]/validaciones` - Validar/rechazar

### PKs y Revanchas

- `GET /api/pks` - Listar PKs georreferenciados
- `GET /api/revanchas` - Listar revanchas
- `GET /api/revanchas/georreferenciadas` - Revanchas con coordenadas
- `GET /api/revanchas/[id]` - Detalle de revancha
- `GET /api/revanchas/comparar` - Comparar versiones

### Administración

- `GET /api/usuarios` - Listar usuarios
- `POST /api/usuarios` - Crear usuario
- `GET /api/usuarios/[id]` - Detalle de usuario
- `PUT /api/usuarios/[id]` - Actualizar usuario
- `DELETE /api/usuarios/[id]` - Eliminar usuario
- `GET /api/empresas` - Listar empresas
- `GET /api/roles` - Listar roles

---

## 📋 Instrucciones

Guías paso a paso para tareas específicas.

- **[INSTRUCCIONES_REVANCHAS.md](instrucciones/INSTRUCCIONES_REVANCHAS.md)**
  - Cómo manejar rechazos
  - Proceso de revanchas
  - Validaciones

---

## 🎨 Diseño

Documentos de diseño de features específicos.

- **[PKS_GEORREFERENCIADOS_README.md](diseno/PKS_GEORREFERENCIADOS_README.md)**
  - Sistema de postes kilométricos
  - Georreferenciación
  - Integración con mapas

- **[PROMPT_DISEÑO_PKS.md](diseno/PROMPT_DISEÑO_PKS.md)**
  - Prompts originales de diseño
  - Decisiones de arquitectura

- **[RESUMEN_DISEÑO_PKS.md](diseno/RESUMEN_DISEÑO_PKS.md)**
  - Resumen ejecutivo del diseño

---

## 🛠️ Desarrollo

### Estándares y Guías

- **[CODE_STANDARDS.md](CODE_STANDARDS.md)**
  - Nomenclatura de archivos
  - Convenciones TypeScript/Astro
  - Estilos CSS (BEM)
  - Seguridad y validación
  - Manejo de errores

- **[CONTRIBUTING.md](../CONTRIBUTING.md)**
  - Workflow de Git
  - Pull Requests
  - Reportar bugs
  - Proponer features

### Setup del Proyecto

```bash
# Instalar dependencias
pnpm install

# Variables de entorno
cp .env.example .env

# Ejecutar en desarrollo
pnpm dev

# Build para producción
pnpm build
```

### Tecnologías

- **Frontend**: Astro 5.x
- **Backend**: Supabase (PostgreSQL)
- **Mapas**: Mapbox GL JS 3.8
- **Estilos**: CSS vanilla
- **Deploy**: Vercel

---

## 📊 Diagramas

### Flujo de Canchas

```
Creada (ANGLO)
  ↓
En Proceso (BESALCO trabaja)
  ↓
Finalizada (BESALCO termina)
  ↓
Validada por Linkapsis
  ↓ (si rechaza, vuelve a En Proceso como revancha)
Validada por LlayLlay
  ↓ (si rechaza, vuelve a En Proceso como revancha)
Cerrada (ANGLO cierra)
```

### Arquitectura de Capas

```
Cliente (Browser)
  ↓ HTTP/HTTPS
Astro SSR + Client Islands
  ↓ REST API
Supabase PostgreSQL
  ↓ RLS Policies + Triggers
Datos Persistentes
```

---

## 🔍 Búsqueda Rápida

### Por Tema

- **Autenticación**: [CODE_STANDARDS.md](CODE_STANDARDS.md#-seguridad), [LOGIN_COMPLETO.md](componentes/LOGIN_COMPLETO.md), [API Auth](ARCHITECTURE.md#autenticación)
- **Mapas**: [MAPBOX_INTEGRATION.md](integraciones/MAPBOX_INTEGRATION.md), [mapbox-utils.md](componentes/mapbox-utils.md), [mapbox-window.astro](componentes/paginas.md#-mapbox-windowastro)
- **PKs**: [PKS_GEORREFERENCIADOS](diseno/PKS_GEORREFERENCIADOS_README.md), [SISTEMA_PKS](database/SISTEMA_PKS_GEORREFERENCIADOS.sql)
- **Revanchas**: [SISTEMA_REVANCHAS](arquitectura/SISTEMA_REVANCHAS_COMPLETO.md), [INSTRUCCIONES](instrucciones/INSTRUCCIONES_REVANCHAS.md)
- **Creación de Canchas**: [CREAR_CANCHA.md](funcionalidades/CREAR_CANCHA.md)
- **Gestión de Usuarios**: [GESTION_USUARIOS.md](funcionalidades/GESTION_USUARIOS.md)
- **Subir Revanchas (Linkapsis)**: [SUBIR_REVANCHAS.md](funcionalidades/SUBIR_REVANCHAS.md)
- [📥 Subir Canchas (Linkapsis)](./funcionalidades/SUBIR_CANCHAS.md)
- [📊 Filtros y Estadísticas](./funcionalidades/FILTROS_Y_ESTADISTICAS.md)
- [📋 Tabla de Canchas](./funcionalidades/TABLA_CANCHAS.md)
- [🔵 Widgets de Estado](./funcionalidades/WIDGETS_ESTADO.md)
- [🗺️ Vista de Mapa y Georreferencia](./funcionalidades/VISTA_MAPA.md)
- [🔐 Sistema de Autenticación](./funcionalidades/AUTENTICACION.md)
- [🌍 Utilidades GIS y Mapbox](./funcionalidades/GIS_UTILS.md)
- [🎨 Personalización Visual](./PERSONALIZACION_DASHBOARD.md)
- **Base de Datos**: [database/](database/), [ARCHITECTURE.md](ARCHITECTURE.md#-base-de-datos)
- **API**: [ARCHITECTURE.md](ARCHITECTURE.md#-apis-y-endpoints)

### Por Rol

- **Desarrollador**: [CODE_STANDARDS.md](CODE_STANDARDS.md), [ARCHITECTURE.md](ARCHITECTURE.md)
- **DevOps**: [TILESERVER_DEPLOY.md](integraciones/TILESERVER_DEPLOY.md)
- **Usuario Final**: [README.md](../README.md), Flujos en [flujos/](flujos/)
- **Product Owner**: [ARCHITECTURE.md](ARCHITECTURE.md), Sistemas en [arquitectura/](arquitectura/)

---

## 🆘 Soporte

### ¿Tienes preguntas?

1. Busca en esta documentación
2. Revisa el código con comentarios
3. Consulta a los maintainers
4. Abre un issue en GitHub

### ¿Encontraste un error en la documentación?

1. Abre un PR con la corrección
2. Sigue [CONTRIBUTING.md](../CONTRIBUTING.md)
3. Actualiza este índice si es necesario

---

## 📝 Notas

- Esta documentación está **viva** y debe actualizarse con cada cambio significativo
- Usa lenguaje claro y ejemplos de código
- Incluye diagramas cuando ayuden a entender
- Prioriza la utilidad sobre la perfección

---

## 🔗 Enlaces Externos

- [Astro Docs](https://docs.astro.build)
- [Supabase Docs](https://supabase.com/docs)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)

---

**Última actualización**: 19 de diciembre de 2025

**Versión del proyecto**: 0.0.1

**Maintainers**: [Añadir nombres]
