-- =====================================================
-- SISTEMA DE PKS GEORREFERENCIADOS Y VISUALIZACIÓN DE REVANCHAS
-- =====================================================
-- Fecha: Diciembre 2024
-- Descripción: Sistema completo para georreferenciar PKs del tranque 
--              y visualizar revanchas en Mapbox con colores según estado
--
-- COMPONENTES:
-- 1. Tabla pks_maestro (138 PKs con coordenadas UTM → WGS84)
-- 2. Función normalizar_pk() para manejar formatos irregulares
-- 3. Vista vista_revanchas_georreferenciadas (JOIN inteligente)
-- 4. Vista vista_ultimas_revanchas_geo (solo mediciones más recientes)
-- 5. Vista vista_resumen_revanchas_geo (estadísticas por muro/fecha)
--
-- DISTRIBUCIÓN DE PKs:
-- - Muro Principal: 73 PKs (0+000 a 1+434)
-- - Muro Este: 29 PKs (0+000 a 0+551)
-- - Muro Oeste: 36 PKs (0+000 a 0+690)
-- TOTAL: 138 PKs georreferenciados
-- =====================================================


-- =====================================================
-- PASO 1: CREAR TABLA pks_maestro
-- =====================================================
-- Almacena los puntos fijos georreferenciados de cada muro
-- con coordenadas UTM Zona 19S convertidas a WGS84

