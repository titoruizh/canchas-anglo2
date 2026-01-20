
export interface Cancha {
    id: number;
    nombre: string;
    estado_actual: string;
    empresa_actual: string;
    created_at: string;
    validaciones?: any[];
    // Add other properties as needed
}

export interface TableCallbacks {
    onAction: (action: string, canchaId: number) => void;
    onZoom: (canchaId: number) => void;
    onSelectionChange?: (selectedIds: number[]) => void;
}

export class TableManager {
    private container: HTMLElement | null;
    private tbody: HTMLElement | null;
    private datos: Cancha[] = [];
    private datosFiltrados: Cancha[] = []; // Current view (filtered)
    private paginaActual: number = 1;
    private filasPorPagina: number = 15;
    private callbacks: TableCallbacks;
    private empresaLogueada: any = null;

    constructor(containerId: string, callbacks: TableCallbacks) {
        this.container = document.getElementById(containerId);
        this.tbody = document.getElementById('canchas-tbody');
        this.callbacks = callbacks;

        this.initEventListeners();
        this.initPaginationListeners();
    }

    public setEmpresa(empresa: any) {
        this.empresaLogueada = empresa;
        // Re-render if data exists to update buttons
        if (this.datosFiltrados.length > 0) {
            this.render();
        }
    }

    public setData(canchas: Cancha[]) {
        this.datos = canchas;
        this.datosFiltrados = canchas; // Default: show all passed
        this.paginaActual = 1;
        this.render();
    }

    // Methods for future local sorting/filtering if needed
    public filterData(canchas: Cancha[]) {
        this.datosFiltrados = canchas;
        this.paginaActual = 1;
        this.render();
    }

    private render() {
        if (!this.tbody) return;

        const inicio = (this.paginaActual - 1) * this.filasPorPagina;
        const fin = inicio + this.filasPorPagina;
        const canchasPagina = this.datosFiltrados.slice(inicio, fin);

        this.tbody.innerHTML = canchasPagina.map(cancha => this.generateRowHTML(cancha)).join('');

        this.updatePaginationUI();
    }

    private generateRowHTML(cancha: Cancha): string {
        const accionesHTML = this.generarBotonesAccion(cancha);

        // Format naming classes
        const estadoClass = cancha.estado_actual.toLowerCase().replace(/\s+/g, "-");
        const empresaClass = cancha.empresa_actual.toLowerCase().replace(/\s+/g, "-");

        return `
          <tr data-cancha-id="${cancha.id}" class="cancha-row">
            <td style="text-align: center;">
              <input type="checkbox" class="cancha-checkbox" data-cancha-id="${cancha.id}" data-cancha-nombre="${cancha.nombre}">
            </td>
            <td><strong>${cancha.nombre.toUpperCase()}</strong></td>
            <td>
              <span class="estado estado-${estadoClass}">${cancha.estado_actual}</span>
            </td>
            <td>
              <span class="empresa-actual empresa-${empresaClass}">${cancha.empresa_actual}</span>
            </td>
            <td>${new Date(cancha.created_at).toLocaleDateString("es-ES")}</td>
            <td>
              <button class="btn-mapa" data-cancha-id="${cancha.id}" type="button" 
                style="background:none; border:none; font-size:1.5rem; cursor:pointer; padding:0.5rem; transition: transform 0.2s;" 
                title="Ver en mapa">🗺️</button>
            </td>
            <td>
              <div class="actions">
                ${accionesHTML}
              </div>
            </td>
          </tr>
        `;
    }

