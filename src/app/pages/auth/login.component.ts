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

  // These Unsplash images rotate in the background panel to give the login page a
  // premium editorial feel. They're loaded lazily by the browser so they don't block
  // the initial render.
  images: string[] = [
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&q=90&fit=crop',
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&q=90&fit=crop',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=90&fit=crop',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=90&fit=crop',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=90&fit=crop',
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
    // We build the form in the constructor so it's ready before the template renders.
    // Doing it here rather than ngOnInit means the form is never undefined when Angular
    // first evaluates the template bindings.
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.startImageRotation();

    // Google OAuth redirects back to /login?token=... after the backend exchanges the
    // Google code for a JWT. We read the token from the query params here, save it, and
    // redirect the user to the right dashboard. This is the final leg of the OAuth flow.
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
    // Always clear the interval in ngOnDestroy to prevent memory leaks. If we don't,
    // the setInterval callback keeps firing even after the component is destroyed, which
    // can cause "expression changed after it was checked" errors and ghost updates.
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  startImageRotation(): void {
    this.intervalId = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
      // We call detectChanges() manually here because setInterval runs outside Angular's
      // zone, so the framework doesn't automatically know the state changed. Without this
      // the image wouldn't update until the next user interaction triggered a CD cycle.
      this.cdr.detectChanges();
    }, 5000);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // We subscribe to the login Observable here in the component rather than using async pipe
    // because we need to perform imperative navigation after success, which doesn't fit the
    // declarative async pipe pattern cleanly.
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

        // The backend can return errors in several shapes depending on which validation
        // layer caught the problem — ASP.NET Identity returns an array of error objects,
        // our custom middleware returns { message: string }, and some endpoints return
        // plain strings. We handle all three cases here to always show a readable message.
        let parsedError = 'Invalid email or password';
        if (err.error) {
          if (Array.isArray(err.error)) {
             parsedError = err.error.map((e: any) => e.description).join(' ');
          } else if (err.error.message) {
             parsedError = err.error.message;
          } else if (typeof err.error === 'string') {
             parsedError = err.error;
          } else if (err.error.Message) {
             parsedError = err.error.Message;
             // If the account exists but email isn't verified, the backend sends
             // requiresVerification: true. We redirect to signup's OTP step so the
             // user can complete verification without starting over.
             if (err.error.requiresVerification || err.error.RequiresVerification) {
               this.router.navigate(['/signup'], { state: { verifyEmail: err.error.email || err.error.Email } });
               return;
             }
          }
        }

        this.errorMessage = parsedError;
      }
    });
  }
}
