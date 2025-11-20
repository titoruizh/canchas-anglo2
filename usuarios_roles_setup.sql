-- =====================================================
-- SCRIPT PARA CREAR TABLAS DE USUARIOS Y ROLES
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Crear tabla de roles
CREATE TABLE IF NOT EXISTS public.roles (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    empresa_id BIGINT NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraint para evitar roles duplicados por empresa
    UNIQUE(nombre, empresa_id)
);

-- 2. Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre_completo VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    empresa_id BIGINT NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    rol_id BIGINT NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    activo BOOLEAN DEFAULT true NOT NULL,
    password_hash VARCHAR(255), -- Para autenticación básica (desarrollo)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraint para evitar usuarios duplicados por empresa
    UNIQUE(nombre_completo, empresa_id)
);

-- 3. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_roles_empresa_id ON public.roles(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON public.usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_id ON public.usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON public.usuarios(activo);

-- 4. Crear vista para usuarios completos con información de empresa y rol
-- NOTA: Incluye TODOS los usuarios (activos e inactivos) para permitir gestión completa
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

-- 5. Insertar roles predeterminados para cada empresa existente

-- Roles para AngloAmerican (ID 1)
INSERT INTO public.roles (nombre, empresa_id, descripcion) VALUES
('Ingeniero QA/QC', 1, 'Ingeniero de Control de Calidad'),
('Jefe de Operaciones', 1, 'Responsable de Operaciones')
ON CONFLICT (nombre, empresa_id) DO NOTHING;

-- Roles para Besalco (ID 2)
INSERT INTO public.roles (nombre, empresa_id, descripcion) VALUES
('Admin', 2, 'Administrador de la empresa'),
('Operador', 2, 'Operador de campo')
ON CONFLICT (nombre, empresa_id) DO NOTHING;

-- Roles para Linkapsis (ID 3)
INSERT INTO public.roles (nombre, empresa_id, descripcion) VALUES
('Admin', 3, 'Administrador de la empresa'),
('Operador', 3, 'Operador de campo')
ON CONFLICT (nombre, empresa_id) DO NOTHING;

-- Roles para LlayLlay (ID 4)
INSERT INTO public.roles (nombre, empresa_id, descripcion) VALUES
('Admin', 4, 'Administrador de la empresa'),
('Operador', 4, 'Operador de campo')
ON CONFLICT (nombre, empresa_id) DO NOTHING;

-- 6. Insertar usuarios de ejemplo para cada empresa

-- Usuarios para AngloAmerican
DO $$
DECLARE
    rol_qaqc_id BIGINT;
    rol_jefe_id BIGINT;
BEGIN
    -- Obtener IDs de roles
    SELECT id INTO rol_qaqc_id FROM public.roles WHERE nombre = 'Ingeniero QA/QC' AND empresa_id = 1;
    SELECT id INTO rol_jefe_id FROM public.roles WHERE nombre = 'Jefe de Operaciones' AND empresa_id = 1;
    
    -- Insertar usuarios
    INSERT INTO public.usuarios (nombre_completo, email, empresa_id, rol_id, password_hash) VALUES
    ('Juan Pérez González', 'juan.perez@angloamerican.com', 1, rol_qaqc_id, '123'),
    ('María Rodriguez Silva', 'maria.rodriguez@angloamerican.com', 1, rol_jefe_id, '123')
    ON CONFLICT (nombre_completo, empresa_id) DO NOTHING;
END $$;

-- Usuarios para Besalco
DO $$
DECLARE
    rol_admin_id BIGINT;
    rol_operador_id BIGINT;
BEGIN
    SELECT id INTO rol_admin_id FROM public.roles WHERE nombre = 'Admin' AND empresa_id = 2;
    SELECT id INTO rol_operador_id FROM public.roles WHERE nombre = 'Operador' AND empresa_id = 2;
    
    INSERT INTO public.usuarios (nombre_completo, email, empresa_id, rol_id, password_hash) VALUES
    ('Carlos Mendez Torres', 'carlos.mendez@besalco.com', 2, rol_admin_id, '123'),
    ('Ana López Morales', 'ana.lopez@besalco.com', 2, rol_operador_id, '123')
    ON CONFLICT (nombre_completo, empresa_id) DO NOTHING;
END $$;

-- Usuarios para Linkapsis
DO $$
DECLARE
    rol_admin_id BIGINT;
    rol_operador_id BIGINT;
BEGIN
    SELECT id INTO rol_admin_id FROM public.roles WHERE nombre = 'Admin' AND empresa_id = 3;
    SELECT id INTO rol_operador_id FROM public.roles WHERE nombre = 'Operador' AND empresa_id = 3;
    
    INSERT INTO public.usuarios (nombre_completo, email, empresa_id, rol_id, password_hash) VALUES
    ('Roberto Sanchez Castro', 'roberto.sanchez@linkapsis.com', 3, rol_admin_id, '123'),
    ('Patricia Díaz Herrera', 'patricia.diaz@linkapsis.com', 3, rol_operador_id, '123')
    ON CONFLICT (nombre_completo, empresa_id) DO NOTHING;
END $$;

-- Usuarios para LlayLlay
DO $$
DECLARE
    rol_admin_id BIGINT;
    rol_operador_id BIGINT;
BEGIN
    SELECT id INTO rol_admin_id FROM public.roles WHERE nombre = 'Admin' AND empresa_id = 4;
    SELECT id INTO rol_operador_id FROM public.roles WHERE nombre = 'Operador' AND empresa_id = 4;
    
    INSERT INTO public.usuarios (nombre_completo, email, empresa_id, rol_id, password_hash) VALUES
    ('Miguel Fernandez Ramos', 'miguel.fernandez@llayllay.com', 4, rol_admin_id, '123'),
    ('Valentina Castro Núñez', 'valentina.castro@llayllay.com', 4, rol_operador_id, '123')
    ON CONFLICT (nombre_completo, empresa_id) DO NOTHING;
END $$;

-- 7. Habilitar Row Level Security (RLS) para seguridad
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 8. Crear políticas básicas de seguridad (ajustar según necesidades)
CREATE POLICY "Usuarios pueden ver roles de su empresa" ON public.roles
    FOR SELECT USING (true); -- Por ahora permisivo para desarrollo

CREATE POLICY "Usuarios pueden ver otros usuarios de su empresa" ON public.usuarios
    FOR SELECT USING (true); -- Por ahora permisivo para desarrollo

-- 9. Crear función para trigger de updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Crear trigger para actualizar updated_at automáticamente
CREATE TRIGGER trigger_usuarios_updated_at
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Verificar creación exitosa
SELECT 'Tablas y datos creados exitosamente' AS status;
SELECT 'Roles creados: ' || COUNT(*) FROM public.roles;
SELECT 'Usuarios creados: ' || COUNT(*) FROM public.usuarios;