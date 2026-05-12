import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logins',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './logins.component.html',
  styleUrl: './logins.component.css',
})
export class LoginsComponent implements OnInit {
  loginForm: FormGroup;
  rememberMe = false;
  isLoading = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Redirect to dashboard if already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.router.navigate(['/dashboard']);
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  toggleRemember(): void {
    this.rememberMe = !this.rememberMe;
  }

  signInWithGoogle(): void {
    // Placeholder: navigate to dashboard with mock login
    this.mockLogin();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';

    // Simulate API call
    setTimeout(() => {
      const { email, password } = this.loginForm.value;
      if (email && password) {
        this.mockLogin();
      } else {
        this.errorMessage = 'Invalid credentials. Please try again.';
        this.isLoading = false;
      }
    }, 1200);
  }

  private mockLogin(): void {
    localStorage.setItem('auth_token', 'mock_token_' + Date.now());
    this.isLoading = false;
    this.router.navigate(['/dashboard']);
  }
}
