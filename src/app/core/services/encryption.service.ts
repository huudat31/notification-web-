import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  encrypt(data: string): string {
    // Basic base64 skeleton encoding
    return btoa(data);
  }

  decrypt(cipherText: string): string {
    // Basic base64 skeleton decoding
    return atob(cipherText);
  }
}
