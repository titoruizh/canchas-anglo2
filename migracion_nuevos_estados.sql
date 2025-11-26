-- ================================================
-- MIGRACIÓN: ACTUALIZAR ESTADOS DEL SISTEMA
-- ================================================
-- Fecha: 2025-11-26
-- Descripción: Incorporar nuevos estados "En Espera", "Rechazada en Espera" y "Validada"
--              Eliminar estados no utilizados "Finalizada"

-- ================================================
-- PASO 1: AGREGAR NUEVOS ESTADOS
-- ================================================

-- Insertar el nuevo estado "En Espera" (id: 7)
INSERT INTO estados_cancha (nombre, descripcion) VALUES 
    ('En Espera', 'Cancha asignada a empresa pero aún no tomada para ejecución');

-- Insertar el nuevo estado "Rechazada, en Espera" (id: 8)
INSERT INTO estados_cancha (nombre, descripcion) VALUES 
    ('Rechazada, en Espera', 'Cancha rechazada y devuelta a empresa, pendiente de ser retomada');

-- Actualizar la descripción del estado "Validada" para clarificar su uso
UPDATE estados_cancha 
SET descripcion = 'Cancha completamente validada por todas las empresas, lista para cierre por AngloAmerican'
WHERE id = 4;

-- ================================================
-- PASO 2: VERIFICAR ESTADOS ACTUALES
-- ================================================

-- Ver todos los estados después de la migración
SELECT 
    id,
    nombre,
    descripcion,
    CASE 
        WHEN id IN (1, 2, 5, 6) THEN '✅ ACTIVO (en uso actual)'
        WHEN id = 3 THEN '⚠️ DEPRECADO (nunca usado)'
        WHEN id = 4 THEN '🆕 NUEVO USO (validación completa)'
        WHEN id IN (7, 8) THEN '🆕 NUEVO ESTADO'
    END as estado_uso
FROM estados_cancha
ORDER BY id;

-- ================================================
-- PASO 3: ACTUALIZAR TRIGGER DE HISTORIAL
-- ================================================

