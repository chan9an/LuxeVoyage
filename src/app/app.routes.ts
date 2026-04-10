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

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'LuxeVoyage | The World Precisely Curated' },
  { path: 'login', component: LoginComponent, title: 'LuxeVoyage | Sign In' },
  { path: 'signup', component: SignupComponent, title: 'LuxeVoyage | Membership' },
  { path: 'hotels', component: LuxuryHotelsComponent, title: 'LuxeVoyage | Luxury Hotels' },
  { path: 'hotels/:id', component: HotelDetailComponent, title: 'LuxeVoyage | Property' },
  { path: 'my-bookings', component: MyBookingsComponent, title: 'LuxeVoyage | My Bookings' },
  { path: 'destinations', component: TopDestinationsComponent, title: 'LuxeVoyage | Top Destinations' },
  { path: 'vip', component: VipAccessComponent, title: 'LuxeVoyage | Elite VIP Access' },
  { path: 'fleet', component: FleetComponent, title: 'LuxeVoyage | The Elite Fleet' },
  { path: 'partner/add-property', component: AddPropertyComponent, title: 'LuxeVoyage Partner | Add Built Property' },
  { path: 'partner/dashboard', component: DashboardComponent, title: 'LuxeVoyage Partner | Dashboard' },
  { path: '**', redirectTo: '' }
];
