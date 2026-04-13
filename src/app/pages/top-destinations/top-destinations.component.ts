import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-top-destinations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './top-destinations.component.html'
})
export class TopDestinationsComponent {
  readonly destinations = [
    { city: 'Jaipur', state: 'Rajasthan', tagline: 'The Pink City of Palaces', query: 'Jaipur', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&q=85&fit=crop' },
    { city: 'Udaipur', state: 'Rajasthan', tagline: 'City of Lakes & Royalty', query: 'Udaipur', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=85&fit=crop' },
    { city: 'Goa', state: 'Goa', tagline: 'Sun, Sea & Serenity', query: 'Goa', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=85&fit=crop' },
    { city: 'Mumbai', state: 'Maharashtra', tagline: 'The City That Never Sleeps', query: 'Mumbai', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=85&fit=crop' },
    { city: 'Shimla', state: 'Himachal Pradesh', tagline: 'Queen of the Hills', query: 'Shimla', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=85&fit=crop' },
    { city: 'Varanasi', state: 'Uttar Pradesh', tagline: 'The Eternal City', query: 'Varanasi', image: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=800&q=85&fit=crop' },
  ];
}
