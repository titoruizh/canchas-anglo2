-- =====================================================
-- SCRIPT PARA AGREGAR CAMPOS DE USUARIO VALIDADOR
-- Ejecutar en Supabase SQL Editor después de usuarios_roles_setup.sql
-- =====================================================

-- 1. Agregar columnas para usuario validador en tabla validaciones
ALTER TABLE public.validaciones 
ADD COLUMN IF NOT EXISTS usuario_validador_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS usuario_validador_nombre VARCHAR(200);

-- 2. Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_validaciones_usuario_validador ON public.validaciones(usuario_validador_id);

-- 3. Actualizar la vista para incluir información del usuario validador (mantener estructura existente)
CREATE OR REPLACE VIEW public.vista_canchas_completa AS
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
    c.numero_informe,
    c.poligono_coordenadas,
    -- Agregar información de validaciones con usuarios ordenadas correctamente
    (
        SELECT json_agg(
            json_build_object(
                'id', sub.id,
                'empresa_validadora_id', sub.empresa_validadora_id,
                'tipo_validacion', sub.tipo_validacion,
                'resultado', sub.resultado,
                'observaciones', sub.observaciones,
                'mediciones', sub.mediciones,
                'created_at', sub.created_at,
                'is_revalidacion', sub.is_revalidacion,
                'usuario_validador_id', sub.usuario_validador_id,
                'usuario_validador_nombre', sub.usuario_validador_nombre,
                'empresa', sub.empresa_nombre
            ) ORDER BY sub.created_at
        )
        FROM (
            SELECT 
                v.id,
                v.empresa_validadora_id,
                v.tipo_validacion,
                v.resultado,
                v.observaciones,
                v.mediciones,
                v.created_at,
                v.is_revalidacion,
                v.usuario_validador_id,
                v.usuario_validador_nombre,
                ev.nombre as empresa_nombre
            FROM public.validaciones v
            LEFT JOIN public.empresas ev ON v.empresa_validadora_id = ev.id
            WHERE v.cancha_id = c.id
            ORDER BY v.created_at
        ) sub
    ) as validaciones
FROM public.canchas c
LEFT JOIN public.estados_cancha ec ON c.estado_actual_id = ec.id
LEFT JOIN public.empresas emp ON c.empresa_actual_id = emp.id
LEFT JOIN public.empresas created_emp ON c.created_by = created_emp.id;

-- 4. Comentario sobre uso
COMMENT ON COLUMN public.validaciones.usuario_validador_id IS 'ID del usuario que realizó la validación (puede ser NULL para validaciones antiguas)';
COMMENT ON COLUMN public.validaciones.usuario_validador_nombre IS 'Nombre del usuario que realizó la validación (guardado para historial, puede diferir del nombre actual del usuario)';

-- Verificar que las columnas se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'validaciones' 
AND column_name IN ('usuario_validador_id', 'usuario_validador_nombre')
ORDER BY ordinal_position;