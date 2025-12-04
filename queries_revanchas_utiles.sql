-- =====================================================
-- QUERIES ÚTILES - SISTEMA DE REVANCHAS
-- Para monitoreo, análisis y troubleshooting
-- =====================================================

-- =====================================================
-- 1. VERIFICACIÓN DE SISTEMA
-- =====================================================

-- 1.1 Verificar que todas las tablas existan
SELECT 
    'TABLAS' as tipo,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as total_columnas
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_name LIKE 'revanchas_%'
ORDER BY table_name;

-- 1.2 Verificar triggers activos
SELECT 
    'TRIGGERS' as tipo,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%revanchas%'
ORDER BY trigger_name;

-- 1.3 Verificar vistas creadas
SELECT 
    'VISTAS' as tipo,
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
    AND table_name LIKE 'vista_%revanchas%'
ORDER BY table_name;

-- 1.4 Verificar índices
SELECT 
    'ÍNDICES' as tipo,
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE '%revanchas%'
ORDER BY tablename, indexname;

-- =====================================================
-- 2. CONSULTAS DE MONITOREO
-- =====================================================

-- 2.1 Resumen general del sistema
SELECT 
    'RESUMEN GENERAL' as reporte,
    (SELECT COUNT(*) FROM revanchas_archivos) as total_archivos,
    (SELECT COUNT(*) FROM revanchas_mediciones) as total_mediciones,
    (SELECT COUNT(*) FROM revanchas_estadisticas) as archivos_con_stats,
    (SELECT COUNT(*) FROM revanchas_comparaciones) as total_comparaciones,
    (SELECT COUNT(DISTINCT muro) FROM revanchas_archivos) as muros_distintos,
    (SELECT MIN(fecha_medicion) FROM revanchas_archivos) as primera_medicion,
    (SELECT MAX(fecha_medicion) FROM revanchas_archivos) as ultima_medicion;

-- 2.2 Archivos por muro
SELECT 
    muro,
    COUNT(*) as total_archivos,
    MIN(fecha_medicion) as primera_fecha,
    MAX(fecha_medicion) as ultima_fecha,
    SUM(total_registros) as total_mediciones
FROM revanchas_archivos
GROUP BY muro
ORDER BY muro;

-- 2.3 Últimas 10 cargas
SELECT 
    id,
    muro,
    fecha_medicion,
    archivo_nombre,
    total_registros,
    array_length(sectores_incluidos, 1) as num_sectores,
    created_at
FROM revanchas_archivos
ORDER BY created_at DESC
LIMIT 10;

-- 2.4 Archivos sin estadísticas (problema con trigger)
SELECT 
    ra.id,
    ra.muro,
    ra.fecha_medicion,
    ra.archivo_nombre,
    ra.total_registros
FROM revanchas_archivos ra
LEFT JOIN revanchas_estadisticas re ON ra.id = re.archivo_id
WHERE re.id IS NULL;

-- 2.5 Mediciones por sector (última carga)
SELECT 
    sector,
    COUNT(*) as total_mediciones,
    AVG(revancha) as revancha_promedio,
    AVG(ancho) as ancho_promedio
FROM revanchas_mediciones
WHERE archivo_id = (SELECT id FROM revanchas_archivos ORDER BY created_at DESC LIMIT 1)
GROUP BY sector
ORDER BY sector;

-- =====================================================
-- 3. ANÁLISIS DE DATOS
-- =====================================================

-- 3.1 Evolución de Revancha promedio por muro
SELECT 
    ra.muro,
    ra.fecha_medicion,
    re.revancha_promedio,
    re.revancha_min,
    re.revancha_max
FROM revanchas_archivos ra
JOIN revanchas_estadisticas re ON ra.id = re.archivo_id
ORDER BY ra.muro, ra.fecha_medicion;

-- 3.2 Puntos críticos (Revancha < 3.0) en última medición
SELECT 
    ra.muro,
    ra.fecha_medicion,
    rm.sector,
    rm.pk,
    rm.revancha,
    rm.ancho,
    CASE 
        WHEN rm.revancha < 3.0 THEN 'ROJO'
        WHEN rm.revancha >= 3.0 AND rm.revancha <= 3.5 THEN 'AMARILLO'
        ELSE 'VERDE'
    END as clasificacion
