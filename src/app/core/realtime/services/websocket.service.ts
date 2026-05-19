import { Injectable, signal } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import { Observable, Subject, debounceTime, map, shareReplay, filter, pairwise } from 'rxjs';
import { RealtimeConnectionState } from '../enums/realtime-connection-state.enum';
import { RealtimeTopic } from '../enums/realtime-topic.enum';
import { rxStompConfig } from '../config/rx-stomp.config';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private readonly rxStomp = new RxStomp();
  readonly connectionState = signal<RealtimeConnectionState>(RealtimeConnectionState.DISCONNECTED);

  private connectionLostSubject = new Subject<void>();

  // Expose reconnect$ stream specifically for offline recovery
  private readonly reconnectSubject = new Subject<void>();
  readonly reconnect$ = this.reconnectSubject.asObservable();

  constructor() {
    this.rxStomp.configure(rxStompConfig);

    this.rxStomp.connectionState$.subscribe(state => {
      switch (state) {
        case 0:
          this.connectionState.set(RealtimeConnectionState.CONNECTING);
          break;
        case 1:
          this.connectionState.set(RealtimeConnectionState.CONNECTED);
          break;
        case 3:
          this.connectionState.set(RealtimeConnectionState.DISCONNECTED);
          this.connectionLostSubject.next();
          break;
      }
    });

    // Detect CLOSED -> OPEN transition to trigger reconnect$
    this.rxStomp.connectionState$.pipe(
      pairwise(),
      filter(([prev, curr]) => prev === 3 && curr === 1) // 3=CLOSED, 1=OPEN
    ).subscribe(() => {
      console.log('[WebsocketService] Reconnected successfully. Firing reconnect$ stream.');
      this.reconnectSubject.next();
    });

    this.connectionLostSubject.pipe(
      debounceTime(5000)
    ).subscribe(() => {
      if (this.connectionState() === RealtimeConnectionState.DISCONNECTED) {
        console.warn('Realtime connection lost. Reconnecting...');
      }
    });
  }

  // Singleton activation: ensure it only activates once if called multiple times
  private isActivated = false;
  activate(): void {
    if (!this.isActivated) {
      this.rxStomp.activate();
      this.isActivated = true;
    }
  }

  deactivate(): void {
    if (this.isActivated) {
      this.rxStomp.deactivate();
      this.isActivated = false;
    }
  }

  watchCampaignEvents(): Observable<string> {
    return this.rxStomp.watch(RealtimeTopic.CAMPAIGNS).pipe(
      map(message => message.body),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  watchNotificationEvents(): Observable<string> {
    return this.rxStomp.watch(RealtimeTopic.NOTIFICATIONS).pipe(
      map(message => message.body),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  watchTopic(topic: string): Observable<string> {
    return this.rxStomp.watch(topic).pipe(
      map(message => message.body),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }
}
