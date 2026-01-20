
export class CreateCanchaManager {
    modal: HTMLElement | null;
    form: HTMLFormElement | null;
    muroSelect: HTMLSelectElement | null;
    sectorSelect: HTMLSelectElement | null;
    createBtn: HTMLButtonElement | null;
    openDrawingBtn: HTMLButtonElement | null;
    drawingStatus: HTMLElement | null;
    poligonoCoordinadas: any | null = null;
    drawingWindow: Window | null = null;

    constructor() {
        this.modal = document.getElementById("createCanchaModal");
        this.form = document.querySelector(".create-cancha-form"); // Assuming form container usage or specific form element if added
        this.muroSelect = document.getElementById("muro-select") as HTMLSelectElement;
        this.sectorSelect = document.getElementById("sector-select") as HTMLSelectElement;
        this.createBtn = document.getElementById("create-cancha-btn") as HTMLButtonElement;
        this.openDrawingBtn = document.getElementById("open-drawing-btn") as HTMLButtonElement;
        this.drawingStatus = document.getElementById("drawing-status");

        this.init();
    }

    init() {
        if (!this.modal) return;
        this.setupEventListeners();

        // Listen for messages from iframe
        window.addEventListener("message", (event) => this.handleDrawingMessage(event));
    }

    setupEventListeners() {
        // Close buttons
        const closeBtns = this.modal?.querySelectorAll(".map-close-btn");
        closeBtns?.forEach(btn => {
            btn.addEventListener("click", () => this.closeModal());
        });

        // Muro selection
        this.muroSelect?.addEventListener("change", () => this.handleMuroChange());

        // Inputs change for validation
        const inputs = this.modal?.querySelectorAll("input, select");
        inputs?.forEach(input => {
            input.addEventListener("change", () => this.validateForm());
            input.addEventListener("input", () => this.validateForm());
        });

        // Open drawing map
        this.openDrawingBtn?.addEventListener("click", () => this.openDrawingMap());

        // Create button
        this.createBtn?.addEventListener("click", () => this.createCancha());

        // Click outside to close
        this.modal?.addEventListener("click", (e) => {
            if (e.target === this.modal) this.closeModal();
        });
    }

    handleMuroChange() {
        if (!this.muroSelect || !this.sectorSelect) return;

        const muro = this.muroSelect.value;
        this.sectorSelect.innerHTML = '<option value="">Seleccionar Sector</option>';

        if (!muro) {
            this.sectorSelect.disabled = true;
            this.sectorSelect.innerHTML = '<option value="">Selecciona un muro primero</option>';
            return;
        }

        this.sectorSelect.disabled = false;

        // Populate sectors based on muro (Logic from original file)
        const sectors = this.getSectorsForMuro(muro);

        sectors.forEach(sector => {
            const option = document.createElement("option");
            option.value = sector;
            option.textContent = sector;
            this.sectorSelect!.appendChild(option);
        });

        this.validateForm();
    }

    getSectorsForMuro(muro: string): string[] {
        // Hardcoded logic from original file
        if (muro === "MP") return ["S1", "S2", "S3", "S4", "S5", "S6", "S7"];
        if (muro === "ME") return ["S1", "S2", "S3"];
        if (muro === "MO") return ["S1", "S2", "S3"];
        return [];
    }

    validateForm() {
        if (!this.createBtn || !this.openDrawingBtn) return;

        const muro = this.muroSelect?.value;
        const sector = this.sectorSelect?.value;
        const nombre = (document.getElementById("nombre-detalle-input") as HTMLInputElement)?.value;

        // Enable drawing button if basic info is present
        if (muro && sector && nombre) {
            this.openDrawingBtn.disabled = false;
        } else {
            this.openDrawingBtn.disabled = true;
        }

        // Enable create button only if polygon exists too
        if (muro && sector && nombre && this.poligonoCoordinadas) {
            this.createBtn.disabled = false;
        } else {
            this.createBtn.disabled = true;
        }
    }

