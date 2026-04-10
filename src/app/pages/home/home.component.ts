import { Component, ElementRef, ViewChild, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HotelService } from '../../services/hotel.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  showDatePicker = false;
  showGuestsPicker = false;
  hotels: any[] = [];
  hotelsLoading = true;
  searchDestination = '';

  guests = { adults: 2, children: 0, infants: 0 };
  days = Array.from({ length: 30 }, (_, i) => i + 1);
  checkInDate: number | null = null;
  checkOutDate: number | null = null;

  @ViewChild('hotelSlider') hotelSlider!: ElementRef;

  private hotelService = inject(HotelService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  readonly topDestinations = [
    {
      city: 'Jaipur',
      state: 'Rajasthan',
      tagline: 'The Pink City of Palaces',
      query: 'Jaipur',
      image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&q=85&fit=crop',
      featured: true
    },
    {
      city: 'Udaipur',
      state: 'Rajasthan',
      tagline: 'City of Lakes & Royalty',
      query: 'Udaipur',
      image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=85&fit=crop',
      featured: false
    },
    {
      city: 'Goa',
      state: 'Goa',
      tagline: 'Sun, Sea & Serenity',
      query: 'Goa',
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=85&fit=crop',
      featured: false
    },
  ];

  ngOnInit() {
    this.hotelService.getHotels().subscribe({
      next: (data: any[]) => {
        this.hotels = data || [];
        this.hotelsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.hotelsLoading = false; this.cdr.detectChanges(); }
    });
  }

  search() {
    this.router.navigate(['/hotels'], {
      queryParams: this.searchDestination.trim() ? { q: this.searchDestination.trim() } : {}
    });
  }

  goToCity(query: string) {
    this.router.navigate(['/hotels'], { queryParams: { q: query } });
  }

  formatPrice(price: number): string {
    return '₹' + price.toLocaleString('en-IN');
  }

  get dateDisplay(): string {
    if (this.checkInDate && this.checkOutDate) return `Nov ${this.checkInDate} – Nov ${this.checkOutDate}`;
    if (this.checkInDate) return `Nov ${this.checkInDate} – Select checkout`;
    return 'Select dates';
  }

  selectDate(day: number) {
    if (!this.checkInDate || (this.checkInDate && this.checkOutDate)) {
      this.checkInDate = day; this.checkOutDate = null;
    } else if (day > this.checkInDate) {
      this.checkOutDate = day; this.showDatePicker = false;
    } else {
      this.checkInDate = day;
    }
  }

  toggleDatePicker() { this.showDatePicker = !this.showDatePicker; this.showGuestsPicker = false; }
  toggleGuestsPicker() { this.showGuestsPicker = !this.showGuestsPicker; this.showDatePicker = false; }

  incrementGuest(type: 'adults' | 'children' | 'infants') { this.guests[type]++; }
  decrementGuest(type: 'adults' | 'children' | 'infants') {
    if (type === 'adults' && this.guests[type] <= 1) return;
    if (this.guests[type] > 0) this.guests[type]--;
  }

  get totalGuests(): string {
    const total = this.guests.adults + this.guests.children;
    return `${total} Guest${total !== 1 ? 's' : ''}${this.guests.infants > 0 ? ', ' + this.guests.infants + ' Infant' + (this.guests.infants > 1 ? 's' : '') : ''}`;
  }

  scrollHotels(direction: 'left' | 'right') {
    if (this.hotelSlider) {
      this.hotelSlider.nativeElement.scrollBy({
        left: direction === 'left' ? -500 : 500,
        behavior: 'smooth'
      });
    }
  }
}
