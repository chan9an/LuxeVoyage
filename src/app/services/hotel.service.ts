import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private apiUrl = environment.hotelApiUrl;

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Cloudinary upload goes directly from the browser to Cloudinary's CDN — we never route
  // image files through our own backend. The upload preset is configured in Cloudinary's
  // dashboard to allow unsigned uploads, which is why we don't need an API secret here.
  // The auth interceptor skips Cloudinary URLs so our JWT doesn't get sent there by mistake.
  uploadImageToCloudinary(file: File): Observable<any> {
    const cloudName = environment.cloudinaryCloudName;
    const uploadPreset = environment.cloudinaryUploadPreset;
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    return this.http.post(url, formData);
  }

  createHotel(hotelData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, hotelData, { headers: this.getAuthHeaders() });
  }

  // Public endpoint — no auth header needed since anyone can browse hotels.
  // The auth interceptor would add the header anyway if a token exists, but it doesn't
  // matter because the backend ignores it on public GET endpoints.
  getHotels(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }

  getHotelById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // The /my endpoint on the backend reads the ManagerId from the JWT claims and returns
  // only hotels owned by that manager — so this call is inherently scoped to the logged-in user.
  getManagerHotels(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my`, { headers: this.getAuthHeaders() });
  }

  deleteHotel(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  updateHotel(id: string, hotelData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, hotelData, { headers: this.getAuthHeaders() });
  }
}
