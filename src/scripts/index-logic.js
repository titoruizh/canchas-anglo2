// Variables globales
let usuarioLogueado = null
let empresaLogueada = null
let cargando = false
let vistaActual = 'acciones' // 'acciones' o 'historico'
let filtroFecha = 'all'
let todasLasCanchas = []
let canchasFiltradas = []

// Elementos del DOM (se inicializan en inicializar)
let mainScreen, userHeader, userName, userRole, userCompany
let btnAdminUsuarios, btnLogout
let formCrearCancha, btnCrearCancha, btnAbrirModalCrear
let canchasTBody, mensajeContainer, contadorResultados

// Elementos de filtros
let btnVistaAcciones, btnVistaHistorico
let filtroFechaSelect, rangoFechas, fechaDesde, fechaHasta, btnAplicarRango

// Cargar datos iniciales
async function inicializar() {
    try {
        // Inicializar referencias al DOM
        inicializarElementosDOM()

        configurarEventListeners()

        // Esperar a que el AuthGuard termine de verificar
        window.addEventListener('userAuthenticated', (event) => {
            cargarUsuarioAutenticado(event.detail)
        })

        // Verificar si ya hay usuario autenticado
        verificarUsuarioExistente()

    } catch (error) {
        console.error('Error al inicializar:', error)
        mostrarMensaje('Error al cargar datos iniciales', 'error')
    }
}

function inicializarElementosDOM() {
    mainScreen = document.getElementById('main-screen')
    userHeader = document.getElementById('user-header')
    userName = document.getElementById('user-name')
    userRole = document.getElementById('user-role')
    userCompany = document.getElementById('user-company')
    btnAdminUsuarios = document.getElementById('btn-admin-usuarios')
    btnLogout = document.getElementById('btn-logout')
    formCrearCancha = document.getElementById('form-crear-cancha')
    btnCrearCancha = document.getElementById('btn-crear-cancha')
    btnAbrirModalCrear = document.getElementById('btn-abrir-modal-crear')
    canchasTBody = document.getElementById('canchas-tbody')
    mensajeContainer = document.getElementById('mensaje-container')
    contadorResultados = document.getElementById('contador-resultados')

    btnVistaAcciones = document.getElementById('btn-vista-acciones')
    btnVistaHistorico = document.getElementById('btn-vista-historico')
    filtroFechaSelect = document.getElementById('filtro-fecha')
    rangoFechas = document.getElementById('rango-fechas')
    fechaDesde = document.getElementById('fecha-desde')
    fechaHasta = document.getElementById('fecha-hasta')
    btnAplicarRango = document.getElementById('btn-aplicar-rango')
}

// Verificar si hay usuario autenticado en localStorage
function verificarUsuarioExistente() {
    try {
        const sessionData = localStorage.getItem('userSession')
        if (sessionData) {
            const session = JSON.parse(sessionData)
            const expiresAt = new Date(session.expiresAt)

            if (expiresAt > new Date()) {
                cargarUsuarioAutenticado(session.usuario)
            } else {
                // Sesión expirada, redirigir al login
                window.location.href = '/login'
            }
        } else {
            // No hay sesión, redirigir al login
            window.location.href = '/login'
        }
    } catch (error) {
        console.error('Error verificando usuario:', error)
        window.location.href = '/login'
    }
}

// Configurar todos los event listeners
function configurarEventListeners() {
    // Logout
    if (btnLogout) btnLogout.addEventListener('click', cerrarSesion)

    // Filtros
    if (btnVistaAcciones) btnVistaAcciones.addEventListener('click', () => cambiarVista('acciones'))
    if (btnVistaHistorico) btnVistaHistorico.addEventListener('click', () => cambiarVista('historico'))
    if (filtroFechaSelect) filtroFechaSelect.addEventListener('change', manejarCambioFiltroFecha)
    if (btnAplicarRango) btnAplicarRango.addEventListener('click', aplicarRangoFechas)

    // Modal
    configurarModalEventListeners()

    // Crear cancha (si aplica)
    if (btnCrearCancha) {
        console.log('Registrando event listener para btnCrearCancha')
        btnCrearCancha.addEventListener('click', crearCancha)
    }

    // Botón para abrir modal de crear cancha con polígono
    if (btnAbrirModalCrear) {
        console.log('Registrando event listener para btnAbrirModalCrear')
        btnAbrirModalCrear.addEventListener('click', abrirModalCrearCancha)
    }

    // Configurar selectores dinámicos de Muro y Sector
    configurarSelectoresMuroSector()
}

// Configurar selectores dinámicos de Muro y Sector
function configurarSelectoresMuroSector() {
    const selectMuro = document.getElementById('muro-select')
    const selectSector = document.getElementById('sector-select')

    if (!selectMuro || !selectSector) return

    selectMuro.addEventListener('change', function () {
        const muroSeleccionado = this.value

        // Limpiar opciones del sector
        selectSector.innerHTML = ''

        if (!muroSeleccionado) {
            selectSector.disabled = true
            selectSector.innerHTML = '<option value="">Primero selecciona un muro</option>'
            return
        }

        selectSector.disabled = false
        selectSector.innerHTML = '<option value="">Selecciona un sector</option>'

        // Agregar opciones según el muro seleccionado
        if (muroSeleccionado === 'MP') {
            // MP: S1 hasta S7
            for (let i = 1; i <= 7; i++) {
                const option = document.createElement('option')
                option.value = `S${i}`
                option.textContent = `S${i}`
                selectSector.appendChild(option)
            }
        } else if (muroSeleccionado === 'ME' || muroSeleccionado === 'MO') {
            // ME y MO: S1 hasta S3
            for (let i = 1; i <= 3; i++) {
                const option = document.createElement('option')
                option.value = `S${i}`
                option.textContent = `S${i}`
                selectSector.appendChild(option)
            }
        }
    })
}

// Configurar event listeners del modal
function configurarModalEventListeners() {
    // Botón de cerrar modal
    const closeBtn = document.querySelector('.close-btn')
    if (closeBtn) {
        closeBtn.addEventListener('click', cerrarTodosLosModales)
    }
}

// Cargar información del usuario autenticado
async function cargarUsuarioAutenticado(usuario) {
    try {
        console.log('Cargando usuario autenticado:', usuario)

        usuarioLogueado = usuario
        empresaLogueada = {
            id: usuario.empresa_id,
            nombre: usuario.empresa_nombre
        }

        // Actualizar UI del header
        if (userName) userName.textContent = usuario.nombre_completo
        if (userRole) userRole.textContent = `${usuario.rol_nombre} - ${usuario.empresa_nombre}`
        if (userCompany) {
            userCompany.textContent = usuario.empresa_nombre
            userCompany.className = `empresa-actual empresa-${usuario.empresa_nombre.toLowerCase().replace(' ', '')}`
        }

        // Mostrar/ocultar formulario de crear cancha según la empresa
        if (formCrearCancha) {
            if (usuario.empresa_nombre === 'AngloAmerican') {
                formCrearCancha.classList.remove('hidden')
            } else {
                formCrearCancha.classList.add('hidden')
            }
        }

        // Mostrar enlace de administración si es de AngloAmerican
        if (btnAdminUsuarios) {
            if (usuario.empresa_id === 1) { // AngloAmerican
                btnAdminUsuarios.style.display = 'inline-block'
            } else {
                btnAdminUsuarios.style.display = 'none'
            }
        }

        // Cargar datos
        await cargarCanchas()

        // Actualizar columna de administración
        actualizarColumnaAdmin()

        // Mensaje de bienvenida eliminado para evitar duplicados

    } catch (error) {
        console.error('Error cargando usuario:', error)
        mostrarMensaje('Error al cargar información del usuario', 'error')
        window.location.href = '/login'
    }
}

