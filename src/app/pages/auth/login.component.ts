import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  images: string[] = [
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&q=90&fit=crop', // Taj Mahal
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&q=90&fit=crop', // Jaipur palace
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=90&fit=crop', // Luxury hotel pool
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=90&fit=crop', // Resort
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=90&fit=crop',  // Grand hotel lobby
  ];
  currentImageIndex: number = 0;
  intervalId: any;

  constructor(
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.startImageRotation();
    
    // Check for Google OAuth Token
    this.route.queryParams.subscribe(params => {
        if (params['token']) {
            this.authService.saveToken(params['token']);
            if (this.authService.getUserRole() === 'HotelManager') {
                this.router.navigate(['/partner/dashboard']);
            } else {
                this.router.navigate(['/']);
            }
        }
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  startImageRotation(): void {
    this.intervalId = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
      this.cdr.detectChanges(); // Force change detection
    }, 5000);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        if (this.authService.getUserRole() === 'HotelManager') {
            this.router.navigate(['/partner/dashboard']);
        } else {
            this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        
        let parsedError = 'Invalid email or password';
        if (err.error) {
          if (Array.isArray(err.error)) {
             parsedError = err.error.map((e: any) => e.description).join(' ');
          } else if (err.error.message) {
             parsedError = err.error.message;
          } else if (typeof err.error === 'string') {
             parsedError = err.error;
          }
        }
        
        this.errorMessage = parsedError;
      }
    });
  }
}
