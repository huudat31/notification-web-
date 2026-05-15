import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationItemComponent } from '../notification-item/notification-item.component';
import { CampaignNotification } from '../../../../domain/models/campaign-notification.model';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, NotificationItemComponent],
  template: `
    <div class="list-container">
      <app-notification-item 
        *ngFor="let n of notifications; trackBy: trackById" 
        [notification]="n">
      </app-notification-item>

      <!-- Loading Skeletons -->
      <ng-container *ngIf="isLoading && notifications.length === 0">
        <div class="skeleton-item" *ngFor="let i of [1,2,3,4,5]"></div>
      </ng-container>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!isLoading && notifications.length === 0">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" 
               stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>
        <h3>Không có notification phù hợp</h3>
        <p>Thử điều chỉnh bộ lọc để tìm kiếm kết quả khác.</p>
      </div>

      <!-- Load More Spinner -->
      <div class="load-more" *ngIf="isLoading && notifications.length > 0">
        <div class="spinner"></div>
        <span>Đang tải thêm...</span>
      </div>
    </div>
  `,
  styles: [`
    .list-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .skeleton-item {
      height: 100px;
      background: #f1f5f9;
      border-radius: 0.75rem;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .5; }
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      background: white;
      border-radius: 1rem;
      border: 1px dashed #e2e8f0;
    }
    .empty-icon { margin-bottom: 1rem; opacity: 0.5; }
    .empty-state h3 { font-size: 1.125rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem 0; }
    .empty-state p { font-size: 0.875rem; color: #64748b; margin: 0; }
    
    .load-more {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 2rem;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 500;
    }
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #e2e8f0;
      border-top-color: #7c3aed;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class NotificationListComponent {
  @Input() notifications: CampaignNotification[] = [];
  @Input() isLoading = false;

  trackById(index: number, item: CampaignNotification) {
    return item.id;
  }
}