function cerrarSesion() {
    usuarioLogueado = null
    empresaLogueada = null

    // Limpiar localStorage
    localStorage.removeItem('userSession')

    // Redirigir al login
    window.location.href = '/login'
    todasLasCanchas = []
    canchasFiltradas = []

    // Ocultar columna de administración
    actualizarColumnaAdmin()

    mostrarMensaje('Sesión cerrada correctamente', 'success')
}

// === FUNCIONES DE FILTROS ===
function cambiarVista(nuevaVista) {
    console.log('Cambiando vista a:', nuevaVista)
    vistaActual = nuevaVista

    // Actualizar botones
    if (btnVistaAcciones) btnVistaAcciones.classList.toggle('active', nuevaVista === 'acciones')
    if (btnVistaHistorico) btnVistaHistorico.classList.toggle('active', nuevaVista === 'historico')

    // Aplicar filtros
    aplicarFiltros()
}

function manejarCambioFiltroFecha() {
    filtroFecha = filtroFechaSelect.value

    if (filtroFecha === 'custom') {
        rangoFechas.classList.remove('hidden')
    } else {
        rangoFechas.classList.add('hidden')
        aplicarFiltros()
    }
}

function aplicarRangoFechas() {
    const desde = fechaDesde.value
    const hasta = fechaHasta.value

    if (!desde || !hasta) {
        mostrarMensaje('Por favor selecciona ambas fechas', 'error')
        return
    }

    aplicarFiltros()
}

function aplicarFiltros() {
    if (!empresaLogueada || !todasLasCanchas.length) return

    let canchasFiltradas = [...todasLasCanchas]

    // Filtro por vista (acciones vs histórico)
    if (vistaActual === 'acciones') {
        canchasFiltradas = filtrarPorAccionesDisponibles(canchasFiltradas)
    }

    // Filtro por fecha
    canchasFiltradas = filtrarPorFecha(canchasFiltradas)

    // Mostrar resultados
    mostrarCanchas(canchasFiltradas)
    actualizarContadorResultados(canchasFiltradas.length, todasLasCanchas.length)
}

function filtrarPorAccionesDisponibles(canchas) {
    const empresaId = empresaLogueada.id
    const empresaNombre = empresaLogueada.nombre

    return canchas.filter(cancha => {
        const estado = cancha.estado_actual
        const empresaActual = cancha.empresa_actual

        let tieneAccion = false

        switch (empresaNombre) {
            case 'AngloAmerican':
                tieneAccion = estado === 'Creada' ||
                    (estado === 'En Proceso' && empresaActual === 'AngloAmerican')
                break

            case 'Besalco':
                tieneAccion = (estado === 'En Proceso' && empresaActual === 'Besalco') ||
                    (estado === 'Rechazada' && empresaActual === 'Besalco')
                break

            case 'Linkapsis':
                tieneAccion = estado === 'En Proceso' && empresaActual === 'Linkapsis'
                break

            case 'LlayLlay':
                tieneAccion = estado === 'En Proceso' && empresaActual === 'LlayLlay'
                break

            default:
                tieneAccion = false
        }

        return tieneAccion
    })
}

function filtrarPorFecha(canchas) {
    if (filtroFecha === 'all') return canchas

    const ahora = new Date()
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

    return canchas.filter(cancha => {
        const fechaCancha = new Date(cancha.created_at)

        switch (filtroFecha) {
            case 'today':
                return fechaCancha >= hoy
            case 'week':
                const semanaAtras = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
                return fechaCancha >= semanaAtras
            case 'month':
                const mesAtras = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)
                return fechaCancha >= mesAtras
            case 'custom':
                if (!fechaDesde.value || !fechaHasta.value) return true
                const desde = new Date(fechaDesde.value)
                const hasta = new Date(fechaHasta.value + 'T23:59:59')
                return fechaCancha >= desde && fechaCancha <= hasta
            default:
                return true
        }
    })
}

function actualizarContadorResultados(mostradas, total) {
    if (!contadorResultados) return
    const texto = vistaActual === 'acciones'
        ? `${mostradas} acción(es) disponible(s) de ${total} canchas totales`
        : `${mostradas} de ${total} canchas`

    contadorResultados.textContent = texto
}

// === FUNCIÓN DE CREACIÓN DE CANCHAS ===
async function crearCancha() {
    if (cargando) return

    const muro = document.getElementById('muro').value.trim()
    const sector = document.getElementById('sector').value.trim()
    const nombreDetalle = document.getElementById('nombre-detalle').value.trim()

    if (!muro || !sector || !nombreDetalle) {
        alert('Por favor completa todos los campos')
        return
    }

    try {
        cargando = true
        if (btnCrearCancha) {
            btnCrearCancha.textContent = 'Creando...'
            btnCrearCancha.disabled = true
        }

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

        // Limpiar formulario
        document.getElementById('muro').value = ''
        document.getElementById('sector').value = ''
        document.getElementById('nombre-detalle').value = ''

        // Recargar tabla
        await cargarCanchas()

        mostrarMensaje('Cancha creada exitosamente', 'success')

    } catch (error) {
        console.error('Error al crear cancha:', error)
        mostrarMensaje('Error al crear la cancha: ' + error.message, 'error')
    } finally {
        cargando = false
        if (btnCrearCancha) {
            btnCrearCancha.textContent = 'Crear Cancha'
            btnCrearCancha.disabled = false
        }
    }
}

// === FUNCIÓN DE CARGA DE CANCHAS ===
async function cargarCanchas() {
    try {
        const response = await fetch('/api/canchas')
        if (!response.ok) {
            throw new Error('Error al cargar canchas')
        }

        todasLasCanchas = await response.json()
        aplicarFiltros()
    } catch (error) {
        console.error('Error al cargar canchas:', error)
        mostrarMensaje('Error al cargar las canchas', 'error')
    }
}

// Mostrar canchas filtradas
function mostrarCanchas(canchas) {
    renderizarCanchas(canchas)
}

