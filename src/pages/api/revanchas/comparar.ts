import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

/**
 * GET /api/revanchas/comparar
 * Comparar mediciones entre dos archivos de revanchas
 * 
 * Query params:
 * - anteriorId: ID del archivo anterior
 * - actualId: ID del archivo actual
 * 
 * O para comparar últimas dos mediciones de un muro:
 * - muro: 'Principal' | 'Este' | 'Oeste'
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const anteriorId = url.searchParams.get('anteriorId');
    const actualId = url.searchParams.get('actualId');
    const muro = url.searchParams.get('muro');

    // Si se especifica muro, obtener últimas dos mediciones automáticamente
    if (muro && !anteriorId && !actualId) {
      const { data: archivos, error: errorArchivos } = await supabase
        .from('revanchas_archivos')
        .select('id, fecha_medicion')
        .eq('muro', muro)
        .order('fecha_medicion', { ascending: false })
        .limit(2);

      if (errorArchivos || !archivos || archivos.length < 2) {
        return new Response(
          JSON.stringify({ 
            error: 'Se necesitan al menos 2 archivos del mismo muro para comparar' 
          }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Usar las últimas dos
      return await compararArchivos(archivos[1].id, archivos[0].id);
    }

    // Si se especifican IDs directamente
    if (anteriorId && actualId) {
      return await compararArchivos(parseInt(anteriorId), parseInt(actualId));
    }

    return new Response(
      JSON.stringify({ 
        error: 'Debes especificar "muro" o ambos "anteriorId" y "actualId"' 
      }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error en GET /api/revanchas/comparar:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor', 
        detalles: error instanceof Error ? error.message : 'Error desconocido' 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Función auxiliar para comparar dos archivos
 */
