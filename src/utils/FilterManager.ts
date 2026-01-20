
export type FilterVista = 'acciones' | 'historico';
export type FilterFecha = 'all' | 'today' | 'week' | 'month' | 'custom';
export type Cancha = any; // TODO: Definir interfaz Cancha compartida

interface FilterState {
    vista: FilterVista;
    fecha: FilterFecha;
    fechaDesde?: string;
    fechaHasta?: string;
    estadoActivo: string | null;
}

interface FilterCallbacks {
    onFilterUpdate: (canchasFiltradas: Cancha[]) => void;
    onStatsUpdate: (canchasFiltradas: Cancha[], totalCanchas: number) => void;
}

export class FilterManager {
    private todasLasCanchas: Cancha[] = [];
    private canchasFiltradas: Cancha[] = [];
    private state: FilterState = {
        vista: 'acciones',
        fecha: 'all',
        estadoActivo: null
    };
    private empresaLogueada: any = null;
    private callbacks: FilterCallbacks;

    constructor(callbacks: FilterCallbacks) {
        this.callbacks = callbacks;
        this.initEventListeners();
    }

    public setEmpresa(empresa: any) {
        this.empresaLogueada = empresa;
    }

    public setCanchas(canchas: Cancha[]) {
        this.todasLasCanchas = canchas;
        this.aplicarFiltros();
    }

    public getCanchasFiltradas() {
        return this.canchasFiltradas;
    }

    public setVista(vista: FilterVista) {
        console.log(`FilterManager: Cambiando vista a ${vista}`);
        this.state.vista = vista;
        this.updateVistaUI();
        this.aplicarFiltros();
    }

    public setFecha(tipo: FilterFecha, desde?: string, hasta?: string) {
        this.state.fecha = tipo;
        if (desde) this.state.fechaDesde = desde;
        if (hasta) this.state.fechaHasta = hasta;
        this.aplicarFiltros();
    }

    public toggleEstadoWidget(estadoSlug: string) {
        const widgets = document.querySelectorAll(".estado-widget");

        // Mapeo: Slug -> Nombre Real (BD)
        const estadoMap: Record<string, string> = {
            "creada": "Creada",
            "en-espera": "En Espera",
            "en-proceso": "En Proceso",
            "validada": "Validada",
            "rechazada-en-espera": "Rechazada, en Espera",
            "cerrada": "Cerrada",
        };

        const estadoReal = estadoMap[estadoSlug];
        if (!estadoReal) {
            console.warn("FilterManager: Estado desconocido:", estadoSlug);
            return;
        }

        if (this.state.estadoActivo === estadoReal) {
            // Desactivar filtro
            this.state.estadoActivo = null;
            widgets.forEach((w) => {
                w.classList.remove("selected");
                w.classList.remove("dimmed");
            });
        } else {
            // Activar nuevo filtro
            this.state.estadoActivo = estadoReal;
            widgets.forEach((widget) => {
                const widgetSlug = widget.getAttribute("data-estado");

                if (widgetSlug === estadoSlug) {
                    // Es el seleccionado
                    widget.classList.add("selected");
                    widget.classList.remove("dimmed");
                } else {
                    // No es el seleccionado -> Opacar
                    widget.classList.remove("selected");
                    widget.classList.add("dimmed");
                }
            });
        }
        this.aplicarFiltros();
    }

    private aplicarFiltros() {
        if (!this.empresaLogueada || !this.todasLasCanchas.length) return;

        let resultados = [...this.todasLasCanchas];

        // 1. Filtro Vista
        if (this.state.vista === 'acciones') {
            resultados = this.filtrarPorAccionesDisponibles(resultados);
        }

        // 2. Filtro Fecha
        resultados = this.filtrarPorFecha(resultados);

        // 3. Filtro Estado (Widget)
        if (this.state.estadoActivo) {
            resultados = resultados.filter(c => c.estado_actual === this.state.estadoActivo);
        }

        this.canchasFiltradas = resultados;

        // Notificar cambios
        this.callbacks.onFilterUpdate(this.canchasFiltradas);
        this.callbacks.onStatsUpdate(this.canchasFiltradas, this.todasLasCanchas.length);
        this.updateSliderPosition();
    }

    private filtrarPorAccionesDisponibles(canchas: Cancha[]): Cancha[] {
        const empresaNombre = this.empresaLogueada.nombre;

        return canchas.filter((cancha) => {
            const estado = cancha.estado_actual;
            const empresaActual = cancha.empresa_actual;
            let tieneAccion = false;

            switch (empresaNombre) {
                case "AngloAmerican":
                    tieneAccion = estado === "Creada" || estado === "Validada";
                    break;
                case "Besalco":
                    tieneAccion =
                        (estado === "En Espera" && empresaActual === "Besalco") ||
                        (estado === "En Proceso" && empresaActual === "Besalco") ||
                        (estado === "Rechazada, en Espera" && empresaActual === "Besalco");
                    break;
                case "Linkapsis":
                    tieneAccion =
                        (estado === "En Espera" && empresaActual === "Linkapsis") ||
                        (estado === "En Proceso" && empresaActual === "Linkapsis");
                    break;
                case "LlayLlay":
                    tieneAccion =
                        (estado === "En Espera" && empresaActual === "LlayLlay") ||
                        (estado === "En Proceso" && empresaActual === "LlayLlay");
                    break;
                default:
                    tieneAccion = false;
            }
            return tieneAccion;
        });
    }

    private filtrarPorFecha(canchas: Cancha[]): Cancha[] {
        if (this.state.fecha === 'all') return canchas;

        const ahora = new Date();
        const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

        return canchas.filter((cancha) => {
            const fechaCancha = new Date(cancha.created_at);

            switch (this.state.fecha) {
                case "today":
                    return fechaCancha >= hoy;
                case "week":
                    const semanaAtras = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return fechaCancha >= semanaAtras;
                case "month":
                    const mesAtras = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return fechaCancha >= mesAtras;
                case "custom":
                    if (!this.state.fechaDesde || !this.state.fechaHasta) return true;
                    const desde = new Date(this.state.fechaDesde);
                    const hasta = new Date(this.state.fechaHasta + "T23:59:59");
                    return fechaCancha >= desde && fechaCancha <= hasta;
                default:
                    return true;
            }
        });
    }

    // --- UI Helpers ---

    private initEventListeners() {
        // UI Listeners initialization logic moved here or called from index.astro
        // En esta primera fase, index.astro seguirá bindeando los eventos y llamando a los métodos públicos
    }

    private updateVistaUI() {
        const btnAcciones = document.getElementById('btn-vista-acciones');
        const btnHistorico = document.getElementById('btn-vista-historico');

        if (btnAcciones) btnAcciones.classList.toggle('active', this.state.vista === 'acciones');
        if (btnHistorico) btnHistorico.classList.toggle('active', this.state.vista === 'historico');
    }

    public updateSliderPosition() {
        // Misma lógica del slider visual
        const container = document.querySelector(".toggle-container");
        const activeBtn = container?.querySelector(".active");
        const slider = container?.querySelector(".toggle-slider") as HTMLElement;

        if (activeBtn && slider && container) {
            const containerRect = container.getBoundingClientRect();
            const btnRect = activeBtn.getBoundingClientRect();
            const left = btnRect.left - containerRect.left;
            slider.style.transform = `translateX(${left}px)`;
            slider.style.width = `${btnRect.width}px`;
        }
    }
}