// Renderizar tabla de canchas
function renderizarCanchas(canchas) {
    if (!canchasTBody) return

    canchasTBody.innerHTML = canchas.map(cancha => `
    <tr data-cancha-id="${cancha.id}">
      <td><strong>${cancha.nombre.toUpperCase()}</strong></td>
      <td>
        <span class="estado estado-${cancha.estado_actual.toLowerCase().replace(/\s+/g, '-')}">
          ${cancha.estado_actual}
        </span>
      </td>
      <td>
        <span class="empresa-actual empresa-${cancha.empresa_actual.toLowerCase().replace(/\s+/g, '-')}">
          ${cancha.empresa_actual}
        </span>
      </td>
      <td>${new Date(cancha.created_at).toLocaleDateString('es-ES')}</td>
      <td>
        <button class="btn-mapa" data-cancha-id="${cancha.id}" data-cancha-nombre="${cancha.nombre}" type="button" style="background:none; border:none; font-size:1.5rem; cursor:pointer; padding:0.5rem; transition: transform 0.2s;" title="Ver en mapa">🗺️</button>
      </td>
      <td>
        <div class="actions" data-cancha-id="${cancha.id}" data-estado="${cancha.estado_actual}" data-empresa="${cancha.empresa_actual}">
        </div>
      </td>
      <td class="borrar-column hidden">
        <div class="admin-actions" data-cancha-id="${cancha.id}">
        </div>
      </td>
    </tr>
  `).join('')

    // Agregar event listeners para botones del mapa inmediatamente después de renderizar
    setTimeout(() => {
        document.querySelectorAll('.btn-mapa').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const canchaId = e.target.dataset.canchaId
                const canchaName = e.target.dataset.canchaNombre
                abrirMapaModal(canchaId, canchaName)
            })
        })
    }, 100)

    actualizarAcciones()
}

// Actualizar botones de acción según empresa seleccionada
function actualizarAcciones() {
    const actionsDivs = document.querySelectorAll('.actions')
    const adminDivs = document.querySelectorAll('.admin-actions')

    actionsDivs.forEach((div) => {
        const canchaId = div.dataset.canchaId
        const estado = div.dataset.estado
        const empresaActual = div.dataset.empresa

        const botonesHTML = generarBotonesAccion(canchaId, estado, empresaActual)
        div.innerHTML = botonesHTML
    })

    // Actualizar botones de administración
    adminDivs.forEach((div) => {
        const canchaId = div.dataset.canchaId
        const adminHTML = generarBotonesAdmin(canchaId)
        div.innerHTML = adminHTML
    })

    // Agregar event listeners a los botones
    agregarEventListeners()
}

// Generar botones según empresa y estado
function generarBotonesAccion(canchaId, estado, empresaActual) {
    if (!empresaLogueada) {
        return '<span style="color:#666;">Selecciona tu empresa</span>'
    }

    const botones = []
    const empresaId = empresaLogueada.id

    // AngloAmerican
    if (empresaId === 1) {
        if (estado === 'Creada') {
            botones.push(`<button class="btn-accion" data-accion="enviar-besalco" data-cancha-id="${canchaId}">📤 Enviar a Besalco</button>`)
        } else if (estado === 'En Proceso' && empresaActual === 'AngloAmerican') {
            // Buscar la cancha para verificar validaciones
            const cancha = todasLasCanchas.find(c => c.id == canchaId)
            if (cancha) {
                const validaciones = cancha.validaciones || []
                const hasLinkapsis = validaciones.some(v => v.empresa === 'Linkapsis' && v.estado === 'VALIDADO')
                const hasLlayLlay = validaciones.some(v => v.empresa === 'LlayLlay' && v.estado === 'VALIDADO')
                const hasBesalco = validaciones.some(v => v.empresa === 'Besalco' && v.estado === 'VALIDADO')

                if (hasLinkapsis && hasLlayLlay && hasBesalco) {
                    botones.push(`<button class="btn-accion btn-pdf" data-accion="exportar-pdf" data-cancha-id="${canchaId}">📄 PDF</button>`)
                }
            }

            botones.push(`<button class="btn-accion btn-success" data-accion="abrir-modal-cierre" data-cancha-id="${canchaId}">🔒 Cerrar Cancha</button>`)
        } else if (estado === 'Finalizada' || estado === 'Cerrada') {
            botones.push(`<button class="btn-accion btn-pdf" data-accion="exportar-pdf" data-cancha-id="${canchaId}">📄 PDF</button>`)
        }
    }

    // Besalco
    else if (empresaId === 2) {
        if ((estado === 'En Proceso' || estado === 'Rechazada') && empresaActual === 'Besalco') {
            botones.push(`<button class="btn-accion btn-success" data-accion="abrir-modal-besalco" data-cancha-id="${canchaId}">🛠️ Gestionar</button>`)
        }
    }

    // Linkapsis
    else if (empresaId === 3) {
        if (estado === 'En Proceso' && empresaActual === 'Linkapsis') {
            botones.push(`<button class="btn-accion btn-success" data-accion="abrir-modal-linkapsis" data-cancha-id="${canchaId}">📏 Gestionar</button>`)
        }
    }

    // LlayLlay
    else if (empresaId === 4) {
        if (estado === 'En Proceso' && empresaActual === 'LlayLlay') {
            botones.push(`<button class="btn-accion btn-success" data-accion="abrir-modal-llayllay" data-cancha-id="${canchaId}">🧪 Gestionar</button>`)
        }
    }

    return botones.length > 0 ? botones.join('') : '<span style="color:#666;">Sin acciones disponibles</span>'
}

// Generar botones de administración (solo para AngloAmerican)
function generarBotonesAdmin(canchaId) {
    if (!empresaLogueada || empresaLogueada.id !== 1) {
        return '' // Solo AngloAmerican puede administrar
    }

    return `<button class="btn-accion btn-danger" data-accion="abrir-modal-borrar" data-cancha-id="${canchaId}">🗑️ Borrar</button>`
}

// Mostrar/ocultar columna de administración según empresa
function actualizarColumnaAdmin() {
    const borrarHeader = document.getElementById('borrar-header')
    const borrarColumns = document.querySelectorAll('.borrar-column')

    if (empresaLogueada && empresaLogueada.id === 1) {
        // Mostrar columna para AngloAmerican
        if (borrarHeader) borrarHeader.classList.remove('hidden')
        borrarColumns.forEach(col => col.classList.remove('hidden'))
    } else {
        // Ocultar columna para otras empresas
        if (borrarHeader) borrarHeader.classList.add('hidden')
        borrarColumns.forEach(col => col.classList.add('hidden'))
    }
}

// Agregar event listeners a botones de acción
function agregarEventListeners() {
    document.querySelectorAll('.btn-accion').forEach(btn => {
        btn.addEventListener('click', manejarAccion)
    })
}

