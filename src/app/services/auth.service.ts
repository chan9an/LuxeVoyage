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
    // The tap operator lets us perform a side effect (saving the token) without breaking
    // the Observable chain. The component subscribing to this call still gets the full
    // response — we're just intercepting it mid-stream to persist the token to localStorage.
    return this.http.post<any>(`${this.apiUrl}/login`, request)
      .pipe(
        tap(response => {
          // C# default JSON serialization capitalizes property names, so we handle both
          // 'token' (camelCase) and 'Token' (PascalCase) to be safe across environments.
          const token = response?.token || response?.Token;
          if (token) {
            this.saveToken(token);
          }
        })
      );
  }

  register(request: RegisterRequest): Observable<any> {
    // Same tap pattern as login — if the backend returns a token on registration
    // (old flow), we save it immediately. The new OTP flow returns RequiresVerification
    // instead of a token, so the tap just does nothing in that case.
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
      // A JWT is three Base64-encoded segments separated by dots. The middle segment (index 1)
      // is the payload containing all the claims. We decode it with atob() and parse the JSON
      // to read the role claim. The long URI-style claim name is what ASP.NET Identity uses
      // by default when it serializes roles into the token.
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));

      const roleClaim = decodedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
                        decodedPayload['role'] ||
                        decodedPayload['Role'];

      // ASP.NET can serialize multiple roles as a JSON array, so we handle both the array
      // case and the plain string case to avoid breaking role checks elsewhere in the app.
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
      // Same JWT decode trick as getUserRole — we try multiple claim name formats because
      // different .NET Identity configurations serialize the name claim differently.
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
