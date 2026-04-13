import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';

type Step = 1 | 2 | 3;

interface AddOn {
  id: string;
  icon: string;
  title: string;
  description: string;
  price: number;
  selected: boolean;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent implements OnInit {
  step: Step = 1;
  booking: any = null;
  isProcessing = false;
  isConfirmed = false;
  confirmedBookingId = '';
  error = '';

  paymentForm: FormGroup;

  // Add-ons are UI-only for now — they affect the displayed total but aren't persisted
  // to the booking record. The pricing is included in grandTotal which gets sent to the
  // backend, so the revenue is captured even if the line items aren't broken out yet.
  addOns: AddOn[] = [
    { id: 'airport',   icon: 'flight_takeoff', title: 'Airport Transfer',    description: 'Private luxury car pickup & drop', price: 3500,  selected: false },
    { id: 'breakfast', icon: 'free_breakfast',  title: 'Daily Breakfast',     description: 'Curated breakfast for all guests',  price: 1200,  selected: false },
    { id: 'spa',       icon: 'spa',             title: 'Spa Session',         description: '90-min signature treatment',        price: 4500,  selected: false },
    { id: 'latecheck', icon: 'schedule',        title: 'Late Checkout',       description: 'Extend your stay until 4 PM',       price: 2000,  selected: false },
    { id: 'flowers',   icon: 'local_florist',   title: 'Room Decoration',     description: 'Flowers & welcome amenities',       price: 1800,  selected: false },
  ];

  private router = inject(Router);
  private bookingService = inject(BookingService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  constructor() {
    // We initialize paymentForm with an empty group here so the template never sees
    // an undefined form reference during the brief window before ngOnInit runs.
    this.paymentForm = new FormGroup({});
  }

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // history.state is the correct way to read router state in ngOnInit. The alternative,
    // router.getCurrentNavigation(), returns null by the time ngOnInit fires because the
    // navigation has already completed. history.state persists across the lifecycle and
    // is populated by the { state: {...} } option we pass in hotel-detail's navigate call.
    const state = history.state;

    if (!state?.hotelId) {
      this.router.navigate(['/hotels']);
      return;
    }

    this.booking = state;

    // We build the real payment form here in ngOnInit rather than the constructor because
    // we want it fully initialized before the template renders step 3. The pattern validators
    // enforce basic card format rules client-side — real payment validation would go through
    // a payment gateway like Razorpay in production.
    this.paymentForm = this.fb.group({
      cardName:   ['', Validators.required],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expiry:     ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
      cvv:        ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]]
    });
  }

  get selectedAddOns(): AddOn[] {
    return this.addOns.filter(a => a.selected);
  }

  get addOnsTotal(): number {
    return this.selectedAddOns.reduce((sum, a) => sum + a.price, 0);
  }

  get grandTotal(): number {
    return (this.booking?.totalPrice ?? 0) + this.addOnsTotal;
  }

  get nightCount(): number {
    return this.booking?.nightCount ?? 0;
  }

  toggleAddOn(id: string) {
    const a = this.addOns.find(x => x.id === id);
    if (a) a.selected = !a.selected;
  }

  formatPrice(price: number): string {
    return '₹' + price.toLocaleString('en-IN');
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  goToStep(s: Step) {
    this.step = s;
    this.cdr.detectChanges();
  }

  confirmPayment() {
    if (this.paymentForm.invalid) return;
    this.isProcessing = true;
    this.error = '';

    // The setTimeout simulates a payment gateway processing delay so the UI feels realistic.
    // In production this would be replaced with a real Razorpay or Stripe call, and the
    // booking would only be created after the payment gateway confirms the charge succeeded.
    setTimeout(() => {
      this.bookingService.createBooking({
        hotelId:       this.booking.hotelId,
        roomId:        this.booking.roomId,
        checkInDate:   this.booking.checkInDate,
        checkOutDate:  this.booking.checkOutDate,
        totalPrice:    this.grandTotal,
        guestCount:    this.booking.guestCount,
        roomsBooked:   this.booking.roomsBooked,
        hotelName:     this.booking.hotelName,
        roomName:      this.booking.roomName,
        hotelImageUrl: this.booking.hotelImageUrl,
        location:      this.booking.location,
      }).subscribe({
        next: (res: any) => {
          this.isProcessing = false;
          this.isConfirmed = true;
          this.confirmedBookingId = res?.id ?? '';
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.isProcessing = false;
          this.error = err.status === 401
            ? 'Session expired. Please log in again.'
            : 'Payment failed. Please try again.';
          this.cdr.detectChanges();
        }
      });
    }, 1800);
  }
}
