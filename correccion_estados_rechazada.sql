-- ================================================
-- CORRECCIÓN: ELIMINAR ESTADO "RECHAZADA" ANTIGUO
-- ================================================
-- Fecha: 2025-11-26
-- Descripción: Migrar de "Rechazada" (id: 5) a "Rechazada, en Espera" (id: 8)
--              para mantener consistencia con "En Espera"

-- ================================================
-- PASO 1: MIGRAR CANCHAS EXISTENTES
-- ================================================

-- Actualizar canchas que están en estado "Rechazada" (id: 5) 
-- para que pasen a "Rechazada, en Espera" (id: 8)
UPDATE canchas
SET estado_actual_id = 8
WHERE estado_actual_id = 5;

-- Verificar cambio
SELECT 'Canchas migradas de Rechazada a Rechazada, en Espera:' as verificacion;
SELECT COUNT(*) as cantidad_migradas FROM canchas WHERE estado_actual_id = 8;

-- ================================================
-- PASO 2: ACTUALIZAR HISTORIAL (OPCIONAL)
-- ================================================

-- Actualizar registros históricos para consistencia
-- NOTA: Esto es opcional, solo si quieres limpiar el historial antiguo
UPDATE historial_cancha
SET estado_nuevo_id = 8
WHERE estado_nuevo_id = 5;

UPDATE historial_cancha
SET estado_anterior_id = 8
WHERE estado_anterior_id = 5;

-- ================================================
-- PASO 3: MARCAR ESTADO ANTIGUO COMO DEPRECADO
-- ================================================

-- Actualizar descripción para marcar como deprecado
UPDATE estados_cancha 
SET descripcion = '⚠️ DEPRECADO - Usar estado 8 "Rechazada, en Espera"',
    nombre = '⚠️ Rechazada (deprecado)'
WHERE id = 5;

-- ================================================
-- PASO 4: ACTUALIZAR TRIGGER FINAL
-- ================================================

-- Actualizar la función de registro de cambios SIN usar estado 5
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
                
                -- Estados de "En Espera"
                WHEN NEW.estado_actual_id = 7 AND NEW.empresa_actual_id = 2 THEN 'Cancha asignada a Besalco - En espera de ser tomada'
                WHEN NEW.estado_actual_id = 7 AND NEW.empresa_actual_id = 3 THEN 'Cancha asignada a Linkapsis - En espera de validación'
                WHEN NEW.estado_actual_id = 7 AND NEW.empresa_actual_id = 4 THEN 'Cancha asignada a LlayLlay - En espera de validación'
                
                -- Estados de "En Proceso"
                WHEN NEW.estado_actual_id = 2 AND NEW.empresa_actual_id = 2 THEN 'Besalco tomó la cancha - En ejecución'
                WHEN NEW.estado_actual_id = 2 AND NEW.empresa_actual_id = 3 THEN 'Linkapsis tomó la cancha - Validando espesores'
                WHEN NEW.estado_actual_id = 2 AND NEW.empresa_actual_id = 4 THEN 'LlayLlay tomó la cancha - Validando densidad'
                
                -- Estados de "Rechazada, en Espera"
                WHEN NEW.estado_actual_id = 8 AND NEW.empresa_actual_id = 2 AND OLD.empresa_actual_id = 3 THEN 'Linkapsis rechazó espesores - Devuelta a Besalco en espera'
                WHEN NEW.estado_actual_id = 8 AND NEW.empresa_actual_id = 2 AND OLD.empresa_actual_id = 4 THEN 'LlayLlay rechazó densidad - Devuelta a Besalco en espera'
                WHEN NEW.estado_actual_id = 8 AND NEW.empresa_actual_id = 2 THEN 'Cancha rechazada - Devuelta a Besalco en espera de retrabajo'
                
                -- Estado de "Validada"
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
-- PASO 5: VERIFICACIÓN FINAL
-- ================================================

-- Ver todos los estados actuales
SELECT 
    id,
    nombre,
    descripcion,
    CASE 
        WHEN id IN (1, 2, 4, 6, 7, 8) THEN '✅ ACTIVO'
        WHEN id IN (3, 5) THEN '⚠️ DEPRECADO'
    END as estado_uso
FROM estados_cancha
ORDER BY id;

-- Ver distribución de canchas por estado
SELECT 
    ec.nombre as estado,
    COUNT(*) as cantidad_canchas
FROM canchas c
JOIN estados_cancha ec ON c.estado_actual_id = ec.id
GROUP BY ec.nombre
ORDER BY cantidad_canchas DESC;

-- Verificar que no hay canchas en estado 5
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No hay canchas en estado Rechazada antiguo'
        ELSE '⚠️ Aún hay ' || COUNT(*) || ' canchas en estado antiguo'
    END as verificacion_estado_5
FROM canchas
WHERE estado_actual_id = 5;

-- ================================================
-- RESUMEN DE ESTADOS FINALES
-- ================================================

/*
ESTADOS ACTIVOS FINALES:

ID | Nombre                  | Uso
---+------------------------+------------------------------------------
1  | Creada                 | Cancha recién creada
2  | En Proceso             | Cancha siendo ejecutada por alguna empresa
4  | Validada               | Cancha lista para cierre por AngloAmerican
6  | Cerrada                | Cancha cerrada definitivamente
7  | En Espera              | Cancha asignada pero no tomada
8  | Rechazada, en Espera   | Cancha rechazada, en espera de retrabajo

ESTADOS DEPRECADOS:

ID | Nombre                  | Razón
---+------------------------+------------------------------------------
3  | Finalizada             | Nunca se usó en el flujo
5  | Rechazada              | Reemplazado por estado 8 para consistencia

FLUJO FINAL:
1. Creada → 7. En Espera (Besalco)
2. 7 → 2. En Proceso (Besalco toma)
3. 2 → 7. En Espera (Linkapsis)
4. 7 → 2. En Proceso (Linkapsis toma)
5A. 2 → 7. En Espera (Linkapsis valida → LlayLlay)
5B. 2 → 8. Rechazada en Espera (Linkapsis rechaza → Besalco)
6. 8 → 2. En Proceso (Besalco retoma)
7. 7 → 2. En Proceso (LlayLlay toma)
8A. 2 → 4. Validada (LlayLlay valida → AngloAmerican)
8B. 2 → 8. Rechazada en Espera (LlayLlay rechaza → Besalco)
9. 4 → 6. Cerrada (AngloAmerican cierra)
*/

-- ================================================
-- FIN DE CORRECCIÓN
-- ================================================

SELECT '✅ Corrección completada - Estado "Rechazada, en Espera" es ahora el estándar' as resultado;
