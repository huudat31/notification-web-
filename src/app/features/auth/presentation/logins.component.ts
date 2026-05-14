import { Component, OnInit, AfterViewInit, OnDestroy, inject, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthFacade } from '../application/facade/auth.facade';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-logins',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './logins.component.html',
  styleUrl: './logins.component.css',
})
export class LoginsComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authFacade = inject(AuthFacade);
  private readonly ngZone = inject(NgZone);

  loginForm: FormGroup;
  rememberMe = false;

  readonly isLoading = this.authFacade.isLoading;
  readonly errorMessage = this.authFacade.error;

  private googleInitialized = false;
  private pollIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void { /* no-op */ }

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
          this.authFacade.loginWithGoogle(response.credential).subscribe();
        });
      },
      use_fedcm_for_prompt: false,
    });

    const container = document.getElementById('google-btn-container');
    if (container) {
      google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        width: container.offsetWidth || 340,
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
    }
  }
}
