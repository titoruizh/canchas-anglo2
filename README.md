# Sistema Integral de Gestión Georreferenciada - AngloAmerican

![Astro](https://img.shields.io/badge/Astro-5.15-BC52EE?logo=astro)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Mapbox](https://img.shields.io/badge/Mapbox-GL_JS_3.8-000000?logo=mapbox)

## 🎯 Descripción del Proyecto

**Sistema web full-stack** para gestión operacional de trabajos de construcción georreferenciados en faena minera AngloAmerican. Coordina el flujo de trabajo entre 4 empresas contratistas con **trazabilidad completa**, **validaciones multi-nivel** y **visualización geoespacial avanzada**.

### Problema Resuelto
Reemplaza procesos manuales en Excel y WhatsApp por un sistema centralizado que garantiza:
- ✅ Trazabilidad de cada acción con timestamp y responsable
- ✅ Validaciones técnicas estructuradas (espesores, densidad, etc.)
- ✅ Georreferenciación precisa con conversión UTM ↔ WGS84
- ✅ Control de estados y rechazos con historial completo

---

## 🚀 Funcionalidades Destacadas

### 1. Sistema de Flujo Multi-Empresa (Workflow Engine)
**Máquina de estados** con transiciones controladas entre 4 empresas:

```
AngloAmerican → Besalco → Linkapsis → LlayLlay → AngloAmerican
     ↓            ↓          ↓           ↓
  [Creada]   [Proceso]  [Validación] [Validación]  [Cerrada]
                          Espesores    Densidad
```

- **Roles y permisos específicos** por empresa
- **Sistema de rechazos** que devuelve trabajos a Besalco con observaciones obligatorias
- **Triggers PostgreSQL** que automatizan transiciones y notificaciones
- **Historial completo** de cada transición con usuario y timestamp

### 2. Georreferenciación y Mapas Interactivos

#### Sistema de PKs (Postes Kilométricos)
- **138 puntos georreferenciados** con coordenadas UTM Zona 19S
- Conversión automática **UTM ↔ WGS84** usando Proj4
- Normalización inteligente de formatos irregulares (0+550.800 → 0+551)
- **100% de coincidencias** entre mediciones y coordenadas

#### Visualización Mapbox GL JS
- **Mapa base offline** con tiles propios (TileServer + Docker)
- **Capas GeoJSON** de polígonos y sectores
- **Marcadores dinámicos** con clasificación por colores (verde/amarillo/rojo)
- **Zoom automático** a bounding box de puntos activos
- **Popup interactivos** con datos técnicos en tiempo real

### 3. Módulo de Revanchas (Mediciones de Seguridad)

Sistema completo para gestión de mediciones críticas de seguridad en tranque de relaves:

#### Carga de Datos
- **Parser inteligente** de archivos Excel/CSV con validación de estructura
- Detección automática de fecha de medición (celda específica)
- Normalización de formatos irregulares de PKs
- **Constraint UNIQUE** por (muro, fecha) para evitar duplicados

#### Procesamiento Automático
- **Triggers PostgreSQL** que calculan estadísticas globales:
  - Min/Max/Promedio de revancha, ancho, coronamiento
  - Identificación de PKs críticos
  - Conteo de alertas por nivel
- **Vistas materializadas** para queries geoespaciales optimizadas
- **Clasificación por colores** según umbrales de seguridad:
  ```
  Revancha:  🟢 ≥3.5m  🟡 3.0-3.5m  🔴 <3.0m
  Ancho:     🟢 ≥18m   🟡 15-18m    🔴 <15m
  Dist.Geo:  🟢 ≥1.0m  🟡 0.5-1.0m  🔴 <0.5m
  ```

#### Análisis y Comparación
- **Vista temporal** de mediciones históricas por PK
- **Comparación entre fechas** con cálculo de deltas
- **Identificación de tendencias** (crecimiento/decrecimiento)
- **Alertas tempranas** para puntos que se acercan a umbrales críticos

### 4. API REST Completa

Endpoints organizados por dominio:

```
/api/auth/              # Autenticación y gestión de sesiones
/api/canchas/           # CRUD de trabajos (canchas)
/api/validaciones/      # Validaciones y rechazos
/api/revanchas/         # Mediciones y estadísticas
/api/pks/               # Sistema de coordenadas
```

- **Respuestas estandarizadas** con códigos HTTP semánticos
- **Validación de entrada** con sanitización
- **Manejo de errores** robusto con logs detallados
- **Rate limiting** y protección CORS

---

## 🏗️ Stack Tecnológico

### Frontend
- **Astro 5.15** - Framework SSR con Islands Architecture
- **TypeScript** - Tipado estático end-to-end
- **Mapbox GL JS 3.8** - Renderización de mapas WebGL
- **CSS vanilla** - Sin frameworks, diseño responsivo custom

### Backend
- **Supabase** - PostgreSQL + Row Level Security (RLS)
- **Edge Functions** - Lógica serverless con Deno
- **Database Triggers** - Automatización de cálculos y validaciones
- **Views & Materialized Views** - Queries complejas optimizadas

### GIS & Datos
- **Proj4** - Transformación de coordenadas
- **GeoJSON** - Formato estándar para geometrías
- **TileServer GL** - Servidor de tiles propio (WMTS)
- **Docker** - Containerización del TileServer

### DevOps
- **Vercel** - Deploy automático con CI/CD
- **pnpm** - Gestión de dependencias eficiente
- **Git** - Control de versiones con convenciones semánticas

---

## 🎨 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────┐
│           CLIENTE (Astro SSR + Islands)          │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │   Pages    │  │ Components │  │   Utils   │ │
│  │  .astro    │  │   .astro   │  │    .ts    │ │
│  └────────────┘  └────────────┘  └───────────┘ │
└────────────────────┬────────────────────────────┘
                     │
           ┌─────────▼─────────┐
           │   API REST Layer   │
           │  (/api endpoints)  │
           └─────────┬─────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼─────┐  ┌─────▼──────┐  ┌────▼─────┐
│ Supabase │  │  Mapbox    │  │TileServer│
│PostgreSQL│  │   API      │  │  Docker  │
└──────────┘  └────────────┘  └──────────┘
```

### Patrones Implementados
- **Repository Pattern** - Abstracción de acceso a datos
- **Service Layer** - Lógica de negocio centralizada
- **State Machine** - Control de transiciones de estados
- **Observer Pattern** - Triggers para eventos de BD
- **Factory Pattern** - Creación de objetos complejos (GeoJSON)

---

## 📊 Características Técnicas Avanzadas

### Base de Datos
- **23 tablas** con relaciones complejas (1:N, N:M)
- **12 triggers** para automatización de lógica de negocio
- **8 vistas** materializadas para queries geoespaciales
- **Row Level Security** (RLS) con políticas por rol
- **Constraints** avanzados: CHECK, UNIQUE compuestos, FK con CASCADE
- **Funciones PL/pgSQL** para cálculos complejos

### Performance
- **Índices compuestos** en columnas de búsqueda frecuente
- **Vistas materializadas** para queries costosas
- **Paginación server-side** en listados grandes
- **Lazy loading** de capas de mapa
- **Code splitting** automático con Astro Islands

### Seguridad
- **Autenticación JWT** con refresh tokens
- **RLS policies** a nivel de fila en PostgreSQL
- **Sanitización de inputs** contra SQL injection
- **CORS configurado** para dominios autorizados
- **Rate limiting** en endpoints críticos
- **Secrets management** con variables de entorno

---

## 📈 Métricas del Proyecto

- **~15,000 líneas de código** (TypeScript + SQL + Astro)
- **138 puntos georreferenciados** con coordenadas precisas
- **23 tablas relacionales** con integridad referencial completa
- **12 triggers automáticos** para lógica de negocio
- **8 vistas SQL** optimizadas para reportes
- **4 empresas** coordinadas en flujo de trabajo
- **6 estados** de cancha con transiciones controladas
- **100% tipo-seguro** con TypeScript

---


### Full-Stack Development
- ✅ Arquitectura de sistemas complejos multi-actor
- ✅ Diseño de APIs RESTful escalables
- ✅ Implementación de máquinas de estado
- ✅ Integración de servicios externos (Mapbox, Supabase)

### Base de Datos
- ✅ Diseño de esquemas relacionales normalizados
- ✅ Optimización de queries con índices y vistas
- ✅ Triggers y stored procedures complejos
- ✅ Migraciones y versionado de esquema

### GIS y Mapas
- ✅ Transformación de coordenadas entre sistemas (UTM/WGS84)
- ✅ Renderización de mapas con Mapbox GL JS
- ✅ Procesamiento de geometrías GeoJSON
- ✅ Deploy de TileServer con Docker

### DevOps y Buenas Prácticas
- ✅ CI/CD con Vercel
- ✅ Containerización con Docker
- ✅ Versionado semántico con Git
- ✅ Documentación técnica exhaustiva
- ✅ Testing y validación de datos

---

## 📚 Documentación

Para información detallada del proyecto, consulta la [documentación completa](docs/):

- **[Arquitectura](docs/ARCHITECTURE.md)** - Diseño del sistema
- **[Estándares de Código](docs/CODE_STANDARDS.md)** - Guías de desarrollo
- **[Base de Datos](docs/database/)** - Esquemas y migraciones
- **[API](docs/api/)** - Documentación de endpoints
- **[Flujos](docs/flujos/)** - Diagramas de procesos

---

## 📞 Contacto

**Desarrollador**: Tito Ruiz  
**GitHub**: [@titoruizh](https://github.com/titoruizh)  
**Proyecto**: [Full-Stack-Sistema-Integral-Canchas-AngloAmerican-Tortolas](https://github.com/titoruizh/Full-Stack-Sistema-Integral-Canchas-AngloAmerican-Tortolas)

---

## 📝 Licencia

Este proyecto fue desarrollado como solución interna para AngloAmerican. El código se comparte con fines de portafolio profesional.

---

