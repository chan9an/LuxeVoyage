import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  showProfileMenu = false;
  isPartnerRoute = false;

  constructor(private router: Router, public authService: AuthService) {
    // We subscribe to router events in the constructor rather than ngOnInit because the
    // navbar is always alive and we want to catch navigation events from the very first
    // route load. The filter(event => event instanceof NavigationEnd) pipe narrows the
    // stream to only the events we care about — NavigationEnd fires after the route has
    // fully resolved and the new component is rendered.
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // We use this flag to conditionally show the partner-specific nav items. Checking
      // the URL directly here is simpler than injecting ActivatedRoute into a shared component.
      this.isPartnerRoute = event.urlAfterRedirects.startsWith('/partner');
      this.showProfileMenu = false;
    });
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  goToDashboard() {
    this.showProfileMenu = false;
    this.router.navigate(['/partner/dashboard']);
  }

  logout() {
    this.authService.logout();
    this.showProfileMenu = false;
    this.router.navigate(['/']);
  }

  // HostListener on document:click is the standard Angular pattern for "click outside to close"
  // dropdowns. We check if the click target is inside the profile menu container — if it's
  // not, we close the menu. This avoids needing a separate overlay div or z-index hacks.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-menu-container')) {
      this.showProfileMenu = false;
    }
  }
}
