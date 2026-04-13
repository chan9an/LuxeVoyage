import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

// Four distinct UI states for the password reset flow. Using a union type keeps the
// template's *ngIf conditions readable and prevents invalid state combinations.
type Step = 'email' | 'otp' | 'reset' | 'done';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  step: Step = 'email';
  isLoading = false;
  error = '';

  // We store the email as a plain string after step 1 so the OTP and reset steps can
  // reference it without needing to read it back from a form that may have been reset.
  email = '';

  emailForm: FormGroup;
  otpForm: FormGroup;
  resetForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d{6}$/)]]
    });

    // The cross-field validator (passwordsMatch) is applied at the FormGroup level rather
    // than on an individual control because it needs to read two sibling fields at once.
    // Angular evaluates group-level validators after all control-level validators pass.
    this.resetForm = this.fb.group({
      newPassword:     ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatch });
  }

  // Custom cross-field validator — returns null (valid) if the passwords match, or an
  // error object if they don't. The template reads resetForm.errors?.['mismatch'] to
  // decide whether to show the mismatch warning.
  passwordsMatch(group: FormGroup) {
    return group.get('newPassword')?.value === group.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  submitEmail() {
    if (this.emailForm.invalid) return;
    this.isLoading = true;
    this.error = '';
    this.email = this.emailForm.value.email;

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.step = 'otp';
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.error = 'Something went wrong. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  submitOtp() {
    if (this.otpForm.invalid) return;
    this.isLoading = true;
    this.error = '';

    this.authService.verifyOtp(this.email, this.otpForm.value.otp).subscribe({
      next: () => {
        this.isLoading = false;
        this.step = 'reset';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.Message || 'Invalid or expired OTP.';
        this.cdr.detectChanges();
      }
    });
  }

  submitReset() {
    if (this.resetForm.invalid) return;
    this.isLoading = true;
    this.error = '';

    // We pass the OTP from the previous step along with the new password. The backend
    // re-validates the OTP here as a security measure so the reset endpoint can't be
    // called directly without going through the OTP verification step first.
    this.authService.resetPassword(this.email, this.otpForm.value.otp, this.resetForm.value.newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.step = 'done';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.Message || 'Failed to reset password. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  resendOtp() {
    this.error = '';
    // Resending just calls forgotPassword again with the same email — the backend
    // generates a fresh OTP and sends a new email, invalidating the previous one.
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.otpForm.reset();
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to resend OTP.';
        this.cdr.detectChanges();
      }
    });
  }
}
