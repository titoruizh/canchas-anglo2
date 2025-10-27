// Script para probar observaciones
async function probarObservaciones() {
  console.log('🔍 Probando observaciones...')
  
  try {
    // Primero, obtener canchas existentes
    const responseListar = await fetch('http://localhost:4321/api/canchas')
    const canchas = await responseListar.json()
    console.log('📋 Canchas encontradas:', canchas.length)
    
    if (canchas.length === 0) {
      console.log('ℹ️ No hay canchas, creando una de prueba...')
      
      // Crear una cancha de prueba
      const responseCrear = await fetch('http://localhost:4321/api/canchas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: 'TEST_CANCHA_RECHAZO',
          muro: 'TEST',
          sector: 'S1',
          nombre_detalle: 'PRUEBA'
        })
      })
      
      if (!responseCrear.ok) {
        console.error('❌ Error al crear cancha:', await responseCrear.text())
        return
      }
      
      const nuevaCancha = await responseCrear.json()
      console.log('✅ Cancha creada:', nuevaCancha)
      
      // Enviar a Besalco
      await fetch(`http://localhost:4321/api/canchas/${nuevaCancha.id}/accion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accion: 'enviar_besalco'
        })
      })
      
      // Finalizar en Besalco
      await fetch(`http://localhost:4321/api/canchas/${nuevaCancha.id}/accion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accion: 'finalizar_besalco'
        })
      })
      
      // Rechazar desde Linkapsis con observaciones
      const responseRechazo = await fetch(`http://localhost:4321/api/canchas/${nuevaCancha.id}/accion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accion: 'rechazar_linkapsis',
          observaciones: 'Los espesores no cumplen con las especificaciones técnicas. Se requiere nueva compactación en el sector norte.'
        })
      })
      
      if (responseRechazo.ok) {
        console.log('✅ Cancha rechazada con observaciones')
        
        // Verificar observaciones
        const responseObs = await fetch(`http://localhost:4321/api/canchas/${nuevaCancha.id}/observaciones`)
        const observaciones = await responseObs.json()
        console.log('📝 Observaciones guardadas:', observaciones)
      } else {
        console.error('❌ Error al rechazar:', await responseRechazo.text())
      }
    } else {
      // Usar la primera cancha existente
      const cancha = canchas[0]
      console.log(`🎯 Probando con cancha existente: ${cancha.nombre}`)
      
      const responseObs = await fetch(`http://localhost:4321/api/canchas/${cancha.id}/observaciones`)
      const observaciones = await responseObs.json()
      console.log('📝 Observaciones:', observaciones)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Ejecutar
probarObservaciones()