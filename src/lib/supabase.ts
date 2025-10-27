import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.SUPABASE_URL || 'https://chzlwqxjdcydnndrnfjk.supabase.co'
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoemx3cXhqZGN5ZG5uZHJuZmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjQxMDMsImV4cCI6MjA3NjEwMDEwM30.uyI7C2j8yz1WqAWXft4cbZTBdliJlYVhHv4oL1Nthxo'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos TypeScript para las tablas
export interface Empresa {
  id: number
  nombre: string
  created_at: string
}

export interface EstadoCancha {
  id: number
  nombre: string
  descripcion: string
  created_at: string
}

export interface Cancha {
  id: number
  nombre: string
  muro: string
  sector: string
  nombre_detalle: string
  estado_actual_id: number
  empresa_actual_id: number
  created_by: number
  created_at: string
  updated_at: string
}

export interface HistorialCancha {
  id: number
  cancha_id: number
  estado_anterior_id: number
  estado_nuevo_id: number
  empresa_anterior_id: number
  empresa_nueva_id: number
  accion: string
  observaciones?: string
  created_by: number
  created_at: string
}

export interface Validacion {
  id: number
  cancha_id: number
  empresa_validadora_id: number
  tipo_validacion: string
  resultado: string
  observaciones?: string
  mediciones?: any
  created_at: string
}

// Vista completa con joins
export interface CanchaCompleta {
  id: number
  nombre: string
  muro: string
  sector: string
  nombre_detalle: string
  estado_actual: string
  empresa_actual: string
  creada_por: string
  created_at: string
  updated_at: string
}

// Funciones auxiliares para el manejo de datos
export class CanchaService {
  // Obtener todas las canchas con información completa
  static async obtenerCanchas(): Promise<CanchaCompleta[]> {
    const { data, error } = await supabase
      .from('vista_canchas_completa')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // Crear nueva cancha
  static async crearCancha(muro: string, sector: string, nombreDetalle: string): Promise<Cancha> {
    const nombre = `${muro}_${sector}_${nombreDetalle}`
    
    const { data, error } = await supabase
      .from('canchas')
      .insert({
        nombre,
        muro,
        sector,
        nombre_detalle: nombreDetalle,
        estado_actual_id: 1, // Creada
        empresa_actual_id: 1, // AngloAmerican
        created_by: 1
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Enviar cancha a Besalco
  static async enviarABesalco(canchaId: number): Promise<void> {
    const { error } = await supabase
      .from('canchas')
      .update({
        estado_actual_id: 2, // En Proceso
        empresa_actual_id: 2  // Besalco
      })
      .eq('id', canchaId)
    
    if (error) throw error
  }

  // Finalizar trabajo de Besalco
  static async finalizarTrabajo(canchaId: number): Promise<void> {
    const { error } = await supabase
      .from('canchas')
      .update({
        estado_actual_id: 3, // Finalizada
        empresa_actual_id: 3  // Linkapsis (siguiente en el flujo)
      })
      .eq('id', canchaId)
    
    if (error) throw error
  }

  // Rechazar por Besalco (nueva función)
  static async rechazarPorBesalco(canchaId: number, observaciones?: string): Promise<void> {
    // Devolver a AngloAmerican con estado rechazada
    const { error } = await supabase
      .from('canchas')
      .update({
        estado_actual_id: 5, // Rechazada
        empresa_actual_id: 1  // AngloAmerican
      })
      .eq('id', canchaId)
    
    if (error) throw error

    // Registrar validación de rechazo
    await supabase
      .from('validaciones')
      .insert({
        cancha_id: canchaId,
        empresa_validadora_id: 2, // Besalco
        tipo_validacion: 'trabajo_maquinaria',
        resultado: 'rechazada',
        observaciones
      })
  }

  // Validar por Linkapsis
  static async validarLinkapsis(canchaId: number, validar: boolean, observaciones?: string): Promise<void> {
    if (validar) {
      // Pasar a LlayLlay
      await supabase
        .from('canchas')
        .update({
          estado_actual_id: 4, // Validada
          empresa_actual_id: 4  // LlayLlay
        })
        .eq('id', canchaId)
    } else {
      // Rechazar y volver a Besalco
      await supabase
        .from('canchas')
        .update({
          estado_actual_id: 5, // Rechazada
          empresa_actual_id: 2  // Besalco
        })
        .eq('id', canchaId)
    }

    // Registrar validación
    await supabase
      .from('validaciones')
      .insert({
        cancha_id: canchaId,
        empresa_validadora_id: 3, // Linkapsis
        tipo_validacion: 'espesores',
        resultado: validar ? 'validada' : 'rechazada',
        observaciones
      })
  }

  // Validar por LlayLlay
  static async validarLlayLlay(canchaId: number, validar: boolean, observaciones?: string): Promise<void> {
    if (validar) {
      // Devolver a AngloAmerican para cierre
      await supabase
        .from('canchas')
        .update({
          estado_actual_id: 4, // Validada
          empresa_actual_id: 1  // AngloAmerican
        })
        .eq('id', canchaId)
    } else {
      // Rechazar y volver a Besalco
      await supabase
        .from('canchas')
        .update({
          estado_actual_id: 5, // Rechazada
          empresa_actual_id: 2  // Besalco
        })
        .eq('id', canchaId)
    }

    // Registrar validación
    await supabase
      .from('validaciones')
      .insert({
        cancha_id: canchaId,
        empresa_validadora_id: 4, // LlayLlay
        tipo_validacion: 'densidad',
        resultado: validar ? 'validada' : 'rechazada',
        observaciones
      })
  }

  // Cerrar cancha (AngloAmerican)
  static async cerrarCancha(canchaId: number): Promise<void> {
    const { error } = await supabase
      .from('canchas')
      .update({
        estado_actual_id: 6 // Cerrada
      })
      .eq('id', canchaId)
    
    if (error) throw error
  }

  // Obtener historial de una cancha
  static async obtenerHistorial(canchaId: number) {
    const { data, error } = await supabase
      .from('vista_historial_completa')
      .select('*')
      .eq('cancha_id', canchaId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // Obtener empresas
  static async obtenerEmpresas(): Promise<Empresa[]> {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('id')
    
    if (error) throw error
    return data || []
  }

  // Obtener observaciones de validaciones/rechazos de una cancha
  static async obtenerObservacionesCancha(canchaId: number) {
    const { data, error } = await supabase
      .from('validaciones')
      .select(`
        *,
        empresa_validadora:empresas!empresa_validadora_id(nombre)
      `)
      .eq('cancha_id', canchaId)
      .eq('resultado', 'rechazada')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}