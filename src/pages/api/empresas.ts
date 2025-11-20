import { CanchaService } from '../../lib/supabase'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  try {
    const empresas = await CanchaService.obtenerEmpresas()
    return new Response(JSON.stringify({
      success: true,
      empresas: empresas
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error: any) {
    console.error('Error al obtener empresas:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Error al obtener empresas',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}