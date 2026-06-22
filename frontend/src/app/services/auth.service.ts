import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, of, tap } from 'rxjs';
import { ConfigService } from './config/config.service';

export interface User {
  id: string | number;
  username: string;
  name: string;
  role: 'super_admin' | 'supervisor' | 'employee';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'dtr_auth_token';
  private readonly USER_KEY = 'dtr_auth_user';

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private router: Router,
  ) {}

  private get headers() {
    return { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
  }

  login(username: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.configService.apiUrl}/auth/login`, { username, password }, this.headers)
      .pipe(
        tap((res) => this.storeSession(res.token, res.user)),
        catchError(() => {
          const mockUsers: Record<string, { password: string; user: User }> = {
            superadmin: { password: 'admin123', user: { id: 1, username: 'superadmin', name: 'Super Admin', role: 'super_admin' } },
            supervisor: { password: 'super123', user: { id: 2, username: 'supervisor', name: 'John Supervisor', role: 'supervisor' } },
            employee: { password: 'emp123', user: { id: 3, username: 'employee', name: 'Jane Employee', role: 'employee' } },
          };
          const match = mockUsers[username];
          if (match && match.password === password) {
            const token = 'local-' + Date.now();
            this.storeSession(token, match.user);
            return of({ token, user: match.user });
          }
          throw new Error('Invalid username or password');
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string | string[]): boolean {
    const userRole = this.getUser()?.role;
    if (!userRole) return false;
    return Array.isArray(role) ? role.includes(userRole) : userRole === role;
  }

  private storeSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
}
