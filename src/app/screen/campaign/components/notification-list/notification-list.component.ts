import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CampaignNotification } from '@data/model/campaign-notification.model';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-container shadow-sm">
      <!-- HEADER -->
      <div class="table-header">
        <div class="th col-user">User</div>
        <div class="th col-channel">Channel</div>
        <div class="th col-status">Status</div>
        <div class="th col-message">Title & Message</div>
        <div class="th col-sent">Sent At</div>
        <div class="th col-actions text-right">Actions</div>
      </div>

      <!-- SKELETON LOADING -->
      <div *ngIf="isLoading && notifications.length === 0" class="skeleton-container">
        <div *ngFor="let i of [1,2,3,4,5,6,7,8]" class="skeleton-row">
          <div class="skeleton-line"></div>
        </div>
      </div>

      <!-- VIRTUAL VIEWPORT -->
      <cdk-virtual-scroll-viewport [itemSize]="72" class="viewport" (scrolledIndexChange)="listScrolled.emit($event)">
        <!-- DATA ROWS -->
        <div *cdkVirtualFor="let n of notifications; trackBy: trackById" 
             class="data-row" 
             (click)="onViewDetails(n)">
          <div class="td col-user">
            <div class="user-cell">
              <div class="avatar">{{ n.userName.charAt(0).toUpperCase() }}</div>
              <div class="user-info">
                <span class="user-name">{{ n.userName }}</span>
                <span class="user-id">ID: {{ n.userId }}</span>
              </div>
            </div>
          </div>
          <div class="td col-channel">
            <span class="badge" [ngClass]="'badge--' + n.channel.toLowerCase()">
              {{ n.channel }}
            </span>
          </div>
          <div class="td col-status">
            <span class="badge" [ngClass]="'badge--' + n.status.toLowerCase()">
              {{ n.status }}
            </span>
          </div>
          <div class="td col-message">
            <div class="content-cell">
              <span class="content-title">{{ n.title }}</span>
              <span class="content-body" [title]="n.body">{{ n.body }}</span>
            </div>
          </div>
          <div class="td col-sent">
            <div class="time-cell">
              <span class="date">{{ n.sentAt | date:'MMM d, yyyy' }}</span>
              <span class="time">{{ n.sentAt | date:'HH:mm' }}</span>
            </div>
          </div>
          <div class="td col-actions text-right">
            <div class="actions-group">
              <button *ngIf="n.status.trim().toUpperCase() === 'FAILED'" 
                      class="action-btn retry" 
                      (click)="$event.stopPropagation(); onRetry(n)" 
                      title="Retry">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- EMPTY STATE -->
        <div *ngIf="!isLoading && notifications.length === 0" class="empty-state">
          <div class="empty-icon">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h3>No notifications found</h3>
          <p>Try adjusting your filters or keyword.</p>
        </div>
      </cdk-virtual-scroll-viewport>

      <!-- LOAD MORE/FETCHING SPINNER -->
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
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .shadow-sm { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }

    .viewport {
      height: 550px;
      width: 100%;
      background: white;
    }

    /* Flexbox Table Layout */
    .table-header {
      display: flex;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-weight: 700;
      color: #64748b;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      user-select: none;
    }

    .data-row {
      display: flex;
      align-items: center;
      height: 72px;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.2s;
      width: 100%;
    }
    .data-row:hover { background: #f8fafc; }
    .data-row:active { background: #f1f5f9; }

    .th, .td {
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      overflow: hidden;
    }

    /* Column Widths Definition */
    .col-user { flex: 1.8; min-width: 160px; }
    .col-channel { flex: 0.8; min-width: 90px; }
    .col-status { flex: 0.8; min-width: 90px; }
    .col-message { flex: 3.2; min-width: 250px; }
    .col-sent { flex: 1.4; min-width: 130px; }
    .col-actions { flex: 0.8; min-width: 80px; justify-content: flex-end; }

    /* User Cell */
    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .avatar {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8125rem;
      flex-shrink: 0;
    }
    .user-info { display: flex; flex-direction: column; gap: 0.125rem; }
    .user-name { font-weight: 700; color: #1e293b; font-size: 0.8125rem; }
    .user-id { font-size: 0.6875rem; color: #94a3b8; }

    /* Content Cell */
    .content-cell {
      display: flex;
      flex-direction: column;
      max-width: 100%;
    }
    .content-title { font-weight: 700; color: #334155; font-size: 0.8125rem; margin-bottom: 0.125rem; }
    .content-body { 
      font-size: 0.75rem; 
      color: #64748b; 
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Time Cell */
    .time-cell { display: flex; flex-direction: column; }
    .date { font-size: 0.8125rem; font-weight: 600; color: #334155; }
    .time { font-size: 0.6875rem; color: #94a3b8; }

    /* Badges */
    .badge {
      font-size: 0.625rem;
      font-weight: 800;
      padding: 0.1875rem 0.5rem;
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
    .text-right { justify-content: flex-end; text-align: right; }
    .actions-group { display: flex; gap: 0.5rem; justify-content: flex-end; }
    .action-btn {
      width: 28px;
      height: 28px;
      border-radius: 0.375rem;
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

    /* Skeletons */
    .skeleton-container {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .skeleton-row {
      height: 48px;
      display: flex;
      align-items: center;
    }
    .skeleton-line {
      height: 12px;
      width: 100%;
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
      justify-content: center;
      gap: 1rem;
      width: 100%;
    }
    .empty-icon { opacity: 0.5; }
    .empty-state h3 { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0; }
    .empty-state p { font-size: 0.8125rem; color: #64748b; margin: 0; }

    /* Load More */
    .load-more {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #f8fafc;
      color: #64748b;
      font-size: 0.8125rem;
      font-weight: 600;
      border-top: 1px solid #e2e8f0;
    }
    .spinner {
      width: 16px;
      height: 16px;
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
  @Output() listScrolled = new EventEmitter<number>();

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
