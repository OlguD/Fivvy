import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, finalize, map, shareReplay, take, tap } from "rxjs";
import { API_BASE_URL } from "./api.config";


@Injectable({ providedIn: 'root' })
export class AuthService {
    private apiUrl = `${API_BASE_URL}/auth`;
    private refreshRequest$?: Observable<string>;

    constructor(private http: HttpClient) {}

    login(credentials: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, credentials, { withCredentials: true });
    }

    register(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, data, { withCredentials: true });
    }

    isLoggedIn(): boolean {
        return !!localStorage.getItem('token');
    }

    logout() {
        this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
            .pipe(take(1))
            .subscribe({
                next: () => this.clearSession(),
                error: () => this.clearSession()
            });
    }

    private clearSession(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('currentUser');
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    isAdmin(): boolean {
        const storedRole = localStorage.getItem('role');
        if (storedRole && storedRole.toLowerCase() === 'admin') {
            return true;
        }

        const token = localStorage.getItem('token');
        if (token) {
            const payload = this.decodeToken(token);
            const roleClaim = this.extractRoleFromPayload(payload);
            if (roleClaim) {
                return roleClaim;
            }
        }

        const userInfo = localStorage.getItem('currentUser');
        if (userInfo) {
            try {
                const parsed = JSON.parse(userInfo);
                const role = parsed?.role ?? parsed?.permission ?? parsed?.type;
                if (typeof role === 'string') {
                    return role.toLowerCase() === 'admin';
                }
                if (Array.isArray(role)) {
                    return role.some((value: string) => value?.toLowerCase() === 'admin');
                }
            } catch {
                return false;
            }
        }

        return false;
    }

    storeUserContext(payload: { token: string; role?: string; user?: any }): void {
        localStorage.setItem('token', payload.token);
        if (payload.role) {
            localStorage.setItem('role', payload.role);
        }
        if (payload.user) {
            localStorage.setItem('currentUser', JSON.stringify(payload.user));
        }
    }

    getCurrentUserId(): number | null {
        const userInfo = localStorage.getItem('currentUser');
        if (!userInfo) return null;
        try {
            const parsed = JSON.parse(userInfo);
            const id = parsed?.id ?? parsed?.userId ?? parsed?.sub;
            if (typeof id === 'number') return id;
            if (typeof id === 'string' && id && !Number.isNaN(Number(id))) return Number(id);
            return null;
        } catch {
            return null;
        }
    }

    private decodeToken(token: string): unknown {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = atob(base64);
            return JSON.parse(payload);
        } catch {
            return null;
        }
    }

    private extractRoleFromPayload(payload: unknown): boolean {
        if (!payload || typeof payload !== 'object') {
            return false;
        }

        const candidate = (payload as Record<string, unknown>);
        const claim = candidate['role'] ?? candidate['roles'] ?? candidate['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

        if (typeof claim === 'string') {
            return claim.toLowerCase() === 'admin';
        }

        if (Array.isArray(claim)) {
            return claim.some(item => typeof item === 'string' && item.toLowerCase() === 'admin');
        }

        return false;
    }

    refreshAccessToken(): Observable<string> {
        if (!this.refreshRequest$) {
            this.refreshRequest$ = this.http.post<{ token: string }>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
                .pipe(
                    map(response => response.token),
                    tap(token => {
                        if (token) {
                            this.storeUserContext({ token });
                        }
                    }),
                    shareReplay({ bufferSize: 1, refCount: true }),
                    finalize(() => {
                        this.refreshRequest$ = undefined;
                    })
                );
        }

        return this.refreshRequest$;
    }

    shouldSkipAuthHeader(url: string): boolean {
        // Skip auth header for auth endpoints and for public client portal data
        const lower = url.toLowerCase();
        if (lower.includes('/client/') && lower.includes('/portal')) return true;
        return this.matchesAuthPath(url, ['/auth/login', '/auth/register', '/auth/refresh']);
    }

    shouldSkipRefresh(url: string): boolean {
        // Also skip attempting refresh for client portal endpoints (public)
        const lower = url.toLowerCase();
        if (lower.includes('/client/') && lower.includes('/portal')) return true;
        return this.matchesAuthPath(url, ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']);
    }

    handleAuthFailure(): void {
        this.clearSession();
    }

    private matchesAuthPath(url: string, paths: string[]): boolean {
        const lower = url.toLowerCase();
        return paths.some(path => lower.includes(path));
    }
}