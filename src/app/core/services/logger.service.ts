import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthEvent, AuthEventType } from '@data/model/auth.model';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly isDev = !environment.production;
  private readonly eventLog: AuthEvent[] = [];

  log(type: AuthEventType, details?: Record<string, unknown>): void {
    const event: AuthEvent = { type, timestamp: Date.now(), details };
    this.eventLog.push(event);

    if (this.isDev) {
      const time = new Date().toISOString().split('T')[1].split('.')[0];
      console.log(`%c[AUTH] ${type}`, 'color: #4ade80; font-weight: bold', `@ ${time}`, details ?? '');
    }
  }

  error(message: string, details?: Record<string, unknown>): void {
    if (this.isDev) {
      console.error(`%c[AUTH ERROR] ${message}`, 'color: #f87171; font-weight: bold', details ?? '');
    }
  }

  getEventLog(): AuthEvent[] {
    return [...this.eventLog];
  }
}
