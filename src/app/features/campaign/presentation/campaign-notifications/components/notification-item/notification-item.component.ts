import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignNotification } from '../../../../domain/models/campaign-notification.model';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notif-item">
      <div class="notif-item__user">
        <div class="avatar">{{ notification.userName.charAt(0).toUpperCase() }}</div>
        <div class="user-info">
          <span class="user-name">{{ notification.userName }}</span>
          <span class="user-id">ID: {{ notification.userId }}</span>
        </div>
      </div>

      <div class="notif-item__content">
        <h4 class="notif-title">{{ notification.title }}</h4>
        <p class="notif-body">{{ notification.body }}</p>
      </div>

      <div class="notif-item__meta">
        <div class="badge-group">
          <span class="badge" [ngClass]="'badge--' + notification.channel.toLowerCase()">
            {{ notification.channel }}
          </span>
          <span class="badge" [ngClass]="'badge--' + notification.status.toLowerCase()">
            {{ notification.status }}
          </span>
        </div>
        <div class="meta-bottom">
          <span class="time">{{ notification.sentAt | date:'MMM d, HH:mm' }}</span>
          <span class="devices" *ngIf="notification.count > 0">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" 
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            {{ notification.count }} devices
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notif-item {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.25rem;
      display: grid;
      grid-template-columns: 200px 1fr 200px;
      gap: 1.5rem;
      align-items: center;
      transition: all 0.2s;
    }
    .notif-item:hover {
      border-color: #7c3aed;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.05);
    }
    /* User Section */
    .notif-item__user {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .avatar {
      width: 40px;
      height: 40px;
      background: #f1f5f9;
      color: #64748b;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      border: 2px solid white;
      box-shadow: 0 0 0 1px #e2e8f0;
    }
    .user-info {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-weight: 700;
      color: #1e293b;
      font-size: 0.9375rem;
    }
    .user-id {
      font-size: 0.75rem;
      color: #64748b;
    }
    /* Content Section */
    .notif-title {
      font-size: 1rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.25rem 0;
    }
    .notif-body {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    /* Meta Section */
    .notif-item__meta {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: flex-end;
    }
    .badge-group {
      display: flex;
      gap: 0.5rem;
    }
    .badge {
      font-size: 0.625rem;
      font-weight: 800;
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    /* Channel Badges */
    .badge--push { background: #f5f3ff; color: #7c3aed; }
    .badge--email { background: #eff6ff; color: #2563eb; }
    .badge--sms { background: #f8fafc; color: #64748b; }
    /* Status Badges */
    .badge--sent { background: #ecfdf5; color: #059669; }
    .badge--failed { background: #fef2f2; color: #dc2626; }
    .badge--pending { background: #fff7ed; color: #ea580c; }
    
    .meta-bottom {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }
    .time {
      font-size: 0.75rem;
      font-weight: 500;
      color: #94a3b8;
    }
    .devices {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }
  `]
})
export class NotificationItemComponent {
  @Input({ required: true }) notification!: CampaignNotification;
}
