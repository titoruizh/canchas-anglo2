-- =====================================================
-- DIAGNÓSTICO COMPLETO DE BASE DE DATOS
-- Sistema de Gestión de Canchas - AngloAmerican
-- Fecha: 2024-12-04
-- Propósito: Análisis completo antes de migración de datos de Revanchas
-- =====================================================

-- =====================================================
-- 1. VERIFICACIÓN DE ESTRUCTURA ACTUAL
-- =====================================================

-- 1.1 Listar todas las tablas existentes
SELECT 
    'TABLAS EXISTENTES' as diagnostico,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 1.2 Verificar estructura de tabla empresas
SELECT 
    'ESTRUCTURA: empresas' as diagnostico,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'empresas'
ORDER BY ordinal_position;

-- 1.3 Verificar estructura de tabla canchas
SELECT 
    'ESTRUCTURA: canchas' as diagnostico,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'canchas'
ORDER BY ordinal_position;

-- 1.4 Verificar estructura de tabla estados_cancha
SELECT 
    'ESTRUCTURA: estados_cancha' as diagnostico,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'estados_cancha'
ORDER BY ordinal_position;

-- =====================================================
-- 2. ANÁLISIS DE DATOS ACTUALES
-- =====================================================

-- 2.1 Conteo de registros por tabla
SELECT 'CONTEO: empresas' as tabla, COUNT(*) as total FROM empresas
UNION ALL
SELECT 'CONTEO: estados_cancha', COUNT(*) FROM estados_cancha
UNION ALL
SELECT 'CONTEO: canchas', COUNT(*) FROM canchas
UNION ALL
SELECT 'CONTEO: historial_canchas', COUNT(*) FROM historial_canchas
UNION ALL
SELECT 'CONTEO: validaciones', COUNT(*) FROM validaciones;

-- 2.2 Verificar empresas existentes
SELECT 
    'DATOS: empresas' as diagnostico,
    id,
    nombre,
    created_at
FROM empresas
ORDER BY id;

-- 2.3 Verificar estados de cancha
SELECT 
    'DATOS: estados_cancha' as diagnostico,
    id,
    nombre,
    descripcion
FROM estados_cancha
ORDER BY id;

-- 2.4 Análisis de canchas por muro y sector
SELECT 
    'ANÁLISIS: Canchas por Muro' as diagnostico,
    muro,
    COUNT(*) as total_canchas,
    COUNT(DISTINCT sector) as sectores_distintos
FROM canchas
GROUP BY muro
ORDER BY muro;

-- =====================================================
-- 3. VERIFICACIÓN DE RELACIONES E INTEGRIDAD
-- =====================================================

-- 3.1 Verificar foreign keys existentes
SELECT 
    'FOREIGN KEYS' as diagnostico,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 3.2 Verificar índices existentes
SELECT 
    'ÍNDICES' as diagnostico,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- 4. ANÁLISIS DE ESPACIO Y PERFORMANCE
-- =====================================================

-- 4.1 Tamaño de tablas
SELECT 
    'TAMAÑO DE TABLAS' as diagnostico,
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as size
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY pg_total_relation_size(quote_ident(table_name)::regclass) DESC;

-- =====================================================
-- 5. VERIFICACIÓN DE POLÍTICAS RLS
-- =====================================================

-- 5.1 Verificar si RLS está habilitado
SELECT 
    'RLS HABILITADO' as diagnostico,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5.2 Listar políticas RLS existentes
SELECT 
    'POLÍTICAS RLS' as diagnostico,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 6. ANÁLISIS ESPECÍFICO PARA MIGRACIÓN DE REVANCHAS
-- =====================================================

-- 6.1 Verificar si existe alguna tabla relacionada con revanchas
SELECT 
    'BÚSQUEDA: Tablas con "revancha"' as diagnostico,
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name LIKE '%revancha%';

-- 6.2 Verificar si existe alguna columna relacionada con revanchas
SELECT 
    'BÚSQUEDA: Columnas con "revancha"' as diagnostico,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name LIKE '%revancha%';

-- 6.3 Análisis de muros y sectores únicos (para diseño de nueva tabla)
SELECT 
    'ANÁLISIS: Muros únicos' as diagnostico,
    DISTINCT muro
FROM canchas
ORDER BY muro;

SELECT 
    'ANÁLISIS: Sectores por muro' as diagnostico,
    muro,
    array_agg(DISTINCT sector ORDER BY sector) as sectores
FROM canchas
GROUP BY muro
ORDER BY muro;

-- =====================================================
-- 7. VERIFICACIÓN DE TRIGGERS Y FUNCIONES
-- =====================================================

-- 7.1 Listar funciones existentes
SELECT 
    'FUNCIONES' as diagnostico,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 7.2 Listar triggers existentes
SELECT 
    'TRIGGERS' as diagnostico,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 8. RECOMENDACIONES PARA NUEVA ESTRUCTURA
-- =====================================================

/*
ANÁLISIS Y RECOMENDACIONES:

1. ESTRUCTURA ACTUAL:
   - Sistema enfocado en trazabilidad de estados de canchas
   - No hay tablas para almacenar datos de mediciones de revanchas
   - Existe tabla 'validaciones' con campo JSONB para mediciones

2. NECESIDADES IDENTIFICADAS:
   - Almacenar datos de archivos de revanchas (CSV/XLSX)
   - Tracking temporal de mediciones por fecha
   - Relacionar mediciones con canchas existentes
   - Mantener historial de cambios entre mediciones

3. PROPUESTA DE NUEVAS TABLAS:
   a) revanchas_archivos: Metadata de archivos subidos
   b) revanchas_mediciones: Datos individuales de cada medición
   c) revanchas_comparaciones: Diferencias entre mediciones

4. CONSIDERACIONES DE SEGURIDAD:
   - Mantener RLS habilitado
   - Crear políticas específicas para nuevas tablas
   - Asegurar integridad referencial

5. PERFORMANCE:
   - Crear índices en campos de búsqueda frecuente (fecha, muro, sector, pk)
   - Considerar particionamiento si el volumen de datos crece significativamente
*/

-- =====================================================
-- 9. VERIFICACIÓN FINAL
-- =====================================================

SELECT 
    'DIAGNÓSTICO COMPLETADO' as status,
    NOW() as fecha_diagnostico,
    current_database() as database_name,
    current_user as usuario;
