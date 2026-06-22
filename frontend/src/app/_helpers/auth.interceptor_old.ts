import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service'; 

@Injectable()
export class AuthInterceptor implements HttpInterceptor { 
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
      const token = localStorage.getItem('token');
      let authReq = req;    
      console.log(localStorage.getItem('token'));
      if (token) {
          authReq = req.clone({
              setHeaders: {
                  Authorization: `Bearer ${token}`
              }
          })
      } 
      console.log(token)
      
      console.log('Outgoing request headers:', authReq.headers);
      return next.handle(authReq).pipe(
          catchError((error: HttpErrorResponse) => {
              if (error.status === 401) { 
                  this.authService.logout(); 
              } 
              return throwError(error);
          })
      );
  }
}