    openDrawingMap() {
        const container = document.getElementById("drawingMapContainer");
        if (!container) return;

        container.innerHTML = "";

        const iframe = document.createElement("iframe");
        iframe.src = "/mapbox-window?drawing=true";
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        iframe.style.borderRadius = "8px";

        container.appendChild(iframe);
        this.drawingWindow = iframe.contentWindow;

        // Update status
        if (this.drawingStatus) {
            this.drawingStatus.className = "drawing-status info";
            this.drawingStatus.innerHTML = "✏️ <b>Modo Dibujo Activo:</b> Utilice las herramientas del mapa para dibujar el polígono de la cancha.";
        }
    }

    handleDrawingMessage(event: MessageEvent) {
        // Verify origin if possible, or source
        if (!event.data) return;

        if (event.data.type === "polygon-drawn") {
            this.poligonoCoordinadas = event.data.coordinates;

            if (this.drawingStatus) {
                this.drawingStatus.className = "drawing-status success";
                this.drawingStatus.innerHTML = "✅ <b>Polígono Capturado:</b> Coordenadas registradas correctamente.";
            }

            this.validateForm();
        } else if (event.data.type === "polygon-deleted") {
            this.poligonoCoordinadas = null;

            if (this.drawingStatus) {
                this.drawingStatus.className = "drawing-status info";
                this.drawingStatus.innerHTML = "⚠️ <b>Polígono Borrado:</b> Dibuje una nueva área.";
            }

            this.validateForm();
        }
    }

    async createCancha() {
        const muro = this.muroSelect?.value;
        const sector = this.sectorSelect?.value;
        const nombreDetalle = (document.getElementById("nombre-detalle-input") as HTMLInputElement)?.value;

        if (!muro || !sector || !nombreDetalle || !this.poligonoCoordinadas) {
            this.showNotification("Faltan datos requeridos", "error");
            return;
        }

        try {
            this.createBtn!.innerHTML = "⏳ Creando...";
            this.createBtn!.disabled = true;

            const response = await fetch("/api/canchas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    muro,
                    sector,
                    nombreDetalle,
                    poligonoCoordinadas: this.poligonoCoordinadas,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Dispatch custom event
                const event = new CustomEvent("cancha-created", {
                    detail: { message: "Cancha creada exitosamente", cancha: data }
                });
                window.dispatchEvent(event);

                this.closeModal();
                this.showNotification("Cancha creada exitosamente", "success");
            } else {
                console.error("Error creating cancha (server response):", data);
                this.showNotification("Error al crear cancha: " + (data.error || data.message || "Desconocido"), "error");
            }
        } catch (error) {
            console.error("Error creating cancha:", error);
            this.showNotification("Error de conexión", "error");
        } finally {
            if (this.createBtn) {
                this.createBtn.innerHTML = "✅ Crear Cancha";
                this.createBtn.disabled = false;
            }
        }
    }

    openModal() {
        if (this.modal) {
            this.modal.classList.add("show");
            this.resetForm();
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.classList.remove("show");
            // Clear iframe to stop map resources
            const container = document.getElementById("drawingMapContainer");
            if (container) container.innerHTML = "";
        }
    }

    resetForm() {
        if (this.muroSelect) this.muroSelect.value = "";
        if (this.sectorSelect) {
            this.sectorSelect.innerHTML = '<option value="">Selecciona un muro primero</option>';
            this.sectorSelect.disabled = true;
        }
        const nameInput = document.getElementById("nombre-detalle-input") as HTMLInputElement;
        if (nameInput) nameInput.value = "";

        this.poligonoCoordinadas = null;
        if (this.drawingStatus) {
            this.drawingStatus.innerHTML = "";
            this.drawingStatus.className = "drawing-status";
        }

        this.validateForm();
    }

    showNotification(message: string, type: 'success' | 'error' = 'success') {
        const notification = document.createElement('div');
        notification.className = `anglo-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        // Inline styles for simplicity and self-containment
        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: type === 'success' ? '#1a1d21' : '#2c1515',
            color: type === 'success' ? '#69f0ae' : '#ff8a80',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            zIndex: '9999',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            border: `1px solid ${type === 'success' ? '#69f0ae33' : '#ff8a8033'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backdropFilter: 'blur(8px)'
        });

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });

        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}
