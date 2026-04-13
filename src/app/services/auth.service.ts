import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  token?: string;
  Token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  private apiUrl = environment.authApiUrl;
  private readonly TOKEN_KEY = 'jwt_token';

  login(request: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, request)
      .pipe(
        tap(response => {
          // Handle both 'token' and 'Token' (C# default serialization)
          const token = response?.token || response?.Token;
          if (token) {
            this.saveToken(token);
          }
        })
      );
  }

  register(request: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, request).pipe(
      tap(response => {
        const token = response?.token || response?.Token;
        if (token) {
          this.saveToken(token);
        }
      })
    );
  }

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      
      const roleClaim = decodedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
                        decodedPayload['role'] || 
                        decodedPayload['Role'];
                        
      if (Array.isArray(roleClaim)) {
        return roleClaim[0]; 
      }
      return roleClaim;
    } catch (e) {
      console.error('Error decoding token', e);
      return null;
    }
  }

  getUserName(): string {
    const token = this.getToken();
    if (!token) return '';
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
             decoded['name'] ||
             decoded['email'] ||
             decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '';
    } catch { return ''; }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isHotelManager(): boolean {
    return this.getUserRole() === 'HotelManager';
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-otp`, { email, otp });
  }

  resetPassword(email: string, otp: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { email, otp, newPassword });
  }

  verifyEmail(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-email`, { email, otp });
  }

  resendVerification(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-verification`, { email });
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}