-- Actualizar la función de registro de cambios para incluir los nuevos estados
CREATE OR REPLACE FUNCTION registrar_cambio_cancha()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar si hay cambios en estado o empresa
    IF (OLD.estado_actual_id != NEW.estado_actual_id OR OLD.empresa_actual_id != NEW.empresa_actual_id) THEN
        INSERT INTO historial_cancha (
            cancha_id,
            estado_anterior_id,
            estado_nuevo_id,
            empresa_anterior_id,
            empresa_nueva_id,
            accion,
            created_by
        ) VALUES (
            NEW.id,
            OLD.estado_actual_id,
            NEW.estado_actual_id,
            OLD.empresa_actual_id,
            NEW.empresa_actual_id,
            CASE 
                -- Estados de creación
                WHEN NEW.estado_actual_id = 1 THEN 'Cancha creada por AngloAmerican'
                
                -- Estados de "En Espera" (nuevo)
                WHEN NEW.estado_actual_id = 7 AND NEW.empresa_actual_id = 2 THEN 'Cancha asignada a Besalco - En espera de ser tomada'
                WHEN NEW.estado_actual_id = 7 AND NEW.empresa_actual_id = 3 THEN 'Cancha asignada a Linkapsis - En espera de validación'
                WHEN NEW.estado_actual_id = 7 AND NEW.empresa_actual_id = 4 THEN 'Cancha asignada a LlayLlay - En espera de validación'
                
                -- Estados de "En Proceso"
                WHEN NEW.estado_actual_id = 2 AND NEW.empresa_actual_id = 2 THEN 'Besalco tomó la cancha - En ejecución'
                WHEN NEW.estado_actual_id = 2 AND NEW.empresa_actual_id = 3 THEN 'Linkapsis tomó la cancha - Validando espesores'
                WHEN NEW.estado_actual_id = 2 AND NEW.empresa_actual_id = 4 THEN 'LlayLlay tomó la cancha - Validando densidad'
                
                -- Estados de "Rechazada, en Espera" (nuevo)
                WHEN NEW.estado_actual_id = 8 AND NEW.empresa_actual_id = 2 THEN 'Cancha rechazada devuelta a Besalco - En espera de retrabajo'
                
                -- Estados de rechazo activo
                WHEN NEW.estado_actual_id = 5 AND NEW.empresa_actual_id = 2 AND OLD.empresa_actual_id = 2 THEN 'Besalco rechazó su propio trabajo'
                WHEN NEW.estado_actual_id = 5 AND NEW.empresa_actual_id = 2 AND OLD.empresa_actual_id = 3 THEN 'Linkapsis rechazó espesores - Devuelta a Besalco'
                WHEN NEW.estado_actual_id = 5 AND NEW.empresa_actual_id = 2 AND OLD.empresa_actual_id = 4 THEN 'LlayLlay rechazó densidad - Devuelta a Besalco'
                
                -- Estado de "Validada" (nuevo uso)
                WHEN NEW.estado_actual_id = 4 AND NEW.empresa_actual_id = 1 THEN 'Cancha completamente validada - Lista para cierre por AngloAmerican'
                
                -- Estado de cierre
                WHEN NEW.estado_actual_id = 6 THEN 'Cancha cerrada definitivamente por AngloAmerican'
                
                ELSE 'Cambio de estado'
            END,
            NEW.empresa_actual_id
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ================================================
-- PASO 4: CONSULTAS DE VERIFICACIÓN
-- ================================================

-- Verificar que los nuevos estados se crearon correctamente
SELECT 'Estados creados:' as verificacion;
SELECT id, nombre, descripcion FROM estados_cancha WHERE id IN (7, 8);

-- Verificar estados en uso actualmente
SELECT 'Estados en uso actual:' as verificacion;
SELECT 
    ec.nombre as estado,
    COUNT(*) as cantidad_canchas
FROM canchas c
JOIN estados_cancha ec ON c.estado_actual_id = ec.id
GROUP BY ec.nombre
ORDER BY cantidad_canchas DESC;

-- ================================================
-- PASO 5: NOTAS PARA DESARROLLO
-- ================================================

/*
NOTAS PARA IMPLEMENTACIÓN EN EL CÓDIGO:

FLUJO ACTUALIZADO:
1. AngloAmerican crea cancha → Estado: "Creada" (id: 1)
2. AngloAmerican envía a Besalco → Estado: "En Espera" (id: 7, empresa: Besalco)
3. Besalco "toma" la cancha → Estado: "En Proceso" (id: 2, empresa: Besalco)
4. Besalco finaliza trabajo → Estado: "En Espera" (id: 7, empresa: Linkapsis)
5. Linkapsis "toma" la cancha → Estado: "En Proceso" (id: 2, empresa: Linkapsis)
6. Linkapsis valida/rechaza:
   - ✅ Valida → Estado: "En Espera" (id: 7, empresa: LlayLlay)
   - ❌ Rechaza → Estado: "Rechazada, en Espera" (id: 8, empresa: Besalco)
7. Si fue rechazada, Besalco "retoma" → Estado: "En Proceso" (id: 2, empresa: Besalco)
8. LlayLlay "toma" la cancha → Estado: "En Proceso" (id: 2, empresa: LlayLlay)
9. LlayLlay valida/rechaza:
   - ✅ Valida → Estado: "Validada" (id: 4, empresa: AngloAmerican)
   - ❌ Rechaza → Estado: "Rechazada, en Espera" (id: 8, empresa: Besalco)
10. AngloAmerican cierra cancha → Estado: "Cerrada" (id: 6)

NUEVAS ACCIONES NECESARIAS EN EL FRONTEND:
- Botón "Tomar Cancha" para cambiar de "En Espera" → "En Proceso"
- Botón "Retomar Cancha" para cambiar de "Rechazada, en Espera" → "En Proceso"
- Botón "Cerrar Cancha" solo disponible cuando estado = "Validada"

IDs DE ESTADOS:
1 = Creada
2 = En Proceso
3 = Finalizada (DEPRECADO - no usar)
4 = Validada (nuevo uso: cancha lista para cierre)
5 = Rechazada (DEPRECADO en favor de estado 8)
6 = Cerrada
7 = En Espera (NUEVO)
8 = Rechazada, en Espera (NUEVO)
*/

-- ================================================
-- FIN DE MIGRACIÓN
-- ================================================

SELECT '✅ Migración completada exitosamente' as resultado;
