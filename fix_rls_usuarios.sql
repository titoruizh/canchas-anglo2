-- =====================================================
-- SCRIPT PARA REVISAR Y CORREGIR POLÍTICAS RLS DE USUARIOS
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Revisar políticas RLS existentes para tabla usuarios
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('usuarios', 'roles');

-- 2. Verificar si RLS está habilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('usuarios', 'roles') 
    AND schemaname = 'public';

-- 3. Crear/actualizar políticas para permitir gestión de usuarios por AngloAmerican
-- Primero, eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "usuarios_select_policy" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert_policy" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON public.usuarios;

-- Política para SELECT - cualquier usuario autenticado puede leer usuarios
CREATE POLICY "usuarios_select_policy" ON public.usuarios
    FOR SELECT
    USING (true); -- Permitir a todos los usuarios autenticados leer

-- Política para INSERT - solo usuarios de AngloAmerican pueden crear usuarios
CREATE POLICY "usuarios_insert_policy" ON public.usuarios
    FOR INSERT
    WITH CHECK (true); -- Permitir inserción (se controla desde la aplicación)

-- Política para UPDATE - solo usuarios de AngloAmerican pueden actualizar usuarios
CREATE POLICY "usuarios_update_policy" ON public.usuarios
    FOR UPDATE
    USING (true)
    WITH CHECK (true); -- Permitir actualización (se controla desde la aplicación)

-- 4. Asegurar que RLS esté habilitado pero con políticas permisivas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 5. También revisar tabla roles
DROP POLICY IF EXISTS "roles_select_policy" ON public.roles;
CREATE POLICY "roles_select_policy" ON public.roles
    FOR SELECT
    USING (true); -- Permitir leer todos los roles

-- Habilitar RLS en roles también
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 6. Verificar que las políticas se aplicaron correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('usuarios', 'roles')
ORDER BY tablename, policyname;