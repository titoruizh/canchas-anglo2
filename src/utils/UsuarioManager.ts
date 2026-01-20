
// src/utils/UsuarioManager.ts

export interface Usuario {
    id: number;
    nombre_completo: string;
    email: string | null;
    empresa_id: number;
    empresa_nombre: string;
    rol_id: number;
    rol_nombre: string;
    activo: boolean;
    created_at: string;
}

export interface Empresa {
    id: number;
    nombre: string;
}

export interface Rol {
    id: number;
    nombre: string;
    empresa_id: number;
}

export class UsuarioManager {
    currentUser: any = null;
    usuarios: Usuario[] = [];
    empresas: Empresa[] = [];
    roles: Rol[] = [];

    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthentication();
    }

    setupEventListeners() {
        // Botones principales
        const btnLogout = document.getElementById("btn-logout");
        if (btnLogout) btnLogout.addEventListener("click", () => this.logout());

        const btnNuevo = document.getElementById("btn-nuevo-usuario");
        if (btnNuevo) btnNuevo.addEventListener("click", () => this.openCreateModal());

        const btnActualizar = document.getElementById("btn-actualizar");
        if (btnActualizar) btnActualizar.addEventListener("click", () => this.loadUsuarios());

        // Filtros
        const filtroEmpresa = document.getElementById("filtro-empresa");
        if (filtroEmpresa) filtroEmpresa.addEventListener("change", () => this.applyFilters());

        const filtroEstado = document.getElementById("filtro-estado");
        if (filtroEstado) filtroEstado.addEventListener("change", () => this.applyFilters());

        // Modal
        const closeBtn = document.querySelector(".close-btn");
        if (closeBtn) closeBtn.addEventListener("click", () => this.closeModal());

        const closeModalBtn = document.querySelector(".close-modal");
        if (closeModalBtn) closeModalBtn.addEventListener("click", () => this.closeModal());

        const formUsuario = document.getElementById("form-usuario");
        if (formUsuario) formUsuario.addEventListener("submit", (e) => this.handleSubmit(e));

        const empresaSelect = document.getElementById("empresa-select");
        if (empresaSelect) empresaSelect.addEventListener("change", () => this.onEmpresaChange());

        // Cerrar modal al hacer click fuera
        const modal = document.getElementById("usuario-modal");
        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target instanceof Element && e.target.id === "usuario-modal") {
                    this.closeModal();
                }
            });
        }

        // Evento de autenticación
        window.addEventListener("userAuthenticated", (event: any) => {
            if (event.detail) {
                this.currentUser = event.detail;
                this.updateUserInfo();
                this.loadData();
            }
        });
    }

    checkAuthentication() {
        try {
            const sessionData = localStorage.getItem("userSession");
            if (!sessionData) {
                window.location.href = "/login";
                return;
            }

            const session = JSON.parse(sessionData);
            const expiresAt = new Date(session.expiresAt);

            if (expiresAt <= new Date()) {
                localStorage.removeItem("userSession");
                window.location.href = "/login";
                return;
            }

            this.currentUser = session.usuario;

            // Verificar que sea de AngloAmerican (ID 1)
            // NOTA: Ajustar este ID si la empresa AngloAmerican tiene otro ID en tu base de datos
            // En el código original era currentUser.empresa_id !== 1
            if (this.currentUser.empresa_id !== 1) {
                this.showMessage(
                    "No tienes permisos para acceder a esta sección",
                    "error"
                );
                setTimeout(() => {
                    window.location.href = "/";
                }, 2000);
                return;
            }

            this.updateUserInfo();
            this.loadData();
        } catch (error) {
            console.error("Error checking authentication:", error);
            window.location.href = "/login";
        }
    }

    updateUserInfo() {
        const nameEl = document.getElementById("current-user-name");
        const roleEl = document.getElementById("current-user-role");

        if (nameEl && this.currentUser) {
            nameEl.textContent = this.currentUser.nombre_completo;
        }

        if (roleEl && this.currentUser) {
            roleEl.textContent = `${this.currentUser.rol_nombre} - ${this.currentUser.empresa_nombre}`;
        }
    }

    async loadData() {
        try {
            await Promise.all([
                this.loadEmpresas(),
                this.loadRoles(),
                this.loadUsuarios(),
            ]);
        } catch (error) {
            console.error("Error loading data:", error);
            this.showMessage("Error al cargar datos", "error");
        }
    }

    async loadEmpresas() {
        try {
            const response = await fetch("/api/empresas");
            const data = await response.json();

            if (data.success) {
                this.empresas = data.empresas;
                this.populateEmpresaSelects();
            }
        } catch (error) {
            console.error("Error loading empresas:", error);
        }
    }

    async loadRoles() {
        try {
            const response = await fetch("/api/roles");
            const data = await response.json();

            if (data.success) {
                this.roles = data.roles;
            }
        } catch (error) {
            console.error("Error loading roles:", error);
        }
    }

    async loadUsuarios() {
        try {
            const loadingRow = document.getElementById("usuarios-tbody");
            if (loadingRow) loadingRow.innerHTML = '<tr><td colspan="7" class="loading">Cargando usuarios...</td></tr>';

            const response = await fetch("/api/usuarios");
            const data = await response.json();

            if (data.success) {
                this.usuarios = data.usuarios;
                this.renderUsuarios();
            } else {
                this.showMessage("Error al cargar usuarios", "error");
            }
        } catch (error) {
            console.error("Error loading usuarios:", error);
            this.showMessage("Error de conexión al cargar usuarios", "error");
        }
    }

    populateEmpresaSelects() {
        const filtroEmpresa = document.getElementById("filtro-empresa") as HTMLSelectElement;
        const empresaSelect = document.getElementById("empresa-select") as HTMLSelectElement;

        if (!filtroEmpresa || !empresaSelect) return;

        // Limpiar opciones existentes
        filtroEmpresa.innerHTML = '<option value="">Todas las empresas</option>';
        empresaSelect.innerHTML = '<option value="">Seleccione una empresa...</option>';

        this.empresas.forEach((empresa) => {
            // Filtro
            const filterOption = document.createElement("option");
            filterOption.value = empresa.id.toString();
            filterOption.textContent = empresa.nombre;
            filtroEmpresa.appendChild(filterOption);

            // Modal
            const modalOption = document.createElement("option");
            modalOption.value = empresa.id.toString();
            modalOption.textContent = empresa.nombre;
            empresaSelect.appendChild(modalOption);
        });
    }

    onEmpresaChange() {
        const empresaSelect = document.getElementById("empresa-select") as HTMLSelectElement;
        const rolSelect = document.getElementById("rol-select") as HTMLSelectElement;

        if (!empresaSelect || !rolSelect) return;

        const empresaId = empresaSelect.value;

        if (!empresaId) {
            rolSelect.innerHTML = '<option value="">Primero seleccione una empresa</option>';
            rolSelect.disabled = true;
            return;
        }

        rolSelect.disabled = false;
        rolSelect.innerHTML = '<option value="">Seleccione un rol...</option>';

        const rolesEmpresa = this.roles.filter(
            (rol) => rol.empresa_id == parseInt(empresaId),
        );
        rolesEmpresa.forEach((rol) => {
            const option = document.createElement("option");
            option.value = rol.id.toString();
            option.textContent = rol.nombre;
            rolSelect.appendChild(option);
        });
    }

    renderUsuarios() {
        const tbody = document.getElementById("usuarios-tbody");
        if (!tbody) return;

        if (this.usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">No hay usuarios registrados</td></tr>';
            return;
        }

        tbody.innerHTML = this.usuarios
            .map(
                (usuario) => `
        <tr>
            <td><strong>${usuario.nombre_completo}</strong></td>
            <td>${usuario.empresa_nombre}</td>
            <td>${usuario.rol_nombre}</td>
            <td>${usuario.email || "No especificado"}</td>
            <td>
                <span class="estado estado-${usuario.activo ? "activo" : "inactivo"}">
                    ${usuario.activo ? "Activo" : "Inactivo"}
                </span>
            </td>
            <td>${new Date(usuario.created_at).toLocaleDateString("es-ES")}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-primary" onclick="window.usuarioManager.editUsuario(${usuario.id})">
                        ✏️ Editar
                    </button>
                </div>
            </td>
        </tr>
    `)
            .join("");
    }

    applyFilters() {
        const filtroEmpresa = document.getElementById("filtro-empresa") as HTMLSelectElement;
        const filtroEstado = document.getElementById("filtro-estado") as HTMLSelectElement;

        if (!filtroEmpresa || !filtroEstado) return;

        const empresaVal = filtroEmpresa.value;
        const estadoVal = filtroEstado.value;

        // Filtrar sobre una copia para no perder la referencia original si se vuelve a filtrar
        // Pero el diseño original mutaba this.usuarios temporalmente y restauraba
        // Para simplificar y evitar problemas, filtraremos directo del backend o 
        // mantendremos una copia "master" si fuera necesario.
        // Dado el código original:

        // Mejor aproximación: filtrar en renderizado o fetch nuevo. 
        // El original hacía un swap temporal. Replicaré la lógica de filtrado en memoria
        // pero idealmente deberíamos tener allUsuarios vs displayedUsuarios.

        // Vamos a asumir que this.usuarios contiene TODOS los usuarios siempre
        // Y que applyFilters se llama sobre esa base. 
        // Pero wait, si modifico this.usuarios pierdo los datos. 
        // El código original hacía: const usuariosOriginal = this.usuarios; ... this.usuarios = filtered; render; this.usuarios = original;
        // Eso es un poco hacky. Mejor filtrar al vuelo si es posible o recargar.
        // Voy a implementar un filtrado en memoria seguro.

        // Recargar datos frescos primero para asegurar consistencia
        // O mejor: Implementar una caché "todosLosUsuarios"

        // Como no quero cambiar demasiado la lógica, voy a recargar usuarios primero
        // y luego aplicar filtros en el cliente.
        // O simplemente filtrar visualmente.

        // Implementación robusta: 
        // Si no tengo copia de respaldo, la creo ahora
        if (!(this as any)._allUsuarios) {
            (this as any)._allUsuarios = [...this.usuarios];
        } else if ((this as any)._allUsuarios.length < this.usuarios.length) {
            // Si cargué más usuarios, actualizo el respaldo
            (this as any)._allUsuarios = [...this.usuarios];
        }

        let filtered = [...((this as any)._allUsuarios || this.usuarios)];

        if (empresaVal) {
            filtered = filtered.filter(u => u.empresa_id == parseInt(empresaVal));
        }

        if (estadoVal !== "") {
            const activo = estadoVal === "true";
            filtered = filtered.filter(u => u.activo === activo);
        }

        this.usuarios = filtered;
        this.renderUsuarios();

        // Restaurar para futuras operaciones (hacky pero mantiene compatibilidad con la logica simple)
        // Mejor: en la próxima llamada a loadUsuarios se resetea todo.
        // Pero si cambio filtro sin recargar, necesito la base completa.
        // Por eso usaré _allUsuarios como fuente de verdad.
    }

    openCreateModal() {
        const title = document.getElementById("modal-title");
        if (title) title.textContent = "Crear Nuevo Usuario";

        const form = document.getElementById("form-usuario") as HTMLFormElement;
        if (form) {
            form.reset();
            delete form.dataset.editId;
        }

        const check = document.getElementById("activo-check") as HTMLInputElement;
        if (check) check.checked = true;

        const rolSelect = document.getElementById("rol-select") as HTMLSelectElement;
        if (rolSelect) rolSelect.disabled = true;

        const modal = document.getElementById("usuario-modal");
        if (modal) modal.classList.add("show");
    }

    editUsuario(id: number) {
        // Asegurarse de buscar en todos los usuarios, no solo los filtrados
        const source = (this as any)._allUsuarios || this.usuarios;
        const usuario = source.find((u: Usuario) => u.id === id);

        if (!usuario) return;

        const title = document.getElementById("modal-title");
        if (title) title.textContent = "Editar Usuario";

        const nombreInput = document.getElementById("nombre-completo") as HTMLInputElement;
        if (nombreInput) nombreInput.value = usuario.nombre_completo;

        const emailInput = document.getElementById("email") as HTMLInputElement;
        if (emailInput) emailInput.value = usuario.email || "";

        const empresaSelect = document.getElementById("empresa-select") as HTMLSelectElement;
        if (empresaSelect) empresaSelect.value = usuario.empresa_id.toString();

        const activoCheck = document.getElementById("activo-check") as HTMLInputElement;
        if (activoCheck) activoCheck.checked = usuario.activo;

        // Cargar roles de la empresa
        this.onEmpresaChange();

        setTimeout(() => {
            const rolSelect = document.getElementById("rol-select") as HTMLSelectElement;
            if (rolSelect) rolSelect.value = usuario.rol_id.toString();
        }, 100);

        const form = document.getElementById("form-usuario");
        if (form) form.dataset.editId = id.toString();

        const modal = document.getElementById("usuario-modal");
        if (modal) modal.classList.add("show");
    }

    async handleSubmit(event: Event) {
        event.preventDefault();

        const target = event.target as HTMLFormElement;
        const editId = target.dataset.editId;
        const nombreInput = document.getElementById("nombre-completo") as HTMLInputElement;
        const emailInput = document.getElementById("email") as HTMLInputElement;
        const empresaSelect = document.getElementById("empresa-select") as HTMLSelectElement;
        const rolSelect = document.getElementById("rol-select") as HTMLSelectElement;
        const activoCheck = document.getElementById("activo-check") as HTMLInputElement;

        const userData = {
            nombre_completo: nombreInput.value,
            email: emailInput.value || null,
            empresa_id: parseInt(empresaSelect.value),
            rol_id: parseInt(rolSelect.value),
            activo: activoCheck.checked,
        };

        try {
            let response;
            if (editId) {
                response = await fetch(`/api/usuarios/${editId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(userData),
                });
            } else {
                response = await fetch("/api/usuarios", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(userData),
                });
            }

            const data = await response.json();

            if (response.ok && data.success) {
                this.showMessage(
                    data.message ||
                    `Usuario ${editId ? "actualizado" : "creado"} correctamente`,
                    "success"
                );
                this.closeModal();
                await this.loadUsuarios();
                // Actualizar cache
                (this as any)._allUsuarios = [...this.usuarios];
            } else {
                this.showMessage(
                    data.details ||
                    data.error ||
                    "Error al procesar solicitud",
                    "error"
                );
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            this.showMessage("Error de conexión", "error");
        }
    }

    closeModal() {
        const modal = document.getElementById("usuario-modal");
        if (modal) modal.classList.remove("show");

        const form = document.getElementById("form-usuario") as HTMLFormElement;
        if (form) {
            form.reset();
            delete form.dataset.editId;
        }
    }

    showMessage(message: string, type: string) {
        const container = document.getElementById("message-container");
        if (!container) return;

        container.innerHTML = `<div class="message ${type}">${message}</div>`;

        setTimeout(() => {
            container.innerHTML = "";
        }, 5000);
    }

    logout() {
        localStorage.removeItem("userSession");
        window.location.href = "/login";
    }
}