CREATE TABLE IF NOT EXISTS pks_maestro (
    id BIGSERIAL PRIMARY KEY,
    muro VARCHAR(50) NOT NULL CHECK (muro IN ('Principal', 'Este', 'Oeste')),
    pk VARCHAR(20) NOT NULL,
    utm_x NUMERIC(12,3) NOT NULL,
    utm_y NUMERIC(12,3) NOT NULL,
    lon NUMERIC(12,8),
    lat NUMERIC(12,8),
    activo BOOLEAN DEFAULT TRUE,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(muro, pk)
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_pks_maestro_muro ON pks_maestro(muro);
CREATE INDEX IF NOT EXISTS idx_pks_maestro_pk ON pks_maestro(pk);
CREATE INDEX IF NOT EXISTS idx_pks_maestro_activo ON pks_maestro(activo);

COMMENT ON TABLE pks_maestro IS 'Tabla maestra de PKs georreferenciados con coordenadas UTM y WGS84';
COMMENT ON COLUMN pks_maestro.utm_x IS 'Coordenada Este UTM Zona 19S (metros)';
COMMENT ON COLUMN pks_maestro.utm_y IS 'Coordenada Norte UTM Zona 19S (metros)';
COMMENT ON COLUMN pks_maestro.lon IS 'Longitud WGS84 (grados decimales)';
COMMENT ON COLUMN pks_maestro.lat IS 'Latitud WGS84 (grados decimales)';


-- =====================================================
-- PASO 2: FUNCIÓN utm_to_wgs84()
-- =====================================================
-- Convierte coordenadas UTM a WGS84 usando fórmulas de Transverse Mercator Inverse
-- Zona: 19S, Hemisferio: Sur, Datum: WGS84

CREATE OR REPLACE FUNCTION utm_to_wgs84(
    utm_x NUMERIC,
    utm_y NUMERIC,
    zona INTEGER DEFAULT 19,
    hemisferio VARCHAR DEFAULT 'S'
)
RETURNS TABLE(lon NUMERIC, lat NUMERIC) AS $$
DECLARE
    a CONSTANT NUMERIC := 6378137.0;
    f CONSTANT NUMERIC := 1.0 / 298.257223563;
    e2 NUMERIC;
    e NUMERIC;
    e_prima NUMERIC;
    k0 CONSTANT NUMERIC := 0.9996;
    E0 CONSTANT NUMERIC := 500000.0;
    N0 NUMERIC;
    lon0 NUMERIC;
    x NUMERIC;
    y NUMERIC;
    M NUMERIC;
    mu NUMERIC;
    phi1 NUMERIC;
    C1 NUMERIC;
    T1 NUMERIC;
    N1 NUMERIC;
    R1 NUMERIC;
    D NUMERIC;
    phi NUMERIC;
    lambda NUMERIC;
    lon_out NUMERIC;
    lat_out NUMERIC;
BEGIN
    e2 := 2 * f - f * f;
    e := SQRT(e2);
    e_prima := e / SQRT(1 - e2);
    
    IF hemisferio = 'S' THEN
        N0 := 10000000.0;
    ELSE
        N0 := 0.0;
    END IF;
    
    lon0 := (zona - 1) * 6 - 180 + 3;
    
    x := utm_x - E0;
    y := utm_y - N0;
    
    M := y / k0;
    mu := M / (a * (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256));
    
    phi1 := mu + 
           (3*e/2 - 27*e*e*e/32) * SIN(2*mu) +
           (21*e*e/16 - 55*e*e*e*e/32) * SIN(4*mu) +
           (151*e*e*e/96) * SIN(6*mu);
    
    C1 := e_prima * e_prima * COS(phi1) * COS(phi1);
    T1 := TAN(phi1) * TAN(phi1);
    N1 := a / SQRT(1 - e2 * SIN(phi1) * SIN(phi1));
    R1 := a * (1 - e2) / POWER(1 - e2 * SIN(phi1) * SIN(phi1), 1.5);
    D := x / (N1 * k0);
    
    phi := phi1 - (N1 * TAN(phi1) / R1) * 
           (D*D/2 - (5 + 3*T1 + 10*C1 - 4*C1*C1 - 9*e_prima*e_prima) * D*D*D*D/24 +
            (61 + 90*T1 + 298*C1 + 45*T1*T1 - 252*e_prima*e_prima - 3*C1*C1) * D*D*D*D*D*D/720);
    
    lambda := (D - (1 + 2*T1 + C1) * D*D*D/6 +
              (5 - 2*C1 + 28*T1 - 3*C1*C1 + 8*e_prima*e_prima + 24*T1*T1) * D*D*D*D*D/120) / COS(phi1);
    
    lon_out := lon0 + lambda * 180.0 / PI();
    lat_out := phi * 180.0 / PI();
    
    RETURN QUERY SELECT lon_out, lat_out;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION utm_to_wgs84 IS 'Convierte coordenadas UTM Zona 19S a WGS84 (lon, lat)';


-- =====================================================
-- PASO 3: INSERTAR LOS 138 PKs CON CONVERSIÓN AUTOMÁTICA
-- =====================================================
-- Inserta todos los PKs con coordenadas UTM y convierte a WGS84

INSERT INTO pks_maestro (muro, pk, utm_x, utm_y, lon, lat) 
SELECT 
    muro,
    pk,
    utm_x,
    utm_y,
    (SELECT lon FROM utm_to_wgs84(utm_x, utm_y, 19, 'S')),
    (SELECT lat FROM utm_to_wgs84(utm_x, utm_y, 19, 'S'))
FROM (VALUES
    -- MURO PRINCIPAL (73 PKs)
    ('Principal', '0+000', 337997.913, 6334753.227),
    ('Principal', '0+020', 337979.647, 6334745.096),
    ('Principal', '0+040', 337961.381, 6334736.965),
    ('Principal', '0+060', 337943.115, 6334728.834),
    ('Principal', '0+080', 337924.848, 6334720.704),
    ('Principal', '0+100', 337906.582, 6334712.573),
    ('Principal', '0+120', 337888.316, 6334704.442),
    ('Principal', '0+140', 337870.050, 6334696.311),
    ('Principal', '0+160', 337851.784, 6334688.180),
    ('Principal', '0+180', 337833.518, 6334680.049),
    ('Principal', '0+200', 337815.251, 6334671.919),
    ('Principal', '0+220', 337796.985, 6334663.788),
    ('Principal', '0+240', 337778.719, 6334655.657),
    ('Principal', '0+260', 337760.453, 6334647.526),
    ('Principal', '0+280', 337742.187, 6334639.395),
    ('Principal', '0+300', 337723.921, 6334631.264),
    ('Principal', '0+320', 337705.655, 6334623.134),
    ('Principal', '0+340', 337687.388, 6334615.003),
    ('Principal', '0+360', 337669.122, 6334606.872),
    ('Principal', '0+380', 337650.856, 6334598.741),
    ('Principal', '0+400', 337632.590, 6334590.610),
    ('Principal', '0+420', 337614.324, 6334582.479),
    ('Principal', '0+440', 337596.058, 6334574.349),
    ('Principal', '0+460', 337577.792, 6334566.218),
    ('Principal', '0+480', 337559.525, 6334558.087),
    ('Principal', '0+500', 337541.259, 6334549.956),
    ('Principal', '0+520', 337522.993, 6334541.825),
    ('Principal', '0+540', 337504.727, 6334533.694),
    ('Principal', '0+560', 337486.461, 6334525.564),
    ('Principal', '0+580', 337468.195, 6334517.433),
    ('Principal', '0+600', 337449.928, 6334509.302),
    ('Principal', '0+620', 337431.662, 6334501.171),
    ('Principal', '0+640', 337413.396, 6334493.040),
    ('Principal', '0+660', 337395.130, 6334484.909),
    ('Principal', '0+680', 337376.864, 6334476.779),
    ('Principal', '0+700', 337358.598, 6334468.648),
    ('Principal', '0+720', 337340.332, 6334460.517),
    ('Principal', '0+740', 337322.065, 6334452.386),
    ('Principal', '0+760', 337303.799, 6334444.255),
    ('Principal', '0+780', 337285.533, 6334436.124),
    ('Principal', '0+800', 337267.267, 6334427.994),
    ('Principal', '0+820', 337249.001, 6334419.863),
    ('Principal', '0+840', 337230.735, 6334411.732),
    ('Principal', '0+860', 337212.469, 6334403.601),
    ('Principal', '0+880', 337194.202, 6334395.470),
    ('Principal', '0+900', 337175.936, 6334387.339),
    ('Principal', '0+920', 337157.670, 6334379.209),
    ('Principal', '0+940', 337139.404, 6334371.078),
    ('Principal', '0+960', 337121.138, 6334362.947),
    ('Principal', '0+980', 337102.872, 6334354.816),
    ('Principal', '1+000', 337084.605, 6334346.685),
    ('Principal', '1+020', 337066.339, 6334338.554),
    ('Principal', '1+040', 337048.073, 6334330.423),
    ('Principal', '1+060', 337029.807, 6334322.293),
    ('Principal', '1+080', 337011.541, 6334314.162),
    ('Principal', '1+100', 336993.275, 6334306.031),
    ('Principal', '1+120', 336975.009, 6334297.900),
    ('Principal', '1+140', 336956.742, 6334289.769),
    ('Principal', '1+160', 336938.476, 6334281.638),
    ('Principal', '1+180', 336920.210, 6334273.508),
    ('Principal', '1+200', 336901.944, 6334265.377),
    ('Principal', '1+220', 336883.678, 6334257.246),
    ('Principal', '1+240', 336865.412, 6334249.115),
    ('Principal', '1+260', 336847.146, 6334240.984),
    ('Principal', '1+280', 336828.879, 6334232.853),
    ('Principal', '1+300', 336810.613, 6334224.723),
    ('Principal', '1+320', 336792.347, 6334216.592),
    ('Principal', '1+340', 336774.081, 6334208.461),
    ('Principal', '1+360', 336755.815, 6334200.330),
    ('Principal', '1+380', 336737.549, 6334192.199),
    ('Principal', '1+400', 336719.282, 6334184.068),
    ('Principal', '1+420', 336701.016, 6334175.938),
    ('Principal', '1+434', 336688.230, 6334170.246),
    
    -- MURO OESTE (36 PKs)
    ('Oeste', '0+000', 336193.025, 6332549.931),
    ('Oeste', '0+020', 336203.229, 6332567.132),
    ('Oeste', '0+040', 336213.434, 6332584.333),
    ('Oeste', '0+060', 336223.638, 6332601.533),
    ('Oeste', '0+080', 336233.843, 6332618.734),
    ('Oeste', '0+100', 336244.047, 6332635.935),
    ('Oeste', '0+120', 336254.252, 6332653.136),
    ('Oeste', '0+140', 336264.456, 6332670.337),
    ('Oeste', '0+160', 336274.661, 6332687.537),
    ('Oeste', '0+180', 336284.865, 6332704.738),
    ('Oeste', '0+200', 336295.070, 6332721.939),
    ('Oeste', '0+220', 336305.274, 6332739.140),
    ('Oeste', '0+240', 336315.332, 6332756.425),
    ('Oeste', '0+260', 336323.065, 6332774.843),
    ('Oeste', '0+280', 336327.593, 6332794.300),
    ('Oeste', '0+300', 336328.788, 6332814.240),
    ('Oeste', '0+320', 336326.615, 6332834.098),
    ('Oeste', '0+340', 336323.504, 6332853.853),
    ('Oeste', '0+360', 336320.276, 6332873.589),
    ('Oeste', '0+380', 336316.090, 6332893.146),
    ('Oeste', '0+400', 336311.903, 6332912.703),
    ('Oeste', '0+420', 336307.716, 6332932.260),
    ('Oeste', '0+440', 336303.530, 6332951.817),
    ('Oeste', '0+460', 336299.344, 6332971.374),
    ('Oeste', '0+480', 336295.157, 6332990.931),
    ('Oeste', '0+500', 336290.780, 6333010.446),
    ('Oeste', '0+520', 336286.397, 6333029.960),
    ('Oeste', '0+540', 336282.014, 6333049.474),
    ('Oeste', '0+560', 336277.631, 6333068.988),
    ('Oeste', '0+580', 336273.247, 6333088.501),
    ('Oeste', '0+600', 336268.864, 6333108.015),
    ('Oeste', '0+620', 336264.481, 6333127.529),
    ('Oeste', '0+640', 336260.098, 6333147.043),
    ('Oeste', '0+660', 336255.715, 6333166.557),
    ('Oeste', '0+680', 336251.332, 6333186.070),
    ('Oeste', '0+690', 336249.167, 6333195.707),
    
    -- MURO ESTE (29 PKs)
    ('Este', '0+000', 340114.954, 6333743.678),
    ('Este', '0+020', 340104.134, 6333760.498),
    ('Este', '0+040', 340093.313, 6333777.319),
    ('Este', '0+060', 340082.493, 6333794.139),
    ('Este', '0+080', 340071.673, 6333810.959),
    ('Este', '0+100', 340060.853, 6333827.779),
    ('Este', '0+120', 340050.032, 6333844.600),
    ('Este', '0+140', 340039.212, 6333861.420),
    ('Este', '0+160', 340028.392, 6333878.240),
    ('Este', '0+180', 340017.572, 6333895.060),
    ('Este', '0+200', 340006.751, 6333911.881),
    ('Este', '0+220', 339995.931, 6333928.701),
    ('Este', '0+240', 339985.111, 6333945.521),
    ('Este', '0+260', 339974.290, 6333962.342),
    ('Este', '0+280', 339963.470, 6333979.162),
    ('Este', '0+300', 339952.650, 6333995.982),
    ('Este', '0+320', 339941.830, 6334012.802),
    ('Este', '0+340', 339931.009, 6334029.623),
    ('Este', '0+360', 339920.189, 6334046.443),
    ('Este', '0+380', 339909.369, 6334063.263),
    ('Este', '0+400', 339898.549, 6334080.084),
    ('Este', '0+420', 339887.728, 6334096.904),
    ('Este', '0+440', 339876.908, 6334113.724),
    ('Este', '0+460', 339866.088, 6334130.544),
    ('Este', '0+480', 339855.267, 6334147.365),
    ('Este', '0+500', 339844.447, 6334164.185),
    ('Este', '0+520', 339833.627, 6334181.005),
    ('Este', '0+540', 339822.807, 6334197.825),
    ('Este', '0+551', 339816.955, 6334206.922)
) AS datos(muro, pk, utm_x, utm_y)
ON CONFLICT (muro, pk) DO UPDATE SET
    utm_x = EXCLUDED.utm_x,
    utm_y = EXCLUDED.utm_y,
    lon = EXCLUDED.lon,
    lat = EXCLUDED.lat,
    updated_at = NOW();


-- =====================================================
-- PASO 4: FUNCIÓN normalizar_pk()
-- =====================================================
-- Normaliza PKs con decimales irregulares redondeando a metros enteros
-- Ejemplos:
--   0+550.800 → 0+551
--   0+689.88  → 0+690
--   0+000.00  → 0+000

CREATE OR REPLACE FUNCTION normalizar_pk(pk_original VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    kilometros VARCHAR;
    metros_str VARCHAR;
    metros_decimal NUMERIC;
    metros_redondeado INTEGER;
    resultado VARCHAR;
BEGIN
    -- Extraer kilómetros (parte antes del +)
    kilometros := SPLIT_PART(pk_original, '+', 1);
    
    -- Extraer metros (parte después del +)
    metros_str := SPLIT_PART(pk_original, '+', 2);
    
    -- Convertir a número y redondear
    metros_decimal := metros_str::NUMERIC;
    metros_redondeado := ROUND(metros_decimal)::INTEGER;
    
    -- Reconstruir con padding de 3 dígitos
    resultado := kilometros || '+' || LPAD(metros_redondeado::TEXT, 3, '0');
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION normalizar_pk IS 'Normaliza PKs con decimales irregulares (0+550.800 → 0+551)';


-- =====================================================
-- PASO 5: VISTA vista_revanchas_georreferenciadas
-- =====================================================
-- Vista principal que une revanchas_mediciones con pks_maestro
-- usando normalizar_pk() para manejar formatos irregulares

CREATE OR REPLACE VIEW vista_revanchas_georreferenciadas AS
SELECT 
    rm.id as medicion_id,
    ra.id as archivo_id,
    ra.pk as archivo_pk,
    ra.muro as archivo_muro,
    ra.fecha_medicion,
    ra.nombre_archivo as archivo_nombre,
    rm.sector,
    rm.pk,
    p.lon,
    p.lat,
    p.utm_x,
    p.utm_y,
    rm.coronamiento,
    rm.revancha,
    rm.lama,
    rm.ancho,
    rm.geomembrana,
    rm.dist_geo_lama,
    rm.dist_geo_coronamiento,
    
    -- Clasificación por colores (revancha)
    CASE 
        WHEN rm.revancha >= 3.5 THEN 'verde'
        WHEN rm.revancha >= 3.0 AND rm.revancha < 3.5 THEN 'amarillo'
        WHEN rm.revancha < 3.0 THEN 'rojo'
        ELSE NULL
    END as color_revancha,
    
    -- Clasificación por colores (ancho)
    CASE 
        WHEN rm.ancho >= 18.0 THEN 'verde'
        WHEN rm.ancho >= 15.0 AND rm.ancho < 18.0 THEN 'amarillo'
        WHEN rm.ancho < 15.0 THEN 'rojo'
        ELSE NULL
    END as color_ancho,
    
    -- Clasificación por colores (distancia geomembrana)
    CASE 
        WHEN rm.dist_geo_lama >= 1.0 THEN 'verde'
        WHEN rm.dist_geo_lama >= 0.5 AND rm.dist_geo_lama < 1.0 THEN 'amarillo'
        WHEN rm.dist_geo_lama < 0.5 THEN 'rojo'
        ELSE NULL
    END as color_dist_geo,
    
    ra.created_at,
    ra.usuario_id,
    
    -- Indicador de georreferenciación
    (p.id IS NOT NULL) as tiene_coordenadas
    
FROM revanchas_mediciones rm
INNER JOIN revanchas_archivos ra ON rm.archivo_id = ra.id
LEFT JOIN pks_maestro p ON (
    normalizar_pk(rm.pk) = p.pk 
    AND ra.muro = p.muro
)
ORDER BY ra.muro, ra.fecha_medicion DESC, rm.sector, rm.pk;

COMMENT ON VIEW vista_revanchas_georreferenciadas IS 
'Vista que une mediciones de revanchas con coordenadas georreferenciadas del maestro de PKs. Incluye clasificación por colores.';


-- =====================================================
-- PASO 6: VISTA vista_ultimas_revanchas_geo
-- =====================================================
-- Solo las mediciones más recientes de cada PK por muro

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
ORDER BY vrg.archivo_muro, vrg.sector, vrg.pk;

COMMENT ON VIEW vista_ultimas_revanchas_geo IS 
'Solo las mediciones más recientes de cada PK con coordenadas (usado para visualización en mapa)';


-- =====================================================
-- PASO 7: VISTA vista_resumen_revanchas_geo
-- =====================================================
-- Estadísticas agregadas por muro y fecha

CREATE OR REPLACE VIEW vista_resumen_revanchas_geo AS
SELECT 
    archivo_muro as muro,
    fecha_medicion,
    COUNT(*) as total_puntos,
    COUNT(CASE WHEN tiene_coordenadas THEN 1 END) as puntos_georreferenciados,
    COUNT(CASE WHEN color_revancha = 'rojo' THEN 1 END) as alertas_rojas_revancha,
    COUNT(CASE WHEN color_revancha = 'amarillo' THEN 1 END) as alertas_amarillas_revancha,
    AVG(revancha) as revancha_promedio,
    MIN(revancha) as revancha_min,
    MAX(revancha) as revancha_max,
    AVG(ancho) as ancho_promedio,
    MIN(lon) as lon_min,
    MAX(lon) as lon_max,
    MIN(lat) as lat_min,
    MAX(lat) as lat_max
FROM vista_revanchas_georreferenciadas
GROUP BY archivo_muro, fecha_medicion
ORDER BY fecha_medicion DESC, muro;

COMMENT ON VIEW vista_resumen_revanchas_geo IS 
'Resumen estadístico de revanchas georreferenciadas por muro y fecha';


-- =====================================================
-- VERIFICACIÓN: QUERIES ÚTILES
-- =====================================================

-- Ver total de PKs por muro
-- SELECT muro, COUNT(*) as total_pks 
-- FROM pks_maestro 
-- GROUP BY muro 
-- ORDER BY muro;

-- Ver resumen de georreferenciación
-- SELECT 
--     ra.muro,
--     COUNT(*) as total_mediciones,
--     COUNT(p.id) as con_coordenadas,
--     COUNT(*) - COUNT(p.id) as sin_coordenadas,
--     ROUND(COUNT(p.id)::NUMERIC / COUNT(*)::NUMERIC * 100, 2) as porcentaje
-- FROM revanchas_mediciones rm
-- INNER JOIN revanchas_archivos ra ON rm.archivo_id = ra.id
-- LEFT JOIN pks_maestro p ON (normalizar_pk(rm.pk) = p.pk AND ra.muro = p.muro)
-- GROUP BY ra.muro
-- ORDER BY ra.muro;

-- Ver últimas revanchas con coordenadas
-- SELECT * FROM vista_ultimas_revanchas_geo LIMIT 10;

-- Ver estadísticas por muro
-- SELECT * FROM vista_resumen_revanchas_geo;