// Manejar acciones de botones
async function manejarAccion(e) {
    if (cargando) return

    const accion = e.target.dataset.accion
    const canchaId = parseInt(e.target.dataset.canchaId)

    // Manejar apertura de modales
    if (accion === 'abrir-modal-besalco') {
        abrirModalBesalco(canchaId)
        return
    } else if (accion === 'abrir-modal-linkapsis') {
        abrirModalLinkapsis(canchaId)
        return
    } else if (accion === 'abrir-modal-llayllay') {
        abrirModalLlayLlay(canchaId)
        return
    } else if (accion === 'abrir-modal-cierre') {
        abrirModalCierre(canchaId)
        return
    } else if (accion === 'abrir-modal-borrar') {
        abrirModalBorrar(canchaId)
        return
    } else if (accion === 'exportar-pdf') {
        await exportarPDF(canchaId)
        return
    }

    // Confirmar acción de cierre
    if (accion === 'cerrar') {
        if (!confirm('¿Confirmas el cierre de esta cancha?')) {
            return
        }
    }

    // Pedir observaciones para rechazos (acciones directas legacy)
    let observaciones = null
    if (accion.includes('rechazar')) {
        const empresaNombre = accion === 'rechazar-besalco' ? 'Besalco' :
            accion === 'rechazar-linkapsis' ? 'Linkapsis' : 'LlayLlay'
        observaciones = prompt(`Observaciones del rechazo por ${empresaNombre}:`)
        if (observaciones === null) return // Usuario canceló
    }

    try {
        cargando = true
        const textoOriginal = e.target.textContent
        e.target.disabled = true
        e.target.textContent = 'Procesando...'

        const response = await fetch(`/api/canchas/${canchaId}/action`, {
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

        await cargarCanchas()
        mostrarMensaje('Acción realizada exitosamente', 'success')

    } catch (error) {
        console.error('Error en acción:', error)
        mostrarMensaje('Error: ' + error.message, 'error')
    } finally {
        cargando = false
    }
}

// Mostrar mensajes
function mostrarMensaje(mensaje, tipo) {
    const div = document.createElement('div')
    div.className = tipo
    div.innerHTML = `<strong>${tipo === 'success' ? 'Éxito:' : 'Error:'}</strong> ${mensaje}`

    if (mensajeContainer) mensajeContainer.appendChild(div)

    setTimeout(() => {
        div.remove()
    }, 5000)
}

// === FUNCIONES DE MODALES DE VALIDACIÓN ===
let canchaIdActual = null

// Función para cargar historial de observaciones de una cancha
async function cargarHistorialObservaciones(canchaId, historialElementId) {
    try {
        const response = await fetch(`/api/canchas/${canchaId}/validaciones`)
        if (!response.ok) {
            throw new Error('Error al cargar historial')
        }

        const validaciones = await response.json()
        const historialElement = document.getElementById(historialElementId)
        if (!historialElement) return

        const content = historialElement.querySelector('.historial-content')

        if (validaciones.length === 0) {
            content.innerHTML = '<p style="color: #666; font-style: italic; text-align: center; padding: 2rem;">No hay observaciones previas</p>'
        } else {
            content.innerHTML = `
        <div class="historial-timeline">
          ${validaciones.map(val => {
                let medicionesHtml = ''

                if (val.mediciones) {
                    if (val.mediciones.espesores) {
                        // Mediciones de Linkapsis (formato anterior)
                        medicionesHtml = `
                  <div class="medicion-linea">
                    <span class="medicion-label">Medición de Espesor:</span> <strong>${val.mediciones.espesores.join(', ')} ${val.mediciones.unidad}</strong>
                    ${val.mediciones.promedio ? `<br><span style="font-size: 0.9rem; color: #666;">Promedio: <strong>${val.mediciones.promedio} ${val.mediciones.unidad}</strong></span>` : ''}
                  </div>`
                    } else if (val.mediciones.espesor) {
                        // Nueva medición de Linkapsis
                        medicionesHtml = `
                  <div class="medicion-linea">
                    <span class="medicion-label">Medición de Espesor:</span> <strong>${val.mediciones.espesor} ${val.mediciones.unidad}</strong>
                  </div>`
                    } else if (val.mediciones.densidad) {
                        // Mediciones de LlayLlay
                        medicionesHtml = `
                  <div class="medicion-linea">
                    <span class="medicion-label">Medición de Densidad:</span> <strong>${val.mediciones.densidad} ${val.mediciones.unidad}</strong>
                  </div>`
                    }
                }

                const empresaNombre = val.empresa_validadora?.nombre || 'Empresa desconocida'
                const empresaClass = empresaNombre.toLowerCase().replace(/\s+/g, '')

                return `
              <div class="historial-entry empresa-${empresaClass}">
                <div class="empresa-nombre">${empresaNombre}</div>
                <div class="fecha-linea">
                  <span class="fecha-label">Fecha:</span> ${new Date(val.created_at).toLocaleDateString('es-ES', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
                </div>
                <div class="observacion-linea">
                  <span class="observacion-label">Observaciones:</span> "${val.observaciones || 'Sin observaciones específicas'}"
                </div>
                ${medicionesHtml}
              </div>`
            }).join('')}
        </div>
      `
        }
    } catch (error) {
        console.error('Error al cargar historial:', error)
        const historialElement = document.getElementById(historialElementId)
        if (historialElement) {
            const content = historialElement.querySelector('.historial-content')
            content.innerHTML = '<p style="color: #e74c3c;">Error al cargar historial</p>'
        }
    }
}

function abrirModalBesalco(canchaId) {
    canchaIdActual = canchaId
    const modal = document.getElementById('validacion-besalco-modal')
    const form = document.getElementById('form-validacion-besalco')

    // Limpiar formulario
    form.reset()

    // Cargar historial de observaciones
    cargarHistorialObservaciones(canchaId, 'historial-besalco')

    // Mostrar modal
    modal.classList.add('show')
}

function abrirModalLinkapsis(canchaId) {
    canchaIdActual = canchaId
    const modal = document.getElementById('validacion-linkapsis-modal')
    const form = document.getElementById('form-validacion-linkapsis')

    // Limpiar formulario básico
    form.reset()

    // Limpiar checkboxes específicamente
    document.getElementById('trabajo-corte').checked = false
    document.getElementById('trabajo-relleno').checked = false

    // Verificar si ya existen coordenadas previas de Linkapsis
    verificarCoordenadasExistentes(canchaId)

    // Cargar historial de observaciones (incluye observaciones de Besalco)
    cargarHistorialObservaciones(canchaId, 'historial-linkapsis')

    // Mostrar modal
    modal.classList.add('show')
}

async function verificarCoordenadasExistentes(canchaId) {
    try {
        const response = await fetch(`/api/canchas/${canchaId}/validaciones`)
        const validaciones = await response.json()

        // Buscar validaciones de Linkapsis (empresa_validadora_id = 3) que tengan coordenadas
        if (validaciones && validaciones.length > 0) {
            const validacionLinkapsis = validaciones.find(v =>
                v.empresa_validadora_id === 3 &&
                v.mediciones &&
                v.mediciones.coordenadas
            )

            if (validacionLinkapsis && validacionLinkapsis.mediciones && validacionLinkapsis.mediciones.coordenadas) {
                const coordenadas = validacionLinkapsis.mediciones.coordenadas

                // Pre-llenar los campos con coordenadas existentes
                const coordMap = {
                    'p1-norte': coordenadas.p1?.norte || '',
                    'p1-este': coordenadas.p1?.este || '',
                    'p1-cota': coordenadas.p1?.cota || '',
                    'p2-norte': coordenadas.p2?.norte || '',
                    'p2-este': coordenadas.p2?.este || '',
                    'p2-cota': coordenadas.p2?.cota || '',
                    'p3-norte': coordenadas.p3?.norte || '',
                    'p3-este': coordenadas.p3?.este || '',
                    'p3-cota': coordenadas.p3?.cota || '',
                    'p4-norte': coordenadas.p4?.norte || '',
                    'p4-este': coordenadas.p4?.este || '',
                    'p4-cota': coordenadas.p4?.cota || ''
                }

                // Llenar los campos si tienen valores
                Object.keys(coordMap).forEach(id => {
                    const input = document.getElementById(id)
                    if (input && coordMap[id]) {
                        input.value = coordMap[id]
                    }
                })

                // Mantener espesor y checkboxes vacíos para nueva evaluación
                const espesorInput = document.getElementById('espesor-linkapsis')
                if (espesorInput) {
                    espesorInput.value = ''
                }

                // Mantener checkboxes de tipo de trabajo sin marcar para nueva evaluación
                document.getElementById('trabajo-corte').checked = false
                document.getElementById('trabajo-relleno').checked = false
            } else {
                // No hay coordenadas previas, limpiar todos los campos
                const coordInputs = [
                    'p1-norte', 'p1-este', 'p1-cota',
                    'p2-norte', 'p2-este', 'p2-cota',
                    'p3-norte', 'p3-este', 'p3-cota',
                    'p4-norte', 'p4-este', 'p4-cota'
                ]

                coordInputs.forEach(id => {
                    const input = document.getElementById(id)
                    if (input) input.value = ''
                })
            }
        }
    } catch (error) {
        console.error('Error al verificar coordenadas existentes:', error)
        // En caso de error, limpiar campos por seguridad
        const coordInputs = [
            'p1-norte', 'p1-este', 'p1-cota',
            'p2-norte', 'p2-este', 'p2-cota',
            'p3-norte', 'p3-este', 'p3-cota',
            'p4-norte', 'p4-este', 'p4-cota'
        ]

        coordInputs.forEach(id => {
            const input = document.getElementById(id)
            if (input) input.value = ''
        })
    }
}

function abrirModalLlayLlay(canchaId) {
    canchaIdActual = canchaId
    const modal = document.getElementById('validacion-llayllay-modal')
    const form = document.getElementById('form-validacion-llayllay')

    // Limpiar formulario
    form.reset()

    // Cargar historial de observaciones (incluye Besalco y Linkapsis)
    cargarHistorialObservaciones(canchaId, 'historial-llayllay')

    // Mostrar modal
    modal.classList.add('show')
}

function abrirModalCierre(canchaId) {
    canchaIdActual = canchaId
    const modal = document.getElementById('cerrar-cancha-modal')

    // Cargar historial completo para revisión final
    cargarHistorialObservaciones(canchaId, 'historial-cierre')

    // Mostrar modal
    modal.classList.add('show')
}

function abrirModalBorrar(canchaId) {
    canchaIdActual = canchaId
    const modal = document.getElementById('borrar-cancha-modal')
    const inputConfirmacion = document.getElementById('confirmacion-borrado')
    const btnConfirmar = document.getElementById('confirmar-borrado')

    // Limpiar input y deshabilitar botón
    inputConfirmacion.value = ''
    btnConfirmar.disabled = true

    // Cargar historial que se eliminará
    cargarHistorialObservaciones(canchaId, 'historial-borrado')

    // Mostrar modal
    modal.classList.add('show')
}

// Función para exportar PDF
async function exportarPDF(canchaId) {
    try {
        cargando = true
        mostrarMensaje('Generando PDF...', 'info')

        // Abrir la URL de descarga directamente en una nueva ventana
        const url = `/api/canchas/${canchaId}/download-pdf`
        window.open(url, '_blank')

        mostrarMensaje('PDF generado correctamente', 'success')

    } catch (error) {
        console.error('Error al exportar PDF:', error)
        mostrarMensaje('Error al generar PDF: ' + error.message, 'error')
    } finally {
        cargando = false
    }
}

function cerrarTodosLosModales() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show')
    })
    canchaIdActual = null
}

// Cerrar modal al hacer click fuera
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        cerrarTodosLosModales()
    }
})

