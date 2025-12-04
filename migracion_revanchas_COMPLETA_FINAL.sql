-- =====================================================
-- PLAN DE MIGRACIÓN: SISTEMA DE REVANCHAS - VERSIÓN FINAL
-- Sistema de Gestión de Canchas - AngloAmerican
-- Fecha: 2024-12-04
-- COMPLETO CON TRIGGERS FUNCIONANDO
-- =====================================================

-- =====================================================
-- FASE 1: CREAR NUEVAS TABLAS (SIN AFECTAR EXISTENTES)
-- =====================================================

-- 1.1 Tabla para almacenar metadata de archivos de revanchas subidos
CREATE TABLE IF NOT EXISTS revanchas_archivos (
    id SERIAL PRIMARY KEY,
    muro VARCHAR(50) NOT NULL, -- 'Principal', 'Este', 'Oeste'
    fecha_medicion DATE NOT NULL, -- Fecha extraída del archivo
    archivo_nombre VARCHAR(255) NOT NULL,
    archivo_tipo VARCHAR(10) NOT NULL, -- 'CSV' o 'XLSX'
    total_registros INTEGER NOT NULL,
    sectores_incluidos TEXT[], -- Array de sectores encontrados
    usuario_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_muro_fecha UNIQUE (muro, fecha_medicion),
    CONSTRAINT check_muro CHECK (muro IN ('Principal', 'Este', 'Oeste')),
    CONSTRAINT check_archivo_tipo CHECK (archivo_tipo IN ('CSV', 'XLSX'))
);

-- 1.2 Tabla para almacenar mediciones individuales de revanchas
CREATE TABLE IF NOT EXISTS revanchas_mediciones (
    id SERIAL PRIMARY KEY,
    archivo_id INTEGER REFERENCES revanchas_archivos(id) ON DELETE CASCADE,
    
    -- Datos de ubicación
    sector VARCHAR(10) NOT NULL,
    pk VARCHAR(20) NOT NULL, -- Progressive Kilometer
    
    -- Mediciones principales
    coronamiento DECIMAL(10, 3),
    revancha DECIMAL(10, 3),
    lama DECIMAL(10, 3),
    ancho DECIMAL(10, 3),
    geomembrana DECIMAL(10, 3),
    
    -- Distancias calculadas
    dist_geo_lama DECIMAL(10, 3),
    dist_geo_coronamiento DECIMAL(10, 3),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_archivo_sector_pk UNIQUE (archivo_id, sector, pk)
);

-- 1.3 Tabla para almacenar comparaciones entre mediciones
CREATE TABLE IF NOT EXISTS revanchas_comparaciones (
    id SERIAL PRIMARY KEY,
    archivo_anterior_id INTEGER REFERENCES revanchas_archivos(id),
    archivo_actual_id INTEGER REFERENCES revanchas_archivos(id),
    
    -- Datos de ubicación
    sector VARCHAR(10) NOT NULL,
    pk VARCHAR(20) NOT NULL,
    
    -- Diferencias en mediciones
    diff_coronamiento DECIMAL(10, 3),
    diff_revancha DECIMAL(10, 3),
    diff_lama DECIMAL(10, 3),
    diff_ancho DECIMAL(10, 3),
    
    -- Flags de alerta
    alerta_revancha BOOLEAN DEFAULT FALSE, -- Si diff > umbral
    alerta_ancho BOOLEAN DEFAULT FALSE,
    alerta_coronamiento BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_comparacion UNIQUE (archivo_anterior_id, archivo_actual_id, sector, pk),
    CONSTRAINT check_archivos_diferentes CHECK (archivo_anterior_id != archivo_actual_id)
);

