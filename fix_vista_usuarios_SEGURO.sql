-- =====================================================
-- CORRECCIÓN SEGURA DE LA VISTA vista_usuarios_completa
-- Ejecutar DESPUÉS del diagnóstico completo
-- =====================================================

-- SOLO EJECUTAR SI EL DIAGNÓSTICO CONFIRMÓ QUE LA VISTA TIENE FILTRO activo = true

-- Recrear la vista SIN filtro de usuarios activos
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

-- Verificación después del cambio
SELECT 
    'Después del cambio' as momento,
    activo,
    COUNT(*) as cantidad
FROM public.vista_usuarios_completa 
GROUP BY activo
ORDER BY activo;