FROM revanchas_mediciones rm
JOIN revanchas_archivos ra ON rm.archivo_id = ra.id
WHERE ra.id = (SELECT id FROM revanchas_archivos ORDER BY created_at DESC LIMIT 1)
    AND rm.revancha < 3.0
ORDER BY rm.revancha ASC;

-- 3.3 Top 10 sectores con menor Revancha (última medición de cada muro)
WITH ultimas_mediciones AS (
    SELECT DISTINCT ON (muro)
        id, muro, fecha_medicion
    FROM revanchas_archivos
    ORDER BY muro, fecha_medicion DESC
)
SELECT 
    um.muro,
    res.sector,
    res.revancha_min,
    res.revancha_pk_min as pk_critico,
    res.ancho_min
FROM ultimas_mediciones um
JOIN revanchas_estadisticas_sector res ON um.id = res.archivo_id
ORDER BY res.revancha_min ASC
LIMIT 10;

-- 3.4 Distribución de mediciones por rango de Revancha
SELECT 
    ra.muro,
    COUNT(*) FILTER (WHERE rm.revancha > 3.5) as verde,
    COUNT(*) FILTER (WHERE rm.revancha >= 3.0 AND rm.revancha <= 3.5) as amarillo,
    COUNT(*) FILTER (WHERE rm.revancha < 3.0) as rojo,
    COUNT(*) as total
FROM revanchas_archivos ra
JOIN revanchas_mediciones rm ON ra.id = rm.archivo_id
WHERE ra.id = (SELECT id FROM revanchas_archivos ORDER BY created_at DESC LIMIT 1)
GROUP BY ra.muro;

-- 3.5 Sectores con mayor variabilidad (std deviation)
SELECT 
    archivo_id,
    sector,
    COUNT(*) as num_mediciones,
    AVG(revancha) as revancha_promedio,
    STDDEV(revancha) as revancha_std,
    AVG(ancho) as ancho_promedio,
    STDDEV(ancho) as ancho_std
FROM revanchas_mediciones
WHERE archivo_id = (SELECT id FROM revanchas_archivos ORDER BY created_at DESC LIMIT 1)
GROUP BY archivo_id, sector
ORDER BY revancha_std DESC;

-- =====================================================
-- 4. COMPARACIONES Y TENDENCIAS
-- =====================================================

-- 4.1 Comparar últimas 2 mediciones de cada muro
WITH ultimas_dos AS (
    SELECT 
        muro,
        id,
        fecha_medicion,
        ROW_NUMBER() OVER (PARTITION BY muro ORDER BY fecha_medicion DESC) as rn
    FROM revanchas_archivos
)
SELECT 
    actual.muro,
    anterior.fecha_medicion as fecha_anterior,
    actual.fecha_medicion as fecha_actual,
    (actual.fecha_medicion - anterior.fecha_medicion) as dias_diferencia,
    re_anterior.revancha_promedio as revancha_anterior,
    re_actual.revancha_promedio as revancha_actual,
    (re_actual.revancha_promedio - re_anterior.revancha_promedio) as cambio_revancha
FROM ultimas_dos actual
JOIN ultimas_dos anterior ON actual.muro = anterior.muro AND anterior.rn = 2
JOIN revanchas_estadisticas re_actual ON actual.id = re_actual.archivo_id
JOIN revanchas_estadisticas re_anterior ON anterior.id = re_anterior.archivo_id
WHERE actual.rn = 1;

-- 4.2 Tendencia de Revancha por muro (últimas 6 mediciones)
WITH ultimas_seis AS (
    SELECT 
        muro,
        id,
        fecha_medicion,
        ROW_NUMBER() OVER (PARTITION BY muro ORDER BY fecha_medicion DESC) as rn
    FROM revanchas_archivos
)
SELECT 
    us.muro,
    us.fecha_medicion,
    re.revancha_promedio,
    re.revancha_min,
    re.revancha_max
FROM ultimas_seis us
JOIN revanchas_estadisticas re ON us.id = re.archivo_id
WHERE us.rn <= 6
ORDER BY us.muro, us.fecha_medicion;

