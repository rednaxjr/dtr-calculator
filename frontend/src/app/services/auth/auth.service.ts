import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt'; 
import { BehaviorSubject } from 'rxjs';


interface AuthResponse {
    token: string;
}
@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private jwtHelper = new JwtHelperService();
    private apiUrl = 'http://localhost:3000/api/';
    private userSubject = new BehaviorSubject<any>(null);
    user = signal<{ id: number, username: string } | null>(null);  
    headers = {
        headers: new HttpHeaders().set('Content-Type', "application/json")
    }
    constructor(private http: HttpClient, private router: Router) {
        this.userSubject.next(localStorage.getItem('token'));
    }
    ngOnInit(): void {
        if (this.isAuthenticated()) {
            this.router.navigate(['/dashboard']);
        }
    }

    getToken() {
        return this.userSubject.asObservable();
    }

    login(data: any): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(this.apiUrl + "auth/loginAccount/", data, this.headers).pipe(
            tap(response => {
                localStorage.setItem('token', response.token);
                this.userSubject.next(this.jwtHelper.decodeToken(response.token));
            })
        );
    }

    logout() {
        localStorage.removeItem('token');
        this.userSubject.next(null);
        this.router.navigate(['/']).then(() => {
            history.pushState(null, '', '/');
        });

    }
    isAuthenticated(): boolean {
        const token = localStorage.getItem('token');
        const user =null;
        console.log(token)
        if (!token) {
            return false;
        }
        if (this.jwtHelper.isTokenExpired(token)) {
            alert("session expired")
            this.logout();  
            return false;
        }
        return true;
    } 
    getUser(): Observable<any> {
        return this.userSubject.asObservable();
    }



}