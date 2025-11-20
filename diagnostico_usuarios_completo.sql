-- =====================================================
-- DIAGNÓSTICO COMPLETO DE USUARIOS INACTIVOS
-- Ejecutar paso a paso en Supabase SQL Editor
-- =====================================================

-- PASO 1: Verificar estructura actual de la tabla usuarios
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASO 2: Contar usuarios por estado en la tabla base
SELECT 
    'Tabla usuarios directa' as fuente,
    activo,
    COUNT(*) as cantidad
FROM public.usuarios 
GROUP BY activo;

-- PASO 3: Ver definición actual de la vista (esto nos dirá si tiene filtro)
SELECT pg_get_viewdef('public.vista_usuarios_completa', true) as definicion_vista;

-- PASO 4: Contar usuarios por estado en la vista actual
SELECT 
    'Vista usuarios completa' as fuente,
    activo,
    COUNT(*) as cantidad
FROM public.vista_usuarios_completa 
GROUP BY activo;

-- PASO 5: Mostrar algunos usuarios inactivos de la tabla base (si existen)
SELECT 
    'Usuarios inactivos en tabla base' as info,
    id,
    nombre_completo,
    activo,
    empresa_id,
    rol_id,
    created_at
FROM public.usuarios 
WHERE activo = false
ORDER BY created_at DESC
LIMIT 3;

-- PASO 6: Intentar ver usuarios inactivos desde la vista actual
SELECT 
    'Usuarios inactivos en vista actual' as info,
    id,
    nombre_completo,
    activo,
    empresa_nombre,
    rol_nombre
FROM public.vista_usuarios_completa 
WHERE activo = false
ORDER BY created_at DESC
LIMIT 3;