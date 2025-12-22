-- =====================================================
-- CORRECCIÓN: Vistas de Revanchas Georreferenciadas
-- =====================================================
-- Fecha: 2025-12-22
-- Objetivo: Recrear vistas para que funcione la visualización en mapa
-- =====================================================

-- PASO 1: Eliminar PKs con formato incorrecto
-- =====================================================
-- Estos PKs no pueden hacer match con pks_maestro
-- Ejemplos: "736.45", "0.05999999999994543", "2.75"

DELETE FROM revanchas_mediciones
WHERE pk !~ '^\d+\+\d+';

-- Verificar cuántos se eliminaron
-- SELECT COUNT(*) FROM revanchas_mediciones WHERE pk !~ '^\d+\+\d+';


-- PASO 2: Recrear vista_revanchas_georreferenciadas
-- =====================================================
-- Esta vista une mediciones con coordenadas de pks_maestro

DROP VIEW IF EXISTS vista_revanchas_georreferenciadas CASCADE;

CREATE OR REPLACE VIEW vista_revanchas_georreferenciadas AS
SELECT 
    rm.id as medicion_id,
    ra.id as archivo_id,
    ra.muro as archivo_muro,
    rm.sector,
    rm.pk,
    ra.fecha_medicion,
    
    -- Mediciones
    rm.coronamiento,
    rm.revancha,
    rm.lama,
    rm.ancho,
    rm.geomembrana,
    rm.dist_geo_lama,
    rm.dist_geo_coronamiento,
    
    -- Coordenadas desde pks_maestro
    pk.lat,
    pk.lon,
    pk.utm_x,
    pk.utm_y,
    
    -- Flag para saber si tiene coordenadas
    CASE 
        WHEN pk.lat IS NOT NULL AND pk.lon IS NOT NULL THEN true
        ELSE false
    END as tiene_coordenadas,
    
    -- Colores para visualización (revancha)
    CASE 
        WHEN rm.revancha >= 3.5 THEN 'verde'
        WHEN rm.revancha >= 3.0 AND rm.revancha < 3.5 THEN 'amarillo'
        WHEN rm.revancha < 3.0 THEN 'rojo'
        ELSE NULL
    END as color_revancha,
    
    -- Colores para visualización (ancho)
    CASE 
        WHEN rm.ancho >= 18.0 THEN 'verde'
        WHEN rm.ancho >= 15.0 AND rm.ancho < 18.0 THEN 'amarillo'
        WHEN rm.ancho < 15.0 THEN 'rojo'
        ELSE NULL
    END as color_ancho,
    
    -- Colores para visualización (distancia geomembrana)
    CASE 
        WHEN rm.dist_geo_lama >= 1.0 THEN 'verde'
        WHEN rm.dist_geo_lama >= 0.5 AND rm.dist_geo_lama < 1.0 THEN 'amarillo'
        WHEN rm.dist_geo_lama < 0.5 THEN 'rojo'
        ELSE NULL
    END as color_dist_geo,
    
    ra.archivo_nombre,
    rm.created_at,
    ra.usuario_id
    
FROM revanchas_mediciones rm
INNER JOIN revanchas_archivos ra ON rm.archivo_id = ra.id
LEFT JOIN pks_maestro pk ON 
    pk.muro = ra.muro 
    AND normalizar_pk(pk.pk) = normalizar_pk(rm.pk)
    AND pk.activo = true;

COMMENT ON VIEW vista_revanchas_georreferenciadas IS 
'Vista que une mediciones de revanchas con coordenadas georreferenciadas. Incluye clasificación por colores y flag tiene_coordenadas.';


-- PASO 3: Recrear vista_ultimas_revanchas_geo
-- =====================================================
-- Solo las mediciones más recientes de cada PK por muro

DROP VIEW IF EXISTS vista_ultimas_revanchas_geo CASCADE;

CREATE OR REPLACE VIEW vista_ultimas_revanchas_geo AS
WITH ultimas_mediciones AS (
    SELECT 
        archivo_muro,
        sector,
        pk,
        MAX(fecha_medicion) as fecha_ultima
    FROM vista_revanchas_georreferenciadas
    WHERE tiene_coordenadas = TRUE
    GROUP BY archivo_muro, sector, pk
)
SELECT 
    vrg.*
FROM vista_revanchas_georreferenciadas vrg
INNER JOIN ultimas_mediciones um ON (
    vrg.archivo_muro = um.archivo_muro
    AND vrg.sector = um.sector 
    AND vrg.pk = um.pk 
    AND vrg.fecha_medicion = um.fecha_ultima
)
WHERE vrg.tiene_coordenadas = TRUE
ORDER BY vrg.archivo_muro, vrg.sector, vrg.pk;

COMMENT ON VIEW vista_ultimas_revanchas_geo IS 
'Solo las mediciones más recientes de cada PK con coordenadas (usado para visualización en mapa)';


-- PASO 4: Verificación
-- =====================================================

-- Ver cuántas revanchas tienen coordenadas
SELECT 
    'Total con coordenadas' as metrica,
    COUNT(*) as cantidad
FROM vista_revanchas_georreferenciadas
WHERE tiene_coordenadas = true;

-- Ver cuántas revanchas ÚLTIMAS tienen coordenadas
SELECT 
    'Últimas con coordenadas' as metrica,
    COUNT(*) as cantidad
FROM vista_ultimas_revanchas_geo;

-- Ver distribución por muro
SELECT 
    archivo_muro,
    COUNT(*) as total_puntos
FROM vista_ultimas_revanchas_geo
GROUP BY archivo_muro
ORDER BY archivo_muro;

-- Ver ejemplo de datos
SELECT 
    archivo_muro,
    sector,
    pk,
    fecha_medicion,
    revancha,
    ancho,
    lat,
    lon,
    color_revancha,
    color_ancho
FROM vista_ultimas_revanchas_geo
LIMIT 10;
