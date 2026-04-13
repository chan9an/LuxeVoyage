import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

// The signup flow has two distinct UI states — the registration form and the OTP verification
// step. Using a union type here makes the step transitions explicit and type-safe, which is
// much cleaner than using a boolean or a magic number.
type Step = 'register' | 'verify';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './signup.component.html'
})
export class SignupComponent implements OnInit, OnDestroy {
  step: Step = 'register';

  // We use two separate FormGroups rather than one big form because the validation rules
  // and submission logic are completely different for each step. Keeping them separate
  // makes the template cleaner and avoids having to conditionally enable/disable validators.
  signupForm: FormGroup;
  otpForm: FormGroup;

  errorMessage = '';
  isLoading = false;

  // We store these after the first step so the OTP verification call has the email it needs.
  // We can't read them from the form at that point because the user might have navigated away.
  pendingEmail = '';
  pendingPassword = '';
  pendingRole = '';

  images: string[] = [
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&q=90&fit=crop',
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&q=90&fit=crop',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=90&fit=crop',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=90&fit=crop',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=90&fit=crop',
  ];
  currentImageIndex = 0;
  intervalId: any;

  constructor(
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      full_name:      ['', Validators.required],
      email:          ['', [Validators.required, Validators.email]],
      password:       ['', [Validators.required, Validators.minLength(8)]],
      terms:          [false, Validators.requiredTrue],
      isHotelPartner: [false]
    });

    // The OTP field uses both minLength/maxLength and a pattern validator to ensure
    // the user can only submit exactly 6 digits — no letters, no spaces.
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnInit() { this.startImageRotation(); }
  ngOnDestroy() { if (this.intervalId) clearInterval(this.intervalId); }

  startImageRotation() {
    this.intervalId = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
      this.cdr.detectChanges();
    }, 5000);
  }

  onSubmit() {
    if (this.signupForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';

    // We split the full name on the first space to get firstName and lastName. If the user
    // only entered one word, we use it for both fields rather than sending an empty lastName.
    const [firstName, ...rest] = this.signupForm.value.full_name.trim().split(' ');
    const lastName = rest.join(' ') || firstName;

    const payload = {
      email:     this.signupForm.value.email,
      password:  this.signupForm.value.password,
      firstName,
      lastName,
      role: this.signupForm.value.isHotelPartner ? 'HotelManager' : 'Customer'
    };

    this.pendingEmail    = payload.email;
    this.pendingPassword = payload.password;
    this.pendingRole     = payload.role;

    this.authService.register(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        // The backend returns RequiresVerification: true for new registrations, which
        // tells us to show the OTP step instead of navigating away immediately.
        if (res?.requiresVerification || res?.RequiresVerification) {
          this.step = 'verify';
        } else {
          this.navigateAfterAuth();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        let msg = 'Failed to create account.';
        if (err.error) {
          if (Array.isArray(err.error)) msg = err.error.map((e: any) => e.description).join(' ');
          else if (err.error.message) msg = err.error.message;
          else if (typeof err.error === 'string') msg = err.error;
        }
        this.errorMessage = msg;
        this.cdr.detectChanges();
      }
    });
  }

  verifyOtp() {
    if (this.otpForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';

    // On successful OTP verification the backend returns a JWT, so we save it and navigate
    // just like a normal login. The user is now fully authenticated and email-verified.
    this.authService.verifyEmail(this.pendingEmail, this.otpForm.value.otp).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const token = res?.token || res?.Token;
        if (token) this.authService.saveToken(token);
        this.navigateAfterAuth();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.Message || 'Invalid or expired OTP.';
        this.cdr.detectChanges();
      }
    });
  }

  resendOtp() {
    this.errorMessage = '';
    this.authService.resendVerification(this.pendingEmail).subscribe({
      next: () => { this.otpForm.reset(); this.cdr.detectChanges(); },
      error: () => { this.errorMessage = 'Failed to resend OTP.'; this.cdr.detectChanges(); }
    });
  }

  private navigateAfterAuth() {
    if (this.authService.getUserRole() === 'HotelManager') {
      this.router.navigate(['/partner/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
