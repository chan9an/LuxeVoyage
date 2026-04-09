import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  showNavbar = true;
  
  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Hide the global navbar if the current route handles its own header
      const hideRoutes = ['/destinations', '/hotels', '/login', '/signup'];
      this.showNavbar = !hideRoutes.some(route => event.urlAfterRedirects.startsWith(route));
    });
  }
}
