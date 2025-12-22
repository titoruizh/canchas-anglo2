-- =====================================================
-- DIAGNÓSTICO COMPLETO DEL SCHEMA DE SUPABASE
-- =====================================================
-- Fecha: 2025-12-22
-- Propósito: Obtener información completa de la estructura actual
--            de la base de datos para documentación
-- =====================================================

-- =====================================================
-- 1. LISTAR TODAS LAS TABLAS
-- =====================================================
SELECT 
    'TABLA' as tipo,
    table_name as nombre,
    (SELECT obj_description(oid) 
     FROM pg_class 
     WHERE relname = table_name 
     AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) as descripcion
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- 2. ESTRUCTURA DETALLADA DE CADA TABLA
-- =====================================================
SELECT 
    c.table_name,
    c.column_name,
    c.ordinal_position,
    c.data_type,
    c.character_maximum_length,
    c.numeric_precision,
    c.numeric_scale,
    c.is_nullable,
    c.column_default,
    pgd.description as column_description
FROM information_schema.columns c
LEFT JOIN pg_catalog.pg_statio_all_tables st ON c.table_name = st.relname
LEFT JOIN pg_catalog.pg_description pgd ON (
    pgd.objoid = st.relid 
    AND pgd.objsubid = c.ordinal_position
)
WHERE c.table_schema = 'public'
    AND c.table_name IN (
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    )
ORDER BY c.table_name, c.ordinal_position;

-- =====================================================
-- 3. RELACIONES (FOREIGN KEYS)
-- =====================================================
SELECT
    tc.table_name as tabla_origen,
    kcu.column_name as columna_origen,
    ccu.table_name as tabla_referenciada,
    ccu.column_name as columna_referenciada,
    tc.constraint_name as nombre_constraint,
    rc.update_rule as on_update,
    rc.delete_rule as on_delete
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 4. ÍNDICES
-- =====================================================
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- 5. CONSTRAINTS (UNIQUE, CHECK, PRIMARY KEY)
-- =====================================================
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'CHECK')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- =====================================================
-- 6. VISTAS
-- =====================================================
SELECT 
    table_name as vista_nombre,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- 7. FUNCIONES Y STORED PROCEDURES
-- =====================================================
SELECT 
    n.nspname as schema,
    p.proname as nombre_funcion,
    pg_get_function_arguments(p.oid) as argumentos,
    pg_get_functiondef(p.oid) as definicion,
    CASE p.prokind
        WHEN 'f' THEN 'FUNCTION'
        WHEN 'p' THEN 'PROCEDURE'
        WHEN 'a' THEN 'AGGREGATE'
        WHEN 'w' THEN 'WINDOW'
    END as tipo,
    obj_description(p.oid) as descripcion
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p')
ORDER BY p.proname;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================
SELECT
    trigger_name,
    event_object_table as tabla,
    event_manipulation as evento,
    action_timing as momento,
    action_statement as accion
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 9. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as comando,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 10. ESTADÍSTICAS DE DATOS (CONTEO DE REGISTROS)
-- =====================================================
-- NOTA: Ejecutar cada query individualmente para obtener conteos

-- SELECT 'empresas' as tabla, COUNT(*) as registros FROM empresas;
-- SELECT 'estados_cancha' as tabla, COUNT(*) as registros FROM estados_cancha;
-- SELECT 'canchas' as tabla, COUNT(*) as registros FROM canchas;
-- SELECT 'historial_canchas' as tabla, COUNT(*) as registros FROM historial_canchas;
-- SELECT 'usuarios' as tabla, COUNT(*) as registros FROM usuarios;
-- SELECT 'roles' as tabla, COUNT(*) as registros FROM roles;
-- SELECT 'validaciones' as tabla, COUNT(*) as registros FROM validaciones;
-- SELECT 'revanchas_archivos' as tabla, COUNT(*) as registros FROM revanchas_archivos;
-- SELECT 'revanchas_mediciones' as tabla, COUNT(*) as registros FROM revanchas_mediciones;
-- SELECT 'pks_maestro' as tabla, COUNT(*) as registros FROM pks_maestro;

-- =====================================================
-- 11. SECUENCIAS
-- =====================================================
SELECT
    sequence_name,
    data_type,
    start_value,
    minimum_value,
    maximum_value,
    increment
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- =====================================================
-- 12. ENUMS (TIPOS PERSONALIZADOS)
-- =====================================================
SELECT
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================
/*
CÓMO USAR ESTE ARCHIVO:

1. Abre el SQL Editor en Supabase
2. Ejecuta cada sección UNA POR UNA (separadas por los comentarios)
3. Copia los resultados de cada query
4. Guarda los resultados en un archivo de texto o Excel
5. Comparte los resultados con el equipo de desarrollo

SECCIONES IMPORTANTES:
- Sección 1: Lista de todas las tablas
- Sección 2: Estructura completa de columnas
- Sección 3: Relaciones entre tablas (Foreign Keys)
- Sección 6: Vistas existentes
- Sección 7: Funciones y procedimientos almacenados
- Sección 8: Triggers automáticos
- Sección 9: Políticas de seguridad RLS

NOTA: La sección 10 tiene queries comentadas. 
Ejecuta cada una individualmente para obtener el conteo de registros.
*/
