import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HotelService } from '../../services/hotel.service';

@Component({
  selector: 'app-luxury-hotels',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './luxury-hotels.component.html'
})
export class LuxuryHotelsComponent implements OnInit {
  allHotels: any[] = [];
  isLoading = true;

  // Filters
  searchQuery = '';
  selectedTypes: number[] = [];
  selectedAmenities: number[] = [];
  minPrice = 0;
  maxPrice = 250000;
  minRating = 0;
  sortBy = 'recommended';

  // Pagination
  currentPage = 1;
  pageSize = 9;

  private hotelService = inject(HotelService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  readonly propertyTypes = [
    { label: 'Hotel',       value: 1 },
    { label: 'Apartment',   value: 2 },
    { label: 'Resort',      value: 3 },
    { label: 'Villa',       value: 4 },
    { label: 'Guest House', value: 5 },
    { label: 'Hostel',      value: 6 },
    { label: 'Homestay',    value: 7 },
    { label: 'Boat',        value: 8 },
    { label: 'Campsite',    value: 9 },
  ];

  readonly amenityList = [
    { label: 'Free Wifi',          value: 0  },
    { label: 'Parking',            value: 1  },
    { label: 'Airport Transfer',   value: 2  },
    { label: 'Concierge',          value: 3  },
    { label: 'Room Service',       value: 4  },
    { label: 'Air Conditioning',   value: 6  },
    { label: 'Balcony',            value: 7  },
    { label: 'Sea View',           value: 8  },
    { label: 'Jacuzzi',            value: 10 },
    { label: 'Breakfast Included', value: 11 },
    { label: 'Restaurant',         value: 12 },
    { label: 'Bar',                value: 13 },
    { label: 'Spa',                value: 15 },
    { label: 'Gym',                value: 16 },
    { label: 'Pool',               value: 17 },
  ];

  ngOnInit() {
    // Pre-fill search from ?q= (e.g. clicking a destination on home page)
    this.route.queryParams.subscribe(params => {
      if (params['q']) this.searchQuery = params['q'];
    });

    this.hotelService.getHotels().subscribe({
      next: (data: any[]) => {
        this.allHotels = data || [];
        // set max price from data
        if (this.allHotels.length) {
          this.maxPrice = Math.max(...this.allHotels.map(h => h.pricePerNight));
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  get filteredHotels(): any[] {
    let result = [...this.allHotels];

    // Search
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(h =>
        h.name?.toLowerCase().includes(q) ||
        h.location?.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (this.selectedTypes.length) {
      result = result.filter(h => this.selectedTypes.includes(h.type));
    }

    // Amenity filter
    if (this.selectedAmenities.length) {
      result = result.filter(h =>
        this.selectedAmenities.every(a => (h.amenities || []).includes(a))
      );
    }

    // Price filter
    result = result.filter(h => h.pricePerNight >= this.minPrice && h.pricePerNight <= this.maxPrice);

    // Rating filter
    if (this.minRating > 0) {
      result = result.filter(h => (h.rating || 0) >= this.minRating);
    }

    // Sort
    switch (this.sortBy) {
      case 'price_asc':  result.sort((a, b) => a.pricePerNight - b.pricePerNight); break;
      case 'price_desc': result.sort((a, b) => b.pricePerNight - a.pricePerNight); break;
      case 'rating':     result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'reviews':    result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)); break;
    }

    return result;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredHotels.length / this.pageSize);
  }

  get pagedHotels(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredHotels.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  toggleType(value: number) {
    const idx = this.selectedTypes.indexOf(value);
    idx > -1 ? this.selectedTypes.splice(idx, 1) : this.selectedTypes.push(value);
    this.currentPage = 1;
  }

  toggleAmenity(value: number) {
    const idx = this.selectedAmenities.indexOf(value);
    idx > -1 ? this.selectedAmenities.splice(idx, 1) : this.selectedAmenities.push(value);
    this.currentPage = 1;
  }

  setRating(r: number) {
    this.minRating = this.minRating === r ? 0 : r;
    this.currentPage = 1;
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedTypes = [];
    this.selectedAmenities = [];
    this.minPrice = 0;
    this.maxPrice = this.allHotels.length
      ? Math.max(...this.allHotels.map(h => h.pricePerNight))
      : 250000;
    this.minRating = 0;
    this.sortBy = 'recommended';
    this.currentPage = 1;
  }

  formatPrice(price: number): string {
    return '₹' + price.toLocaleString('en-IN');
  }

  getTypeLabel(type: number): string {
    return this.propertyTypes.find(t => t.value === type)?.label || 'Property';
  }

  getStars(rating: number): number[] {
    return Array.from({ length: Math.round(rating || 0) });
  }

  getEmptyStars(rating: number): number[] {
    return Array.from({ length: 5 - Math.round(rating || 0) });
  }
}
