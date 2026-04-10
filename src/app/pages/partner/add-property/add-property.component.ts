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

  // City searchable dropdown
  citySearch = '';
  showCityDropdown = false;

  @ViewChild('cityDropdownContainer') cityDropdownContainer!: ElementRef;

  readonly indianCities = [
    'Mumbai, Maharashtra',
    'Delhi, Delhi',
    'Bengaluru, Karnataka',
    'Hyderabad, Telangana',
    'Chennai, Tamil Nadu',
    'Kolkata, West Bengal',
    'Pune, Maharashtra',
    'Ahmedabad, Gujarat',
    'Jaipur, Rajasthan',
    'Surat, Gujarat',
    'Lucknow, Uttar Pradesh',
    'Nagpur, Maharashtra',
    'Indore, Madhya Pradesh',
    'Bhopal, Madhya Pradesh',
    'Visakhapatnam, Andhra Pradesh',
    'Patna, Bihar',
    'Vadodara, Gujarat',
    'Goa, Goa',
    'Kochi, Kerala',
    'Coimbatore, Tamil Nadu',
    'Agra, Uttar Pradesh',
    'Varanasi, Uttar Pradesh',
    'Udaipur, Rajasthan',
    'Jodhpur, Rajasthan',
    'Amritsar, Punjab',
    'Chandigarh, Punjab',
    'Shimla, Himachal Pradesh',
    'Manali, Himachal Pradesh',
    'Dehradun, Uttarakhand',
    'Rishikesh, Uttarakhand',
    'Mysuru, Karnataka',
    'Ooty, Tamil Nadu',
    'Darjeeling, West Bengal',
    'Gangtok, Sikkim',
    'Shillong, Meghalaya',
    'Srinagar, Jammu & Kashmir',
    'Leh, Ladakh',
  ];

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
    { label: 'Free Wifi', value: 0 },
    { label: 'Parking', value: 1 },
    { label: 'Airport Transfer', value: 2 },
    { label: 'Concierge', value: 3 },
    { label: 'Room Service', value: 4 },
    { label: 'King Bed', value: 5 },
    { label: 'Air Conditioning', value: 6 },
    { label: 'Balcony', value: 7 },
    { label: 'Sea View', value: 8 },
    { label: 'Mini Bar', value: 9 },
    { label: 'Jacuzzi', value: 10 },
    { label: 'Breakfast Included', value: 11 },
    { label: 'Restaurant', value: 12 },
    { label: 'Bar', value: 13 },
    { label: 'Room Dining', value: 14 },
    { label: 'Spa', value: 15 },
    { label: 'Gym', value: 16 },
    { label: 'Pool', value: 17 },
    { label: 'Sauna', value: 18 }
  ];

  constructor(private fb: FormBuilder) {
    this.propertyForm = this.fb.group({
      propertyName: ['', Validators.required],
      location: ['', Validators.required],
      propertyType: ['Hotel', Validators.required],
      description: [''],
      price: ['', [Validators.required, Validators.min(0)]],
      amenities: this.fb.array(this.availableAmenities.map(() => new FormControl(false))),
      roomTypes: this.fb.array([])
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
    this.roomTypesArray.push(this.fb.group({
      name: ['', Validators.required],
      category: ['DOUBLE', Validators.required],
      pricePerNight: ['', [Validators.required, Validators.min(0)]],
      maxOccupancy: [2, [Validators.required, Validators.min(1)]],
      roomNumbers: ['', Validators.required]
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

    formValue.roomTypes.forEach((rt: any) => {
      const tempId = this.generateGuid();
      mappedRoomTypes.push({
        id: tempId,
        name: rt.name,
        category: this.roomCategoryMap[rt.category],
        pricePerNight: rt.pricePerNight,
        maxOccupancy: rt.maxOccupancy
      });
      rt.roomNumbers.split(',').map((n: string) => n.trim()).filter((n: string) => n.length > 0)
        .forEach((num: string) => {
          mappedRooms.push({ id: this.generateGuid(), roomNumber: num, isAvailable: true, roomTypeId: tempId });
        });
    });

    const dto = {
      name: formValue.propertyName,
      location: formValue.location,
      pricePerNight: formValue.price,
      currency: 'INR',
      imageUrl,
      type: this.propertyTypeMap[formValue.propertyType],
      rating: 5.0,
      reviewCount: 0,
      amenities: selectedAmenities,
      roomTypes: mappedRoomTypes,
      rooms: mappedRooms
    };

    this.hotelService.createHotel(dto).subscribe({
      next: () => {
        this.isLoading = false;
        this.isSuccess = true;
        setTimeout(() => this.router.navigate(['/partner/dashboard']), 2000);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to create property in the system.';
      }
    });
  }
}
