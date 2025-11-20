-- Script para diagnosticar por qué no aparecen usuarios inactivos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si existen usuarios inactivos en la tabla base
SELECT 
    id,
    nombre_completo,
    email,
    activo,
    empresa_id,
    rol_id,
    created_at
FROM public.usuarios 
WHERE activo = false
ORDER BY nombre_completo;

-- 2. Verificar la definición de la vista vista_usuarios_completa
SELECT pg_get_viewdef('public.vista_usuarios_completa', true);

-- 3. Consultar directamente la vista para ver si incluye usuarios inactivos
SELECT 
    id,
    nombre_completo,
    email,
    activo,
    empresa_nombre,
    rol_nombre
FROM public.vista_usuarios_completa 
WHERE activo = false
ORDER BY nombre_completo;

-- 4. Contar todos los usuarios por estado
SELECT 
    activo,
    COUNT(*) as cantidad
FROM public.usuarios 
GROUP BY activo;

-- 5. Contar usuarios en la vista por estado
SELECT 
    activo,
    COUNT(*) as cantidad
FROM public.vista_usuarios_completa 
GROUP BY activo;