-- 1.4 Tabla para almacenar estadísticas por archivo
CREATE TABLE IF NOT EXISTS revanchas_estadisticas (
    id SERIAL PRIMARY KEY,
    archivo_id INTEGER REFERENCES revanchas_archivos(id) ON DELETE CASCADE UNIQUE,
    
    -- Estadísticas globales de Revancha
    revancha_min DECIMAL(10, 3),
    revancha_max DECIMAL(10, 3),
    revancha_promedio DECIMAL(10, 3),
    revancha_pk_min VARCHAR(20),
    revancha_pk_max VARCHAR(20),
    
    -- Estadísticas globales de Ancho
    ancho_min DECIMAL(10, 3),
    ancho_max DECIMAL(10, 3),
    ancho_promedio DECIMAL(10, 3),
    ancho_pk_min VARCHAR(20),
    ancho_pk_max VARCHAR(20),
    
    -- Estadísticas globales de Coronamiento
    coronamiento_min DECIMAL(10, 3),
    coronamiento_max DECIMAL(10, 3),
    coronamiento_promedio DECIMAL(10, 3),
    coronamiento_pk_min VARCHAR(20),
    coronamiento_pk_max VARCHAR(20),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.5 Tabla para estadísticas por sector
CREATE TABLE IF NOT EXISTS revanchas_estadisticas_sector (
    id SERIAL PRIMARY KEY,
    archivo_id INTEGER REFERENCES revanchas_archivos(id) ON DELETE CASCADE,
    sector VARCHAR(10) NOT NULL,
    
    -- Estadísticas de Revancha por sector
    revancha_min DECIMAL(10, 3),
    revancha_max DECIMAL(10, 3),
    revancha_pk_min VARCHAR(20),
    revancha_pk_max VARCHAR(20),
    
    -- Estadísticas de Ancho por sector
    ancho_min DECIMAL(10, 3),
    ancho_max DECIMAL(10, 3),
    ancho_pk_min VARCHAR(20),
    ancho_pk_max VARCHAR(20),
    
    -- Estadísticas de Coronamiento por sector
    coronamiento_min DECIMAL(10, 3),
    coronamiento_max DECIMAL(10, 3),
    coronamiento_pk_min VARCHAR(20),
    coronamiento_pk_max VARCHAR(20),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_archivo_sector UNIQUE (archivo_id, sector)
);

-- =====================================================
-- FASE 2: CREAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_revanchas_archivos_muro_fecha 
    ON revanchas_archivos(muro, fecha_medicion DESC);

CREATE INDEX IF NOT EXISTS idx_revanchas_archivos_usuario 
    ON revanchas_archivos(usuario_id);

CREATE INDEX IF NOT EXISTS idx_revanchas_mediciones_archivo 
    ON revanchas_mediciones(archivo_id);

CREATE INDEX IF NOT EXISTS idx_revanchas_mediciones_sector_pk 
    ON revanchas_mediciones(sector, pk);

CREATE INDEX IF NOT EXISTS idx_revanchas_comparaciones_archivos 
    ON revanchas_comparaciones(archivo_anterior_id, archivo_actual_id);

CREATE INDEX IF NOT EXISTS idx_revanchas_comparaciones_alertas 
    ON revanchas_comparaciones(alerta_revancha, alerta_ancho, alerta_coronamiento) 
    WHERE alerta_revancha = TRUE OR alerta_ancho = TRUE OR alerta_coronamiento = TRUE;

-- =====================================================
-- FASE 3: CREAR FUNCIONES Y TRIGGERS
-- =====================================================

-- 3.1 Función para actualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_revanchas_archivos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3.2 Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_revanchas_archivos_updated_at ON revanchas_archivos;
CREATE TRIGGER trigger_update_revanchas_archivos_updated_at
    BEFORE UPDATE ON revanchas_archivos
    FOR EACH ROW
    EXECUTE FUNCTION update_revanchas_archivos_updated_at();

-- 3.3 Función para calcular estadísticas automáticamente después de insertar mediciones
CREATE OR REPLACE FUNCTION calcular_estadisticas_archivo()
RETURNS TRIGGER AS $$
DECLARE
    v_archivo_id INTEGER;
BEGIN
    -- Si es INSERT, usar NEW.archivo_id
    -- Si es DELETE, usar OLD.archivo_id
    v_archivo_id := COALESCE(NEW.archivo_id, OLD.archivo_id);
    
    -- Eliminar estadísticas existentes para recalcular
    DELETE FROM revanchas_estadisticas WHERE archivo_id = v_archivo_id;
    DELETE FROM revanchas_estadisticas_sector WHERE archivo_id = v_archivo_id;
    
    -- Calcular estadísticas globales
    INSERT INTO revanchas_estadisticas (
        archivo_id,
        revancha_min, revancha_max, revancha_promedio,
        revancha_pk_min, revancha_pk_max,
        ancho_min, ancho_max, ancho_promedio,
        ancho_pk_min, ancho_pk_max,
        coronamiento_min, coronamiento_max, coronamiento_promedio,
        coronamiento_pk_min, coronamiento_pk_max
    )
    SELECT 
        v_archivo_id,
        -- Estadísticas de Revancha
        MIN(revancha), 
        MAX(revancha), 
        AVG(revancha),
        (SELECT pk FROM revanchas_mediciones WHERE archivo_id = v_archivo_id AND revancha IS NOT NULL ORDER BY revancha ASC LIMIT 1),
        (SELECT pk FROM revanchas_mediciones WHERE archivo_id = v_archivo_id AND revancha IS NOT NULL ORDER BY revancha DESC LIMIT 1),
        -- Estadísticas de Ancho
        MIN(ancho), 
        MAX(ancho), 
        AVG(ancho),
        (SELECT pk FROM revanchas_mediciones WHERE archivo_id = v_archivo_id AND ancho IS NOT NULL ORDER BY ancho ASC LIMIT 1),
        (SELECT pk FROM revanchas_mediciones WHERE archivo_id = v_archivo_id AND ancho IS NOT NULL ORDER BY ancho DESC LIMIT 1),
        -- Estadísticas de Coronamiento
        MIN(coronamiento), 
        MAX(coronamiento), 
        AVG(coronamiento),
        (SELECT pk FROM revanchas_mediciones WHERE archivo_id = v_archivo_id AND coronamiento IS NOT NULL ORDER BY coronamiento ASC LIMIT 1),
        (SELECT pk FROM revanchas_mediciones WHERE archivo_id = v_archivo_id AND coronamiento IS NOT NULL ORDER BY coronamiento DESC LIMIT 1)
    FROM revanchas_mediciones
    WHERE archivo_id = v_archivo_id;
    
    -- Calcular estadísticas por sector
    INSERT INTO revanchas_estadisticas_sector (
        archivo_id, sector,
        revancha_min, revancha_max, revancha_pk_min, revancha_pk_max,
        ancho_min, ancho_max, ancho_pk_min, ancho_pk_max,
        coronamiento_min, coronamiento_max, coronamiento_pk_min, coronamiento_pk_max
    )
    SELECT 
        v_archivo_id,
        sector,
        -- Estadísticas de Revancha por sector
        MIN(revancha),
        MAX(revancha),
        (SELECT pk FROM revanchas_mediciones WHERE archivo_id = v_archivo_id AND sector = m.sector AND revancha IS NOT NULL ORDER BY revancha ASC LIMIT 1),
        (SELECT pk FROM revanchas_mediciones WHERE archivo_id = v_archivo_id AND sector = m.sector AND revancha IS NOT NULL ORDER BY revancha DESC LIMIT 1),
        -- Estadísticas de Ancho por sector
        MIN(ancho),
        MAX(ancho),
        (SELECT pk FROM revanchas_mediciones WHERE archivo_id = v_archivo_id AND sector = m.sector AND ancho IS NOT NULL ORDER BY ancho ASC LIMIT 1),
        (SELECT pk FROM revanchas_mediciones WHERE archivo_id = v_archivo_id AND sector = m.sector AND ancho IS NOT NULL ORDER BY ancho DESC LIMIT 1),
        -- Estadísticas de Coronamiento por sector
        MIN(coronamiento),
        MAX(coronamiento),
        (SELECT pk FROM revanchas_mediciones WHERE archivo_id = v_archivo_id AND sector = m.sector AND coronamiento IS NOT NULL ORDER BY coronamiento ASC LIMIT 1),
        (SELECT pk FROM revanchas_mediciones WHERE archivo_id = v_archivo_id AND sector = m.sector AND coronamiento IS NOT NULL ORDER BY coronamiento DESC LIMIT 1)
    FROM revanchas_mediciones m
    WHERE archivo_id = v_archivo_id
    GROUP BY sector;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3.4 Trigger para calcular estadísticas después de insertar mediciones
DROP TRIGGER IF EXISTS trigger_calcular_estadisticas_insert ON revanchas_mediciones;
CREATE TRIGGER trigger_calcular_estadisticas_insert
    AFTER INSERT ON revanchas_mediciones
    FOR EACH ROW
    EXECUTE FUNCTION calcular_estadisticas_archivo();

-- 3.5 Trigger para recalcular estadísticas después de eliminar mediciones
DROP TRIGGER IF EXISTS trigger_calcular_estadisticas_delete ON revanchas_mediciones;
CREATE TRIGGER trigger_calcular_estadisticas_delete
    AFTER DELETE ON revanchas_mediciones
    FOR EACH ROW
    EXECUTE FUNCTION calcular_estadisticas_archivo();

-- =====================================================
-- FASE 4: CREAR VISTAS ÚTILES
-- =====================================================

-- 4.1 Vista de archivos con información completa
CREATE OR REPLACE VIEW vista_revanchas_archivos AS
SELECT 
    ra.id,
    ra.muro,
    ra.fecha_medicion,
    ra.archivo_nombre,
    ra.archivo_tipo,
    ra.total_registros,
    ra.sectores_incluidos,
    u.nombre_completo as subido_por,
    ra.created_at,
    ra.updated_at
FROM revanchas_archivos ra
LEFT JOIN usuarios u ON ra.usuario_id = u.id
ORDER BY ra.fecha_medicion DESC, ra.muro;

-- 4.2 Vista de últimas mediciones por muro
CREATE OR REPLACE VIEW vista_ultimas_mediciones AS
SELECT DISTINCT ON (muro)
    id,
    muro,
    fecha_medicion,
    archivo_nombre,
    total_registros,
    created_at
FROM revanchas_archivos
ORDER BY muro, fecha_medicion DESC;

-- 4.3 Vista de mediciones con estadísticas y clasificación
CREATE OR REPLACE VIEW vista_mediciones_completas AS
SELECT 
    rm.id,
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
    -- Clasificación de valores según umbrales
    CASE 
        WHEN rm.revancha > 3.5 THEN 'VERDE'
        WHEN rm.revancha >= 3.0 THEN 'AMARILLO'
        ELSE 'ROJO'
    END as clasificacion_revancha,
    CASE 
        WHEN rm.ancho > 18 THEN 'VERDE'
        WHEN rm.ancho >= 15 THEN 'AMARILLO'
        ELSE 'ROJO'
    END as clasificacion_ancho,
    CASE 
        WHEN rm.dist_geo_coronamiento > 1 THEN 'SIN_COLOR'
        WHEN rm.dist_geo_coronamiento >= 0.5 THEN 'AMARILLO'
        ELSE 'ROJO'
    END as clasificacion_dist_geo
FROM revanchas_mediciones rm
JOIN revanchas_archivos ra ON rm.archivo_id = ra.id
ORDER BY ra.fecha_medicion DESC, rm.sector, rm.pk;

-- 4.4 Vista de comparación entre última y penúltima medición por muro
CREATE OR REPLACE VIEW vista_comparacion_ultimas_mediciones AS
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
    rm_actual.sector,
    rm_actual.pk,
    rm_anterior.revancha as revancha_anterior,
    rm_actual.revancha as revancha_actual,
    rm_actual.revancha - rm_anterior.revancha as diff_revancha,
    rm_anterior.ancho as ancho_anterior,
    rm_actual.ancho as ancho_actual,
    rm_actual.ancho - rm_anterior.ancho as diff_ancho,
    rm_anterior.coronamiento as coronamiento_anterior,
    rm_actual.coronamiento as coronamiento_actual,
    rm_actual.coronamiento - rm_anterior.coronamiento as diff_coronamiento
FROM ultimas_dos actual
JOIN ultimas_dos anterior ON actual.muro = anterior.muro AND anterior.rn = 2
JOIN revanchas_mediciones rm_actual ON rm_actual.archivo_id = actual.id
JOIN revanchas_mediciones rm_anterior ON rm_anterior.archivo_id = anterior.id 
    AND rm_anterior.sector = rm_actual.sector 
    AND rm_anterior.pk = rm_actual.pk
WHERE actual.rn = 1
ORDER BY actual.muro, rm_actual.sector, rm_actual.pk;

-- =====================================================
-- FASE 5: CONFIGURAR SEGURIDAD (RLS)
-- =====================================================

-- Habilitar RLS en las nuevas tablas
ALTER TABLE revanchas_archivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE revanchas_mediciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE revanchas_comparaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE revanchas_estadisticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE revanchas_estadisticas_sector ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura (todos pueden leer)
CREATE POLICY "Permitir lectura de archivos" ON revanchas_archivos
    FOR SELECT USING (true);

CREATE POLICY "Permitir lectura de mediciones" ON revanchas_mediciones
    FOR SELECT USING (true);

CREATE POLICY "Permitir lectura de comparaciones" ON revanchas_comparaciones
    FOR SELECT USING (true);

CREATE POLICY "Permitir lectura de estadísticas" ON revanchas_estadisticas
    FOR SELECT USING (true);

CREATE POLICY "Permitir lectura de estadísticas por sector" ON revanchas_estadisticas_sector
    FOR SELECT USING (true);

-- Políticas de escritura (todos pueden insertar/actualizar por ahora)
CREATE POLICY "Permitir operaciones en archivos" ON revanchas_archivos
    FOR ALL USING (true);

CREATE POLICY "Permitir operaciones en mediciones" ON revanchas_mediciones
    FOR ALL USING (true);

CREATE POLICY "Permitir operaciones en comparaciones" ON revanchas_comparaciones
    FOR ALL USING (true);

CREATE POLICY "Permitir operaciones en estadísticas" ON revanchas_estadisticas
    FOR ALL USING (true);

CREATE POLICY "Permitir operaciones en estadísticas por sector" ON revanchas_estadisticas_sector
    FOR ALL USING (true);

-- =====================================================
-- FASE 6: COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE revanchas_archivos IS 'Metadata de archivos de revanchas subidos por los usuarios';
COMMENT ON TABLE revanchas_mediciones IS 'Datos individuales de cada medición de revancha extraída de los archivos';
COMMENT ON TABLE revanchas_comparaciones IS 'Comparaciones entre mediciones de diferentes fechas para tracking de cambios';
COMMENT ON TABLE revanchas_estadisticas IS 'Estadísticas globales calculadas automáticamente por archivo';
COMMENT ON TABLE revanchas_estadisticas_sector IS 'Estadísticas calculadas automáticamente por sector dentro de cada archivo';

COMMENT ON COLUMN revanchas_archivos.muro IS 'Tipo de muro: Principal, Este, Oeste';
COMMENT ON COLUMN revanchas_archivos.fecha_medicion IS 'Fecha de medición extraída del archivo (celda F6)';
COMMENT ON COLUMN revanchas_mediciones.pk IS 'Progressive Kilometer - Progresiva del punto medido';
COMMENT ON COLUMN revanchas_mediciones.revancha IS 'Distancia vertical entre coronamiento y lama (m)';
COMMENT ON COLUMN revanchas_mediciones.ancho IS 'Ancho de la cubeta de lamas (m)';

-- =====================================================
-- FASE 7: VERIFICACIÓN DE MIGRACIÓN
-- =====================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
    'VERIFICACIÓN: Nuevas tablas creadas' as status,
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name LIKE 'revanchas_%'
ORDER BY table_name;

-- Verificar índices creados
SELECT 
    'VERIFICACIÓN: Índices creados' as status,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE '%revanchas%'
ORDER BY indexname;

-- Verificar vistas creadas
SELECT 
    'VERIFICACIÓN: Vistas creadas' as status,
    table_name
FROM information_schema.views
WHERE table_schema = 'public'
    AND table_name LIKE 'vista_%revanchas%'
ORDER BY table_name;

-- Verificar triggers creados
SELECT 
    'VERIFICACIÓN: Triggers creados' as status,
    trigger_name,
    event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%revanchas%'
ORDER BY trigger_name;

SELECT 'MIGRACIÓN COMPLETADA EXITOSAMENTE' as status, NOW() as fecha;
