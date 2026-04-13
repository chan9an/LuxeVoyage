import { Component, inject, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { HotelService } from '../../../services/hotel.service';

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './add-property.component.html'
})
export class AddPropertyComponent {
  propertyForm: FormGroup;
  selectedFile: File | null = null;
  selectedFilePreview: string | null = null;
  isLoading = false;
  isSuccess = false;
  errorMessage = '';

  citySearch = '';
  showCityDropdown = false;

  @ViewChild('cityDropdownContainer') cityDropdownContainer!: ElementRef;

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

  // filteredCities is a getter so the dropdown list updates reactively as the user types
  // without needing to manually trigger a filter method on every keystroke.
  get filteredCities(): string[] {
    const q = this.citySearch.toLowerCase().trim();
    if (!q) return this.indianCities;
    return this.indianCities.filter(c => c.toLowerCase().includes(q));
  }

  selectCity(city: string) {
    this.propertyForm.patchValue({ location: city });
    this.citySearch = city;
    this.showCityDropdown = false;
  }

  onCityInput(event: Event) {
    this.citySearch = (event.target as HTMLInputElement).value;
    // We keep the form control in sync with the raw input so validation still works
    // even if the user types a city name that isn't in the dropdown list.
    this.propertyForm.patchValue({ location: this.citySearch });
    this.showCityDropdown = true;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.cityDropdownContainer && !this.cityDropdownContainer.nativeElement.contains(event.target)) {
      this.showCityDropdown = false;
    }
  }

  private hotelService = inject(HotelService);
  private router = inject(Router);

  // These maps translate the string values from the form selects to the integer enum
  // values the backend expects. Keeping them here rather than in the template avoids
  // cluttering the HTML with conversion logic.
  propertyTypeMap: { [key: string]: number } = {
    'Hotel': 1, 'Apartment': 2, 'Resort': 3, 'Villa': 4,
    'GuestHouse': 5, 'Hostel': 6, 'Homestay': 7, 'Boat': 8, 'Campsite': 9
  };

  roomCategoryMap: { [key: string]: number } = {
    'SINGLE': 0, 'DOUBLE': 1, 'TWIN': 2, 'TRIPLE': 3,
    'QUAD': 4, 'STUDIO': 5, 'SUITE': 6, 'PRESIDENTIAL_SUITE': 7,
    'CONNECTING': 8, 'DELUXE': 9
  };

  availableAmenities = [
    { label: 'Free Wifi', value: 0 }, { label: 'Parking', value: 1 },
    { label: 'Airport Transfer', value: 2 }, { label: 'Concierge', value: 3 },
    { label: 'Room Service', value: 4 }, { label: 'King Bed', value: 5 },
    { label: 'Air Conditioning', value: 6 }, { label: 'Balcony', value: 7 },
    { label: 'Sea View', value: 8 }, { label: 'Mini Bar', value: 9 },
    { label: 'Jacuzzi', value: 10 }, { label: 'Breakfast Included', value: 11 },
    { label: 'Restaurant', value: 12 }, { label: 'Bar', value: 13 },
    { label: 'Room Dining', value: 14 }, { label: 'Spa', value: 15 },
    { label: 'Gym', value: 16 }, { label: 'Pool', value: 17 },
    { label: 'Sauna', value: 18 }
  ];

  constructor(private fb: FormBuilder) {
    // The amenities FormArray is built by mapping each available amenity to a boolean
    // FormControl. When the form is submitted, we zip this array back against availableAmenities
    // to extract the integer values of the checked ones. This pattern avoids needing a
    // custom multi-select component while keeping the form fully reactive.
    this.propertyForm = this.fb.group({
      propertyName: ['', Validators.required],
      location:     ['', Validators.required],
      propertyType: ['Hotel', Validators.required],
      description:  [''],
      price:        ['', [Validators.required, Validators.min(0)]],
      amenities:    this.fb.array(this.availableAmenities.map(() => new FormControl(false))),
      roomTypes:    this.fb.array([])
    });
    this.addRoomType();
  }

  get amenitiesArray() {
    return this.propertyForm.get('amenities') as FormArray;
  }

  get roomTypesArray() {
    return this.propertyForm.get('roomTypes') as FormArray;
  }

  addRoomType() {
    // Each room type is its own FormGroup inside the roomTypes FormArray. This lets us
    // validate each room type independently and add/remove them dynamically without
    // affecting the rest of the form.
    this.roomTypesArray.push(this.fb.group({
      name:          ['', Validators.required],
      category:      ['DOUBLE', Validators.required],
      pricePerNight: ['', [Validators.required, Validators.min(0)]],
      maxOccupancy:  [2, [Validators.required, Validators.min(1)]],
      roomNumbers:   ['', Validators.required]
    }));
  }

  removeRoomType(index: number) {
    if (this.roomTypesArray.length > 1) {
      this.roomTypesArray.removeAt(index);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // FileReader gives us a local data URL for the preview without any network call.
      // The actual Cloudinary upload happens later in onSubmit after form validation passes.
      const reader = new FileReader();
      reader.onload = e => this.selectedFilePreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.propertyForm.invalid || !this.selectedFile) {
      this.errorMessage = 'Please complete all required fields and upload an image.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // We upload the image to Cloudinary first and then submit the hotel data with the
    // returned secure_url. This two-step approach means we never store a hotel record
    // without a valid image URL — if the Cloudinary upload fails, we bail out early.
    this.hotelService.uploadImageToCloudinary(this.selectedFile).subscribe({
      next: (cloudinaryResponse) => {
        this.submitHotelData(cloudinaryResponse.secure_url);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to upload image. Please try again.';
      }
    });
  }

  private generateGuid(): string {
    // We generate client-side GUIDs for room type IDs so we can cross-reference them
    // when building the rooms array before sending everything to the backend in one payload.
    // The backend will accept these IDs as-is since they're valid GUIDs.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private submitHotelData(imageUrl: string) {
    const formValue = this.propertyForm.value;

    const selectedAmenities = formValue.amenities
      .map((checked: boolean, i: number) => checked ? this.availableAmenities[i].value : null)
      .filter((v: any) => v !== null);

    const mappedRoomTypes: any[] = [];
    const mappedRooms: any[] = [];

    // We process each room type and expand the comma-separated room numbers into individual
    // room records. Each room gets a client-generated GUID and references its room type
    // via the tempId we assigned above. The backend stores both in the same transaction.
    formValue.roomTypes.forEach((rt: any) => {
      const tempId = this.generateGuid();
      mappedRoomTypes.push({
        id: tempId, name: rt.name,
        category: this.roomCategoryMap[rt.category],
        pricePerNight: rt.pricePerNight, maxOccupancy: rt.maxOccupancy
      });
      rt.roomNumbers.split(',').map((n: string) => n.trim()).filter((n: string) => n.length > 0)
        .forEach((num: string) => {
          mappedRooms.push({ id: this.generateGuid(), roomNumber: num, isAvailable: true, roomTypeId: tempId });
        });
    });

    const dto = {
      name: formValue.propertyName, location: formValue.location,
      pricePerNight: formValue.price, currency: 'INR', imageUrl,
      type: this.propertyTypeMap[formValue.propertyType],
      rating: 5.0, reviewCount: 0,
      amenities: selectedAmenities, roomTypes: mappedRoomTypes, rooms: mappedRooms
    };

    this.hotelService.createHotel(dto).subscribe({
      next: () => {
        this.isLoading = false;
        this.isSuccess = true;
        // Brief success state before redirecting so the user sees the confirmation message.
        setTimeout(() => this.router.navigate(['/partner/dashboard']), 2000);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to create property in the system.';
      }
    });
  }
}
