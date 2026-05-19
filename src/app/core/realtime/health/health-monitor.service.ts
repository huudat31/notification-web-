import { Injectable, signal } from '@angular/core';

export type ConnectionHealth = 'CONNECTED' | 'STALE' | 'RECONNECTING' | 'OFFLINE';

@Injectable({
  providedIn: 'root'
})
export class HealthMonitorService {
  readonly healthState = signal<ConnectionHealth>('OFFLINE');
  readonly latencyMs = signal<number>(0);

  private lastHeartbeat = Date.now();
  private pingTime = 0;

  recordPing(): void {
    this.pingTime = Date.now();
  }

  recordPong(): void {
    const rtt = Date.now() - this.pingTime;
    this.latencyMs.set(rtt);
    this.lastHeartbeat = Date.now();
    this.healthState.set('CONNECTED');
  }

  setHealth(state: ConnectionHealth): void {
    this.healthState.set(state);
    if (state === 'OFFLINE') {
      this.latencyMs.set(0);
    }
  }

  checkLiveness(): void {
    const silenceDuration = Date.now() - this.lastHeartbeat;
    if (this.healthState() === 'CONNECTED' && silenceDuration > 15000) {
      this.healthState.set('STALE');
    }
  }
}