// Event listeners para botones de cerrar y cancelar
document.addEventListener('DOMContentLoaded', () => {
    // Botones de cerrar (X)
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', cerrarTodosLosModales)
    })

    // Botones de cancelar
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', cerrarTodosLosModales)
    })

    // Formularios de validación
    configurarFormulariosValidacion()
})

function configurarFormulariosValidacion() {
    // Formulario Besalco
    const formBesalco = document.getElementById('form-validacion-besalco')
    if (formBesalco) {
        formBesalco.addEventListener('submit', procesarValidacionBesalco)

        const btnRechazar = formBesalco.querySelector('.btn-rechazar')
        if (btnRechazar) {
            btnRechazar.addEventListener('click', procesarRechazoBesalco)
        }
    }

    // Formulario Linkapsis
    const formLinkapsis = document.getElementById('form-validacion-linkapsis')
    if (formLinkapsis) {
        formLinkapsis.addEventListener('submit', procesarValidacionLinkapsis)

        const btnRechazar = formLinkapsis.querySelector('.btn-rechazar')
        if (btnRechazar) {
            btnRechazar.addEventListener('click', procesarRechazoLinkapsis)
        }
    }

    // Formulario LlayLlay
    const formLlayLlay = document.getElementById('form-validacion-llayllay')
    if (formLlayLlay) {
        formLlayLlay.addEventListener('submit', procesarValidacionLlayLlay)

        const btnRechazar = formLlayLlay.querySelector('.btn-rechazar')
        if (btnRechazar) {
            btnRechazar.addEventListener('click', procesarRechazoLlayLlay)
        }
    }

    // Botón de cierre definitivo
    const btnConfirmarCierre = document.getElementById('confirmar-cierre')
    if (btnConfirmarCierre) {
        btnConfirmarCierre.addEventListener('click', async () => {
            if (confirm('¿Estás seguro de que deseas cerrar esta cancha definitivamente?')) {
                await ejecutarAccion('cerrar_cancha', canchaIdActual, null)
                cerrarTodosLosModales()
            }
        })
    }

    // Input de confirmación de borrado
    const inputConfirmacion = document.getElementById('confirmacion-borrado')
    const btnConfirmarBorrado = document.getElementById('confirmar-borrado')

    if (inputConfirmacion && btnConfirmarBorrado) {
        inputConfirmacion.addEventListener('input', () => {
            btnConfirmarBorrado.disabled = inputConfirmacion.value.trim() !== 'borrar-cancha'
        })

        btnConfirmarBorrado.addEventListener('click', async () => {
            await ejecutarAccion('borrar_cancha', canchaIdActual, null)
            cerrarTodosLosModales()
        })
    }
}

