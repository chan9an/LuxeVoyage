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

  // Cloudinary Upload
  uploadImageToCloudinary(file: File): Observable<any> {
    const cloudName = environment.cloudinaryCloudName;
    const uploadPreset = environment.cloudinaryUploadPreset;
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    return this.http.post(url, formData);
  }

  // Create Hotel in Backend
  createHotel(hotelData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, hotelData, { headers: this.getAuthHeaders() });
  }

  // General endpoint to fetch hotels
  getHotels(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }

  // Get hotel by ID
  getHotelById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Get hotels owned by the logged-in manager
  getManagerHotels(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my`, { headers: this.getAuthHeaders() });
  }

  // Delete hotel by ID
  deleteHotel(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // Update hotel
  updateHotel(id: string, hotelData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, hotelData, { headers: this.getAuthHeaders() });
  }
}
