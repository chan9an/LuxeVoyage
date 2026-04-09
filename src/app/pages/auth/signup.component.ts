import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './signup.component.html'
})
export class SignupComponent implements OnInit, OnDestroy {
  signupForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  images: string[] = [
    '/pexels-han-798356342-35471637.jpg',
    '/pexels-jiri-zeman-2040000-6389532.jpg',
    '/pexels-muhammed-i-ki-tepe-155329832-12657897.jpg',
    '/pexels-rasul70-34596088.jpg',
    '/pexels-vince-21856159.jpg'
  ];
  currentImageIndex: number = 0;
  intervalId: any;

  constructor(
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      terms: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    this.startImageRotation();
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
    if (this.signupForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const [firstName, ...lastNameParts] = this.signupForm.value.full_name.split(' ');
    const lastName = lastNameParts.join(' ');

    const payload = {
      email: this.signupForm.value.email,
      password: this.signupForm.value.password,
      firstName: firstName,
      lastName: lastName
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading = false;
        // Proceed to login after successful registration
        this.authService.login({ email: payload.email, password: payload.password }).subscribe({
          next: () => this.router.navigate(['/']),
          error: () => this.router.navigate(['/login'])
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to register account';
      }
    });
  }
}
