-- =====================================================
-- BACKUP COMPLETO DE SUPABASE - CANCHAS ANGLO2
-- Fecha: 2024-11-04
-- Descripción: Backup completo de estructura y datos
-- =====================================================

-- =====================================================
-- 1. CREAR TABLAS (ESTRUCTURA)
-- =====================================================

-- Tabla: empresas
DROP TABLE IF EXISTS empresas CASCADE;
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: estados_cancha  
DROP TABLE IF EXISTS estados_cancha CASCADE;
CREATE TABLE estados_cancha (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: contador_informes
DROP TABLE IF EXISTS contador_informes CASCADE;
CREATE TABLE contador_informes (
    id SERIAL PRIMARY KEY,
    ultimo_numero INTEGER NOT NULL DEFAULT 5000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: canchas
DROP TABLE IF EXISTS canchas CASCADE;
CREATE TABLE canchas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    muro VARCHAR(10) NOT NULL,
    sector VARCHAR(10) NOT NULL,
    nombre_detalle VARCHAR(255),
    estado_actual_id INTEGER REFERENCES estados_cancha(id),
    empresa_actual_id INTEGER REFERENCES empresas(id),
    created_by INTEGER REFERENCES empresas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    numero_informe INTEGER
);

-- Tabla: historial_canchas
DROP TABLE IF EXISTS historial_canchas CASCADE;
CREATE TABLE historial_canchas (
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

-- =====================================================
-- 2. INSERTAR DATOS (ejecutar uno por uno en Supabase)
-- =====================================================

-- NOTA: Los siguientes comandos deben ejecutarse UNO POR UNO
-- en el SQL Editor de Supabase para obtener los datos actuales:

/*
-- Para obtener datos de empresas:
SELECT 'INSERT INTO empresas (id, nombre, created_at) VALUES (' 
    || id || ', ''' || nombre || ''', ''' || created_at || ''');'
FROM empresas ORDER BY id;

-- Para obtener datos de estados_cancha:
SELECT 'INSERT INTO estados_cancha (id, nombre, descripcion, created_at) VALUES (' 
    || id || ', ''' || nombre || ''', ''' 
    || COALESCE(descripcion, '') || ''', ''' || created_at || ''');'
FROM estados_cancha ORDER BY id;

-- Para obtener datos de contador_informes:
SELECT 'INSERT INTO contador_informes (id, ultimo_numero, created_at, updated_at) VALUES (' 
    || id || ', ' || ultimo_numero || ', ''' || created_at || ''', ''' || updated_at || ''');'
FROM contador_informes ORDER BY id;

-- Para obtener datos de canchas:
SELECT 'INSERT INTO canchas (id, nombre, muro, sector, nombre_detalle, estado_actual_id, empresa_actual_id, created_by, created_at, updated_at, numero_informe) VALUES (' 
    || id || ', ''' || nombre || ''', ''' || muro || ''', ''' || sector || ''', ''' 
    || COALESCE(nombre_detalle, '') || ''', ' || estado_actual_id || ', ' || empresa_actual_id 
    || ', ' || created_by || ', ''' || created_at || ''', ''' || updated_at || ''', ' 
    || COALESCE(numero_informe::text, 'NULL') || ');'
FROM canchas ORDER BY id;

-- Para obtener datos de historial_canchas:
SELECT 'INSERT INTO historial_canchas (id, cancha_id, estado_anterior_id, estado_nuevo_id, empresa_anterior_id, empresa_nueva_id, accion, observaciones, created_by, created_at) VALUES (' 
    || id || ', ' || cancha_id || ', ' || COALESCE(estado_anterior_id::text, 'NULL') 
    || ', ' || estado_nuevo_id || ', ' || COALESCE(empresa_anterior_id::text, 'NULL') 
    || ', ' || empresa_nueva_id || ', ''' || accion || ''', ''' 
    || COALESCE(observaciones, '') || ''', ' || created_by || ', ''' || created_at || ''');'
FROM historial_canchas ORDER BY id;
*/

-- =====================================================
-- 3. CREAR VISTA (después de insertar datos)
-- =====================================================

-- Vista: vista_canchas_completa
DROP VIEW IF EXISTS vista_canchas_completa;
CREATE VIEW vista_canchas_completa AS
SELECT 
    c.id,
    c.nombre,
    c.muro,
    c.sector,
    c.nombre_detalle,
    ec.nombre AS estado_actual,
    emp.nombre AS empresa_actual,
    created_emp.nombre AS creada_por,
    c.created_at,
    c.updated_at,
    c.numero_informe
FROM canchas c
LEFT JOIN estados_cancha ec ON c.estado_actual_id = ec.id
LEFT JOIN empresas emp ON c.empresa_actual_id = emp.id
LEFT JOIN empresas created_emp ON c.created_by = created_emp.id;

-- =====================================================
-- 4. POLÍTICAS RLS (si están habilitadas)
-- =====================================================

-- Habilitar RLS
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE estados_cancha ENABLE ROW LEVEL SECURITY;
ALTER TABLE canchas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_canchas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contador_informes ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar según sea necesario)
CREATE POLICY "Enable read access for all users" ON empresas FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON estados_cancha FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON canchas FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON historial_canchas FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON contador_informes FOR ALL USING (true);

-- =====================================================
-- INSTRUCCIONES DE USO:
-- =====================================================

/*
PARA HACER EL BACKUP:

1. Ejecuta cada query SELECT de la sección 2 UNO POR UNO en Supabase SQL Editor
2. Copia los resultados y pégalos en un archivo nuevo (ej: datos-backup.sql)
3. Guarda este archivo backup-supabase.sql junto con datos-backup.sql

PARA RESTAURAR:

1. Ejecuta primero este archivo (estructura)
2. Ejecuta después el archivo de datos (datos-backup.sql)

EJEMPLO DE COMANDO PARA OBTENER DATOS:
Ve a Supabase → SQL Editor → Nueva consulta
Ejecuta: SELECT 'INSERT INTO empresas...' FROM empresas;
Copia el resultado y guárdalo.
*/