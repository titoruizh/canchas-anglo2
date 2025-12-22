# Tabla: pks_maestro

## Propósito

Tabla maestra que almacena los 138 puntos fijos georreferenciados (Progressive Kilometers) del tranque. Cada PK tiene coordenadas UTM Zona 19S que se convierten automáticamente a WGS84 para visualización en mapas.

## Schema

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | INTEGER | NO | nextval('pks_maestro_id_seq') | Identificador único (PK) |
| `muro` | VARCHAR(50) | NO | - | Tipo de muro: 'Principal', 'Este', 'Oeste' |
| `pk` | VARCHAR(20) | NO | - | Progressive Kilometer (formato: 0+000, 0+020, etc.) |
| `utm_x` | NUMERIC(12,3) | NO | - | Coordenada Este (X) en UTM Zona 19S (metros) |
| `utm_y` | NUMERIC(12,3) | NO | - | Coordenada Norte (Y) en UTM Zona 19S (metros) |
| `utm_zona` | INTEGER | YES | 19 | Zona UTM (siempre 19 para este proyecto) |
| `utm_hemisferio` | CHAR(1) | YES | 'S' | Hemisferio UTM ('S' para Sur) |
| `lon` | NUMERIC(10,7) | YES | - | Longitud WGS84 (calculada automáticamente) |
| `lat` | NUMERIC(10,7) | YES | - | Latitud WGS84 (calculada automáticamente) |
| `descripcion` | TEXT | YES | - | Descripción opcional del PK |
| `activo` | BOOLEAN | YES | TRUE | Si el PK está activo |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | YES | NOW() | Fecha de última actualización |

## Distribución de PKs

- **Muro Principal**: 73 PKs (0+000 a 1+434)
- **Muro Este**: 29 PKs (0+000 a 0+551)
- **Muro Oeste**: 36 PKs (0+000 a 0+690)
- **TOTAL**: 138 PKs georreferenciados

## Relaciones

### Uso en Otras Tablas

Los PKs se utilizan para georreferenciar mediciones de revanchas:
- `vista_revanchas_georreferenciadas` hace JOIN con `pks_maestro` usando `normalizar_pk()`

## Constraints

### Primary Key
- `pks_maestro_pkey` en columna `id`

### Unique Constraints
- `unique_muro_pk` - La combinación (muro, pk) debe ser única

### Check Constraints
- `check_muro_pk` - muro debe ser 'Principal', 'Este', o 'Oeste'
- `check_utm_x` - utm_x debe estar entre 200,000 y 800,000
- `check_utm_y` - utm_y debe estar entre 6,000,000 y 7,000,000

## Índices

- `pks_maestro_pkey` (PRIMARY KEY) en `id`
- `unique_muro_pk` (UNIQUE) en `(muro, pk)`
- `idx_pks_muro_pk` (INDEX) en `(muro, pk)`
- `idx_pks_utm_coords` (INDEX) en `(utm_x, utm_y)`
- `idx_pks_wgs84_coords` (INDEX) en `(lon, lat)`
- `idx_pks_activo` (INDEX) en `activo` WHERE activo = true

## Triggers

### trigger_calcular_wgs84
- **Tipo**: BEFORE INSERT OR UPDATE
- **Función**: `calcular_wgs84_pks()`
- **Propósito**: Calcula automáticamente lon/lat desde utm_x/utm_y

## Funciones Relacionadas

### utm_to_wgs84()
Convierte coordenadas UTM Zona 19S a WGS84 (lon, lat).

```sql
SELECT * FROM utm_to_wgs84(337997.913, 6334753.227, 19, 'S');
-- Retorna: lon, lat en WGS84
```

### normalizar_pk()
Normaliza PKs con decimales irregulares redondeando a metros enteros.

```sql
SELECT normalizar_pk('0+550.800');  -- Retorna: '0+551'
SELECT normalizar_pk('0+689.88');   -- Retorna: '0+690'
```

## Uso Común

### Obtener todos los PKs de un muro

```sql
SELECT * FROM pks_maestro
WHERE muro = 'Principal' AND activo = true
ORDER BY pk;
```

### Obtener PKs con coordenadas WGS84

```sql
SELECT muro, pk, lon, lat
FROM pks_maestro
WHERE activo = true;
```

### Insertar un nuevo PK (coordenadas WGS84 se calculan automáticamente)

```sql
INSERT INTO pks_maestro (muro, pk, utm_x, utm_y)
VALUES ('Principal', '0+000', 337997.913, 6334753.227);
-- lon y lat se calculan automáticamente via trigger
```

### Buscar PK más cercano a coordenadas UTM

```sql
SELECT muro, pk, utm_x, utm_y,
       SQRT(POWER(utm_x - 338000, 2) + POWER(utm_y - 6334750, 2)) as distancia
FROM pks_maestro
WHERE activo = true
ORDER BY distancia
LIMIT 1;
```

## Vistas Relacionadas

### vista_pks_completa
PKs activos ordenados por muro y pk.

```sql
SELECT * FROM vista_pks_completa;
```

### vista_pks_por_muro
Resumen estadístico de PKs por muro.

```sql
SELECT * FROM vista_pks_por_muro;
-- Muestra: total_pks, pk_inicial, pk_final, rangos UTM por muro
```

### vista_revanchas_georreferenciadas
Mediciones de revanchas con coordenadas de PKs.

```sql
SELECT * FROM vista_revanchas_georreferenciadas
WHERE archivo_muro = 'Principal';
```

## Notas Importantes

1. **Conversión Automática**: Las coordenadas WGS84 (lon, lat) se calculan automáticamente al insertar/actualizar
2. **Zona UTM Fija**: Siempre se usa Zona 19S para este proyecto
3. **Formato PK**: El formato estándar es `K+MMM` donde K es kilómetro y MMM son metros (ej: 0+000, 0+020, 1+434)
4. **Normalización**: La función `normalizar_pk()` maneja PKs con decimales irregulares
5. **Georreferenciación**: Los PKs se usan para asignar coordenadas a mediciones de revanchas

## Rangos de Coordenadas

### Muro Principal
- UTM X: 336,688 a 337,998 metros
- UTM Y: 6,334,170 a 6,334,753 metros
- Longitud: ~-70.54° a -70.53°
- Latitud: ~-22.86° a -22.85°

### Muro Este
- UTM X: 339,816 a 340,115 metros
- UTM Y: 6,333,743 a 6,334,207 metros

### Muro Oeste
- UTM X: 336,193 a 336,328 metros
- UTM Y: 6,332,549 a 6,333,195 metros

## Ver También

- [../../functions/utm_to_wgs84.md](../../functions/utm_to_wgs84.md) - Función de conversión
- [../../functions/normalizar_pk.md](../../functions/normalizar_pk.md) - Normalización de PKs
- [../../views/vista_revanchas_georreferenciadas.md](../../views/vista_revanchas_georreferenciadas.md) - Uso en revanchas
