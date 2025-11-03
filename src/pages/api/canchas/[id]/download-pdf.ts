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

    // Extraer datos para el template
    function extraerDatosParaTemplate(cancha: any, validaciones: any[] = []) {
      // Buscar validaciones específicas por empresa_validadora_id
      // ID 2 = Besalco, ID 3 = Linkapsis, ID 4 = LlayLlay
      const validacionBesalco = validaciones.find(v => v.empresa_validadora_id === 2)
      const validacionLinkapsis = validaciones.find(v => v.empresa_validadora_id === 3)
      const validacionLlayLlay = validaciones.find(v => v.empresa_validadora_id === 4)
      
      // DEBUG: Logs para ver la estructura de datos
      console.log('=== DEBUG VALIDACIONES ===')
      console.log('Cancha completa:', JSON.stringify(cancha, null, 2))
      console.log('Todas las validaciones:', JSON.stringify(validaciones, null, 2))
      console.log('Validación Linkapsis:', JSON.stringify(validacionLinkapsis, null, 2))
      console.log('Validación LlayLlay:', JSON.stringify(validacionLlayLlay, null, 2))
      console.log('Validación Besalco:', JSON.stringify(validacionBesalco, null, 2))
      
      // Extraer datos de mediciones de las validaciones
      const medicionLinkapsis = validacionLinkapsis?.mediciones || {}
      const medicionLlayLlay = validacionLlayLlay?.mediciones || {}
      const coordenadas = medicionLinkapsis.coordenadas || {}
      
      console.log('Medición Linkapsis:', JSON.stringify(medicionLinkapsis, null, 2))
      console.log('Medición LlayLlay:', JSON.stringify(medicionLlayLlay, null, 2))
      console.log('Coordenadas extraídas:', JSON.stringify(coordenadas, null, 2))
      
      // Determinar qué muro marcar según el campo 'muro' de la cancha
      const muroCancha = cancha.muro || ''
      console.log('Muro de la cancha:', muroCancha)

      return {
        // Encabezado principal
        NUMERO_CN: cancha.numero_informe || '',
        
        // Checkboxes de muros según el muro de la cancha
        TICKET_CNP: muroCancha === 'MP' ? '☑' : '☐', // Muro Principal
        TICKET_CNO: muroCancha === 'MO' ? '☑' : '☐', // Muro Oeste  
        TICKET_CNE: muroCancha === 'ME' ? '☑' : '☐', // Muro Este
        
        // Información de sector y nombre
        SECTOR: cancha.sector || '',
        CANCHA_NAME: cancha.nombre_detalle || cancha.nombre || '',
        
        // Fechas principales
        FECHA_ANGLO: cancha.created_at ? 
          new Date(cancha.created_at).toLocaleDateString('es-ES') : '',
        
        // Datos de Linkapsis (Topografía)
        ESPESOR_LK: medicionLinkapsis.espesor || '',
        TICKET_LK: '☐', // Checkbox para tipo de trabajo
        
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
        FECHA2_BS: '', // Segunda entrega si existe
        FIRMA_BS: '[Firma Besalco]',
        FIRMA2_BS: '[Firma Besalco 2]',
        
        // Linkapsis (Topografía) - usando fechas reales
        NUM_PLK: validacionLinkapsis?.id || '',
        FECHA_LK: validacionLinkapsis?.created_at ? 
          new Date(validacionLinkapsis.created_at).toLocaleDateString('es-ES') : '',
        FECHA2_LK: '', // Segunda entrega si existe
        FIRMA_LK: '[Firma Linkapsis]',
        FIRMA2_LK: '[Firma Linkapsis 2]',
        
        // LlayLlay (Laboratorio) - usando fechas reales
        NUM_PLL: validacionLlayLlay?.id || '',
        FECHA_LL: validacionLlayLlay?.created_at ? 
          new Date(validacionLlayLlay.created_at).toLocaleDateString('es-ES') : '',
        FECHA2_LL: '', // Segunda entrega si existe
        FIRMA_LL: '[Firma LlayLlay]',
        FIRMA2_LL: '[Firma LlayLlay 2]',
        
        // Comentarios y observaciones - usando las observaciones reales
        COMENTARIOS: [
          validacionBesalco?.observaciones,
          validacionLinkapsis?.observaciones, 
          validacionLlayLlay?.observaciones
        ].filter(Boolean).join(' | ') || cancha.observaciones || '',
        
        // Personal de AngloAmerican
        NOMBRE_AAQAQC: 'Ingeniero QA/QC',
        FIRMA_AAQAQC: '[Firma QA/QC]',
        NOMBRE_AAJO: 'Jefe de Operaciones',
        FIRMA_AAJO: new Date().toLocaleDateString('es-ES')
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