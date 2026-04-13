import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.reviewApiUrl;

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  // Public endpoint — returns only AI-approved reviews so the template never has to
  // filter them client-side. No auth header needed here.
  getReviews(hotelId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/hotel/${hotelId}`);
  }

  // This call tells us whether to show the "Write a Review" button. The backend checks
  // two things: whether the user has already reviewed this hotel, and whether they have
  // a confirmed booking. We call this after the hotel loads so the UI gate is always accurate.
  canReview(hotelId: string): Observable<{ canReview: boolean; reason: string }> {
    return this.http.get<{ canReview: boolean; reason: string }>(
      `${this.apiUrl}/hotel/${hotelId}/can-review`,
      { headers: this.getAuthHeaders() }
    );
  }

  // The backend returns 202 Accepted (not 201 Created) because the review isn't live yet.
  // It gets queued to RabbitMQ, processed by AI.API for toxicity detection, and only then
  // does Hotel.API flip IsApproved to true. The guest sees a "pending moderation" message
  // immediately while the async pipeline runs in the background.
  submitReview(payload: {
    hotelId: string;
    bookingId: string;
    rating: number;
    comment: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}`, payload, { headers: this.getAuthHeaders() });
  }
}