-- 4.3 Puntos con mayor variación entre últimas 2 mediciones
WITH ultimas_dos AS (
    SELECT 
        muro,
        id,
        fecha_medicion,
        ROW_NUMBER() OVER (PARTITION BY muro ORDER BY fecha_medicion DESC) as rn
    FROM revanchas_archivos
)
SELECT 
    actual.muro,
    rm_actual.sector,
    rm_actual.pk,
    rm_anterior.revancha as revancha_anterior,
    rm_actual.revancha as revancha_actual,
    ABS(rm_actual.revancha - rm_anterior.revancha) as diferencia,
    CASE 
        WHEN ABS(rm_actual.revancha - rm_anterior.revancha) > 0.3 THEN 'ALERTA'
        ELSE 'NORMAL'
    END as estado
FROM ultimas_dos actual
JOIN ultimas_dos anterior ON actual.muro = anterior.muro AND anterior.rn = 2
JOIN revanchas_mediciones rm_actual ON rm_actual.archivo_id = actual.id
JOIN revanchas_mediciones rm_anterior 
    ON rm_anterior.archivo_id = anterior.id 
    AND rm_anterior.sector = rm_actual.sector 
    AND rm_anterior.pk = rm_actual.pk
WHERE actual.rn = 1
    AND ABS(rm_actual.revancha - rm_anterior.revancha) > 0.3
ORDER BY diferencia DESC
LIMIT 20;

-- =====================================================
-- 5. MANTENIMIENTO Y LIMPIEZA
-- =====================================================

-- 5.1 Eliminar archivo específico (y sus mediciones por CASCADE)
-- CUIDADO: Esto elimina permanentemente los datos
/*
DELETE FROM revanchas_archivos 
WHERE id = [ID_DEL_ARCHIVO];
*/

-- 5.2 Eliminar archivos de prueba (ejemplo: con "Test" en nombre)
/*
DELETE FROM revanchas_archivos 
WHERE archivo_nombre LIKE '%Test%';
*/

-- 5.3 Recalcular estadísticas manualmente (si trigger falló)
DO $$
DECLARE
    archivo_rec RECORD;
BEGIN
    FOR archivo_rec IN 
        SELECT id FROM revanchas_archivos 
        WHERE id NOT IN (SELECT archivo_id FROM revanchas_estadisticas)
    LOOP
        -- Eliminar y recalcular
        DELETE FROM revanchas_estadisticas WHERE archivo_id = archivo_rec.id;
        DELETE FROM revanchas_estadisticas_sector WHERE archivo_id = archivo_rec.id;
        
        -- Trigger se ejecutará automáticamente al insertar mediciones
        -- Si no, ejecutar función manualmente:
        PERFORM calcular_estadisticas_archivo();
    END LOOP;
END $$;

-- 5.4 Verificar integridad de datos
SELECT 
    'INTEGRIDAD' as tipo,
    COUNT(*) as archivos_huerfanos
FROM revanchas_mediciones rm
WHERE NOT EXISTS (
    SELECT 1 FROM revanchas_archivos ra WHERE ra.id = rm.archivo_id
);

-- 5.5 Espacio usado por tablas
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public' 
    AND tablename LIKE 'revanchas_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- 6. EXPORTACIÓN DE DATOS
-- =====================================================

-- 6.1 Exportar última medición completa (para Excel/CSV)
SELECT 
    ra.muro,
    ra.fecha_medicion,
    rm.sector,
    rm.pk,
    rm.coronamiento,
    rm.revancha,
    rm.lama,
    rm.ancho,
    rm.geomembrana,
    rm.dist_geo_lama,
    rm.dist_geo_coronamiento,
    CASE 
        WHEN rm.revancha > 3.5 THEN 'VERDE'
        WHEN rm.revancha >= 3.0 THEN 'AMARILLO'
        ELSE 'ROJO'
    END as clasificacion_revancha,
    CASE 
        WHEN rm.ancho > 18 THEN 'VERDE'
        WHEN rm.ancho >= 15 THEN 'AMARILLO'
        ELSE 'ROJO'
    END as clasificacion_ancho
