import { CanchaService } from '../../../../lib/supabase'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ params }) => {
  try {
    const canchaId = parseInt(params.id!)
    
    if (!canchaId) {
      return new Response(JSON.stringify({ message: 'ID de cancha requerido' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
    
    const validaciones = await CanchaService.obtenerValidacionesCancha(canchaId)
    
    return new Response(JSON.stringify(validaciones), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error: any) {
    console.error('Error al obtener validaciones:', error)
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}