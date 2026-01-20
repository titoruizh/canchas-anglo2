/**
 * SubirCanchasManager
 *
 * Gestiona la funcionalidad completa de "Subir Canchas" para usuarios de Linkapsis.
 * Maneja la navegación entre selector de tipo y formularios (cancha/muestra),
 * validación, preview de fotos, y captura de datos.
 *
 * Estado actual: Frontend completo, sin backend (solo console.log).
 */

export class SubirCanchasManager {
    private modal: HTMLElement | null = null;
    private seleccionTipo: HTMLElement | null = null;
    private formularioCancha: HTMLElement | null = null;
    private formularioMuestra: HTMLElement | null = null;

    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadResponsables();
        this.setupMuroSelectorForBothForms();
        this.setupPhotoPreviewForBothForms();
        this.setupFormSubmitHandlers();
    }

    /**
     * Inicializa las referencias a elementos DOM
     */
    private initializeElements(): void {
        this.modal = document.getElementById("modal-subir-canchas");
        this.seleccionTipo = document.getElementById("seleccion-tipo");
        this.formularioCancha = document.getElementById("formulario-cancha");
        this.formularioMuestra = document.getElementById("formulario-muestra");

        if (!this.modal) {
            console.warn(
                "Modal de Subir Canchas no encontrado. ¿Se importó el componente?",
            );
        }
    }

    /**
     * Abre el modal (llamado desde index.astro)
     */
    public open(): void {
        if (!this.modal) return;

        this.modal.style.display = "flex";

        // Asegurar que estamos en la pantalla de selección
        this.showSelection();
    }

    /**
     * Cierra el modal
     */
    public close(): void {
        if (!this.modal) return;

        this.modal.style.display = "none";

        // Resetear a pantalla de selección
        this.showSelection();
    }

    /**
     * Muestra la pantalla de selección (oculta formularios)
     */
    private showSelection(): void {
        if (this.seleccionTipo) this.seleccionTipo.style.display = "block";
        if (this.formularioCancha) this.formularioCancha.style.display = "none";
        if (this.formularioMuestra) this.formularioMuestra.style.display = "none";
    }

    /**
     * Configura event listeners principales
     */
    private setupEventListeners(): void {
        if (!this.modal) return;

        // Botón cerrar (X)
        const closeBtn = this.modal.querySelector(".close-btn");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => this.close());
        }

        // Botones cancelar
        const cancelButtons = this.modal.querySelectorAll(".btn-cancel");
        cancelButtons.forEach((btn) => {
            btn.addEventListener("click", () => this.close());
        });

        // Click en backdrop (fuera del modal-content)
        this.modal.addEventListener("click", (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Tarjetas de selección de tipo
        const tipoCards = this.modal.querySelectorAll(".tipo-card");
        tipoCards.forEach((card) => {
            card.addEventListener("click", () => {
                const tipo = (card as HTMLElement).dataset.tipo;
                this.navigateToForm(tipo);
            });
        });

        // Botones "Volver"
        const botonesVolver = this.modal.querySelectorAll(".btn-volver");
        botonesVolver.forEach((btn) => {
            btn.addEventListener("click", () => this.showSelection());
        });
    }

    /**
     * Navega al formulario correspondiente
     */
    private navigateToForm(tipo: string | undefined): void {
        if (!tipo) return;

        if (tipo === "cancha") {
            if (this.seleccionTipo) this.seleccionTipo.style.display = "none";
            if (this.formularioCancha) this.formularioCancha.style.display = "block";
            if (this.formularioMuestra)
                this.formularioMuestra.style.display = "none";
        } else if (tipo === "muestra") {
            if (this.seleccionTipo) this.seleccionTipo.style.display = "none";
            if (this.formularioCancha) this.formularioCancha.style.display = "none";
            if (this.formularioMuestra)
                this.formularioMuestra.style.display = "block";
        }
    }

    /**
     * Configura selectores dinámicos Muro → Sector para ambos formularios
     */
    private setupMuroSelectorForBothForms(): void {
        this.setupMuroSelector("cancha");
        this.setupMuroSelector("muestra");
    }

    /**
     * Configura el selector dinámico Muro → Sector para un tipo específico
     */
    private setupMuroSelector(tipo: "cancha" | "muestra"): void {
        const muroSelect = document.getElementById(`muro-${tipo}`) as HTMLSelectElement;
        const sectorSelect = document.getElementById(`sector-${tipo}`) as HTMLSelectElement;

        if (!muroSelect || !sectorSelect) return;

        muroSelect.addEventListener("change", (e) => {
            const muro = (e.target as HTMLSelectElement).value;
            sectorSelect.disabled = !muro;

            if (muro === "Principal") {
                this.fillSectores(sectorSelect, 7); // S1-S7
            } else if (muro === "Este" || muro === "Oeste") {
                this.fillSectores(sectorSelect, 3); // S1-S3
            } else {
                sectorSelect.innerHTML =
                    '<option value="">Seleccione muro primero...</option>';
            }
        });
    }

    /**
     * Llena el selector de sectores con opciones S1-Sn
     */
    private fillSectores(select: HTMLSelectElement, cantidad: number): void {
        select.innerHTML = '<option value="">Seleccione...</option>';
        for (let i = 1; i <= cantidad; i++) {
            const option = document.createElement("option");
            option.value = `S${i}`;
            option.textContent = `S${i}`;
            select.appendChild(option);
        }
    }

    /**
     * Configura preview de fotos para ambos formularios
     */
    private setupPhotoPreviewForBothForms(): void {
        this.setupPhotoPreview("cancha");
        this.setupPhotoPreview("muestra");
    }

    /**
     * Configura el preview de foto para un tipo específico
     */
    private setupPhotoPreview(tipo: "cancha" | "muestra"): void {
        const fotoInput = document.getElementById(`foto-${tipo}`) as HTMLInputElement;
        const previewDiv = document.getElementById(`preview-foto-${tipo}`);
        const imgPreview = document.getElementById(`img-preview-${tipo}`) as HTMLImageElement;

        if (!fotoInput || !previewDiv || !imgPreview) return;

        fotoInput.addEventListener("change", (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];

            if (file && file.type.startsWith("image/")) {
                // Validar tamaño (5MB máximo)
                if (file.size > 5 * 1024 * 1024) {
                    alert("La imagen es demasiado grande. Máximo 5MB.");
                    fotoInput.value = "";
                    previewDiv.style.display = "none";
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    imgPreview.src = e.target?.result as string;
                    previewDiv.style.display = "block";
                };
                reader.readAsDataURL(file);
            } else {
                previewDiv.style.display = "none";
            }
        });
    }

    /**
     * Carga la lista de responsables desde la API
     */
    private async loadResponsables(): Promise<void> {
        const select = document.getElementById("responsable-cancha") as HTMLSelectElement;
        if (!select) return;

        try {
            const response = await fetch("/api/usuarios");

            if (!response.ok) {
                throw new Error("Error al cargar usuarios");
            }

            const data = await response.json();

            if (data.success && data.usuarios) {
                // Filtrar solo usuarios de Linkapsis (empresa_id = 3) activos
                const usuariosLinkapsis = data.usuarios.filter(
                    (usuario: any) => usuario.empresa_id === 3 && usuario.activo,
                );

                select.innerHTML = '<option value="">Seleccione...</option>';

                usuariosLinkapsis.forEach((usuario: any) => {
                    const option = document.createElement("option");
                    option.value = usuario.id;
                    option.textContent = usuario.nombre_completo || usuario.nombre;
                    select.appendChild(option);
                });

                if (usuariosLinkapsis.length === 0) {
                    select.innerHTML =
                        '<option value="">No hay usuarios de Linkapsis disponibles</option>';
                }
            } else {
                select.innerHTML =
                    '<option value="">Error al cargar usuarios</option>';
            }
        } catch (error) {
            console.error("Error cargando responsables:", error);
            select.innerHTML = '<option value="">Error al cargar usuarios</option>';
        }
    }

    /**
     * Configura los handlers de submit para ambos formularios
     */
    private setupFormSubmitHandlers(): void {
        this.setupCanchaFormSubmit();
        this.setupMuestraFormSubmit();
    }

    /**
     * Configura el submit del formulario de Cancha
     */
    private setupCanchaFormSubmit(): void {
        const form = document.getElementById("form-subir-canchas") as HTMLFormElement;
        if (!form) return;

        form.addEventListener("submit", (e) => {
            e.preventDefault();

            // Capturar datos del formulario
            const fotoInput = document.getElementById("foto-cancha") as HTMLInputElement;
            const archivoInput = document.getElementById("archivo-cancha") as HTMLInputElement;

            const datos = {
                tipo: "CANCHA",
                muro: (document.getElementById("muro-cancha") as HTMLSelectElement).value,
                sector: (document.getElementById("sector-cancha") as HTMLSelectElement).value,
                relleno: (document.getElementById("relleno-cancha") as HTMLInputElement).value,
                fecha: (document.getElementById("fecha-cancha") as HTMLInputElement).value,
                foto: fotoInput.files?.[0] || null,
                archivo: archivoInput.files?.[0],
                responsable: (document.getElementById("responsable-cancha") as HTMLSelectElement).value,
                metodo: (document.getElementById("metodo-cancha") as HTMLSelectElement).value,
                capas: (document.getElementById("capas-cancha") as HTMLSelectElement).value,
            };

            // Log de datos capturados (actualmente no hay backend)
            console.log("=== DATOS DE CANCHA CAPTURADOS ===");
            console.log("Tipo:", datos.tipo);
            console.log("Muro:", datos.muro);
            console.log("Sector:", datos.sector);
            console.log("Relleno:", datos.relleno);
            console.log("Fecha:", datos.fecha);
            console.log("Foto:", datos.foto ? datos.foto.name : "No seleccionada");
            console.log("Archivo:", datos.archivo?.name);
            console.log("Responsable ID:", datos.responsable);
            console.log("Método:", datos.metodo);
            console.log("N° Capas:", datos.capas);
            console.log("===================================");

            // Mostrar mensaje de éxito
            alert(
                "✅ Datos de CANCHA capturados correctamente\n\nLos datos han sido registrados en la consola.\n(Sin guardar en base de datos por ahora)",
            );

            // Resetear y volver a selección
            this.resetForm("cancha");
        });
    }

    /**
     * Configura el submit del formulario de Muestra
     */
    private setupMuestraFormSubmit(): void {
        const form = document.getElementById("form-subir-muestras") as HTMLFormElement;
        if (!form) return;

        form.addEventListener("submit", (e) => {
            e.preventDefault();

            // Capturar datos del formulario
            const fotoInput = document.getElementById("foto-muestra") as HTMLInputElement;
            const archivoInput = document.getElementById("archivo-muestra") as HTMLInputElement;

            const datos = {
                tipo: "MUESTRA",
                muro: (document.getElementById("muro-muestra") as HTMLSelectElement).value,
                sector: (document.getElementById("sector-muestra") as HTMLSelectElement).value,
                relleno: (document.getElementById("relleno-muestra") as HTMLInputElement).value,
                fecha: (document.getElementById("fecha-muestra") as HTMLInputElement).value,
                foto: fotoInput.files?.[0] || null,
                archivo: archivoInput.files?.[0],
            };

            // Log de datos capturados
            console.log("=== DATOS DE MUESTRA CAPTURADOS ===");
            console.log("Tipo:", datos.tipo);
            console.log("Muro:", datos.muro);
            console.log("Sector:", datos.sector);
            console.log("Relleno:", datos.relleno);
            console.log("Fecha:", datos.fecha);
            console.log("Foto:", datos.foto ? datos.foto.name : "No seleccionada");
            console.log("Archivo:", datos.archivo?.name);
            console.log("===================================");

            // Mostrar mensaje de éxito
            alert(
                "✅ Datos de MUESTRA capturados correctamente\n\nLos datos han sido registrados en la consola.\n(Sin guardar en base de datos por ahora)",
            );

            // Resetear y volver a selección
            this.resetForm("muestra");
        });
    }

    /**
     * Resetea un formulario y vuelve a la pantalla de selección
     */
    private resetForm(tipo: "cancha" | "muestra"): void {
        const formId = tipo === "cancha" ? "form-subir-canchas" : "form-subir-muestras";
        const form = document.getElementById(formId) as HTMLFormElement;

        if (form) {
            form.reset();
        }

        // Resetear preview de foto
        const previewDiv = document.getElementById(`preview-foto-${tipo}`);
        if (previewDiv) {
            previewDiv.style.display = "none";
        }

        // Resetear selector de sector
        const sectorSelect = document.getElementById(`sector-${tipo}`) as HTMLSelectElement;
        if (sectorSelect) {
            sectorSelect.disabled = true;
            sectorSelect.innerHTML =
                '<option value="">Seleccione muro primero...</option>';
        }

        // Volver a pantalla de selección
        this.showSelection();
    }
}
