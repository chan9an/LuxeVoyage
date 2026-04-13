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

  // We derive the booking base URL from the auth URL by stripping the '/auth' segment.
  // This keeps all API base URLs in one place (environment.ts) without needing a separate
  // bookingApiUrl entry — though we did add one later, this approach still works fine.
  private baseUrl = `${environment.authApiUrl.replace('/auth', '')}/booking`;

  // Even though the auth interceptor handles most requests, we still build headers manually
  // here as a belt-and-suspenders approach for booking endpoints that are strictly protected.
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  createBooking(dto: CreateBookingDto): Observable<any> {
    return this.http.post(`${this.baseUrl}`, dto, { headers: this.getHeaders() });
  }

  // Returns only the bookings belonging to the currently authenticated user. The backend
  // reads the userId from the JWT claims, so there's no userId param needed in the URL.
  getMyBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/my`, { headers: this.getHeaders() });
  }

  cancelBooking(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/cancel`, {}, { headers: this.getHeaders() });
  }
}
