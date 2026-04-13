import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/auth/login.component';
import { SignupComponent } from './pages/auth/signup.component';
import { LuxuryHotelsComponent } from './pages/luxury-hotels/luxury-hotels.component';
import { TopDestinationsComponent } from './pages/top-destinations/top-destinations.component';
import { VipAccessComponent } from './pages/vip-access/vip-access.component';
import { FleetComponent } from './pages/fleet/fleet.component';
import { AddPropertyComponent } from './pages/partner/add-property/add-property.component';
import { DashboardComponent } from './pages/partner/dashboard/dashboard.component';
import { HotelDetailComponent } from './pages/hotel-detail/hotel-detail.component';
import { MyBookingsComponent } from './pages/my-bookings/my-bookings.component';
import { ForgotPasswordComponent } from './pages/auth/forgot-password.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';

// This is the central route table for the entire app. Angular's Router matches the current
// URL against this array top-to-bottom and renders the first component that fits. The title
// property sets the browser tab title automatically via Angular's built-in TitleStrategy,
// which is a nice touch that saves us from manually setting document.title everywhere.
export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'LuxeVoyage | The World Precisely Curated' },
  { path: 'login', component: LoginComponent, title: 'LuxeVoyage | Sign In' },
  { path: 'signup', component: SignupComponent, title: 'LuxeVoyage | Membership' },
  { path: 'forgot-password', component: ForgotPasswordComponent, title: 'LuxeVoyage | Reset Password' },
  { path: 'hotels', component: LuxuryHotelsComponent, title: 'LuxeVoyage | Luxury Hotels' },

  // The :id segment is a route parameter — ActivatedRoute.paramMap lets us read it inside
  // HotelDetailComponent to know which hotel to fetch from the API.
  { path: 'hotels/:id', component: HotelDetailComponent, title: 'LuxeVoyage | Property' },

  // Checkout receives its booking data via router state (history.state), not URL params,
  // so the URL stays clean and sensitive pricing data isn't exposed in the address bar.
  { path: 'checkout', component: CheckoutComponent, title: 'LuxeVoyage | Checkout' },

  { path: 'my-bookings', component: MyBookingsComponent, title: 'LuxeVoyage | My Bookings' },
  { path: 'destinations', component: TopDestinationsComponent, title: 'LuxeVoyage | Top Destinations' },
  { path: 'vip', component: VipAccessComponent, title: 'LuxeVoyage | Elite VIP Access' },
  { path: 'fleet', component: FleetComponent, title: 'LuxeVoyage | The Elite Fleet' },
  { path: 'partner/add-property', component: AddPropertyComponent, title: 'LuxeVoyage Partner | Add Built Property' },
  { path: 'partner/dashboard', component: DashboardComponent, title: 'LuxeVoyage Partner | Dashboard' },

  // Wildcard catch-all — any URL that doesn't match above gets redirected to home.
  // This must always be the last entry because the router matches top-to-bottom.
  { path: '**', redirectTo: '' }
];
