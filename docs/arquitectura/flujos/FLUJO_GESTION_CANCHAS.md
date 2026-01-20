# Flujo de Gestión de Canchas - Sistema Anglo2

> **Última actualización**: 23 de Diciembre 2025
> **Versión**: 2.0

## Índice
1. [Resumen del Flujo](#resumen-del-flujo)
2. [Estados de una Cancha](#estados-de-una-cancha)
3. [Empresas y Roles](#empresas-y-roles)
4. [Flujo Detallado por Empresa](#flujo-detallado-por-empresa)
5. [Ciclo de Rechazos y Revalidaciones](#ciclo-de-rechazos-y-revalidaciones)
6. [Modales y Formularios](#modales-y-formularios)
7. [Estructura de Datos](#estructura-de-datos)
8. [Fotos de Validación](#fotos-de-validación)
9. [API Endpoints](#api-endpoints)

---

## Resumen del Flujo

```
┌─────────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  AngloAmerican  │ ──▶ │   Besalco   │ ──▶ │  Linkapsis  │ ──▶ │  LlayLlay   │ ──▶ │  AngloAmerican  │
│    (Crea)       │     │  (Ejecuta)  │     │  (Valida)   │     │  (Valida)   │     │    (Cierra)     │
└─────────────────┘     └─────────────┘     └─────────────┘     └─────────────┘     └─────────────────┘
      Estado:               Estado:            Estado:            Estado:            Estado:
      CREADA              EN PROCESO          VALIDADA          VALIDADA            CERRADA
        (1)                  (2)               (4) L             (4) LL              (6)
```

### Flujo Normal (Sin Rechazos)
1. **AngloAmerican** crea la cancha → Estado: `Creada (1)`
2. **AngloAmerican** envía a Besalco → Estado: `En Espera (7)` para Besalco
3. **Besalco** toma el trabajo → Estado: `En Proceso (2)`
4. **Besalco** finaliza → Estado: `En Espera (7)` para Linkapsis
5. **Linkapsis** toma el trabajo → Estado: `En Proceso (2)`
6. **Linkapsis** valida → Estado: `Validada (4)` + `En Espera (7)` para LlayLlay
7. **LlayLlay** toma el trabajo → Estado: `En Proceso (2)`
8. **LlayLlay** valida → Estado: `Validada (4)` completa
9. **AngloAmerican** cierra → Estado: `Cerrada (6)`

---

## Estados de una Cancha

| ID | Estado | Descripción |
|----|--------|-------------|
| 1 | **Creada** | Cancha recién creada, pendiente de enviar a Besalco |
| 2 | **En Proceso** | Una empresa está trabajando activamente en ella |
| 4 | **Validada** | Validación completada (puede ser parcial o completa) |
| 6 | **Cerrada** | Ciclo completado, cancha archivada |
| 7 | **En Espera** | Esperando que la siguiente empresa tome el trabajo |
| 8 | **Rechazada en Espera** | Fue rechazada y espera que la empresa anterior corrija |

### Campos de Estado en BD

```sql
-- Tabla: canchas
estado_id           -- Estado general de la cancha
empresa_actual_id   -- Empresa que tiene el trabajo actualmente

-- Estados combinados:
-- estado_id=7 + empresa_actual_id=2 → En espera para Besalco
-- estado_id=7 + empresa_actual_id=3 → En espera para Linkapsis
-- estado_id=7 + empresa_actual_id=4 → En espera para LlayLlay
```

---

## Empresas y Roles

| ID | Empresa | Rol | Acciones |
|----|---------|-----|----------|
| 1 | **AngloAmerican** | Administrador | Crear, Enviar a Besalco, Cerrar |
| 2 | **Besalco** | Contratista | Tomar trabajo, Finalizar, Rechazar |
| 3 | **Linkapsis** | Validador Topográfico | Tomar trabajo, Validar, Rechazar |
| 4 | **LlayLlay** | Validador Densidad | Tomar trabajo, Validar, Rechazar |

---

## Flujo Detallado por Empresa

### 1. AngloAmerican (Creación)

**Modal**: `crear-cancha-modal`

**Acciones disponibles**:
- ✅ Crear nueva cancha
- ✅ Enviar a Besalco (cambia a En Espera para Besalco)
- ✅ Ver canchas Validadas
- ✅ Cerrar cancha (cuando tiene ambas validaciones)
- ✅ Borrar cancha (solo si está en estado Creada)

**Flujo**:
```
Crear Cancha → [Creada] → Enviar a Besalco → [En Espera para Besalco]
```

---

### 2. Besalco (Ejecución del Trabajo)

**Modal**: `validacion-besalco-modal`

**Campos del formulario**:
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| Observaciones | textarea | ✅ | Descripción del trabajo realizado |
| Maquinarias | text | ❌ | Lista de maquinarias utilizadas (separadas por coma) |
| Foto | file | ❌ | Foto de respaldo del trabajo |

**Acciones disponibles**:
- ✅ Tomar Trabajo (cambia de En Espera → En Proceso)
- ✅ Finalizar Trabajo (crea validación, pasa a Linkapsis)
- ✅ Rechazar Trabajo (devuelve a AngloAmerican con observaciones)

**Flujo**:
```
[En Espera] → Tomar Trabajo → [En Proceso] 
    → Finalizar → [En Espera para Linkapsis]
    → Rechazar → [Rechazada en Espera para Anglo]
```

**Datos guardados en validación**:
```json
{
  "observaciones": "Trabajo completado según especificaciones...",
  "mediciones": {
    "maquinarias": "Rodillo CAT-001, Motoniveladora MN-15"
  }
}
```

---

### 3. Linkapsis (Validación Topográfica)

**Modal**: `validacion-linkapsis-modal`

**Campos del formulario**:
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| Observaciones | textarea | ✅ | Observaciones de la validación |
| Espesor | number (metros) | ✅ | Medición del espesor (ej: 0.03) |
| Tipo de Depósito | radio | ❌ | Hidráulico o Mecánico |
| Tipo de Trabajo | radio | ❌ | Corte, Relleno o Mejoramiento y Sello |
| Coordenadas P1-P4 | numbers | ❌ | Norte, Este, Cota para cada punto |
| Foto | file | ❌ | Foto de respaldo |

**Acciones disponibles**:
- ✅ Tomar Trabajo
- ✅ Validar (aprueba y pasa a LlayLlay)
- ✅ Rechazar (devuelve a Besalco con observaciones)

**Flujo**:
```
[En Espera] → Tomar Trabajo → [En Proceso]
    → Validar → [Validada Linkapsis + En Espera para LlayLlay]
    → Rechazar → [Rechazada en Espera para Besalco]
```

**Datos guardados en validación**:
```json
{
  "observaciones": "Espesor dentro de tolerancia...",
  "mediciones": {
    "espesor": 0.03,
    "unidad": "metros",
    "tipoDeposito": "hidraulico",
    "tipoTrabajo": "corte",
    "coordenadas": {
      "p1": { "norte": 1234.567, "este": 9876.543, "cota": 123.45 },
      "p2": { ... },
      "p3": { ... },
      "p4": { ... }
    },
    "isRevalidacion": false
  }
}
```

---

### 4. LlayLlay (Validación de Densidad)

**Modal**: `validacion-llayllay-modal`

**Campos del formulario**:
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| Observaciones | textarea | ✅ | Observaciones de la validación |
| Densidad | number (%) | ✅ | Porcentaje de densidad (ej: 95.5) |
| Número de Ficha | text | ❌ | Número interno de ficha LlayLlay |
| Foto | file | ❌ | Foto de respaldo |

**Acciones disponibles**:
- ✅ Tomar Trabajo
- ✅ Validar (aprueba, cancha lista para cierre)
- ✅ Rechazar (devuelve a Linkapsis con observaciones)

**Flujo**:
```
[En Espera] → Tomar Trabajo → [En Proceso]
    → Validar → [Validada Completa - Lista para Cierre]
    → Rechazar → [Rechazada en Espera para Linkapsis]
```

**Datos guardados en validación**:
```json
{
  "observaciones": "Densidad cumple especificación...",
  "mediciones": {
    "densidad": 95.5,
    "unidad": "%",
    "numeroFicha": "F-2024-0123",
    "isRevalidacion": false
  }
}
```

---

## Ciclo de Rechazos y Revalidaciones

### Diagrama de Rechazos

```
                    ┌─── RECHAZO ────┐
                    ▼                │
AngloAmerican ◀── Besalco ──────────┤
                    ▲                │
                    └─── RECHAZO ────┤
                                     │
                    ┌─── RECHAZO ────┤
                    ▼                │
     Besalco ◀──── Linkapsis ───────┤
                    ▲                │
                    └─── RECHAZO ────┤
                                     │
                    ┌─── RECHAZO ────┘
                    ▼
    Linkapsis ◀── LlayLlay
```

### Estados Durante Rechazo

1. **Besalco rechaza** → Estado: `Rechazada en Espera (8)` para AngloAmerican
2. **Linkapsis rechaza** → Estado: `Rechazada en Espera (8)` para Besalco
3. **LlayLlay rechaza** → Estado: `Rechazada en Espera (8)` para Linkapsis

### Revalidación

Cuando una cancha es rechazada y corregida:
- Se marca `is_revalidacion: true` en la nueva validación
- Se mantiene historial de validaciones anteriores
- El flujo continúa desde donde se rechazó

---

## Modales y Formularios

### Ubicación en el código

```
src/pages/index.astro
├── Modal Crear Cancha (línea ~3200)
├── Modal Linkapsis (línea ~4100)
├── Modal LlayLlay (línea ~4900)
├── Modal Besalco (línea ~5040)
└── Modal Cerrar Cancha (línea ~5090)
```

### JavaScript de Procesamiento

```javascript
// Funciones principales (líneas ~7800-8200)
procesarValidacionBesalco(e)    // Finalizar trabajo Besalco
procesarRechazoBesalco(e)       // Rechazar trabajo Besalco
procesarValidacionLinkapsis(e)  // Validar Linkapsis
procesarRechazoLinkapsis(e)     // Rechazar Linkapsis
procesarValidacionLlayLlay(e)   // Validar LlayLlay
procesarRechazoLlayLlay(e)      // Rechazar LlayLlay
```

---

## Estructura de Datos

### Tabla: `canchas`

```sql
id                  SERIAL PRIMARY KEY
muro                VARCHAR
sector              INTEGER
relleno             VARCHAR
fecha               DATE
archivo             TEXT
foto                TEXT
estado_id           INTEGER REFERENCES estados(id)
empresa_actual_id   INTEGER REFERENCES empresas(id)
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### Tabla: `validaciones`

```sql
id                      SERIAL PRIMARY KEY
cancha_id               INTEGER REFERENCES canchas(id)
empresa_validadora_id   INTEGER REFERENCES empresas(id)
resultado               VARCHAR -- 'VALIDADO' | 'RECHAZADO' | 'FINALIZADO'
observaciones           TEXT
mediciones              JSONB   -- Datos específicos por empresa
is_revalidacion         BOOLEAN
usuario_validador       VARCHAR
usuario_validador_id    INTEGER
created_at              TIMESTAMP
```

### Estructura de `mediciones` (JSONB)

```typescript
interface MedicionData {
  // Linkapsis
  espesor?: number           // En metros
  tipoDeposito?: 'hidraulico' | 'mecanico'
  tipoTrabajo?: 'corte' | 'relleno' | 'mejoramiento_sello'
  coordenadas?: {
    p1: { norte, este, cota }
    p2: { norte, este, cota }
    p3: { norte, este, cota }
    p4: { norte, este, cota }
  }
  
  // LlayLlay
  densidad?: number          // En porcentaje
  numeroFicha?: string       // Número interno
  
  // Besalco
  maquinarias?: string       // Lista de maquinarias
  
  // Metadatos
  unidad?: string
  isRevalidacion?: boolean
}
```

---

## Fotos de Validación

### Almacenamiento

- **Bucket**: `validaciones-fotos` (Supabase Storage)
- **Ruta**: `{empresa}/cancha-{id}/validacion-{id}/{archivo}`
- **Límite**: 5MB por foto
- **Formatos**: JPEG, PNG, WebP

### Tabla: `validaciones_fotos`

```sql
id              SERIAL PRIMARY KEY
validacion_id   INTEGER REFERENCES validaciones(id)
storage_path    TEXT
storage_url     TEXT
nombre_archivo  VARCHAR
tipo_mime       VARCHAR
tamano_bytes    INTEGER
orden           INTEGER DEFAULT 1
empresa_id      INTEGER
cancha_id       INTEGER
created_at      TIMESTAMP
```

### Vistas Útiles

- `vista_fotos_reporte` - Para generar reportes PDF
- `vista_resumen_fotos_cancha` - Resumen de fotos por cancha

---

## API Endpoints

### Acciones de Cancha

```
POST /api/canchas/{id}/accion
Body: {
  accion: string,
  observaciones: string,
  mediciones?: object,
  usuario: string,
  empresa?: number
}
```

**Acciones disponibles**:
| Acción | Descripción |
|--------|-------------|
| `tomar_trabajo` | Empresa toma el trabajo |
| `enviar_besalco` | AngloAmerican envía a Besalco |
| `finalizar_besalco` | Besalco finaliza trabajo |
| `rechazar_besalco` | Besalco rechaza trabajo |
| `validar_linkapsis` | Linkapsis aprueba |
| `rechazar_linkapsis` | Linkapsis rechaza |
| `validar_llay_llay` | LlayLlay aprueba |
| `rechazar_llay_llay` | LlayLlay rechaza |
| `cerrar_cancha` | AngloAmerican cierra |
| `borrar_cancha` | AngloAmerican elimina |

### Fotos de Validación

```
POST /api/validaciones/{id}/fotos
Content-Type: multipart/form-data
Body: FormData con campo 'fotos'

Response: {
  success: true,
  subidas: [...],
  errores: [...]
}
```

---

## Archivos Principales

| Archivo | Descripción |
|---------|-------------|
| `src/pages/index.astro` | Frontend principal con todos los modales |
| `src/lib/supabase.ts` | CanchaService con lógica de negocio |
| `src/pages/api/canchas/[id]/accion.ts` | Endpoint de acciones |
| `src/pages/api/validaciones/[id]/fotos.ts` | Endpoint de fotos |

---

## Historial de Cambios

### v2.0 (23/12/2025)
- ✅ Sistema de fotos de validación
- ✅ Tipo de depósito (Hidráulico/Mecánico) en Linkapsis
- ✅ Tipo de trabajo cambiado a selección única
- ✅ Opción "Mejoramiento y Sello" agregada
- ✅ Densidad cambiada a porcentaje en LlayLlay
- ✅ Campo "Número de Ficha" en LlayLlay
- ✅ Campo "Maquinarias" en Besalco (preparado para futuro)

### v1.0 (Inicial)
- Sistema base de gestión de canchas
- Flujo de validación en 4 etapas
- Sistema de usuarios y roles
