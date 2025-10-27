import { CanchaService } from '../../lib/supabase'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  try {
    const empresas = await CanchaService.obtenerEmpresas()
    return new Response(JSON.stringify(empresas), {
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