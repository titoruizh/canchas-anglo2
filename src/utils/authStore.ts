// src/utils/authStore.ts
export interface UserSession {
  id: number;
  nombre_completo: string;
  email?: string;
  empresa_id: number;
  empresa_nombre: string;
  rol_id: number;
  rol_nombre: string;
  rol_descripcion?: string;
}

export interface SessionData {
  usuario: UserSession;
  loginTime: string;
  expiresAt: string;
}

class AuthStore {
  private static instance: AuthStore;
  private currentUser: UserSession | null = null;
  private sessionExpiry: Date | null = null;

  private constructor() {
    this.loadSessionFromStorage();
  }

  public static getInstance(): AuthStore {
    if (!AuthStore.instance) {
      AuthStore.instance = new AuthStore();
    }
    return AuthStore.instance;
  }

  private loadSessionFromStorage(): void {
    if (typeof window === 'undefined') return; // SSR protection

    try {
      const sessionData = localStorage.getItem('userSession');
      if (sessionData) {
        const session: SessionData = JSON.parse(sessionData);
        const expiresAt = new Date(session.expiresAt);
        
        if (expiresAt > new Date()) {
          this.currentUser = session.usuario;
          this.sessionExpiry = expiresAt;
        } else {
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Error loading session from storage:', error);
      this.clearSession();
    }
  }

  public login(usuario: UserSession, expiryHours: number = 8): void {
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    
    const sessionData: SessionData = {
      usuario,
      loginTime: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    this.currentUser = usuario;
    this.sessionExpiry = expiresAt;

    if (typeof window !== 'undefined') {
      localStorage.setItem('userSession', JSON.stringify(sessionData));
    }

    // Dispatch custom event for reactive updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userLogin', { detail: usuario }));
    }
  }

  public logout(): void {
    this.currentUser = null;
    this.sessionExpiry = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('userSession');
      window.dispatchEvent(new CustomEvent('userLogout'));
    }
  }

  public clearSession(): void {
    this.logout();
  }

  public getCurrentUser(): UserSession | null {
    if (this.isSessionExpired()) {
      this.clearSession();
      return null;
    }
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  public isSessionExpired(): boolean {
    if (!this.sessionExpiry) return true;
    return new Date() >= this.sessionExpiry;
  }

  public getSessionTimeRemaining(): number {
    if (!this.sessionExpiry) return 0;
    const remaining = this.sessionExpiry.getTime() - Date.now();
    return Math.max(0, remaining);
  }

  public extendSession(additionalHours: number = 2): void {
    if (!this.currentUser) return;

    const newExpiry = new Date(Date.now() + additionalHours * 60 * 60 * 1000);
    this.sessionExpiry = newExpiry;

    const sessionData: SessionData = {
      usuario: this.currentUser,
      loginTime: new Date().toISOString(),
      expiresAt: newExpiry.toISOString()
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('userSession', JSON.stringify(sessionData));
    }
  }

  public hasRole(roleName: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.rol_nombre === roleName : false;
  }

  public isFromCompany(companyId: number): boolean {
    const user = this.getCurrentUser();
    return user ? user.empresa_id === companyId : false;
  }

  public isAdmin(): boolean {
    return this.hasRole('Admin');
  }

  public isAngloAmerican(): boolean {
    return this.isFromCompany(1); // AngloAmerican ID = 1
  }

  // Método para usar en middleware de Astro
  public static requireAuth(): UserSession | null {
    const store = AuthStore.getInstance();
    return store.getCurrentUser();
  }

  // Método para redireccionar si no está autenticado
  public static redirectIfNotAuth(redirectTo: string = '/login'): void {
    if (typeof window !== 'undefined') {
      const store = AuthStore.getInstance();
      if (!store.isAuthenticated()) {
        window.location.href = redirectTo;
      }
    }
  }

  // Listeners para eventos de autenticación
  public onLogin(callback: (user: UserSession) => void): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('userLogin', (event: CustomEvent) => {
        callback(event.detail);
      });
    }
  }

  public onLogout(callback: () => void): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('userLogout', callback);
    }
  }
}

// Export singleton instance
export const authStore = AuthStore.getInstance();

// Utility functions
export const requireAuth = AuthStore.requireAuth;
export const redirectIfNotAuth = AuthStore.redirectIfNotAuth;