// === FUNCIONES DE PROCESAMIENTO DE VALIDACIONES ===

async function procesarValidacionBesalco(e) {
    e.preventDefault()

    const observaciones = document.getElementById('besalco-observaciones').value.trim()
    if (!observaciones) {
        mostrarMensaje('Por favor ingresa observaciones', 'error')
        return
    }

    await ejecutarAccion('finalizar_besalco', canchaIdActual, observaciones)
}

async function procesarRechazoBesalco(e) {
    e.preventDefault()

    const observaciones = document.getElementById('besalco-observaciones').value.trim()
    if (!observaciones) {
        mostrarMensaje('Por favor ingresa observaciones del rechazo', 'error')
        return
    }

    await ejecutarAccion('rechazar_besalco', canchaIdActual, observaciones)
}

async function procesarValidacionLinkapsis(e) {
    e.preventDefault()

    const observaciones = document.getElementById('linkapsis-observaciones').value.trim()
    const espesor = parseFloat(document.getElementById('linkapsis-espesor').value)

    if (!observaciones || !espesor) {
        mostrarMensaje('Por favor completa las observaciones y la medición de espesor', 'error')
        return
    }

    // Verificar si es revalidación
    const isRevalidacion = await esRevalidacion(canchaIdActual, 'Linkapsis')

    // Recopilar tipo de trabajo
    const tipoTrabajo = []
    if (document.getElementById('trabajo-corte').checked) {
        tipoTrabajo.push('corte')
    }
    if (document.getElementById('trabajo-relleno').checked) {
        tipoTrabajo.push('relleno')
    }

    // Recopilar coordenadas de los 4 puntos
    const coordenadas = {
        p1: {
            norte: parseFloat(document.getElementById('p1-norte').value) || null,
            este: parseFloat(document.getElementById('p1-este').value) || null,
            cota: parseFloat(document.getElementById('p1-cota').value) || null
        },
        p2: {
            norte: parseFloat(document.getElementById('p2-norte').value) || null,
            este: parseFloat(document.getElementById('p2-este').value) || null,
            cota: parseFloat(document.getElementById('p2-cota').value) || null
        },
        p3: {
            norte: parseFloat(document.getElementById('p3-norte').value) || null,
            este: parseFloat(document.getElementById('p3-este').value) || null,
            cota: parseFloat(document.getElementById('p3-cota').value) || null
        },
        p4: {
            norte: parseFloat(document.getElementById('p4-norte').value) || null,
            este: parseFloat(document.getElementById('p4-este').value) || null,
            cota: parseFloat(document.getElementById('p4-cota').value) || null
        }
    }

    const mediciones = {
        espesor: espesor,
        unidad: 'metros',
        tipoTrabajo: tipoTrabajo,
        coordenadas: coordenadas,
        isRevalidacion: isRevalidacion
    }

    await ejecutarAccion('validar_linkapsis', canchaIdActual, observaciones, mediciones)
}

async function procesarRechazoLinkapsis(e) {
    e.preventDefault()

    const observaciones = document.getElementById('linkapsis-observaciones').value.trim()
    const espesor = parseFloat(document.getElementById('linkapsis-espesor').value)

    if (!observaciones) {
        mostrarMensaje('Por favor ingresa observaciones del rechazo', 'error')
        return
    }

    // Incluir mediciones aunque sea rechazo
    let mediciones = null
    if (espesor) {
        // Recopilar tipo de trabajo si están marcados
        const tipoTrabajo = []
        if (document.getElementById('trabajo-corte').checked) {
            tipoTrabajo.push('corte')
        }
        if (document.getElementById('trabajo-relleno').checked) {
            tipoTrabajo.push('relleno')
        }

        // Recopilar coordenadas si están disponibles
        const coordenadas = {
            p1: {
                norte: parseFloat(document.getElementById('p1-norte').value) || null,
                este: parseFloat(document.getElementById('p1-este').value) || null,
                cota: parseFloat(document.getElementById('p1-cota').value) || null
            },
            p2: {
                norte: parseFloat(document.getElementById('p2-norte').value) || null,
                este: parseFloat(document.getElementById('p2-este').value) || null,
                cota: parseFloat(document.getElementById('p2-cota').value) || null
            },
            p3: {
                norte: parseFloat(document.getElementById('p3-norte').value) || null,
                este: parseFloat(document.getElementById('p3-este').value) || null,
                cota: parseFloat(document.getElementById('p3-cota').value) || null
            },
            p4: {
                norte: parseFloat(document.getElementById('p4-norte').value) || null,
                este: parseFloat(document.getElementById('p4-este').value) || null,
                cota: parseFloat(document.getElementById('p4-cota').value) || null
            }
        }

        mediciones = {
            espesor: espesor,
            unidad: 'metros',
            tipoTrabajo: tipoTrabajo,
            coordenadas: coordenadas
        }
    }

    await ejecutarAccion('rechazar_linkapsis', canchaIdActual, observaciones, mediciones)
}

async function procesarValidacionLlayLlay(e) {
    e.preventDefault()

    const observaciones = document.getElementById('llayllay-observaciones').value.trim()
    const densidad = parseFloat(document.getElementById('llayllay-densidad').value)

    if (!observaciones || !densidad) {
        mostrarMensaje('Por favor completa observaciones y densidad', 'error')
        return
    }

    // Verificar si es revalidación
    const isRevalidacion = await esRevalidacion(canchaIdActual, 'LlayLlay')

    const mediciones = {
        densidad: densidad,
        unidad: 'g/cm³',
        isRevalidacion: isRevalidacion
    }

    await ejecutarAccion('validar_llay_llay', canchaIdActual, observaciones, mediciones)
}

async function procesarRechazoLlayLlay(e) {
    e.preventDefault()

    const observaciones = document.getElementById('llayllay-observaciones').value.trim()
    const densidad = parseFloat(document.getElementById('llayllay-densidad').value)

    if (!observaciones) {
        mostrarMensaje('Por favor ingresa observaciones del rechazo', 'error')
        return
    }

    // Incluir mediciones aunque sea rechazo
    let mediciones = null
    if (densidad) {
        mediciones = {
            densidad: densidad,
            unidad: 'g/cm³'
        }
    }

    await ejecutarAccion('rechazar_llay_llay', canchaIdActual, observaciones, mediciones)
}

