import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HotelService } from '../../services/hotel.service';
import { AuthService } from '../../services/auth.service';
import { ReviewService } from '../../services/review.service';
import { BookingService } from '../../services/booking.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-hotel-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './hotel-detail.component.html'
})
export class HotelDetailComponent implements OnInit {
  hotel: any = null;
  isLoading = true;
  error = '';

  // Booking state
  checkIn = '';
  checkOut = '';
  guests = 2;
  selectedRoomType: any = null;
  guestWarning = '';

  // Review state
  reviews: any[] = [];
  canSubmitReview = false;
  reviewBlockReason = '';
  userBookingForHotel: any = null;   // the confirmed booking we'll attach to the review
  showReviewForm = false;
  reviewRating = 5;
  reviewComment = '';
  reviewSubmitting = false;
  reviewSubmitSuccess = false;
  reviewSubmitError = '';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hotelService = inject(HotelService);
  protected authService = inject(AuthService);
  private reviewService = inject(ReviewService);
  private bookingService = inject(BookingService);
  private cdr = inject(ChangeDetectorRef);

  readonly amenityIcons: { [key: number]: { icon: string; label: string; category: string } } = {
    0:  { icon: 'wifi',              label: 'Free Wifi',          category: 'Connectivity' },
    1:  { icon: 'local_parking',     label: 'Parking',            category: 'Convenience' },
    2:  { icon: 'flight_takeoff',    label: 'Airport Transfer',   category: 'Access' },
    3:  { icon: 'concierge',         label: 'Concierge',          category: 'Service' },
    4:  { icon: 'room_service',      label: 'Room Service',       category: 'Service' },
    5:  { icon: 'king_bed',          label: 'King Bed',           category: 'Comfort' },
    6:  { icon: 'ac_unit',           label: 'Air Conditioning',   category: 'Comfort' },
    7:  { icon: 'balcony',           label: 'Balcony',            category: 'Views' },
    8:  { icon: 'water',             label: 'Sea View',           category: 'Views' },
    9:  { icon: 'liquor',            label: 'Mini Bar',           category: 'Comfort' },
    10: { icon: 'hot_tub',           label: 'Jacuzzi',            category: 'Wellness' },
    11: { icon: 'free_breakfast',    label: 'Breakfast Included', category: 'Dining' },
    12: { icon: 'restaurant',        label: 'Restaurant',         category: 'Dining' },
    13: { icon: 'local_bar',         label: 'Bar',                category: 'Dining' },
    14: { icon: 'dining',            label: 'Room Dining',        category: 'Dining' },
    15: { icon: 'spa',               label: 'Spa',                category: 'Wellness' },
    16: { icon: 'fitness_center',    label: 'Gym',                category: 'Wellness' },
    17: { icon: 'pool',              label: 'Pool',               category: 'Leisure' },
    18: { icon: 'sauna',             label: 'Sauna',              category: 'Wellness' },
  };

  readonly roomCategoryLabels: { [key: number]: string } = {
    0: 'Single', 1: 'Double', 2: 'Twin', 3: 'Triple', 4: 'Quad',
    5: 'Studio', 6: 'Suite', 7: 'Presidential Suite', 8: 'Connecting', 9: 'Deluxe'
  };

