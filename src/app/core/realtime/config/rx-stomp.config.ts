import { RxStompConfig } from '@stomp/rx-stomp';
import { environment } from '../../../../environments/environment';
import SockJS from 'sockjs-client';

export const rxStompConfig: RxStompConfig = {
  // SockJS factory
  webSocketFactory: () => {
    return new SockJS(`${environment.apiBaseUrl}/ws-notification`);
  },

  // Connection config
  heartbeatIncoming: 0, // Typical default
  heartbeatOutgoing: 20000, 
  reconnectDelay: 5000,

  // Log level (only log if enabled in environment)
  debug: (msg: string): void => {
    if (environment.enableRealtimeDebug) {
      console.log('[RxStomp]', new Date().toISOString(), msg);
    }
  },
};
