export interface NotificationRealtimeEvent {
  notificationId: number;
  status: 'pending' | 'sent' | 'failed';
}