FROM revanchas_archivos ra
JOIN revanchas_mediciones rm ON ra.id = rm.archivo_id
WHERE ra.id = (SELECT id FROM revanchas_archivos ORDER BY created_at DESC LIMIT 1)
ORDER BY rm.sector, rm.pk;

-- 6.2 Exportar resumen estadístico para reporte
SELECT 
    ra.muro,
    ra.fecha_medicion,
    ra.archivo_nombre,
    ra.total_registros,
    res.sector,
    res.revancha_min,
    res.revancha_pk_min,
    res.revancha_max,
    res.revancha_pk_max,
    res.ancho_min,
    res.ancho_pk_min,
    res.ancho_max,
    res.ancho_pk_max
FROM revanchas_archivos ra
JOIN revanchas_estadisticas_sector res ON ra.id = res.archivo_id
WHERE ra.id = (SELECT id FROM revanchas_archivos ORDER BY created_at DESC LIMIT 1)
ORDER BY res.sector;

-- =====================================================
-- 7. DEBUGGING Y TROUBLESHOOTING
-- =====================================================

-- 7.1 Ver últimas 20 operaciones en logs (requiere pg_stat_statements)
/*
SELECT 
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements
WHERE query LIKE '%revanchas%'
ORDER BY total_time DESC
LIMIT 20;
*/

-- 7.2 Ver locks activos en tablas de revanchas
SELECT 
    pg_class.relname,
    pg_locks.locktype,
    pg_locks.mode,
    pg_locks.granted,
    pg_stat_activity.query,
    pg_stat_activity.state
FROM pg_locks
JOIN pg_class ON pg_locks.relation = pg_class.oid
JOIN pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid
WHERE pg_class.relname LIKE 'revanchas_%';

-- 7.3 Ver procesos activos en tablas de revanchas
SELECT 
    pid,
    usename,
    application_name,
    state,
    query,
    query_start
FROM pg_stat_activity
WHERE query LIKE '%revanchas_%'
    AND state != 'idle';

-- =====================================================
-- 8. ALERTAS Y NOTIFICACIONES (BASE PARA IMPLEMENTAR)
-- =====================================================

-- 8.1 Crear vista de alertas críticas
CREATE OR REPLACE VIEW vista_alertas_criticas AS
WITH ultima_medicion_por_muro AS (
    SELECT DISTINCT ON (muro)
        id, muro, fecha_medicion
    FROM revanchas_archivos
    ORDER BY muro, fecha_medicion DESC
)
SELECT 
    um.muro,
    um.fecha_medicion,
    rm.sector,
    rm.pk,
    rm.revancha,
    rm.ancho,
    rm.dist_geo_coronamiento,
    CASE 
        WHEN rm.revancha < 3.0 THEN 'REVANCHA CRÍTICA'
        WHEN rm.ancho < 15 THEN 'ANCHO CRÍTICO'
        WHEN rm.dist_geo_coronamiento < 0.5 THEN 'DIST GEO CRÍTICA'
        ELSE 'NORMAL'
    END as tipo_alerta
FROM ultima_medicion_por_muro um
JOIN revanchas_mediciones rm ON um.id = rm.archivo_id
WHERE rm.revancha < 3.0 
    OR rm.ancho < 15 
    OR rm.dist_geo_coronamiento < 0.5
ORDER BY rm.revancha ASC, rm.ancho ASC;

-- 8.2 Consultar alertas críticas actuales
SELECT * FROM vista_alertas_criticas;

-- 8.3 Contar alertas por tipo
SELECT 
    tipo_alerta,
    COUNT(*) as total
FROM vista_alertas_criticas
GROUP BY tipo_alerta
ORDER BY total DESC;

-- =====================================================
-- FIN DE QUERIES ÚTILES
-- =====================================================

-- Para usar estas queries:
-- 1. Copiar la query que necesites
-- 2. Pegar en Supabase SQL Editor
-- 3. Ejecutar con "Run" (▶️)
-- 4. Ver resultados en la tabla de output

-- Nota: Algunas queries están comentadas (/* */) porque son
-- operaciones destructivas o requieren extensiones especiales.
-- Descomenta solo si sabes lo que estás haciendo.
