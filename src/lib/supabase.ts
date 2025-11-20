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
  numero_informe?: number // Nuevo campo para el número correlativo
  poligono_coordenadas?: any // Nuevo campo para coordenadas del polígono dibujado
}

export interface ContadorInforme {
  id: number
  ultimo_numero: number
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
  mediciones?: MedicionData
  created_at: string
  is_revalidacion?: boolean // Para distinguir primera vs segunda validación
  usuario_validador?: string // Nombre del usuario que realizó la validación
  usuario_validador_id?: number // ID del usuario que realizó la validación
}

// Interfaces para mediciones específicas
export interface MedicionData {
  // Mediciones de Linkapsis
  espesor?: number
  unidad?: string
  coordenadas?: Coordenadas
  tipo_trabajo?: TipoTrabajo
  
  // Mediciones de LlayLlay  
  densidad?: number
  
  // Mediciones legacy (compatibilidad)
  espesores?: number[]
  promedio?: number
}

export interface Coordenadas {
  p1: Punto
  p2: Punto
  p3: Punto
  p4: Punto
}

export interface Punto {
  norte: number
  este: number
  cota: number
}

export interface TipoTrabajo {
  corte: boolean
  relleno: boolean
}

// Nuevas interfaces para sistema de usuarios y roles
export interface Rol {
  id: number
  nombre: string
  empresa_id: number
  descripcion?: string
  created_at: string
}

export interface Usuario {
  id: number
  nombre_completo: string
  email?: string
  empresa_id: number
  rol_id: number
  activo: boolean
  password_hash?: string // Para autenticación básica (desarrollo)
  created_at: string
  updated_at: string
}

// Vista completa con información de empresa y rol
export interface UsuarioCompleto {
  id: number
  nombre_completo: string
  email?: string
  activo: boolean
  empresa_id: number
  empresa_nombre: string
  rol_id: number
  rol_nombre: string
  created_at: string
}

