import { BaseRealtimeEvent } from '../models/realtime-event.model';

export interface EventParser<T extends BaseRealtimeEvent> {
  parse(payload: string): T | null;
}
