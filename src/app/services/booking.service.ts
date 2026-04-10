import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface CreateBookingDto {
  hotelId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  guestCount: number;
  roomsBooked: number;
  hotelName: string;
  roomName: string;
  hotelImageUrl: string;
  location: string;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = `${environment.authApiUrl.replace('/auth', '')}/booking`;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  createBooking(dto: CreateBookingDto): Observable<any> {
    return this.http.post(`${this.baseUrl}`, dto, { headers: this.getHeaders() });
  }

  getMyBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/my`, { headers: this.getHeaders() });
  }

  cancelBooking(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/cancel`, {}, { headers: this.getHeaders() });
  }
}
