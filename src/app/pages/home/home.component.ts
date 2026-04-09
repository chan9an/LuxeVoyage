import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  showDatePicker = false;
  showGuestsPicker = false;

  guests = {
    adults: 2,
    children: 0,
    infants: 0
  };

  // Static list for UI mockup display
  days = Array.from({ length: 30 }, (_, i) => i + 1);
  checkInDate: number | null = null;
  checkOutDate: number | null = null;

  @ViewChild('hotelSlider') hotelSlider!: ElementRef;

  get dateDisplay(): string {
    if (this.checkInDate && this.checkOutDate) {
      return `Nov ${this.checkInDate} - Nov ${this.checkOutDate}`;
    } else if (this.checkInDate) {
      return `Nov ${this.checkInDate} - Select Checkout`;
    }
    return 'Select dates';
  }

  selectDate(day: number) {
    if (!this.checkInDate || (this.checkInDate && this.checkOutDate)) {
      this.checkInDate = day;
      this.checkOutDate = null;
    } else if (day > this.checkInDate) {
      this.checkOutDate = day;
      this.showDatePicker = false; // close on complete selection
    } else {
      this.checkInDate = day; // reset start date if user clicked before current checkIn
    }
  }

  toggleDatePicker() {
    this.showDatePicker = !this.showDatePicker;
    this.showGuestsPicker = false;
  }

  toggleGuestsPicker() {
    this.showGuestsPicker = !this.showGuestsPicker;
    this.showDatePicker = false;
  }

  incrementGuest(type: 'adults' | 'children' | 'infants') {
    this.guests[type]++;
  }

  decrementGuest(type: 'adults' | 'children' | 'infants') {
    if (this.guests[type] > 0) {
      if (type === 'adults' && this.guests[type] === 1) return;
      this.guests[type]--;
    }
  }

  get totalGuests(): string {
    const total = this.guests.adults + this.guests.children;
    return `${total} Guest${total !== 1 ? 's' : ''}${this.guests.infants > 0 ? ', ' + this.guests.infants + ' Infant' + (this.guests.infants > 1 ? 's' : '') : ''}`;
  }

  scrollHotels(direction: 'left' | 'right') {
    if (this.hotelSlider) {
      const scrollAmount = 500;
      const currentScroll = this.hotelSlider.nativeElement.scrollLeft;
      this.hotelSlider.nativeElement.scrollTo({
        left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
        behavior: 'smooth'
      });
    }
  }
}
