import { Injectable, signal } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import { Observable, Subject, debounceTime, map, share } from 'rxjs';
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

  constructor() {
    this.rxStomp.configure(rxStompConfig);

    this.rxStomp.connectionState$.subscribe(state => {
      // state mapping: 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
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

    this.connectionLostSubject.pipe(
      debounceTime(5000)
    ).subscribe(() => {
      if (this.connectionState() === RealtimeConnectionState.DISCONNECTED) {
        console.warn('Realtime connection lost. Reconnecting...');
      }
    });
  }

  activate(): void {
    this.rxStomp.activate();
  }

  deactivate(): void {
    this.rxStomp.deactivate();
  }

  watchCampaignEvents(): Observable<string> {
    return this.rxStomp.watch(RealtimeTopic.CAMPAIGNS).pipe(
      map(message => message.body),
      share()
    );
  }

  watchNotificationEvents(): Observable<string> {
    return this.rxStomp.watch(RealtimeTopic.NOTIFICATIONS).pipe(
      map(message => message.body),
      share()
    );
  }
}
