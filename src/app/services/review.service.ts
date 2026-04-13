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

  // Fetch all approved reviews for a hotel — public, no auth needed
  getReviews(hotelId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/hotel/${hotelId}`);
  }

  // Check if the logged-in user can submit a review for this hotel
  canReview(hotelId: string): Observable<{ canReview: boolean; reason: string }> {
    return this.http.get<{ canReview: boolean; reason: string }>(
      `${this.apiUrl}/hotel/${hotelId}/can-review`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Submit a review — returns 202 Accepted since it goes through AI moderation
  submitReview(payload: {
    hotelId: string;
    bookingId: string;
    rating: number;
    comment: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}`, payload, { headers: this.getAuthHeaders() });
  }
}
