import { Injectable } from '@angular/core';
import { fromEvent, Observable, merge, EMPTY } from 'rxjs';
import { filter, map } from 'rxjs/operators';

interface BroadcastMessage {
  type: 'LOGOUT';
  timestamp: number;
}


@Injectable({ providedIn: 'root' })
export class BroadcastService {
  private channel: BroadcastChannel | null = null;

  constructor() {
    try {
      this.channel = new BroadcastChannel('auth_channel');
    } catch {
      this.channel = null;
    }
  }

  broadcastLogout(): void {
    const message: BroadcastMessage = { type: 'LOGOUT', timestamp: Date.now() };

    try {
      this.channel?.postMessage(message);
    } catch { /* ignore */ }

    try {
      localStorage.setItem('_auth_logout', JSON.stringify(message));
      setTimeout(() => localStorage.removeItem('_auth_logout'), 200);
    } catch { /* ignore */ }
  }

  listenForLogout(): Observable<void> {
    const sources: Observable<void>[] = [];

    if (this.channel) {
      const channel$ = fromEvent<MessageEvent>(this.channel, 'message').pipe(
        filter(event => (event.data as BroadcastMessage)?.type === 'LOGOUT'),
        map(() => undefined as void),
      );
      sources.push(channel$);
    }

    const storage$ = fromEvent<StorageEvent>(window, 'storage').pipe(
      filter(e => e.key === '_auth_logout' && !!e.newValue),
      map(() => undefined as void),
    );
    sources.push(storage$);

    return sources.length > 0 ? merge(...sources) : EMPTY;
  }
}
