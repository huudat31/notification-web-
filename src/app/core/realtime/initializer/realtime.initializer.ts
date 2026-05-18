import { RealtimeSyncService } from '../services/realtime-sync.service';

export function initializeRealtime(realtimeSyncService: RealtimeSyncService) {
  return () => {
    realtimeSyncService.init();
    // Non-blocking app initialization
  };
}