async function compararArchivos(anteriorId: number, actualId: number) {
  // Obtener metadata de ambos archivos
  const { data: anterior, error: errorAnterior } = await supabase
    .from('revanchas_archivos')
    .select('*')
    .eq('id', anteriorId)
    .single();

  const { data: actual, error: errorActual } = await supabase
    .from('revanchas_archivos')
    .select('*')
    .eq('id', actualId)
    .single();

  if (errorAnterior || errorActual || !anterior || !actual) {
    return new Response(
      JSON.stringify({ error: 'Uno o ambos archivos no encontrados' }), 
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validar que sean del mismo muro
  if (anterior.muro !== actual.muro) {
    return new Response(
      JSON.stringify({ 
        error: 'Los archivos deben ser del mismo muro',
        detalles: { anterior: anterior.muro, actual: actual.muro }
      }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Obtener mediciones de ambos archivos
  const { data: medicionesAnterior } = await supabase
    .from('revanchas_mediciones')
    .select('*')
    .eq('archivo_id', anteriorId)
    .order('sector')
    .order('pk');

  const { data: medicionesActual } = await supabase
    .from('revanchas_mediciones')
    .select('*')
    .eq('archivo_id', actualId)
    .order('sector')
    .order('pk');

  if (!medicionesAnterior || !medicionesActual) {
    return new Response(
      JSON.stringify({ error: 'Error al obtener mediciones' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Crear mapa de mediciones anteriores por sector-pk
  const mapaAnterior = new Map(
    medicionesAnterior.map(m => [`${m.sector}-${m.pk}`, m])
  );

  // Umbrales de alerta
  const UMBRAL_REVANCHA = 0.3; // 30cm de diferencia
  const UMBRAL_ANCHO = 1.0; // 1m de diferencia
  const UMBRAL_CORONAMIENTO = 0.5; // 50cm de diferencia

  // Calcular comparaciones
  const comparaciones = medicionesActual
    .map(actual => {
      const clave = `${actual.sector}-${actual.pk}`;
      const anterior = mapaAnterior.get(clave);

      if (!anterior) {
        return {
          sector: actual.sector,
          pk: actual.pk,
          estado: 'NUEVO',
          mensaje: 'Punto no existía en medición anterior'
        };
      }

      const diffRevancha = actual.revancha !== null && anterior.revancha !== null 
        ? actual.revancha - anterior.revancha 
        : null;
      
      const diffAncho = actual.ancho !== null && anterior.ancho !== null 
        ? actual.ancho - anterior.ancho 
        : null;
      
      const diffCoronamiento = actual.coronamiento !== null && anterior.coronamiento !== null 
        ? actual.coronamiento - anterior.coronamiento 
        : null;

      const alertaRevancha = diffRevancha !== null && Math.abs(diffRevancha) > UMBRAL_REVANCHA;
      const alertaAncho = diffAncho !== null && Math.abs(diffAncho) > UMBRAL_ANCHO;
      const alertaCoronamiento = diffCoronamiento !== null && Math.abs(diffCoronamiento) > UMBRAL_CORONAMIENTO;

      return {
        sector: actual.sector,
        pk: actual.pk,
        anterior: {
          revancha: anterior.revancha,
          ancho: anterior.ancho,
          coronamiento: anterior.coronamiento
        },
        actual: {
          revancha: actual.revancha,
          ancho: actual.ancho,
          coronamiento: actual.coronamiento
        },
        diferencias: {
          revancha: diffRevancha,
          ancho: diffAncho,
          coronamiento: diffCoronamiento
        },
        alertas: {
          revancha: alertaRevancha,
          ancho: alertaAncho,
          coronamiento: alertaCoronamiento
        },
        tieneAlertas: alertaRevancha || alertaAncho || alertaCoronamiento
      };
    })
    .filter(c => c !== null);

  // Calcular resumen
  const totalPuntos = comparaciones.length;
  const puntosConAlertas = comparaciones.filter(c => c.tieneAlertas).length;
  const alertasRevancha = comparaciones.filter(c => c.alertas?.revancha).length;
  const alertasAncho = comparaciones.filter(c => c.alertas?.ancho).length;
  const alertasCoronamiento = comparaciones.filter(c => c.alertas?.coronamiento).length;

  return new Response(
    JSON.stringify({ 
      success: true,
      metadata: {
        anterior: {
          id: anterior.id,
          muro: anterior.muro,
          fecha: anterior.fecha_medicion,
          archivo: anterior.archivo_nombre
        },
        actual: {
          id: actual.id,
          muro: actual.muro,
          fecha: actual.fecha_medicion,
          archivo: actual.archivo_nombre
        }
      },
      resumen: {
        totalPuntos,
        puntosConAlertas,
        alertasPorTipo: {
          revancha: alertasRevancha,
          ancho: alertasAncho,
          coronamiento: alertasCoronamiento
        },
        umbrales: {
          revancha: UMBRAL_REVANCHA,
          ancho: UMBRAL_ANCHO,
          coronamiento: UMBRAL_CORONAMIENTO
        }
      },
      comparaciones
    }), 
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * POST /api/revanchas/comparar
 * Guardar comparación en la base de datos (tabla revanchas_comparaciones)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const { anteriorId, actualId } = await request.json();

    if (!anteriorId || !actualId) {
      return new Response(
        JSON.stringify({ error: 'anteriorId y actualId son requeridos' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener comparación calculada
    const response = await compararArchivos(anteriorId, actualId);
    const responseData = await response.json();

    if (!responseData.success) {
      return response;
    }

    // Preparar datos para insertar
    const comparaciones = responseData.comparaciones
      .filter((c: any) => c.estado !== 'NUEVO') // Solo guardar puntos que existen en ambos
      .map((c: any) => ({
        archivo_anterior_id: anteriorId,
        archivo_actual_id: actualId,
        sector: c.sector,
        pk: c.pk,
        diff_coronamiento: c.diferencias.coronamiento,
        diff_revancha: c.diferencias.revancha,
        diff_ancho: c.diferencias.ancho,
        alerta_revancha: c.alertas.revancha,
        alerta_ancho: c.alertas.ancho,
        alerta_coronamiento: c.alertas.coronamiento
      }));

    // Insertar en base de datos
    const { error } = await supabase
      .from('revanchas_comparaciones')
      .insert(comparaciones);

    if (error) {
      // Si ya existe, actualizar
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Esta comparación ya existe en la base de datos',
            codigo: 'COMPARACION_DUPLICADA'
          }), 
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: 'Error al guardar comparación', 
          detalles: error.message 
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        mensaje: 'Comparación guardada exitosamente',
        totalRegistros: comparaciones.length
      }), 
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error en POST /api/revanchas/comparar:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor', 
        detalles: error instanceof Error ? error.message : 'Error desconocido' 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
