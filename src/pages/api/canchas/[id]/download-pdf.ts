import type { APIRoute } from 'astro'
import { supabase } from '../../../../lib/supabase'
import fs from 'fs'
import path from 'path'

export const GET: APIRoute = async ({ params, request }) => {
  const { id } = params
  
  if (!id) {
    return new Response(
      JSON.stringify({ error: 'ID de cancha requerido' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Obtener los datos de la cancha
    const { data: cancha, error: errorCancha } = await supabase
      .from('vista_canchas_completa')
      .select('*')
      .eq('id', id)
      .single()

    if (errorCancha || !cancha) {
      return new Response(
        JSON.stringify({ error: 'Cancha no encontrada' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Obtener las validaciones (que contienen las mediciones)
    const { data: validaciones, error: errorValidaciones } = await supabase
      .from('validaciones')
      .select('*')
      .eq('cancha_id', id)
      .order('created_at', { ascending: false })

    if (errorValidaciones) {
      console.error('Error al obtener validaciones:', errorValidaciones)
      return new Response(
        JSON.stringify({ error: 'Error al obtener validaciones' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Leer el template HTML
    const templatePath = path.join(process.cwd(), 'src', 'template_mejorado.html')
    let htmlTemplate: string
    
    try {
      htmlTemplate = fs.readFileSync(templatePath, 'utf-8')
    } catch (error) {
      console.error('Error al leer template:', error)
      return new Response(
        JSON.stringify({ error: 'Template no encontrado' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Función para reemplazar variables
    function reemplazarVariables(template: string, datos: any): string {
      return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
        const valor = datos[variable]
        return valor !== undefined && valor !== null ? String(valor) : ''
      })
    }

    // Obtener usuarios de AngloAmerican para las firmas
    const { data: usuariosAnglo, error: errorUsuarios } = await supabase
      .from('vista_usuarios_completa')
      .select('*')
      .eq('empresa_id', 1) // AngloAmerican
      .eq('activo', true)

    if (errorUsuarios) {
      console.error('Error al obtener usuarios de AngloAmerican:', errorUsuarios)
    }

    console.log('Usuarios AngloAmerican encontrados:', usuariosAnglo)

    // Buscar usuarios específicos por rol
    const usuarioQAQC = usuariosAnglo?.find(u => u.rol_nombre === 'Ingeniero QA/QC')
    const usuarioJefeOps = usuariosAnglo?.find(u => u.rol_nombre === 'Jefe de Operaciones')

    // Extraer datos para el template
    function extraerDatosParaTemplate(cancha: any, validaciones: any[] = []) {
      // Buscar validaciones específicas por empresa_validadora_id
      // ID 2 = Besalco, ID 3 = Linkapsis, ID 4 = LlayLlay
      
      // Obtener todas las validaciones por empresa (primera y revalidaciones)
      const validacionesBesalco = validaciones.filter(v => v.empresa_validadora_id === 2 && v.resultado === 'validada')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      const validacionesLinkapsis = validaciones.filter(v => v.empresa_validadora_id === 3 && v.resultado === 'validada')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      const validacionesLlayLlay = validaciones.filter(v => v.empresa_validadora_id === 4 && v.resultado === 'validada')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      
      // Obtener primera y última validación de cada empresa
      const validacionBesalco = validacionesBesalco[0] || null
      const validacionBesalco2 = validacionesBesalco.length > 1 ? validacionesBesalco[validacionesBesalco.length - 1] : null
      const validacionLinkapsis = validacionesLinkapsis[0] || null
      const validacionLinkapsis2 = validacionesLinkapsis.length > 1 ? validacionesLinkapsis[validacionesLinkapsis.length - 1] : null
      const validacionLlayLlay = validacionesLlayLlay[0] || null
      const validacionLlayLlay2 = validacionesLlayLlay.length > 1 ? validacionesLlayLlay[validacionesLlayLlay.length - 1] : null
      
      // DEBUG: Logs para ver la estructura de datos
      console.log('=== DEBUG VALIDACIONES ===')
      console.log('Cancha completa:', JSON.stringify(cancha, null, 2))
      console.log('Todas las validaciones:', JSON.stringify(validaciones, null, 2))
      console.log(`Besalco: ${validacionesBesalco.length} validaciones -`, { primera: validacionBesalco, ultima: validacionBesalco2 })
      console.log(`Linkapsis: ${validacionesLinkapsis.length} validaciones -`, { primera: validacionLinkapsis, ultima: validacionLinkapsis2 })
      console.log(`LlayLlay: ${validacionesLlayLlay.length} validaciones -`, { primera: validacionLlayLlay, ultima: validacionLlayLlay2 })
      
      // Extraer datos de mediciones de las validaciones
      const medicionLinkapsis = validacionLinkapsis?.mediciones || {}
      const medicionLlayLlay = validacionLlayLlay?.mediciones || {}
      const coordenadas = medicionLinkapsis.coordenadas || {}
      
      console.log('Medición Linkapsis:', JSON.stringify(medicionLinkapsis, null, 2))
      console.log('Medición LlayLlay:', JSON.stringify(medicionLlayLlay, null, 2))
      console.log('Coordenadas extraídas:', JSON.stringify(coordenadas, null, 2))
      
      // Determinar el nombre del muro según el código
      const muroCancha = cancha.muro || ''
      let nombreMuro = ''
      
      switch (muroCancha) {
        case 'MP':
          nombreMuro = 'PRINCIPAL'
          break
        case 'MO':
          nombreMuro = 'OESTE'
          break
        case 'ME':
          nombreMuro = 'ESTE'
          break
        default:
          nombreMuro = muroCancha || 'N/A'
      }
      
      console.log('Muro de la cancha:', muroCancha, '-> Nombre:', nombreMuro)

      return {
        // Encabezado principal
        NUMERO_CN: cancha.numero_informe || '',
        
        // Información del muro (nombre legible)
        MURO: nombreMuro,
        
        // Información de sector y nombre
        SECTOR: cancha.sector || '',
        CANCHA_NAME: (cancha.nombre_detalle || cancha.nombre || '').toUpperCase(),
        
        // Fechas principales
        FECHA_ANGLO: cancha.created_at ? 
          new Date(cancha.created_at).toLocaleDateString('es-ES') : '',
        
        // Datos de Linkapsis (Topografía)
        ESPESOR_LK: medicionLinkapsis.espesor || '',
        
        // Checkboxes según lo marcado por el usuario experto
        TICKET_LK_C: (() => {
          const tipoTrabajo = medicionLinkapsis.tipoTrabajo || []
          return tipoTrabajo.includes('corte') ? '☑' : '☐'
        })(),
        
        TICKET_LK_R: (() => {
          const tipoTrabajo = medicionLinkapsis.tipoTrabajo || []
          return tipoTrabajo.includes('relleno') ? '☑' : '☐'
        })(),
        
        // LÓGICA ALTERNATIVA COMENTADA (basada en espesor automático):
        // TICKET_LK_C: (() => {
        //   const espesor = parseFloat(medicionLinkapsis.espesor)
        //   return (!isNaN(espesor) && espesor < -0.1) ? '☑' : '☐'  // Corte si espesor < -0.1
        // })(),
        // TICKET_LK_R: (() => {
        //   const espesor = parseFloat(medicionLinkapsis.espesor)
        //   return (!isNaN(espesor) && espesor > 0.1) ? '☑' : '☐'   // Relleno si espesor > 0.1
        // })(),
        
        // Coordenadas de puntos - ahora usando la estructura real
        P1_N: coordenadas.p1?.norte || '',
        P1_E: coordenadas.p1?.este || '',
        P1_C: coordenadas.p1?.cota || '',
        P2_N: coordenadas.p2?.norte || '',
        P2_E: coordenadas.p2?.este || '',
        P2_C: coordenadas.p2?.cota || '',
        P3_N: coordenadas.p3?.norte || '',
        P3_E: coordenadas.p3?.este || '',
        P3_C: coordenadas.p3?.cota || '',
        P4_N: coordenadas.p4?.norte || '',
        P4_E: coordenadas.p4?.este || '',
        P4_C: coordenadas.p4?.cota || '',
        
        // Personal y firmas
        NOMBRE: 'Sistema AngloAmerican',
        FIRMA: '[Firma Digital]',
        
        // Besalco (Movimiento de tierra) - usando fechas reales
        FECHA_BS: validacionBesalco?.created_at ? 
          new Date(validacionBesalco.created_at).toLocaleDateString('es-ES') : '',
        FECHA2_BS: validacionBesalco2?.created_at ? 
          new Date(validacionBesalco2.created_at).toLocaleDateString('es-ES') : '',
        FIRMA_BS: '[Firma Besalco]',
        FIRMA2_BS: '[Firma Besalco 2]',
        
        // Linkapsis (Topografía) - usando fechas reales
        NUM_PLK: validacionLinkapsis?.id || '',
        FECHA_LK: validacionLinkapsis?.created_at ? 
          new Date(validacionLinkapsis.created_at).toLocaleDateString('es-ES') : '',
        FECHA2_LK: validacionLinkapsis2?.created_at ? 
          new Date(validacionLinkapsis2.created_at).toLocaleDateString('es-ES') : '',
        FIRMA_LK: '[Firma Linkapsis]',
        FIRMA2_LK: '[Firma Linkapsis 2]',
        
        // LlayLlay (Laboratorio) - usando fechas reales
        NUM_PLL: validacionLlayLlay?.id || '',
        FECHA_LL: validacionLlayLlay?.created_at ? 
          new Date(validacionLlayLlay.created_at).toLocaleDateString('es-ES') : '',
        FECHA2_LL: validacionLlayLlay2?.created_at ? 
          new Date(validacionLlayLlay2.created_at).toLocaleDateString('es-ES') : '',
        FIRMA_LL: '[Firma LlayLlay]',
        FIRMA2_LL: '[Firma LlayLlay 2]',
        
        // Comentarios y observaciones: tomar los ÚLTIMOS comentarios de cada empresa (incluyendo rechazos)
        COMENTARIOS_BESALCO: (() => {
          const todasValidacionesBesalco = validaciones.filter(v => v.empresa_validadora_id === 2)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          return todasValidacionesBesalco[0]?.observaciones || ''
        })(),
        COMENTARIOS_LINKAPSIS: (() => {
          const todasValidacionesLinkapsis = validaciones.filter(v => v.empresa_validadora_id === 3)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          return todasValidacionesLinkapsis[0]?.observaciones || ''
        })(),
        COMENTARIOS_LLAYLLAY: (() => {
          const todasValidacionesLlayLlay = validaciones.filter(v => v.empresa_validadora_id === 4)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          return todasValidacionesLlayLlay[0]?.observaciones || ''
        })(),
        
        // Nombres de usuarios validadores - Besalco
        NOMBRE_BS: validacionBesalco?.usuario_validador_nombre || '',
        NOMBRE2_BS: validacionBesalco2?.usuario_validador_nombre || '',
        
        // Nombres de usuarios validadores - Linkapsis  
        NOMBRE_LK: validacionLinkapsis?.usuario_validador_nombre || '',
        NOMBRE2_LK: validacionLinkapsis2?.usuario_validador_nombre || '',
        
        // Nombres de usuarios validadores - LlayLlay
        NOMBRE_LL: validacionLlayLlay?.usuario_validador_nombre || '',
        NOMBRE2_LL: validacionLlayLlay2?.usuario_validador_nombre || '',
        
        // Personal de AngloAmerican (nombres reales desde la base de datos)
        NOMBRE_AAQAQC: usuarioQAQC?.nombre_completo || 'Ingeniero QA/QC',
        FIRMA_AAQAQC: usuarioQAQC ? '[Firma QA/QC]' : '[Sin asignar]',
        NOMBRE_AAJO: usuarioJefeOps?.nombre_completo || 'Jefe de Operaciones',
        FIRMA_AAJO: usuarioJefeOps ? new Date().toLocaleDateString('es-ES') : '[Sin asignar]'
      }
    }

    // Procesar el template
    const datosTemplate = extraerDatosParaTemplate(cancha, validaciones)
    const htmlProcesado = reemplazarVariables(htmlTemplate, datosTemplate)

    // Crear HTML completo para la descarga
    const htmlCompleto = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Control de Calidad Canchas - ${cancha.numero_informe || id}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            padding: 0;
            color: #000;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 5px;
        }
        td, th {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            vertical-align: top;
        }
        p {
            margin: 5px 0;
            line-height: 1.2;
        }
        .CodeBlock-module__code--gyjSL {
            background: none;
            border: none;
            font-family: inherit;
            margin: 0;
            padding: 0;
        }
        @media print {
            body { margin: 15px; }
            table { break-inside: avoid; }
        }
    </style>
</head>
<body>
    ${htmlProcesado}
    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>`

    return new Response(htmlCompleto, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="cancha-${cancha.numero_informe || id}.html"`
      }
    })

  } catch (error) {
    console.error('Error al generar PDF:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}