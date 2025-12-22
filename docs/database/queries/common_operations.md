# Queries Comunes

Colección de queries SQL útiles para operaciones frecuentes en el sistema.

## Sistema Core (Canchas)

### Listar todas las canchas con información completa

```sql
SELECT * FROM vista_canchas_completa
ORDER BY created_at DESC;
```

### Obtener canchas por empresa

```sql
SELECT * FROM vista_canchas_completa
WHERE empresa_actual = 'Besalco';
```

### Obtener canchas por estado

```sql
SELECT * FROM vista_canchas_completa
WHERE estado_actual = 'En Proceso';
```

### Buscar cancha por nombre

```sql
SELECT * FROM vista_canchas_completa
WHERE nombre = 'MP_S5_TALUD';
```

### Obtener historial completo de una cancha

```sql
SELECT * FROM vista_historial_completa
WHERE cancha_nombre = 'MP_S5_TALUD'
ORDER BY created_at DESC;
```

### Obtener transiciones de estado de una cancha

```sql
SELECT * FROM vista_transiciones_completa
WHERE cancha_nombre = 'MP_S5_TALUD'
ORDER BY created_at DESC;
```

### Contar canchas por estado

```sql
SELECT 
    ec.nombre as estado,
    COUNT(*) as total_canchas
FROM canchas c
JOIN estados_cancha ec ON c.estado_actual_id = ec.id
GROUP BY ec.nombre
ORDER BY total_canchas DESC;
```

### Contar canchas por empresa

```sql
SELECT 
    e.nombre as empresa,
    COUNT(*) as total_canchas
FROM canchas c
JOIN empresas e ON c.empresa_actual_id = e.id
GROUP BY e.nombre
ORDER BY total_canchas DESC;
```

### Obtener canchas creadas en un rango de fechas

```sql
SELECT * FROM vista_canchas_completa
WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY created_at DESC;
```

### Obtener canchas con validaciones pendientes

```sql
SELECT DISTINCT c.*
FROM vista_canchas_completa c
WHERE c.estado_actual = 'Finalizada';
```

## Sistema de Revanchas

### Obtener últimas mediciones georreferenciadas

```sql
SELECT * FROM vista_ultimas_revanchas_geo
ORDER BY archivo_muro, sector, pk;
```

### Obtener mediciones de un muro específico

```sql
SELECT * FROM vista_revanchas_georreferenciadas
WHERE archivo_muro = 'Principal'
ORDER BY fecha_medicion DESC, pk;
```

### Obtener mediciones con alertas rojas (revancha < 3.0)

```sql
SELECT * FROM vista_ultimas_revanchas_geo
WHERE color_revancha = 'rojo'
ORDER BY revancha ASC;
```

### Obtener mediciones con alertas amarillas (ancho < 18)

```sql
SELECT * FROM vista_ultimas_revanchas_geo
WHERE color_ancho = 'amarillo'
ORDER BY ancho ASC;
```

### Obtener resumen estadístico por muro

```sql
SELECT * FROM vista_resumen_revanchas_geo
ORDER BY fecha_medicion DESC, muro;
```

### Comparar última vs penúltima medición

```sql
SELECT * FROM vista_comparacion_ultimas_mediciones
WHERE muro = 'Principal'
ORDER BY sector, pk;
```

### Obtener archivos subidos por usuario

```sql
SELECT * FROM vista_revanchas_archivos
WHERE subido_por = 'Juan Pérez'
ORDER BY fecha_medicion DESC;
```

### Obtener mediciones de una fecha específica

```sql
SELECT * FROM vista_revanchas_georreferenciadas
WHERE fecha_medicion = '2024-12-15'
ORDER BY archivo_muro, sector, pk;
```

### Contar mediciones por muro

```sql
SELECT 
    ra.muro,
    COUNT(rm.id) as total_mediciones
FROM revanchas_archivos ra
JOIN revanchas_mediciones rm ON ra.id = rm.archivo_id
GROUP BY ra.muro
ORDER BY total_mediciones DESC;
```

### Obtener estadísticas globales de un archivo

```sql
SELECT 
    ra.muro,
    ra.fecha_medicion,
    re.revancha_min,
    re.revancha_max,
    re.revancha_promedio,
    re.ancho_min,
    re.ancho_max,
    re.ancho_promedio
FROM revanchas_archivos ra
JOIN revanchas_estadisticas re ON ra.id = re.archivo_id
WHERE ra.id = 1;
```

## Sistema de PKs

### Obtener todos los PKs activos

```sql
SELECT * FROM vista_pks_completa;
```

### Obtener PKs de un muro específico

```sql
SELECT * FROM pks_maestro
WHERE muro = 'Principal' AND activo = true
ORDER BY pk;
```

### Obtener resumen de PKs por muro

```sql
SELECT * FROM vista_pks_por_muro;
```

### Buscar PK más cercano a coordenadas UTM

