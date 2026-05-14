import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

declare var google: any;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private router: Router, private ngZone: NgZone) {}

  /**
   * Initializes Google Sign-In
   * @param callback Function to handle the credential response
   */
  initGoogleLogin(callback: (response: any) => void) {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', // Replace with actual Client ID
        callback: (response: any) => {
          this.ngZone.run(() => {
            callback(response);
          });
        }
      });
    }
  }

  /**
   * Triggers the Google One Tap or Sign-In button
   */
  promptGoogleLogin() {
    if (typeof google !== 'undefined') {
      google.accounts.id.prompt();
    }
  }

  /**
   * Handles the Google Credential Response
   */
  handleGoogleResponse(response: any) {
    // In a real app, you would send this token to your backend
    console.log('Google Response:', response);
    
    // Decoding the JWT (mocking)
    const payload = this.decodeJWT(response.credential);
    localStorage.setItem('auth_token', response.credential);
    localStorage.setItem('user_profile', JSON.stringify(payload));
    
    this.userSubject.next(payload);
    this.router.navigate(['/dashboard']);
  }

  private decodeJWT(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_profile');
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }
}
