import { supabase } from '../../../../lib/supabase.js';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(JSON.stringify({
        error: 'ID de usuario requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: usuario, error } = await supabase
      .from('vista_usuarios_completa')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (error) {
      console.error('Error al obtener usuario:', error);
      return new Response(JSON.stringify({
        error: 'Usuario no encontrado',
        details: error.message
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      usuario: usuario
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error inesperado:', error);
    return new Response(JSON.stringify({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(JSON.stringify({
        error: 'ID de usuario requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { nombre_completo, email, empresa_id, rol_id, activo } = body;

    // Validar campos requeridos
    if (!nombre_completo || !empresa_id || !rol_id) {
      return new Response(JSON.stringify({
        error: 'Campos requeridos faltantes',
        details: 'nombre_completo, empresa_id y rol_id son obligatorios'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updateData = {
      nombre_completo,
      email: email || null,
      empresa_id: parseInt(empresa_id),
      rol_id: parseInt(rol_id),
      activo: activo !== undefined ? activo : true,
      updated_at: new Date().toISOString()
    };

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar usuario:', error);
      
      // Manejar error de duplicado
      if (error.code === '23505') {
        return new Response(JSON.stringify({
          error: 'Usuario duplicado',
          details: 'Ya existe un usuario con ese nombre en la empresa'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        error: 'Error al actualizar usuario',
        details: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      usuario: usuario,
      message: 'Usuario actualizado exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error inesperado al actualizar usuario:', error);
    return new Response(JSON.stringify({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(JSON.stringify({
        error: 'ID de usuario requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar usuario:', error);
      return new Response(JSON.stringify({
        error: 'Error al actualizar usuario',
        details: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      usuario: usuario,
      message: 'Usuario actualizado exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error inesperado al actualizar usuario:', error);
    return new Response(JSON.stringify({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(JSON.stringify({
        error: 'ID de usuario requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Soft delete - marcar como inactivo en lugar de eliminar
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .update({
        activo: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('Error al eliminar usuario:', error);
      return new Response(JSON.stringify({
        error: 'Error al eliminar usuario',
        details: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      usuario: usuario,
      message: 'Usuario desactivado exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error inesperado al eliminar usuario:', error);
    return new Response(JSON.stringify({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};