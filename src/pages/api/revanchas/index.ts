import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

/**
 * POST /api/revanchas
 * Procesar y guardar archivo de revanchas subido
 * 
 * Body esperado:
 * {
 *   muro: 'principal' | 'oeste' | 'este',
 *   fechaMedicion: 'YYYY-MM-DD',
 *   archivoNombre: 'string',
 *   archivoTipo: 'CSV' | 'XLSX',
 *   datos: Array<{
 *     sector: number,
 *     pk: string,
 *     coronamiento: number,
 *     revancha: number,
 *     lama: number,
 *     ancho: number,
 *     geomembrana: number,
 *     distGeoLama: number,
 *     distGeoCoronamiento: number
 *   }>,
 *   usuarioId: number
 * }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      muro, 
      fechaMedicion, 
      archivoNombre, 
      archivoTipo, 
      datos, 
      usuarioId 
    } = body;

    // Validaciones básicas
    if (!muro || !fechaMedicion || !archivoNombre || !archivoTipo || !datos) {
      return new Response(
        JSON.stringify({ 
          error: 'Faltan campos requeridos',
          detalles: { muro, fechaMedicion, archivoNombre, archivoTipo, totalDatos: datos?.length, usuarioId }
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(datos) || datos.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Datos deben ser un array no vacío' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Si no hay usuarioId, intentar obtenerlo de la sesión (opcional)
    console.log('📤 Usuario ID recibido:', usuarioId || 'null (anónimo)');

    // Normalizar muro: 'principal' -> 'Principal'
    const muroCapitalizado = muro.charAt(0).toUpperCase() + muro.slice(1);

    // Validar muro
    if (!['Principal', 'Este', 'Oeste'].includes(muroCapitalizado)) {
      return new Response(
        JSON.stringify({ error: 'Muro inválido. Debe ser: Principal, Este o Oeste' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extraer sectores únicos
    const sectoresIncluidos = [...new Set(datos.map(d => String(d.sector)))];

    console.log('📤 Insertando archivo de revanchas:', {
      muro: muroCapitalizado,
      fecha: fechaMedicion,
      archivo: archivoNombre,
      registros: datos.length,
      sectores: sectoresIncluidos
    });

    // PASO 1: Insertar metadata del archivo
    const { data: archivo, error: errorArchivo } = await supabase
      .from('revanchas_archivos')
      .insert({
        muro: muroCapitalizado,
        fecha_medicion: fechaMedicion,
        archivo_nombre: archivoNombre,
        archivo_tipo: archivoTipo.toUpperCase(),
        total_registros: datos.length,
        sectores_incluidos: sectoresIncluidos,
        usuario_id: usuarioId
      })
      .select()
      .single();

    if (errorArchivo) {
      console.error('❌ Error insertando archivo:', errorArchivo);
      
      // Si es error de duplicado (unique constraint)
      if (errorArchivo.code === '23505') {
        return new Response(
          JSON.stringify({ 
            error: `Ya existe un archivo para ${muroCapitalizado} con fecha ${fechaMedicion}`,
            codigo: 'ARCHIVO_DUPLICADO'
          }), 
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: 'Error al guardar metadata del archivo', 
          detalles: errorArchivo.message 
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Archivo insertado con ID:', archivo.id);

    // PASO 2: Preparar mediciones para inserción masiva
    const mediciones = datos.map(row => ({
      archivo_id: archivo.id,
      sector: String(row.sector),
      pk: String(row.pk || ''),
      coronamiento: row.coronamiento !== null && row.coronamiento !== undefined && row.coronamiento !== '' 
        ? parseFloat(String(row.coronamiento)) 
        : null,
      revancha: row.revancha !== null && row.revancha !== undefined && row.revancha !== '' 
        ? parseFloat(String(row.revancha)) 
        : null,
      lama: row.lama !== null && row.lama !== undefined && row.lama !== '' 
        ? parseFloat(String(row.lama)) 
        : null,
      ancho: row.ancho !== null && row.ancho !== undefined && row.ancho !== '' 
        ? parseFloat(String(row.ancho)) 
        : null,
      geomembrana: row.geomembrana !== null && row.geomembrana !== undefined && row.geomembrana !== '' 
        ? parseFloat(String(row.geomembrana)) 
        : null,
      dist_geo_lama: row.distGeoLama !== null && row.distGeoLama !== undefined && row.distGeoLama !== '' 
        ? parseFloat(String(row.distGeoLama)) 
        : null,
      dist_geo_coronamiento: row.distGeoCoronamiento !== null && row.distGeoCoronamiento !== undefined && row.distGeoCoronamiento !== '' 
        ? parseFloat(String(row.distGeoCoronamiento)) 
        : null
    }));

    console.log('📊 Insertando', mediciones.length, 'mediciones...');

    // PASO 3: Insertar mediciones (trigger calculará estadísticas automáticamente)
    const { error: errorMediciones } = await supabase
      .from('revanchas_mediciones')
      .insert(mediciones);

    if (errorMediciones) {
      console.error('❌ Error insertando mediciones:', errorMediciones);

      // Rollback: eliminar archivo creado
      console.log('🔄 Realizando rollback...');
      await supabase
        .from('revanchas_archivos')
        .delete()
        .eq('id', archivo.id);

      return new Response(
        JSON.stringify({ 
          error: 'Error al guardar mediciones', 
          detalles: errorMediciones.message 
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Mediciones insertadas exitosamente');

    // PASO 4: Verificar que las estadísticas se calcularon
    const { data: estadisticas, error: errorStats } = await supabase
      .from('revanchas_estadisticas')
      .select('*')
      .eq('archivo_id', archivo.id)
      .single();

    if (errorStats) {
      console.warn('⚠️ Advertencia: No se pudieron recuperar estadísticas:', errorStats.message);
    } else {
      console.log('📈 Estadísticas calculadas:', estadisticas);
    }

    // Respuesta exitosa
    return new Response(
      JSON.stringify({ 
        success: true, 
        mensaje: 'Archivo procesado exitosamente',
        data: {
          archivoId: archivo.id,
          muro: archivo.muro,
          fechaMedicion: archivo.fecha_medicion,
          totalRegistros: archivo.total_registros,
          sectores: archivo.sectores_incluidos,
          estadisticas: estadisticas || null
        }
      }), 
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error inesperado:', error);
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
 * GET /api/revanchas
 * Obtener archivos de revanchas con filtros opcionales
 * 
 * Query params:
 * - muro: 'Principal' | 'Este' | 'Oeste'
 * - fechaDesde: 'YYYY-MM-DD'
 * - fechaHasta: 'YYYY-MM-DD'
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const muro = url.searchParams.get('muro');
    const fechaDesde = url.searchParams.get('fechaDesde');
    const fechaHasta = url.searchParams.get('fechaHasta');

    let query = supabase
      .from('vista_revanchas_archivos')
      .select('*');

    if (muro) {
      query = query.eq('muro', muro);
    }

    if (fechaDesde) {
      query = query.gte('fecha_medicion', fechaDesde);
    }

    if (fechaHasta) {
      query = query.lte('fecha_medicion', fechaHasta);
    }

    const { data, error } = await query.order('fecha_medicion', { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Error al obtener archivos', detalles: error.message }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error en GET /api/revanchas:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor', 
        detalles: error instanceof Error ? error.message : 'Error desconocido' 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
