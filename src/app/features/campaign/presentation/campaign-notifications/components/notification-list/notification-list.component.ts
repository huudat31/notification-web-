import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignNotification } from '../../../../domain/models/campaign-notification.model';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container shadow-sm">
      <table class="modern-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Channel</th>
            <th>Status</th>
            <th>Title & Message</th>
            <th>Sent At</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- LOADING SKELETONS -->
          <ng-container *ngIf="isLoading && notifications.length === 0">
            <tr *ngFor="let i of [1,2,3,4,5,6,7,8]" class="skeleton-row">
              <td colspan="6">
                <div class="skeleton-line"></div>
              </td>
            </tr>
          </ng-container>

          <!-- DATA ROWS -->
          <tr *ngFor="let n of notifications; trackBy: trackById" 
              class="data-row" 
              (click)="onViewDetails(n)">
            <td>
              <div class="user-cell">
                <div class="avatar">{{ n.userName.charAt(0).toUpperCase() }}</div>
                <div class="user-info">
                  <span class="user-name">{{ n.userName }}</span>
                  <span class="user-id">ID: {{ n.userId }}</span>
                </div>
              </div>
            </td>
            <td>
              <span class="badge" [ngClass]="'badge--' + n.channel.toLowerCase()">
                {{ n.channel }}
              </span>
            </td>
            <td>
              <span class="badge" [ngClass]="'badge--' + n.status.toLowerCase()">
                {{ n.status }}
              </span>
            </td>
            <td>
              <div class="content-cell">
                <span class="content-title">{{ n.title }}</span>
                <span class="content-body">{{ n.body }}</span>
              </div>
            </td>
            <td>
              <div class="time-cell">
                <span class="date">{{ n.sentAt | date:'MMM d, yyyy' }}</span>
                <span class="time">{{ n.sentAt | date:'HH:mm' }}</span>
              </div>
            </td>
            <td class="text-right">
              <div class="actions-group">
                <button class="action-btn" (click)="$event.stopPropagation(); onViewDetails(n)" title="View Details">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
                <button class="action-btn retry" [disabled]="n.status.trim().toUpperCase() !== 'FAILED'" (click)="$event.stopPropagation(); onRetry(n)" [title]="(n.status.trim().toUpperCase() === 'FAILED') ? 'Retry' : 'Cannot retry ' + n.status.toLowerCase()">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg>
                </button>
              </div>
            </td>
          </tr>

          <!-- EMPTY STATE -->
          <tr *ngIf="!isLoading && notifications.length === 0">
            <td colspan="6">
              <div class="empty-state">
                <div class="empty-icon">
                   <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <h3>No notifications found</h3>
                <p>Try adjusting your filters or keyword.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- LOAD MORE -->
      <div class="load-more" *ngIf="isLoading && notifications.length > 0">
        <div class="spinner"></div>
        <span>Loading more results...</span>
      </div>
    </div>
  `,
  styles: [`
    .table-container {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .shadow-sm { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }

    .modern-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .modern-table th {
      background: #f8fafc;
      padding: 1rem 1.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .modern-table td {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    /* User Cell */
    .user-cell {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
    }
    .user-info { display: flex; flex-direction: column; gap: 0.125rem; }
    .user-name { font-weight: 700; color: #1e293b; font-size: 0.875rem; }
    .user-id { font-size: 0.75rem; color: #94a3b8; }

    /* Content Cell */
    .content-cell {
      display: flex;
      flex-direction: column;
      max-width: 300px;
    }
    .content-title { font-weight: 700; color: #334155; font-size: 0.875rem; margin-bottom: 0.125rem; }
    .content-body { 
      font-size: 0.8125rem; 
      color: #64748b; 
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Time Cell */
    .time-cell { display: flex; flex-direction: column; }
    .date { font-size: 0.875rem; font-weight: 600; color: #334155; }
    .time { font-size: 0.75rem; color: #94a3b8; }

    /* Rows */
    .data-row {
      cursor: pointer;
      transition: background 0.2s;
    }
    .data-row:hover { background: #f8fafc; }
    .data-row:active { background: #f1f5f9; }

    /* Badges */
    .badge {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.25rem 0.625rem;
      border-radius: 2rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: inline-block;
    }
    .badge--push { background: #f5f3ff; color: #7c3aed; }
    .badge--email { background: #eff6ff; color: #2563eb; }
    .badge--sms { background: #f0f9ff; color: #0369a1; }
    .badge--sent { background: #ecfdf5; color: #059669; }
    .badge--failed { background: #fef2f2; color: #dc2626; }
    .badge--pending { background: #fff7ed; color: #ea580c; }

    /* Actions */
    .text-right { text-align: right; }
    .actions-group { display: flex; gap: 0.5rem; justify-content: flex-end; }
    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
      background: white;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .action-btn:hover { background: #f1f5f9; color: #1e293b; border-color: #cbd5e1; }
    .action-btn.retry:hover { color: #7c3aed; border-color: #ddd6fe; background: #f5f3ff; }
    .action-btn:disabled { opacity: 0.45; cursor: not-allowed; pointer-events: none; }

    /* Skeleton */
    .skeleton-row td { padding: 1.5rem; }
    .skeleton-line {
      height: 12px;
      background: #f1f5f9;
      border-radius: 1rem;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }

    /* Empty State */
    .empty-state {
      padding: 4rem 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .empty-icon { opacity: 0.5; }
    .empty-state h3 { font-size: 1.125rem; font-weight: 700; color: #1e293b; margin: 0; }
    .empty-state p { font-size: 0.875rem; color: #64748b; margin: 0; }

    /* Load More */
    .load-more {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1.5rem;
      background: #f8fafc;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 600;
      border-top: 1px solid #e2e8f0;
    }
    .spinner {
      width: 18px;
      height: 18px;
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
  
  @Output() viewDetails = new EventEmitter<CampaignNotification>();
  @Output() retryNotification = new EventEmitter<CampaignNotification>();

  trackById(index: number, item: CampaignNotification) {
    return item.id;
  }

  onViewDetails(n: CampaignNotification) {
    this.viewDetails.emit(n);
  }

  onRetry(n: CampaignNotification) {
    if (n.status.trim().toUpperCase() === 'FAILED') {
      this.retryNotification.emit(n);
    }
  }
}
