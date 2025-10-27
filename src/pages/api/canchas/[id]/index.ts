import { CanchaService } from '../../../../lib/supabase'
import type { APIRoute } from 'astro'

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const canchaId = parseInt(params.id!)
    const { accion, observaciones } = await request.json()
    
    console.log('Acción recibida:', accion) // Debug
    console.log('Observaciones:', observaciones) // Debug
    
    if (!canchaId || !accion) {
      return new Response(JSON.stringify({ message: 'Faltan datos requeridos' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
    
    switch (accion) {
      case 'enviar-besalco':
        await CanchaService.enviarABesalco(canchaId)
        break
      case 'finalizar-trabajo':
        await CanchaService.finalizarTrabajo(canchaId)
        break
      case 'rechazar-besalco':
        console.log('Ejecutando rechazo por Besalco...') // Debug
        await CanchaService.rechazarPorBesalco(canchaId, observaciones)
        break
      case 'validar-linkapsis':
        await CanchaService.validarLinkapsis(canchaId, true, observaciones)
        break
      case 'rechazar-linkapsis':
        await CanchaService.validarLinkapsis(canchaId, false, observaciones)
        break
      case 'validar-llayllay':
        await CanchaService.validarLlayLlay(canchaId, true, observaciones)
        break
      case 'rechazar-llayllay':
        await CanchaService.validarLlayLlay(canchaId, false, observaciones)
        break
      case 'cerrar':
        await CanchaService.cerrarCancha(canchaId)
        break
      default:
        console.log('Acción no reconocida:', accion) // Debug
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
    console.error('Error en API:', error) // Debug
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}