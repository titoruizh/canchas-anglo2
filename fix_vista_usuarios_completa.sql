-- Script para corregir la vista vista_usuarios_completa
-- Ejecutar en Supabase SQL Editor

-- Recrear la vista sin filtro de usuarios activos para mostrar todos los usuarios
CREATE OR REPLACE VIEW public.vista_usuarios_completa AS
SELECT 
    u.id,
    u.nombre_completo,
    u.email,
    u.activo,
    u.created_at,
    u.updated_at,
    e.id as empresa_id,
    e.nombre as empresa_nombre,
    r.id as rol_id,
    r.nombre as rol_nombre,
    r.descripcion as rol_descripcion
FROM public.usuarios u
JOIN public.empresas e ON u.empresa_id = e.id
JOIN public.roles r ON u.rol_id = r.id
ORDER BY e.nombre, r.nombre, u.nombre_completo;

-- Verificar que ahora muestra usuarios activos e inactivos
SELECT 
    activo,
    COUNT(*) as cantidad
FROM public.vista_usuarios_completa 
GROUP BY activo;

-- Ver algunos usuarios inactivos
SELECT 
    id,
    nombre_completo,
    activo,
    empresa_nombre,
    rol_nombre
FROM public.vista_usuarios_completa 
WHERE activo = false
LIMIT 5;