    private generarBotonesAccion(cancha: Cancha): string {
        if (!this.empresaLogueada) {
            return '<span style="color:#666;">Cargando...</span>';
        }

        const botones: string[] = [];
        const empresaId = this.empresaLogueada.id;
        const estado = cancha.estado_actual;
        const empresaActual = cancha.empresa_actual;
        const canchaId = cancha.id;

        // Logic extracted from index.astro (generarBotonesAccion)

        // AngloAmerican (ID 1)
        if (empresaId === 1) {
            if (estado === "Creada") {
                botones.push(`<button class="btn-accion" data-accion="enviar-besalco" data-cancha-id="${canchaId}">📤 Enviar a Besalco</button>`);
            } else if (estado === "Validada") {
                botones.push(`<button class="btn-accion btn-success" data-accion="abrir-modal-cierre" data-cancha-id="${canchaId}">🔒 Cerrar Cancha</button>`);
            } else if (estado === "En Proceso" && empresaActual === "AngloAmerican") {
                // Check validations for PDF button
                const validaciones = cancha.validaciones || [];
                const hasLinkapsis = validaciones.some((v: any) => v.empresa === "Linkapsis" && v.estado === "VALIDADO");
                const hasLlayLlay = validaciones.some((v: any) => v.empresa === "LlayLlay" && v.estado === "VALIDADO");
                const hasBesalco = validaciones.some((v: any) => v.empresa === "Besalco" && v.estado === "VALIDADO");

                if (hasLinkapsis && hasLlayLlay && hasBesalco) {
                    botones.push(`<button class="btn-accion btn-pdf" data-accion="exportar-pdf" data-cancha-id="${canchaId}">📄 PDF</button>`);
                }
            } else if (estado === "Finalizada" || estado === "Cerrada") {
                botones.push(`<button class="btn-accion btn-pdf" data-accion="exportar-pdf" data-cancha-id="${canchaId}">📄 PDF</button>`);
            }
        }
        // Besalco (ID 2)
        else if (empresaId === 2) {
            if ((estado === "En Espera" || estado === "Rechazada, en Espera") && empresaActual === "Besalco") {
                botones.push(`<button class="btn-accion btn-info" data-accion="recepcionar-besalco" data-cancha-id="${canchaId}">📋 Recepcionar Trabajo</button>`);
            } else if (estado === "En Proceso" && empresaActual === "Besalco") {
                botones.push(`<button class="btn-accion btn-success" data-accion="validar-besalco" data-cancha-id="${canchaId}">🛠️ Gestionar</button>`);
            }
        }
        // Linkapsis (ID 3)
        else if (empresaId === 3) {
            if (estado === "En Espera" && empresaActual === "Linkapsis") {
                botones.push(`<button class="btn-accion btn-info" data-accion="recepcionar-linkapsis" data-cancha-id="${canchaId}">📋 Recepcionar Trabajo</button>`);
            } else if (estado === "En Proceso" && empresaActual === "Linkapsis") {
                botones.push(`<button class="btn-accion btn-success" data-accion="validar-linkapsis" data-cancha-id="${canchaId}">📏 Gestionar</button>`);
            }
        }
        // LlayLlay (ID 4)
        else if (empresaId === 4) {
            if (estado === "En Espera" && empresaActual === "LlayLlay") {
                botones.push(`<button class="btn-accion btn-info" data-accion="recepcionar-llayllay" data-cancha-id="${canchaId}">📋 Recepcionar Trabajo</button>`);
            } else if (estado === "En Proceso" && empresaActual === "LlayLlay") {
                botones.push(`<button class="btn-accion btn-success" data-accion="validar-llayllay" data-cancha-id="${canchaId}">🧪 Gestionar</button>`);
            }
        }

        return botones.length > 0 ? botones.join("") : '<span style="color:#666;">Sin acciones disponibles</span>';
    }

