-- =====================================================
-- SCRIPT PARA ENTENDER LA ESTRUCTURA DE LA BASE DE DATOS
-- Ejecutar en Supabase SQL Editor para analizar antes de modificar
-- =====================================================

-- 1. Verificar estructura de tabla validaciones
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'validaciones' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar estructura de tabla canchas
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'canchas' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Ver la vista actual vista_canchas_completa (si existe)
SELECT definition 
FROM pg_views 
WHERE viewname = 'vista_canchas_completa' 
    AND schemaname = 'public';

-- 4. Verificar datos de ejemplo en validaciones
SELECT 
    id,
    cancha_id,
    empresa_validadora_id,
    tipo_validacion,
    resultado,
    created_at
FROM validaciones 
LIMIT 5;

-- 5. Verificar relaciones existentes
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('validaciones', 'canchas')
    AND tc.table_schema = 'public';

-- 6. Verificar índices existentes en validaciones
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'validaciones'
    AND schemaname = 'public';