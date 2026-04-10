import { Component, OnInit, inject, ChangeDetectorRef, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { HotelService } from '../../../services/hotel.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-partner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  hotels: any[] = [];
  isLoading = true;
  error = '';
  deletingId: string | null = null;
  confirmDeleteId: string | null = null;

  // Edit panel
  editingHotel: any = null;
  editForm!: FormGroup;
  editSaving = false;
  editError = '';
  editSuccess = false;
  editNewFile: File | null = null;
  editImagePreview: string | null = null;
  editCitySearch = '';
  editShowCityDropdown = false;

  @ViewChild('editCityContainer') editCityContainer!: ElementRef;

  private hotelService = inject(HotelService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  readonly indianCities = [
    'Mumbai, Maharashtra', 'Delhi, Delhi', 'Bengaluru, Karnataka',
    'Hyderabad, Telangana', 'Chennai, Tamil Nadu', 'Kolkata, West Bengal',
    'Pune, Maharashtra', 'Ahmedabad, Gujarat', 'Jaipur, Rajasthan',
    'Surat, Gujarat', 'Lucknow, Uttar Pradesh', 'Nagpur, Maharashtra',
    'Indore, Madhya Pradesh', 'Bhopal, Madhya Pradesh', 'Visakhapatnam, Andhra Pradesh',
    'Patna, Bihar', 'Vadodara, Gujarat', 'Goa, Goa', 'Kochi, Kerala',
    'Coimbatore, Tamil Nadu', 'Agra, Uttar Pradesh', 'Varanasi, Uttar Pradesh',
    'Udaipur, Rajasthan', 'Jodhpur, Rajasthan', 'Amritsar, Punjab',
    'Chandigarh, Punjab', 'Shimla, Himachal Pradesh', 'Manali, Himachal Pradesh',
    'Dehradun, Uttarakhand', 'Rishikesh, Uttarakhand', 'Mysuru, Karnataka',
    'Ooty, Tamil Nadu', 'Darjeeling, West Bengal', 'Gangtok, Sikkim',
    'Shillong, Meghalaya', 'Srinagar, Jammu & Kashmir', 'Leh, Ladakh',
  ];

  readonly propertyTypes: { label: string; value: number }[] = [
    { label: 'Hotel', value: 1 }, { label: 'Apartment', value: 2 },
    { label: 'Resort', value: 3 }, { label: 'Villa', value: 4 },
    { label: 'Guest House', value: 5 }, { label: 'Hostel', value: 6 },
    { label: 'Homestay', value: 7 }, { label: 'Boat', value: 8 },
    { label: 'Campsite', value: 9 },
  ];

  readonly availableAmenities = [
    { label: 'Free Wifi', value: 0 }, { label: 'Parking', value: 1 },
    { label: 'Airport Transfer', value: 2 }, { label: 'Concierge', value: 3 },
    { label: 'Room Service', value: 4 }, { label: 'King Bed', value: 5 },
    { label: 'Air Conditioning', value: 6 }, { label: 'Balcony', value: 7 },
    { label: 'Sea View', value: 8 }, { label: 'Mini Bar', value: 9 },
    { label: 'Jacuzzi', value: 10 }, { label: 'Breakfast Included', value: 11 },
    { label: 'Restaurant', value: 12 }, { label: 'Bar', value: 13 },
    { label: 'Room Dining', value: 14 }, { label: 'Spa', value: 15 },
    { label: 'Gym', value: 16 }, { label: 'Pool', value: 17 },
    { label: 'Sauna', value: 18 },
  ];

  get managerName(): string { return this.authService.getUserName() || 'Partner'; }

  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  get avgRating(): string {
    if (!this.hotels.length) return '—';
    const avg = this.hotels.reduce((s, h) => s + (h.rating || 0), 0) / this.hotels.length;
    return avg.toFixed(2);
  }

  get totalReviews(): number {
    return this.hotels.reduce((s, h) => s + (h.reviewCount || 0), 0);
  }

  get editFilteredCities(): string[] {
    const q = this.editCitySearch.toLowerCase().trim();
    return q ? this.indianCities.filter(c => c.toLowerCase().includes(q)) : this.indianCities;
  }

  get editAmenitiesArray(): FormArray {
    return this.editForm.get('amenities') as FormArray;
  }

  ngOnInit() { this.loadHotels(); }

  loadHotels() {
    this.isLoading = true;
    this.error = '';
    this.hotelService.getManagerHotels().subscribe({
      next: (data) => { this.hotels = data || []; this.isLoading = false; this.cdr.detectChanges(); },
      error: (err) => {
        console.error('Dashboard load error:', err);
        this.error = `Failed to load properties. (${err.status}: ${err.message})`;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  askConfirmDelete(id: string) { this.confirmDeleteId = id; }
  cancelDelete() { this.confirmDeleteId = null; }

  confirmDelete(id: string) {
    this.deletingId = id;
    this.confirmDeleteId = null;
    this.hotelService.deleteHotel(id).subscribe({
      next: () => { this.hotels = this.hotels.filter(h => h.id !== id); this.deletingId = null; this.cdr.detectChanges(); },
      error: () => { this.deletingId = null; this.error = 'Failed to delete property.'; this.cdr.detectChanges(); }
    });
  }

  // ── Edit panel ────────────────────────────────────────────────────────────
  openEdit(hotel: any) {
    this.editingHotel = hotel;
    this.editError = '';
    this.editSuccess = false;
    this.editNewFile = null;
    this.editImagePreview = null;
    this.editCitySearch = hotel.location || '';
    this.editShowCityDropdown = false;

    this.editForm = this.fb.group({
      name:         [hotel.name, Validators.required],
      location:     [hotel.location, Validators.required],
      type:         [hotel.type, Validators.required],
      pricePerNight:[hotel.pricePerNight, [Validators.required, Validators.min(0)]],
      description:  [hotel.description || ''],
      amenities:    this.fb.array(
        this.availableAmenities.map(a => new FormControl((hotel.amenities || []).includes(a.value)))
      ),
    });
    this.cdr.detectChanges();
  }

  closeEdit() {
    this.editingHotel = null;
    this.editNewFile = null;
    this.editImagePreview = null;
  }

  onEditFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.editNewFile = file;
    const reader = new FileReader();
    reader.onload = () => { this.editImagePreview = reader.result as string; this.cdr.detectChanges(); };
    reader.readAsDataURL(file);
  }

  selectEditCity(city: string) {
    this.editForm.patchValue({ location: city });
    this.editCitySearch = city;
    this.editShowCityDropdown = false;
  }

  onEditCityInput(event: Event) {
    this.editCitySearch = (event.target as HTMLInputElement).value;
    this.editForm.patchValue({ location: this.editCitySearch });
    this.editShowCityDropdown = true;
  }

  saveEdit() {
    if (this.editForm.invalid) return;
    this.editSaving = true;
    this.editError = '';
    this.editSuccess = false;

    const doSave = (imageUrl: string) => {
      const fv = this.editForm.value;
      const selectedAmenities = fv.amenities
        .map((checked: boolean, i: number) => checked ? this.availableAmenities[i].value : null)
        .filter((v: any) => v !== null);

      const dto = {
        ...this.editingHotel,
        name: fv.name,
        location: fv.location,
        type: Number(fv.type),
        pricePerNight: fv.pricePerNight,
        description: fv.description,
        amenities: selectedAmenities,
        imageUrl,
      };

      this.hotelService.updateHotel(this.editingHotel.id, dto).subscribe({
        next: () => {
          // Update local list
          const idx = this.hotels.findIndex(h => h.id === this.editingHotel.id);
          if (idx > -1) this.hotels[idx] = { ...this.hotels[idx], ...dto };
          this.editSaving = false;
          this.editSuccess = true;
          this.cdr.detectChanges();
          setTimeout(() => { this.closeEdit(); this.cdr.detectChanges(); }, 1200);
        },
        error: () => {
          this.editSaving = false;
          this.editError = 'Failed to save changes. Please try again.';
          this.cdr.detectChanges();
        }
      });
    };

    if (this.editNewFile) {
      this.hotelService.uploadImageToCloudinary(this.editNewFile).subscribe({
        next: (res) => doSave(res.secure_url),
        error: () => { this.editSaving = false; this.editError = 'Image upload failed.'; this.cdr.detectChanges(); }
      });
    } else {
      doSave(this.editingHotel.imageUrl);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.editCityContainer && !this.editCityContainer.nativeElement.contains(event.target)) {
      this.editShowCityDropdown = false;
    }
  }

  formatPrice(price: number): string { return '₹' + price.toLocaleString('en-IN'); }

  getPropertyTypeLabel(type: number): string {
    return this.propertyTypes.find(t => t.value === type)?.label || 'Property';
  }
}
