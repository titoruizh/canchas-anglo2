import { CanchaService } from '../../../../lib/supabase'
import type { APIRoute } from 'astro'

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const canchaId = parseInt(params.id!)
    const { accion, observaciones, mediciones, usuario } = await request.json()
    
    console.log('API Debug - Acción recibida:', accion)
    console.log('API Debug - Observaciones:', observaciones)
    console.log('API Debug - Mediciones:', mediciones)
    console.log('API Debug - Usuario:', usuario)
    console.log('API Debug - CanchaID:', canchaId)
    
    if (!canchaId || !accion) {
      return new Response(JSON.stringify({ message: 'Faltan datos requeridos' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
    
    switch (accion) {
      case 'enviar_besalco':
        await CanchaService.enviarABesalco(canchaId)
        break
      case 'finalizar_besalco':
        await CanchaService.finalizarBesalco(canchaId, observaciones, usuario)
        break
      case 'rechazar_besalco':
        console.log('API Debug - Ejecutando rechazo por Besalco...')
        await CanchaService.rechazarBesalco(canchaId, observaciones)
        console.log('API Debug - Rechazo por Besalco completado')
        break
      case 'validar_linkapsis':
        await CanchaService.validarLinkapsis(canchaId, true, observaciones, mediciones, false, usuario)
        break
      case 'rechazar_linkapsis':
        await CanchaService.validarLinkapsis(canchaId, false, observaciones, undefined, false, usuario)
        break
      case 'validar_llay_llay':
        await CanchaService.validarLlayLlay(canchaId, true, observaciones, mediciones, false, usuario)
        break
      case 'rechazar_llay_llay':
        await CanchaService.validarLlayLlay(canchaId, false, observaciones, undefined, false, usuario)
        break
      case 'cerrar_cancha':
        await CanchaService.cerrarCancha(canchaId)
        break
      case 'borrar_cancha':
        await CanchaService.borrarCancha(canchaId)
        break
      default:
        console.log('API Debug - Acción no reconocida:', accion)
        return new Response(JSON.stringify({ message: 'Acción no válida: ' + accion }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        })
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error: any) {
    console.error('API Debug - Error en API:', error)
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}