```sql
SELECT 
    muro, 
    pk, 
    utm_x, 
    utm_y,
    SQRT(POWER(utm_x - 338000, 2) + POWER(utm_y - 6334750, 2)) as distancia_metros
FROM pks_maestro
WHERE activo = true
ORDER BY distancia_metros
LIMIT 1;
```

### Convertir coordenadas UTM a WGS84

```sql
SELECT * FROM utm_to_wgs84(337997.913, 6334753.227, 19, 'S');
```

### Normalizar formato de PK

```sql
SELECT normalizar_pk('0+550.800');  -- Retorna: '0+551'
```

## Sistema de Usuarios

### Listar todos los usuarios con empresa y rol

```sql
SELECT * FROM vista_usuarios_completa
ORDER BY empresa_nombre, rol_nombre, nombre_completo;
```

### Obtener usuarios de una empresa

```sql
SELECT * FROM vista_usuarios_completa
WHERE empresa_nombre = 'Besalco';
```

### Obtener usuarios activos

```sql
SELECT * FROM vista_usuarios_completa
WHERE activo = true
ORDER BY nombre_completo;
```

### Obtener usuarios por rol

```sql
SELECT * FROM vista_usuarios_completa
WHERE rol_nombre = 'Administrador'
ORDER BY empresa_nombre, nombre_completo;
```

### Contar usuarios por empresa

```sql
SELECT 
    e.nombre as empresa,
    COUNT(u.id) as total_usuarios,
    COUNT(CASE WHEN u.activo THEN 1 END) as usuarios_activos
FROM empresas e
LEFT JOIN usuarios u ON e.id = u.empresa_id
GROUP BY e.nombre
ORDER BY total_usuarios DESC;
```

## Reportes y Estadísticas

### Resumen general del sistema

```sql
SELECT 
    (SELECT COUNT(*) FROM canchas) as total_canchas,
    (SELECT COUNT(*) FROM usuarios WHERE activo = true) as usuarios_activos,
    (SELECT COUNT(*) FROM revanchas_archivos) as archivos_revanchas,
    (SELECT COUNT(*) FROM pks_maestro WHERE activo = true) as pks_activos;
```

### Actividad reciente (últimas 24 horas)

```sql
SELECT 
    'Canchas creadas' as tipo,
    COUNT(*) as cantidad
FROM canchas
WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
    'Archivos subidos' as tipo,
    COUNT(*) as cantidad
FROM revanchas_archivos
WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
    'Transiciones de estado' as tipo,
    COUNT(*) as cantidad
FROM transiciones_estado
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Canchas por muro y sector

```sql
SELECT 
    muro,
    sector,
    COUNT(*) as total_canchas,
    COUNT(CASE WHEN estado_actual_id = 6 THEN 1 END) as cerradas
FROM canchas
GROUP BY muro, sector
ORDER BY muro, sector;
```

### Tiempo promedio por estado

```sql
WITH transiciones_con_duracion AS (
    SELECT 
        t1.cancha_id,
        t1.estado_nuevo_id,
        t1.created_at as inicio,
        COALESCE(t2.created_at, NOW()) as fin,
        EXTRACT(EPOCH FROM (COALESCE(t2.created_at, NOW()) - t1.created_at)) / 3600 as horas
    FROM transiciones_estado t1
    LEFT JOIN transiciones_estado t2 ON t1.cancha_id = t2.cancha_id 
        AND t2.created_at > t1.created_at
        AND t2.id = (
            SELECT MIN(id) FROM transiciones_estado 
            WHERE cancha_id = t1.cancha_id AND created_at > t1.created_at
        )
)
SELECT 
    ec.nombre as estado,
    ROUND(AVG(horas)::numeric, 2) as horas_promedio,
    COUNT(*) as total_transiciones
FROM transiciones_con_duracion t
JOIN estados_cancha ec ON t.estado_nuevo_id = ec.id
GROUP BY ec.nombre
ORDER BY horas_promedio DESC;
```

## Validaciones y Auditoría

### Verificar integridad de foreign keys

```sql
-- Canchas sin estado válido
SELECT * FROM canchas c
WHERE NOT EXISTS (SELECT 1 FROM estados_cancha WHERE id = c.estado_actual_id);

-- Canchas sin empresa válida
SELECT * FROM canchas c
WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE id = c.empresa_actual_id);
```

### Verificar PKs duplicados

```sql
SELECT muro, pk, COUNT(*) as duplicados
FROM pks_maestro
GROUP BY muro, pk
HAVING COUNT(*) > 1;
```

### Verificar mediciones sin coordenadas

```sql
SELECT COUNT(*) as sin_coordenadas
FROM vista_revanchas_georreferenciadas
WHERE tiene_coordenadas = false;
```

## Ver También

- [reporting.md](./reporting.md) - Queries para reportes
- [debugging.md](./debugging.md) - Queries para debugging
- [../README.md](../README.md) - Documentación principal
