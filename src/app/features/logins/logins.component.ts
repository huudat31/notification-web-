import { Component, OnInit, AfterViewInit, OnDestroy, inject, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/services/auth.service';
import { AuthStore } from '../../core/auth/store/auth.store';
import { TokenStorageService } from '../../core/storage/token.storage';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-logins',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './logins.component.html',
  styleUrl: './logins.component.css',
})
export class LoginsComponent implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);
  private ngZone = inject(NgZone);

  loginForm: FormGroup;
  rememberMe = false;
  isLoading = this.authStore.isLoading;
  errorMessage = this.authStore.error;

  private googleInitialized = false;
  private pollIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Không còn check localStorage ở đây
  }

  ngAfterViewInit(): void {
    this.initGoogleSignIn();
  }

  ngOnDestroy(): void {
    this.clearPollInterval();
    const google = (window as any).google;
    if (google?.accounts?.id) {
      google.accounts.id.cancel();
    }
  }

  private initGoogleSignIn(): void {
    if ((window as any).google?.accounts?.id) {
      this.setupGoogleButton();
      return;
    }

    let attempts = 0;
    const maxAttempts = 75;

    this.pollIntervalId = setInterval(() => {
      attempts++;
      if ((window as any).google?.accounts?.id) {
        this.clearPollInterval();
        this.ngZone.run(() => this.setupGoogleButton());
      } else if (attempts >= maxAttempts) {
        this.clearPollInterval();
        this.ngZone.run(() => {
          this.authStore.setError('Không thể tải Google Sign-In. Vui lòng tải lại trang.');
        });
      }
    }, 200);
  }

  private setupGoogleButton(): void {
    if (this.googleInitialized) return;
    this.googleInitialized = true;

    const google = (window as any).google;

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => {
        this.ngZone.run(() => {
          this.authService.loginGoogleAdmin(response.credential).subscribe();
        });
      },
      use_fedcm_for_prompt: false
    });

    const container = document.getElementById('google-btn-container');
    if (container) {
      google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        width: container.offsetWidth || 340
      });
    }
  }

  private clearPollInterval(): void {
    if (this.pollIntervalId !== null) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  toggleRemember(): void {
    this.rememberMe = !this.rememberMe;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
  }
}
