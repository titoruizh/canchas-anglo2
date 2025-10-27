import { CanchaService } from '../../lib/supabase'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  try {
    const canchas = await CanchaService.obtenerCanchas()
    return new Response(JSON.stringify(canchas), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { muro, sector, nombreDetalle } = await request.json()
    
    if (!muro || !sector || !nombreDetalle) {
      return new Response(JSON.stringify({ message: 'Faltan datos requeridos' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
    
    const cancha = await CanchaService.crearCancha(muro, sector, nombreDetalle)
    return new Response(JSON.stringify(cancha), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}