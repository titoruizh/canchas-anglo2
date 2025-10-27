-- ================================================
-- ACTUALIZACIÓN: AGREGAR RECHAZO POR BESALCO
-- ================================================

-- Actualizar la función de trigger para incluir rechazo por Besalco
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
                WHEN NEW.estado_actual_id = 2 THEN 'Cancha enviada a Besalco para trabajo'
                WHEN NEW.estado_actual_id = 3 THEN 'Trabajo de maquinaria finalizado'
                WHEN NEW.estado_actual_id = 4 AND NEW.empresa_actual_id = 3 THEN 'Espesores validados por Linkapsis'
                WHEN NEW.estado_actual_id = 4 AND NEW.empresa_actual_id = 4 THEN 'Densidad validada por LlayLlay'
                WHEN NEW.estado_actual_id = 5 AND NEW.empresa_actual_id = 1 AND OLD.empresa_actual_id = 2 THEN 'Cancha rechazada por Besalco'
                WHEN NEW.estado_actual_id = 5 AND NEW.empresa_actual_id = 2 AND OLD.empresa_actual_id = 3 THEN 'Cancha rechazada por Linkapsis'
                WHEN NEW.estado_actual_id = 5 AND NEW.empresa_actual_id = 2 AND OLD.empresa_actual_id = 4 THEN 'Cancha rechazada por LlayLlay'
                WHEN NEW.estado_actual_id = 5 THEN 'Cancha rechazada, requiere retrabajo'
                WHEN NEW.estado_actual_id = 6 THEN 'Cancha cerrada por AngloAmerican'
                ELSE 'Cambio de estado'
            END,
            NEW.empresa_actual_id
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Verificar que la función se actualizó correctamente
SELECT 'Función de trigger actualizada para incluir rechazo por Besalco' AS status;