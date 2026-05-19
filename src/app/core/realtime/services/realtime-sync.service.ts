import { Injectable, inject } from '@angular/core';
import { WebsocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class RealtimeSyncService {
  private readonly websocketService = inject(WebsocketService);
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    console.log('[Realtime] Initializing singleton WebSocket connection at boot...');
    this.websocketService.activate();
  }
}
