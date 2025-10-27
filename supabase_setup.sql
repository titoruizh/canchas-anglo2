-- ================================================
-- SISTEMA DE GESTIÓN DE CANCHAS ANGLOAMERICAN
-- ================================================

-- 1. Tabla de Empresas
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar las empresas del flujo
INSERT INTO empresas (nombre) VALUES 
    ('AngloAmerican'),
    ('Besalco'),
    ('Linkapsis'),
    ('LlayLlay');

-- 2. Tabla de Estados de Cancha
CREATE TABLE estados_cancha (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar los estados posibles
INSERT INTO estados_cancha (nombre, descripcion) VALUES 
    ('Creada', 'Cancha creada por AngloAmerican'),
    ('En Proceso', 'Cancha en proceso de trabajo por Besalco'),
    ('Finalizada', 'Trabajo de maquinaria finalizado por Besalco'),
    ('Validada', 'Cancha validada por Linkapsis o LlayLlay'),
    ('Rechazada', 'Cancha rechazada, requiere retrabajo'),
    ('Cerrada', 'Cancha cerrada y firmada por AngloAmerican');

-- 3. Tabla principal de Canchas
CREATE TABLE canchas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    muro VARCHAR(50) NOT NULL,
    sector VARCHAR(50) NOT NULL,
    nombre_detalle VARCHAR(50) NOT NULL,
    estado_actual_id INTEGER REFERENCES estados_cancha(id) DEFAULT 1,
    empresa_actual_id INTEGER REFERENCES empresas(id) DEFAULT 1,
    created_by INTEGER REFERENCES empresas(id) DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_cancha_components UNIQUE (muro, sector, nombre_detalle)
);