  readonly propertyTypeLabels: { [key: number]: string } = {
    1: 'Hotel', 2: 'Apartment', 3: 'Resort', 4: 'Villa',
    5: 'Guest House', 6: 'Hostel', 7: 'Homestay', 8: 'Boat', 9: 'Campsite'
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) { this.router.navigate(['/hotels']); return; }
      this.loadHotel(id);
    });
  }

  loadHotel(id: string) {
    this.isLoading = true;
    this.hotelService.getHotelById(id).subscribe({
      next: (data) => {
        this.hotel = data;
        if (data.roomTypes?.length) this.selectedRoomType = data.roomTypes[0];
        this.isLoading = false;
        this.cdr.detectChanges();
        // Load reviews and check review eligibility after hotel loads
        this.loadReviews(id);
        if (this.authService.isLoggedIn()) {
          this.checkReviewEligibility(id);
        }
      },
      error: () => {
        this.error = 'Property not found.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadReviews(hotelId: string) {
    this.reviewService.getReviews(hotelId).pipe(catchError(() => of([]))).subscribe(reviews => {
      this.reviews = reviews;
      this.cdr.detectChanges();
    });
  }

  // Check if the logged-in user has a confirmed booking for this hotel and hasn't reviewed yet.
  // We do this by fetching their bookings and looking for one that matches the hotel.
  checkReviewEligibility(hotelId: string) {
    forkJoin({
      canReview: this.reviewService.canReview(hotelId).pipe(catchError(() => of({ canReview: false, reason: 'Unable to check.' }))),
      bookings:  this.bookingService.getMyBookings().pipe(catchError(() => of([])))
    }).subscribe(({ canReview, bookings }) => {
      if (!canReview.canReview) {
        this.canSubmitReview = false;
        this.reviewBlockReason = canReview.reason;
      } else {
        // Find a confirmed booking for this hotel — we need the bookingId to attach to the review
        const confirmedBooking = (bookings as any[]).find(
          (b: any) => b.hotelId === hotelId && (b.status === 1 || b.status === 'Confirmed')
        );
        if (confirmedBooking) {
          this.canSubmitReview = true;
          this.userBookingForHotel = confirmedBooking;
        } else {
          this.canSubmitReview = false;
          this.reviewBlockReason = 'You need a confirmed stay at this property to leave a review.';
        }
      }
      this.cdr.detectChanges();
    });
  }

  submitReview() {
    if (!this.reviewComment.trim() || !this.userBookingForHotel) return;
    this.reviewSubmitting = true;
    this.reviewSubmitError = '';

    this.reviewService.submitReview({
      hotelId:   this.hotel.id,
      bookingId: this.userBookingForHotel.id,
      rating:    this.reviewRating,
      comment:   this.reviewComment.trim()
    }).subscribe({
      next: () => {
        this.reviewSubmitting = false;
        this.reviewSubmitSuccess = true;
        this.showReviewForm = false;
        this.canSubmitReview = false;
        this.reviewBlockReason = 'Your review is pending moderation.';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.reviewSubmitting = false;
        this.reviewSubmitError = err?.error?.message ?? 'Failed to submit review. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  setReviewRating(r: number) {
    this.reviewRating = r;
  }

  get nightCount(): number {
    if (!this.checkIn || !this.checkOut) return 0;
    const diff = new Date(this.checkOut).getTime() - new Date(this.checkIn).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  get totalPrice(): number {
    const rate = this.selectedRoomType?.pricePerNight ?? this.hotel?.pricePerNight ?? 0;
    return this.nightCount * rate;
  }

  get minCheckout(): string {
    if (!this.checkIn) return '';
    const d = new Date(this.checkIn);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  get todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Max guests allowed by selected room type
  get maxGuests(): number {
    return this.selectedRoomType?.maxOccupancy ?? 99;
  }

  // Available rooms for selected room type
  get availableRoomCount(): number {
    if (!this.selectedRoomType) return 0;
    return this.getAvailableRooms(this.selectedRoomType);
  }

  // Rooms needed = ceil(guests / maxOccupancy)
  get roomsNeeded(): number {
    if (!this.selectedRoomType || this.guests <= 0) return 1;
    return Math.ceil(this.guests / this.selectedRoomType.maxOccupancy);
  }

  get canBook(): boolean {
    return !!this.checkIn && !!this.checkOut && this.availableRoomCount >= this.roomsNeeded;
  }

  get bookingBlockReason(): string {
    if (!this.checkIn || !this.checkOut) return 'Select Dates to Book';
    if (this.availableRoomCount === 0) return 'No Rooms Available';
    if (this.roomsNeeded > this.availableRoomCount) {
      return `Only ${this.availableRoomCount} Room${this.availableRoomCount > 1 ? 's' : ''} Available`;
    }
    return '';
  }

  incrementGuests() {
    this.guests++;
    this.validateGuests();
  }

  decrementGuests() {
    if (this.guests > 1) {
      this.guests--;
      this.validateGuests();
    }
  }

  validateGuests() {
    if (!this.selectedRoomType) return;
    const maxTotal = this.availableRoomCount * this.selectedRoomType.maxOccupancy;
    if (this.guests > maxTotal) {
      this.guests = maxTotal;
      this.guestWarning = `Maximum capacity is ${maxTotal} guests across ${this.availableRoomCount} available room${this.availableRoomCount > 1 ? 's' : ''}.`;
    } else if (this.roomsNeeded > this.availableRoomCount) {
      this.guestWarning = `${this.roomsNeeded} rooms needed but only ${this.availableRoomCount} available. Reduce guests or select a different room type.`;
    } else {
      this.guestWarning = '';
    }
  }

  onRoomTypeSelected(rt: any) {
    this.selectedRoomType = rt;
    this.guestWarning = '';
    this.validateGuests();
  }

  requestReservation() {
    if (!this.canBook) return;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const availableRoom = (this.hotel.rooms || []).find(
      (r: any) => r.roomTypeId === this.selectedRoomType.id && r.isAvailable
    );
    if (!availableRoom) return;

    // Navigate to checkout with booking data in router state
    this.router.navigate(['/checkout'], {
      state: {
        hotelId:      this.hotel.id,
        roomId:       availableRoom.id,
        checkInDate:  this.checkIn,
        checkOutDate: this.checkOut,
        totalPrice:   this.totalPrice * this.roomsNeeded,
        guestCount:   this.guests,
        roomsBooked:  this.roomsNeeded,
        hotelName:    this.hotel.name,
        roomName:     this.selectedRoomType.name,
        hotelImageUrl:this.hotel.imageUrl,
        location:     this.hotel.location,
        nightCount:   this.nightCount,
        pricePerNight:this.selectedRoomType?.pricePerNight ?? this.hotel.pricePerNight,
      }
    });
  }

  formatPrice(price: number): string {
    return '₹' + price.toLocaleString('en-IN');
  }

  getStars(rating: number): number[] {
    return Array.from({ length: Math.round(rating || 0) });
  }

  getEmptyStars(rating: number): number[] {
    return Array.from({ length: 5 - Math.round(rating || 0) });
  }

  getAmenityInfo(value: number) {
    return this.amenityIcons[value] ?? { icon: 'check_circle', label: 'Amenity', category: 'Other' };
  }

  getRoomCategoryLabel(cat: number): string {
    return this.roomCategoryLabels[cat] ?? 'Room';
  }

  getAvailableRooms(roomType: any): number {
    return (this.hotel?.rooms || []).filter((r: any) => r.roomTypeId === roomType.id && r.isAvailable).length;
  }
}