    private updatePaginationUI() {
        const totalCanchas = this.datosFiltrados.length;
        const totalPaginas = Math.ceil(totalCanchas / this.filasPorPagina);
        const inicio = (this.paginaActual - 1) * this.filasPorPagina + 1;
        const fin = Math.min(inicio + this.filasPorPagina - 1, totalCanchas);

        // Update Text
        const elInicio = document.getElementById("pagination-start");
        const elFin = document.getElementById("pagination-end");
        const elTotal = document.getElementById("pagination-total");
        const elPagActual = document.getElementById("pagina-actual");
        const elTotalPags = document.getElementById("total-paginas");

        if (elInicio) elInicio.textContent = (totalCanchas > 0 ? inicio : 0).toString();
        if (elFin) elFin.textContent = fin.toString();
        if (elTotal) elTotal.textContent = totalCanchas.toString();
        if (elPagActual) elPagActual.textContent = this.paginaActual.toString();
        if (elTotalPags) elTotalPags.textContent = (totalPaginas || 1).toString();

        // Update Buttons
        const cols = {
            first: document.getElementById("btn-primera-pagina") as HTMLButtonElement,
            prev: document.getElementById("btn-pagina-anterior") as HTMLButtonElement,
            next: document.getElementById("btn-pagina-siguiente") as HTMLButtonElement,
            last: document.getElementById("btn-ultima-pagina") as HTMLButtonElement
        };

        if (cols.first) cols.first.disabled = this.paginaActual === 1;
        if (cols.prev) cols.prev.disabled = this.paginaActual === 1;
        if (cols.next) cols.next.disabled = this.paginaActual >= totalPaginas;
        if (cols.last) cols.last.disabled = this.paginaActual >= totalPaginas;
    }

    // --- Interaction ---

    private initEventListeners() {
        if (!this.tbody) return;

        this.tbody.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            // 1. Action Buttons
            if (target.classList.contains('btn-accion')) {
                const accion = target.getAttribute('data-accion');
                const id = target.getAttribute('data-cancha-id');
                if (accion && id) {
                    this.callbacks.onAction(accion, parseInt(id));
                }
            }

            // 2. Map Button
            if (target.closest('.btn-mapa')) {
                const btn = target.closest('.btn-mapa') as HTMLElement;
                const id = btn.getAttribute('data-cancha-id');
                if (id) {
                    this.callbacks.onZoom(parseInt(id)); // Using zoom callback to open modal as well? 
                    // Actually the original behavior: btn-mapa opens Modal, dblclick Zooms on Dashboard.
                    // Let's distinguish them. onZoom can serve both or we can emit 'openMapModal'.
                    // For now, I'll direct .btn-mapa to a new specific action 'abrir-mapa-modal'
                    this.callbacks.onAction('abrir-mapa-modal', parseInt(id));
                }
            }

            // 3. Selection Checkboxes
            if (target.classList.contains('cancha-checkbox')) {
                this.handleSelectionChange();
            }
        });

        // 4. Row Double Click
        this.tbody.addEventListener('dblclick', (e) => {
            const target = e.target as HTMLElement;
            const row = target.closest('tr');
            if (row && row.dataset.canchaId) {
                // Ignore if clicked on button or checkbox
                if (target.closest('button') || target.closest('input')) return;

                this.callbacks.onZoom(parseInt(row.dataset.canchaId));
            }
        });
    }

    private handleSelectionChange() {
        if (!this.tbody) return;
        const checkboxes = this.tbody.querySelectorAll('.cancha-checkbox:checked');
        const ids = Array.from(checkboxes).map(cb => parseInt((cb as HTMLElement).getAttribute('data-cancha-id') || '0'));

        if (this.callbacks.onSelectionChange) {
            this.callbacks.onSelectionChange(ids);
        }
    }

    private initPaginationListeners() {
        document.getElementById("btn-primera-pagina")?.addEventListener("click", () => {
            if (this.paginaActual !== 1) {
                this.paginaActual = 1;
                this.render();
            }
        });

        document.getElementById("btn-pagina-anterior")?.addEventListener("click", () => {
            if (this.paginaActual > 1) {
                this.paginaActual--;
                this.render();
            }
        });

        document.getElementById("btn-pagina-siguiente")?.addEventListener("click", () => {
            const totalPaginas = Math.ceil(this.datosFiltrados.length / this.filasPorPagina);
            if (this.paginaActual < totalPaginas) {
                this.paginaActual++;
                this.render();
            }
        });

        document.getElementById("btn-ultima-pagina")?.addEventListener("click", () => {
            const totalPaginas = Math.ceil(this.datosFiltrados.length / this.filasPorPagina);
            if (this.paginaActual !== totalPaginas) {
                this.paginaActual = totalPaginas || 1;
                this.render();
            }
        });
    }
}
