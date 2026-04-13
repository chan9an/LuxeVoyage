import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-bookings.component.html'
})
export class MyBookingsComponent implements OnInit {
  bookings: any[] = [];
  isLoading = true;
  error = '';
  cancellingId: string | null = null;

  private bookingService = inject(BookingService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // These lookup tables map the BookingStatus enum integer values from the backend to
  // Tailwind CSS classes and human-readable labels. Keeping them as readonly objects
  // here means the template stays clean — no switch statements or inline ternaries needed.
  readonly statusColors: { [key: number]: string } = {
    0: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    1: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    2: 'text-red-400 bg-red-400/10 border-red-400/20',
    3: 'text-stone-400 bg-stone-400/10 border-stone-400/20',
  };

  readonly statusLabels: { [key: number]: string } = {
    0: 'Pending', 1: 'Confirmed', 2: 'Failed', 3: 'Cancelled'
  };

  ngOnInit() {
    // Auth guard — redirect to login if the user somehow lands here without a token.
    // In a larger app we'd use a proper Route Guard, but for a project of this size
    // an inline check in ngOnInit is perfectly fine and keeps things simple.
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadBookings();
  }

  loadBookings() {
    this.isLoading = true;
    this.bookingService.getMyBookings().subscribe({
      next: (data) => {
        // Sort newest first so the most recent booking is always at the top of the list.
        // We do this client-side because the backend doesn't guarantee sort order.
        this.bookings = (data || []).sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load bookings.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelBooking(id: string) {
    this.cancellingId = id;
    this.bookingService.cancelBooking(id).subscribe({
      next: () => {
        // Optimistic UI update — we flip the status locally instead of re-fetching the
        // whole list. This makes the cancellation feel instant to the user without an
        // extra round trip to the server.
        const b = this.bookings.find(b => b.id === id);
        if (b) b.status = 3;
        this.cancellingId = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cancellingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  getNightCount(checkIn: string, checkOut: string): number {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  formatPrice(price: number): string {
    return '₹' + price.toLocaleString('en-IN');
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  canCancel(booking: any): boolean {
    return booking.status === 0 || booking.status === 1;
  }
}