// Tipos de roles predefinidos por empresa
export type RolAngloAmerican = 'Ingeniero QA/QC' | 'Jefe de Operaciones'
export type RolOtrasEmpresas = 'Admin' | 'Operador'

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
  numero_informe?: number // Nuevo campo
  poligono_coordenadas?: any // Nuevo campo para coordenadas del polígono
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

  // Obtener próximo número de informe
  static async obtenerProximoNumeroInforme(): Promise<number> {
    // Primero verificar si existe el contador
    const { data: contador, error: errorGet } = await supabase
      .from('contador_informes')
      .select('ultimo_numero')
      .single()
    
    if (errorGet && errorGet.code === 'PGRST116') {
      // No existe contador, crear uno inicial (empezando en 5001)
      const { data, error: errorInsert } = await supabase
        .from('contador_informes')
        .insert({ ultimo_numero: 5000 })
        .select()
        .single()
      
      if (errorInsert) throw errorInsert
      return 5001
    }
    
    if (errorGet) throw errorGet
    
    // Incrementar el contador
    const nuevoNumero = contador.ultimo_numero + 1
    
    const { error: errorUpdate } = await supabase
      .from('contador_informes')
      .update({ ultimo_numero: nuevoNumero })
      .eq('id', 1)
    
    if (errorUpdate) throw errorUpdate
    
    return nuevoNumero
  }

  // Crear nueva cancha
  static async crearCancha(muro: string, sector: string, nombreDetalle: string): Promise<Cancha> {
    const nombre = `${muro}_${sector}_${nombreDetalle}`
    
    // Obtener próximo número de informe
    const numeroInforme = await this.obtenerProximoNumeroInforme()
    
    const { data, error } = await supabase
      .from('canchas')
      .insert({
        nombre,
        muro,
        sector,
        nombre_detalle: nombreDetalle,
        estado_actual_id: 1, // Creada
        empresa_actual_id: 1, // AngloAmerican
        created_by: 1,
        numero_informe: numeroInforme
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Crear nueva cancha con polígono (para AngloAmerican)
  static async crearCanchaConPoligono(
    muro: string, 
    sector: string, 
    nombreDetalle: string, 
    poligonoCoordinadas: any
  ): Promise<Cancha> {
    const nombre = `${muro}_${sector}_${nombreDetalle}`
    
    // Obtener próximo número de informe
    const numeroInforme = await this.obtenerProximoNumeroInforme()
    
    const { data, error } = await supabase
      .from('canchas')
      .insert({
        nombre,
        muro,
        sector,
        nombre_detalle: nombreDetalle,
        estado_actual_id: 1, // Creada
        empresa_actual_id: 1, // AngloAmerican
        created_by: 1,
        numero_informe: numeroInforme,
        poligono_coordenadas: poligonoCoordinadas
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
  static async rechazarBesalco(canchaId: number, observaciones?: string): Promise<void> {
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

  static async finalizarBesalco(canchaId: number, observaciones?: string, usuario?: any): Promise<void> {
    // Enviar a Linkapsis
    const { error } = await supabase
      .from('canchas')
      .update({
        estado_actual_id: 2, // En Proceso
        empresa_actual_id: 3  // Linkapsis
      })
      .eq('id', canchaId)
    
    if (error) throw error

    // Registrar finalización del trabajo con información del usuario
    const validacionData: any = {
      cancha_id: canchaId,
      empresa_validadora_id: 2, // Besalco
      tipo_validacion: 'trabajo_maquinaria',
      resultado: 'validada',
      observaciones
    }

    // Agregar información del usuario si está disponible
    if (usuario) {
      validacionData.usuario_validador_id = usuario.id
      validacionData.usuario_validador_nombre = usuario.nombre_completo
    }

    await supabase
      .from('validaciones')
      .insert(validacionData)
  }

  // Validar por Linkapsis
  static async validarLinkapsis(
    canchaId: number, 
    validar: boolean, 
    observaciones?: string, 
    mediciones?: MedicionData,
    esRevalidacion: boolean = false,
    usuario?: any
  ): Promise<void> {
    if (validar) {
      // Pasar a LlayLlay
      await supabase
        .from('canchas')
        .update({
          estado_actual_id: 2, // En Proceso
          empresa_actual_id: 4  // LlayLlay
        })
        .eq('id', canchaId)
      
      // Guardar validación con mediciones y usuario
      const validacionData: any = {
        cancha_id: canchaId,
        empresa_validadora_id: 3, // Linkapsis
        tipo_validacion: 'espesores',
        resultado: 'validada',
        observaciones,
        mediciones,
        is_revalidacion: esRevalidacion
      }

      // Agregar información del usuario si está disponible
      if (usuario) {
        validacionData.usuario_validador_id = usuario.id
        validacionData.usuario_validador_nombre = usuario.nombre_completo
      }

      await supabase
        .from('validaciones')
        .insert(validacionData)
    } else {
      // Rechazar y volver a Besalco
      await supabase
        .from('canchas')
        .update({
          estado_actual_id: 5, // Rechazada
          empresa_actual_id: 2  // Besalco
        })
        .eq('id', canchaId)
      
      // Guardar rechazo con usuario
      const rechazoData: any = {
        cancha_id: canchaId,
        empresa_validadora_id: 3, // Linkapsis
        tipo_validacion: 'espesores',
        resultado: 'rechazada',
        observaciones
      }

      // Agregar información del usuario si está disponible
      if (usuario) {
        rechazoData.usuario_validador_id = usuario.id
        rechazoData.usuario_validador_nombre = usuario.nombre_completo
      }

      await supabase
        .from('validaciones')
        .insert(rechazoData)
    }
  }

  // Validar por LlayLlay
  static async validarLlayLlay(
    canchaId: number, 
    validar: boolean, 
    observaciones?: string, 
    mediciones?: MedicionData,
    esRevalidacion: boolean = false,
    usuario?: any
  ): Promise<void> {
    if (validar) {
      // Devolver a AngloAmerican para cierre
      await supabase
        .from('canchas')
        .update({
          estado_actual_id: 2, // En Proceso
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

    // Registrar validación con mediciones y usuario
    const validacionData: any = {
      cancha_id: canchaId,
      empresa_validadora_id: 4, // LlayLlay
      tipo_validacion: 'densidad',
      resultado: validar ? 'validada' : 'rechazada',
      observaciones,
      mediciones,
      is_revalidacion: esRevalidacion
    }

    // Agregar información del usuario si está disponible
    if (usuario) {
      validacionData.usuario_validador_id = usuario.id
      validacionData.usuario_validador_nombre = usuario.nombre_completo
    }

    await supabase
      .from('validaciones')
      .insert(validacionData)
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

  // Obtener historial de validaciones de una cancha
  static async obtenerValidacionesCancha(canchaId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('validaciones')
      .select(`
        *,
        empresa_validadora:empresas!empresa_validadora_id(nombre)
      `)
      .eq('cancha_id', canchaId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  // Borrar cancha y todas sus validaciones relacionadas
  static async borrarCancha(canchaId: number): Promise<void> {
    // Primero eliminar todas las validaciones relacionadas
    const { error: errorValidaciones } = await supabase
      .from('validaciones')
      .delete()
      .eq('cancha_id', canchaId)
    
    if (errorValidaciones) throw errorValidaciones

    // Luego eliminar la cancha
    const { error: errorCancha } = await supabase
      .from('canchas')
      .delete()
      .eq('id', canchaId)
    
    if (errorCancha) throw errorCancha
  }
}

// =====================================================
// SERVICIO PARA GESTIÓN DE ROLES
// =====================================================
export class RolService {
  // Crear roles predeterminados para una empresa
  static async crearRolesPorDefecto(empresaId: number): Promise<Rol[]> {
    const rolesDefecto = this.obtenerRolesPorDefecto(empresaId)
    
    const { data, error } = await supabase
      .from('roles')
      .insert(rolesDefecto.map(rol => ({
        nombre: rol.nombre,
        empresa_id: empresaId,
        descripcion: rol.descripcion
      })))
      .select()
    
    if (error) throw error
    return data || []
  }
  
  // Obtener roles por empresa
  static async obtenerRolesPorEmpresa(empresaId: number): Promise<Rol[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nombre')
    
    if (error) throw error
    return data || []
  }
  
  // Obtener todos los roles con información de empresa
  static async obtenerTodosLosRoles(): Promise<any[]> {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        empresa:empresas!empresa_id(id, nombre)
      `)
      .order('empresa_id', { ascending: true })
      .order('nombre', { ascending: true })
    
    if (error) throw error
    return data || []
  }
  
  // Definir roles por defecto según empresa
  private static obtenerRolesPorDefecto(empresaId: number) {
    switch (empresaId) {
      case 1: // AngloAmerican
        return [
          { nombre: 'Ingeniero QA/QC', descripcion: 'Ingeniero de Control de Calidad' },
          { nombre: 'Jefe de Operaciones', descripcion: 'Responsable de Operaciones' }
        ]
      case 2: // Besalco
      case 3: // Linkapsis  
      case 4: // LlayLlay
      default:
        return [
          { nombre: 'Admin', descripcion: 'Administrador de la empresa' },
          { nombre: 'Operador', descripcion: 'Operador de campo' }
        ]
    }
  }
}

// =====================================================
// SERVICIO PARA GESTIÓN DE USUARIOS
// =====================================================
export class UsuarioService {
  // Crear nuevo usuario
  static async crearUsuario(
    nombreCompleto: string,
    empresaId: number,
    rolId: number,
    email?: string
  ): Promise<Usuario> {
    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        nombre_completo: nombreCompleto,
        email,
        empresa_id: empresaId,
        rol_id: rolId,
        activo: true,
        password_hash: await this.hashPassword('123') // Password por defecto para desarrollo
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  // Obtener todos los usuarios con información completa
  static async obtenerUsuariosCompletos(): Promise<UsuarioCompleto[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        empresa:empresas!empresa_id(id, nombre),
        rol:roles!rol_id(id, nombre)
      `)
      .eq('activo', true)
      .order('empresa_id')
      .order('nombre_completo')
    
    if (error) throw error
    
    // Mapear a la estructura UsuarioCompleto
    return (data || []).map(user => ({
      id: user.id,
      nombre_completo: user.nombre_completo,
      email: user.email,
      activo: user.activo,
      empresa_id: user.empresa_id,
      empresa_nombre: user.empresa?.nombre || '',
      rol_id: user.rol_id,
      rol_nombre: user.rol?.nombre || '',
      created_at: user.created_at
    }))
  }
  
  // Obtener usuarios por empresa
  static async obtenerUsuariosPorEmpresa(empresaId: number): Promise<UsuarioCompleto[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        empresa:empresas!empresa_id(id, nombre),
        rol:roles!rol_id(id, nombre)
      `)
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('nombre_completo')
    
    if (error) throw error
    
    return (data || []).map(user => ({
      id: user.id,
      nombre_completo: user.nombre_completo,
      email: user.email,
      activo: user.activo,
      empresa_id: user.empresa_id,
      empresa_nombre: user.empresa?.nombre || '',
      rol_id: user.rol_id,
      rol_nombre: user.rol?.nombre || '',
      created_at: user.created_at
    }))
  }
  
  // Autenticación básica para desarrollo
  static async autenticarUsuario(empresaId: number, nombreCompleto: string, password: string): Promise<Usuario | null> {
    if (password !== '123') {
      return null // Password incorrecto
    }
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('nombre_completo', nombreCompleto)
      .eq('activo', true)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return data
  }
  
  // Obtener usuarios por rol específico (para PDF)
  static async obtenerUsuarioPorRol(empresaId: number, nombreRol: string): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        rol:roles!rol_id(nombre)
      `)
      .eq('empresa_id', empresaId)
      .eq('activo', true)
    
    if (error) throw error
    
    // Buscar usuario que tenga el rol específico
    const usuario = (data || []).find(user => user.rol?.nombre === nombreRol)
    
    return usuario || null
  }
  
  // Desactivar usuario (soft delete)
  static async desactivarUsuario(usuarioId: number): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', usuarioId)
    
    if (error) throw error
  }
  
  // Hash simple para desarrollo (usar bcrypt en producción)
  private static async hashPassword(password: string): Promise<string> {
    // Para desarrollo, simplemente retorna el password
    // En producción usar: await bcrypt.hash(password, 10)
    return password
  }
}