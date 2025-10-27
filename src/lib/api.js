// API endpoints para operaciones de canchas
export class CanchaAPI {
  static async crearCancha(muro, sector, nombreDetalle) {
    const response = await fetch('/api/canchas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ muro, sector, nombreDetalle })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al crear cancha')
    }
    
    return response.json()
  }

  static async obtenerCanchas() {
    const response = await fetch('/api/canchas')
    
    if (!response.ok) {
      throw new Error('Error al obtener canchas')
    }
    
    return response.json()
  }

  static async ejecutarAccion(canchaId, accion, observaciones = null) {
    const response = await fetch(`/api/canchas/${canchaId}/accion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accion, observaciones })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al ejecutar acción')
    }
    
    return response.json()
  }

  static async obtenerEmpresas() {
    const response = await fetch('/api/empresas')
    
    if (!response.ok) {
      throw new Error('Error al obtener empresas')
    }
    
    return response.json()
  }
}