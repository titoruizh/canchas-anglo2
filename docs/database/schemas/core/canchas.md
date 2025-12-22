# Tabla: canchas

## Propósito

Tabla principal del sistema que almacena todas las canchas gestionadas. Cada cancha representa un área de trabajo que fluye a través de diferentes estados y empresas según el proceso de validación.

## Schema

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | INTEGER | NO | nextval('canchas_id_seq1') | Identificador único (PK) |
| `nombre` | VARCHAR(100) | NO | - | Nombre completo de la cancha (UNIQUE) |
| `muro` | VARCHAR(50) | NO | - | Tipo de muro (MP, MS, MT, etc.) |
| `sector` | VARCHAR(50) | NO | - | Sector de la cancha (S1, S2, S3, etc.) |
| `nombre_detalle` | VARCHAR(50) | NO | - | Detalle adicional (TALUD, BERMA, PISTA, etc.) |
| `estado_actual_id` | INTEGER | YES | 1 | Estado actual de la cancha (FK → estados_cancha) |
| `empresa_actual_id` | INTEGER | YES | 1 | Empresa que tiene la cancha actualmente (FK → empresas) |
| `created_by` | INTEGER | YES | 1 | Empresa que creó la cancha (FK → empresas) |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | YES | NOW() | Fecha de última actualización (auto-actualizado) |
| `numero_informe` | INTEGER | YES | - | Número único de informe (UNIQUE) |
| `poligono_coordenadas` | JSONB | YES | - | Coordenadas del polígono de la cancha en formato GeoJSON |

## Relaciones

### Foreign Keys

- **estado_actual_id** → `estados_cancha.id`
  - Define el estado actual de la cancha
  - ON DELETE: NO ACTION
  
- **empresa_actual_id** → `empresas.id`
  - Define qué empresa tiene la cancha actualmente
  - ON DELETE: NO ACTION
  
- **created_by** → `empresas.id`
  - Registra qué empresa creó la cancha (normalmente AngloAmerican)
  - ON DELETE: NO ACTION

### Tablas que referencian a canchas

- `historial_cancha.cancha_id` (ON DELETE CASCADE)
- `validaciones.cancha_id` (ON DELETE CASCADE)
- `transiciones_estado.cancha_id` (ON DELETE CASCADE)

## Constraints

### Primary Key
- `canchas_pkey` en columna `id`

### Unique Constraints
- `canchas_nombre_key` - El nombre debe ser único
- `uk_canchas_numero_informe` - El número de informe debe ser único
- `unique_cancha_components` - La combinación (muro, sector, nombre_detalle) debe ser única

### Check Constraints
- NOT NULL en: id, nombre, muro, sector, nombre_detalle

## Índices

- `canchas_pkey` (PRIMARY KEY) en `id`
- `canchas_nombre_key` (UNIQUE) en `nombre`
- `uk_canchas_numero_informe` (UNIQUE) en `numero_informe`
- `unique_cancha_components` (UNIQUE) en `(muro, sector, nombre_detalle)`
- `idx_canchas_numero_informe` (INDEX) en `numero_informe`

## Triggers

### update_canchas_updated_at
- **Tipo**: BEFORE UPDATE
- **Función**: `update_updated_at_column()`
- **Propósito**: Actualiza automáticamente `updated_at` cuando se modifica un registro

### trigger_cambio_cancha
- **Tipo**: AFTER UPDATE
- **Función**: `registrar_cambio_cancha()`
- **Propósito**: Registra automáticamente cambios de estado/empresa en `historial_cancha`

## RLS Policies

- **Lectura**: `Permitir lectura de canchas` - FOR SELECT USING (true)
- **Escritura**: `Permitir operaciones en canchas` - FOR ALL USING (true)

## Uso Común

### Crear una cancha

```sql
INSERT INTO canchas (nombre, muro, sector, nombre_detalle, created_by)
VALUES ('MP_S5_TALUD', 'MP', 'S5', 'TALUD', 1);
```

### Obtener canchas con información completa

```sql
SELECT * FROM vista_canchas_completa
WHERE empresa_actual = 'Besalco';
```

### Cambiar estado de una cancha

```sql
UPDATE canchas
SET estado_actual_id = 3,  -- Finalizada
    empresa_actual_id = 2   -- Besalco
WHERE id = 1;
-- Esto automáticamente crea un registro en historial_cancha
```

### Buscar canchas por componentes

```sql
SELECT * FROM canchas
WHERE muro = 'MP' AND sector = 'S5';
```

## Notas Importantes

1. **Nombre Único**: El campo `nombre` se genera típicamente como `{muro}_{sector}_{nombre_detalle}`
2. **Número de Informe**: Se asigna automáticamente desde `contador_informes` cuando se necesita
3. **Polígono**: El campo `poligono_coordenadas` almacena GeoJSON para visualización en mapas
4. **Trazabilidad**: Todos los cambios de estado/empresa se registran automáticamente en `historial_cancha`
5. **Estados por Defecto**: Las canchas nuevas inician en estado 1 (Creada) y empresa 1 (AngloAmerican)

## Estados Posibles

1. **Creada** - Cancha recién creada por AngloAmerican
2. **En Proceso** - Besalco trabajando
3. **Finalizada** - Besalco terminó el trabajo
4. **Validada** - Validada por Linkapsis o LlayLlay
5. **Rechazada** - Rechazada, requiere retrabajo
6. **Cerrada** - Cerrada y firmada por AngloAmerican

## Flujo Típico

```
Creada (Anglo) → En Proceso (Besalco) → Finalizada (Besalco) 
→ Validada (Linkapsis) → Validada (LlayLlay) → Cerrada (Anglo)
                ↓ (si rechazo)
            Rechazada → vuelve a En Proceso
```

## Ver También

- [estados_cancha.md](./estados_cancha.md) - Estados posibles
- [empresas.md](./empresas.md) - Empresas del flujo
- [historial_cancha.md](./historial_cancha.md) - Trazabilidad
- [validaciones.md](./validaciones.md) - Validaciones