// Función auxiliar para determinar si es revalidación
async function esRevalidacion(canchaId, empresa) {
    try {
        const response = await fetch(`/api/canchas/${canchaId}`)
        if (!response.ok) return false

        const data = await response.json()
        const cancha = data.cancha

        // Buscar validaciones previas de la misma empresa
        const validacionesPrevias = cancha.validaciones?.filter(v =>
            v.empresa === empresa && v.estado === 'VALIDADO'
        ) || []

        return validacionesPrevias.length > 0
    } catch (error) {
        console.error('Error al verificar revalidación:', error)
        return false
    }
}

// Función unificada para ejecutar acciones
async function ejecutarAccion(accion, canchaId, observaciones, mediciones = null) {
    try {
        cargando = true

        const payload = {
            accion: accion,
            observaciones: observaciones,
            usuario: usuarioLogueado // Incluir información del usuario actual
        }

        if (mediciones) {
            payload.mediciones = mediciones
        }

        const response = await fetch(`/api/canchas/${canchaId}/accion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor')
        }

        const resultado = await response.json()

        cerrarTodosLosModales()
        mostrarMensaje(`Acción completada exitosamente`, 'success')

        // Recargar canchas para mostrar cambios
        await cargarCanchas()

    } catch (error) {
        console.error('Error al ejecutar acción:', error)
        mostrarMensaje('Error al procesar la acción', 'error')
    } finally {
        cargando = false
    }
}

// Funciones para el Modal del Mapa
function abrirMapaModal(canchaId, canchaName) {
    console.log('🚀 abrirMapaModal llamado con:', { canchaId, canchaName })

    const modal = document.getElementById('mapModal')
    const mapContainer = document.getElementById('mapContainer')
    const canchaIdSpan = document.getElementById('mapCanchaId')
    const closeBtn = document.getElementById('mapCloseBtn')

    // Extraer el muro del nombre de la cancha (primera parte antes del primer _)
    const muro = canchaName ? canchaName.split('_')[0] : null
    console.log(`🗺️ Abriendo mapa para cancha ${canchaId} (${canchaName}) - Muro detectado: ${muro}`)

    // Mostrar ID y nombre de la cancha en el título
    if (canchaIdSpan) canchaIdSpan.textContent = `${canchaId} (${canchaName || 'Sin nombre'})`

    // Agregar event listener al botón de cerrar
    if (closeBtn) closeBtn.addEventListener('click', cerrarMapaModal)

    // Mostrar el modal
    if (modal) modal.classList.add('show')

    // Agregar evento para cerrar con Escape
    document.addEventListener('keydown', handleEscapeKey)

    // Mostrar indicador de carga
    if (mapContainer) mapContainer.innerHTML = '<div class="map-loading">Cargando mapa...</div>'

    // Cargar el mapa en un iframe con el filtro de muro y cancha ID
    setTimeout(() => {
        const iframe = document.createElement('iframe')
        // Pasar el muro y canchaId como parámetros en la URL
        let mapUrl = '/mapbox-window'
        const params = new URLSearchParams()

        if (muro) {
            params.set('muro', muro)
        }
        if (canchaId) {
            params.set('canchaId', canchaId)
        }

        if (params.toString()) {
            mapUrl += '?' + params.toString()
        }

        console.log('🌐 URL del mapa:', mapUrl)
        iframe.src = mapUrl
        iframe.style.width = '100%'
        iframe.style.height = '100%'
        iframe.style.border = 'none'
        iframe.style.borderRadius = '0 0 16px 16px'

        if (mapContainer) {
            mapContainer.innerHTML = ''
            mapContainer.appendChild(iframe)
        }
    }, 300)
}

function cerrarMapaModal() {
    const modal = document.getElementById('mapModal')
    const mapContainer = document.getElementById('mapContainer')
    const closeBtn = document.getElementById('mapCloseBtn')

    if (modal) modal.classList.remove('show')

    // Remover event listeners
    document.removeEventListener('keydown', handleEscapeKey)
    if (closeBtn) closeBtn.removeEventListener('click', cerrarMapaModal)

    // Limpiar el contenido del mapa
    setTimeout(() => {
        if (mapContainer) mapContainer.innerHTML = ''
    }, 300)
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        cerrarMapaModal()
    }
}

// Cerrar modal al hacer clic fuera del contenido
document.addEventListener('click', function (e) {
    const modal = document.getElementById('mapModal')
    if (e.target === modal) {
        cerrarMapaModal()
    }

    const createModal = document.getElementById('createCanchaModal')
    if (e.target === createModal) {
        cerrarModalCrearCancha()
    }
})

// =====================================================
// FUNCIONES PARA CREAR CANCHA CON POLÍGONO
// =====================================================

// Variable global para almacenar las coordenadas del polígono dibujado
let poligonoCoordinadas = null

// Función para abrir el modal de crear cancha
function abrirModalCrearCancha() {
    console.log('🏗️ Abriendo modal de crear cancha...')
    const modal = document.getElementById('createCanchaModal')
    const closeBtn = document.getElementById('createCanchaCloseBtn')

    // Resetear formulario
    document.getElementById('muro-select').value = ''
    document.getElementById('sector-select').value = ''
    document.getElementById('nombre-detalle-input').value = ''
    document.getElementById('open-drawing-btn').disabled = true
    document.getElementById('create-cancha-btn').disabled = true
    document.getElementById('drawing-status').innerHTML = ''
    document.getElementById('drawingMapContainer').style.display = 'none'
    poligonoCoordinadas = null

    // Inicializar estado del selector de sector
    const sectorSelect = document.getElementById('sector-select')
    sectorSelect.disabled = true
    sectorSelect.innerHTML = '<option value="">Selecciona un muro primero</option>'

    // Agregar event listeners
    closeBtn.addEventListener('click', cerrarModalCrearCancha)
    document.getElementById('open-drawing-btn').addEventListener('click', abrirMapaDibujo)
    document.getElementById('create-cancha-btn').addEventListener('click', crearCanchaConPoligono)

    // Agregar listeners para validar formulario
    document.getElementById('muro-select').addEventListener('change', validarFormularioCreacion)
    document.getElementById('sector-select').addEventListener('change', validarFormularioCreacion)
    document.getElementById('nombre-detalle-input').addEventListener('input', validarFormularioCreacion)

    modal.classList.add('show')

    // Agregar evento para cerrar con Escape
    document.addEventListener('keydown', handleEscapeKeyCrear)
}

// Función para cerrar el modal de crear cancha
function cerrarModalCrearCancha() {
    console.log('❌ Cerrando modal de crear cancha...')
    const modal = document.getElementById('createCanchaModal')
    const closeBtn = document.getElementById('createCanchaCloseBtn')

    modal.classList.remove('show')

    // Remover event listeners
    document.removeEventListener('keydown', handleEscapeKeyCrear)
    window.removeEventListener('message', handleDrawingMessage)
    closeBtn.removeEventListener('click', cerrarModalCrearCancha)
    document.getElementById('open-drawing-btn').removeEventListener('click', abrirMapaDibujo)
    document.getElementById('create-cancha-btn').removeEventListener('click', crearCanchaConPoligono)
    document.getElementById('muro-select').removeEventListener('change', validarFormularioCreacion)
    document.getElementById('sector-select').removeEventListener('change', validarFormularioCreacion)
    document.getElementById('nombre-detalle-input').removeEventListener('input', validarFormularioCreacion)

    // Limpiar el contenido del mapa de dibujo
    setTimeout(() => {
        document.getElementById('drawingMapContainer').innerHTML = ''
    }, 300)
}

// Función para validar el formulario y habilitar botones
function validarFormularioCreacion() {
    const muro = document.getElementById('muro-select').value
    const sector = document.getElementById('sector-select').value
    const nombreDetalle = document.getElementById('nombre-detalle-input').value.trim()

    // Solo actualizar opciones de sector si el muro cambió
    const sectorSelect = document.getElementById('sector-select')
    if (sectorSelect.dataset.ultimoMuro !== muro) {
        actualizarOpcionesSector(muro)
        sectorSelect.dataset.ultimoMuro = muro
    }

    const formularioCompleto = muro && sector && nombreDetalle
    document.getElementById('open-drawing-btn').disabled = !formularioCompleto

    // Solo habilitar crear cancha si también hay polígono dibujado
    const puedeCrear = formularioCompleto && poligonoCoordinadas
    document.getElementById('create-cancha-btn').disabled = !puedeCrear

    console.log('🔍 Validación formulario:', { muro, sector, nombreDetalle, formularioCompleto, puedeCrear })
}

// Función para actualizar las opciones del selector de sector
function actualizarOpcionesSector(muro) {
    const sectorSelect = document.getElementById('sector-select')

    if (!muro) {
        sectorSelect.disabled = true
        sectorSelect.innerHTML = '<option value="">Selecciona un muro primero</option>'
        return
    }

    // Guardar la selección actual antes de regenerar
    const seleccionActual = sectorSelect.value

    sectorSelect.disabled = false

    // Determinar el rango de sectores según el muro
    let maxSector = 3 // Por defecto para MO y ME
    if (muro === 'MP') {
        maxSector = 7
    }

    // Generar opciones dinámicamente
    let opciones = '<option value="">Selecciona un sector</option>'
    for (let i = 1; i <= maxSector; i++) {
        opciones += `<option value="S${i}">S${i}</option>`
    }

    sectorSelect.innerHTML = opciones

    // Restaurar la selección anterior si es válida
    if (seleccionActual && seleccionActual.match(/^S[1-9]$/)) {
        const numeroSector = parseInt(seleccionActual.substring(1))
        if (numeroSector <= maxSector) {
            sectorSelect.value = seleccionActual
        }
    }

    console.log(`📍 Muro ${muro} seleccionado - Sectores disponibles: S1 a S${maxSector}`)
}

// Función para abrir el mapa de dibujo
function abrirMapaDibujo() {
    console.log('🗺️ Abriendo mapa de dibujo...')
    const muro = document.getElementById('muro-select').value
    const drawingContainer = document.getElementById('drawingMapContainer')
    const statusDiv = document.getElementById('drawing-status')

    // Mostrar status de carga
    statusDiv.innerHTML = '🔄 Cargando mapa de dibujo...'
    statusDiv.className = 'drawing-status info'

    // Mostrar el contenedor del mapa
    drawingContainer.style.display = 'block'

    // Crear iframe con el mapa de dibujo
    setTimeout(() => {
        const iframe = document.createElement('iframe')
        iframe.src = `/mapbox-window?muro=${encodeURIComponent(muro)}&drawing=true`
        iframe.style.width = '100%'
        iframe.style.height = '100%'
        iframe.style.border = 'none'

        // Limpiar listener anterior si existe
        window.removeEventListener('message', handleDrawingMessage)

        // Agregar listener para mensajes del iframe
        window.addEventListener('message', handleDrawingMessage)

        drawingContainer.innerHTML = ''
        drawingContainer.appendChild(iframe)

        statusDiv.innerHTML = '🎨 Herramientas de dibujo activas'
        statusDiv.className = 'drawing-status info'
    }, 300)
}

// Función para manejar mensajes del iframe de dibujo
function handleDrawingMessage(event) {
    if (event.data.type === 'polygon-drawn') {
        poligonoCoordinadas = event.data.coordinates
        console.log('✅ Polígono recibido del iframe:', poligonoCoordinadas)

        const statusDiv = document.getElementById('drawing-status')
        statusDiv.innerHTML = `✅ ¡Área dibujada correctamente! (${poligonoCoordinadas.length} puntos) Ahora puedes crear la cancha.`
        statusDiv.className = 'drawing-status success'

        // Validar formulario nuevamente para habilitar el botón de crear
        validarFormularioCreacion()
    } else if (event.data.type === 'polygon-deleted') {
        poligonoCoordinadas = null
        console.log('🗑️ Polígono eliminado del iframe')

        const statusDiv = document.getElementById('drawing-status')
        statusDiv.innerHTML = '🎨 Dibuja un nuevo área de trabajo en el mapa'
        statusDiv.className = 'drawing-status info'

        // Validar formulario nuevamente para deshabilitar el botón de crear
        validarFormularioCreacion()
    }
}

// Función para crear la cancha con polígono
async function crearCanchaConPoligono() {
    console.log('🚀 Creando cancha con polígono...')

    const muro = document.getElementById('muro-select').value
    const sector = document.getElementById('sector-select').value
    const nombreDetalle = document.getElementById('nombre-detalle-input').value.trim()

    if (!muro || !sector || !nombreDetalle || !poligonoCoordinadas) {
        alert('Por favor completa todos los campos y dibuja el área en el mapa')
        return
    }

    try {
        // Deshabilitar botón mientras se crea
        document.getElementById('create-cancha-btn').disabled = true
        document.getElementById('create-cancha-btn').textContent = 'Creando...'

        const response = await fetch('/api/canchas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                muro,
                sector,
                nombreDetalle,
                poligonoCoordinadas
            })
        })

        if (!response.ok) {
            throw new Error('Error al crear la cancha')
        }

        const nuevaCancha = await response.json()
        console.log('✅ Cancha creada exitosamente:', nuevaCancha)

        // Cerrar modal
        cerrarModalCrearCancha()

        // Recargar la lista de canchas
        await cargarCanchas()

        // Mostrar mensaje de éxito
        mostrarMensaje(`Cancha ${nuevaCancha.nombre} creada exitosamente con área dibujada`, 'success')

    } catch (error) {
        console.error('❌ Error al crear cancha:', error)
        alert('Error al crear la cancha: ' + error.message)
    } finally {
        // Restaurar botón
        document.getElementById('create-cancha-btn').disabled = false
        document.getElementById('create-cancha-btn').textContent = 'Crear Cancha'
    }
}

// Manejar tecla Escape para cerrar modal de crear cancha
function handleEscapeKeyCrear(e) {
    if (e.key === 'Escape') {
        cerrarModalCrearCancha()
    }
}

// Inicializar la aplicación
inicializar()
