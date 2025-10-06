import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";


@Injectable({ providedIn: 'root' })
export class AuthService {
    private apiUrl = 'http://localhost:5183/api/auth';

    constructor(private http: HttpClient) {}

    login(credentials: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, credentials);
    }

    register(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, data)
    }

    isLoggedIn(): boolean {
        return !!localStorage.getItem('token');
    }

    logout() {
        localStorage.removeItem('token');
    }
}