-- 4. Tabla de Historial de Trazabilidad
CREATE TABLE historial_cancha (
    id SERIAL PRIMARY KEY,
    cancha_id INTEGER REFERENCES canchas(id) ON DELETE CASCADE,
    estado_anterior_id INTEGER REFERENCES estados_cancha(id),
    estado_nuevo_id INTEGER REFERENCES estados_cancha(id),
    empresa_anterior_id INTEGER REFERENCES empresas(id),
    empresa_nueva_id INTEGER REFERENCES empresas(id),
    accion VARCHAR(100) NOT NULL,
    observaciones TEXT,
    created_by INTEGER REFERENCES empresas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de Validaciones/Rechazos
CREATE TABLE validaciones (
    id SERIAL PRIMARY KEY,
    cancha_id INTEGER REFERENCES canchas(id) ON DELETE CASCADE,
    empresa_validadora_id INTEGER REFERENCES empresas(id),
    tipo_validacion VARCHAR(50) NOT NULL, -- 'espesores', 'densidad'
    resultado VARCHAR(20) NOT NULL, -- 'validada', 'rechazada'
    observaciones TEXT,
    mediciones JSONB, -- Para almacenar datos específicos de mediciones
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- FUNCIONES Y TRIGGERS
-- ================================================

-- Función para actualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en canchas
CREATE TRIGGER update_canchas_updated_at 
    BEFORE UPDATE ON canchas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Función para registrar cambios en el historial
CREATE OR REPLACE FUNCTION registrar_cambio_cancha()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar si hay cambios en estado o empresa
    IF (OLD.estado_actual_id != NEW.estado_actual_id OR OLD.empresa_actual_id != NEW.empresa_actual_id) THEN
        INSERT INTO historial_cancha (
            cancha_id,
            estado_anterior_id,
            estado_nuevo_id,
            empresa_anterior_id,
            empresa_nueva_id,
            accion,
            created_by
        ) VALUES (
            NEW.id,
            OLD.estado_actual_id,
            NEW.estado_actual_id,
            OLD.empresa_actual_id,
            NEW.empresa_actual_id,
            CASE 
                WHEN NEW.estado_actual_id = 2 THEN 'Cancha enviada a Besalco para trabajo'
                WHEN NEW.estado_actual_id = 3 THEN 'Trabajo de maquinaria finalizado'
                WHEN NEW.estado_actual_id = 4 AND NEW.empresa_actual_id = 3 THEN 'Espesores validados por Linkapsis'
                WHEN NEW.estado_actual_id = 4 AND NEW.empresa_actual_id = 4 THEN 'Densidad validada por LlayLlay'
                WHEN NEW.estado_actual_id = 5 AND NEW.empresa_actual_id = 1 AND OLD.empresa_actual_id = 2 THEN 'Cancha rechazada por Besalco'
                WHEN NEW.estado_actual_id = 5 AND NEW.empresa_actual_id = 2 AND OLD.empresa_actual_id = 3 THEN 'Cancha rechazada por Linkapsis'
                WHEN NEW.estado_actual_id = 5 AND NEW.empresa_actual_id = 2 AND OLD.empresa_actual_id = 4 THEN 'Cancha rechazada por LlayLlay'
                WHEN NEW.estado_actual_id = 5 THEN 'Cancha rechazada, requiere retrabajo'
                WHEN NEW.estado_actual_id = 6 THEN 'Cancha cerrada por AngloAmerican'
                ELSE 'Cambio de estado'
            END,
            NEW.empresa_actual_id
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para registrar cambios automáticamente
CREATE TRIGGER trigger_cambio_cancha
    AFTER UPDATE ON canchas
    FOR EACH ROW
    EXECUTE FUNCTION registrar_cambio_cancha();

-- ================================================
-- VISTAS ÚTILES
-- ================================================

-- Vista completa de canchas con información de estado y empresa
CREATE VIEW vista_canchas_completa AS
SELECT 
    c.id,
    c.nombre,
    c.muro,
    c.sector,
    c.nombre_detalle,
    ec.nombre as estado_actual,
    emp.nombre as empresa_actual,
    emp_creador.nombre as creada_por,
    c.created_at,
    c.updated_at
FROM canchas c
JOIN estados_cancha ec ON c.estado_actual_id = ec.id
JOIN empresas emp ON c.empresa_actual_id = emp.id
JOIN empresas emp_creador ON c.created_by = emp_creador.id;

-- Vista de historial con nombres legibles
CREATE VIEW vista_historial_completa AS
SELECT 
    h.id,
    c.nombre as cancha_nombre,
    ea.nombre as estado_anterior,
    en.nombre as estado_nuevo,
    emp_ant.nombre as empresa_anterior,
    emp_nue.nombre as empresa_nueva,
    h.accion,
    h.observaciones,
    emp_by.nombre as accion_por,
    h.created_at
FROM historial_cancha h
JOIN canchas c ON h.cancha_id = c.id
LEFT JOIN estados_cancha ea ON h.estado_anterior_id = ea.id
LEFT JOIN estados_cancha en ON h.estado_nuevo_id = en.id
LEFT JOIN empresas emp_ant ON h.empresa_anterior_id = emp_ant.id
LEFT JOIN empresas emp_nue ON h.empresa_nueva_id = emp_nue.id
LEFT JOIN empresas emp_by ON h.created_by = emp_by.id
ORDER BY h.created_at DESC;

-- ================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ================================================

-- Habilitar RLS en las tablas principales
ALTER TABLE canchas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_cancha ENABLE ROW LEVEL SECURITY;
ALTER TABLE validaciones ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura de todas las canchas (para trazabilidad)
CREATE POLICY "Permitir lectura de canchas" ON canchas
    FOR SELECT USING (true);

-- Política para permitir lectura del historial
CREATE POLICY "Permitir lectura de historial" ON historial_cancha
    FOR SELECT USING (true);

-- Política para permitir lectura de validaciones
CREATE POLICY "Permitir lectura de validaciones" ON validaciones
    FOR SELECT USING (true);

-- Política para permitir inserción y actualización
CREATE POLICY "Permitir operaciones en canchas" ON canchas
    FOR ALL USING (true);

CREATE POLICY "Permitir operaciones en historial" ON historial_cancha
    FOR ALL USING (true);

CREATE POLICY "Permitir operaciones en validaciones" ON validaciones
    FOR ALL USING (true);

-- ================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ================================================

-- Insertar algunas canchas de ejemplo
INSERT INTO canchas (nombre, muro, sector, nombre_detalle, created_by) VALUES 
    ('MP_S5_TALUD', 'MP', 'S5', 'TALUD', 1),
    ('MS_S3_BERMA', 'MS', 'S3', 'BERMA', 1),
    ('MT_S1_PISTA', 'MT', 'S1', 'PISTA', 1);

-- ================================================
-- COMENTARIOS FINALES
-- ================================================

COMMENT ON TABLE canchas IS 'Tabla principal que almacena todas las canchas del sistema';
COMMENT ON TABLE historial_cancha IS 'Registro completo de trazabilidad de cambios en canchas';
COMMENT ON TABLE validaciones IS 'Registro específico de validaciones y rechazos por empresa';
COMMENT ON TABLE empresas IS 'Catálogo de empresas participantes en el flujo';
COMMENT ON TABLE estados_cancha IS 'Catálogo de estados posibles de una cancha';

-- Para verificar que todo se creó correctamente
SELECT 'Tablas creadas exitosamente' AS status;