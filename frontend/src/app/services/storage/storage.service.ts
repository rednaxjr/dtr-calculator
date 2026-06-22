import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { decodeJwtToken } from '../../_helpers/jwt.util';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private jwtHelper = new JwtHelperService();
  
  constructor(

  ) {

  }
  getItem(key: string): string | null {
    try {
      const item = localStorage.getItem(key);
      return item ? item : null;
     
    } catch (error) {
      console.error('Failed to get item from localStorage:', error);
      return null;
    }
  }

  getToken() {
    try {
      return localStorage.getItem("token");
    } catch (error) {
      console.error('Failed to get item from localStorage:', error);
      return null;
    }
  }
   
  getDecodedToken(data:any): any {
    const token = localStorage.getItem(data);
    if (token) {
      try {
        return decodeJwtToken(token);
      } catch (e) {
        console.error('Error decoding token:', e);
        return null;
      }
    }
    return null;
  }
   

  setItem(key: string, value: string): void {

    try {
      localStorage.setItem(key, value);
      console.log("sulod diria")
      this.getItem("token")
    } catch (error) {
      console.error('Failed to set item in localStorage:', error);
    }
  }
  removeItem(key: string): void {

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove item from localStorage:', error);
    }
  }

  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
}
