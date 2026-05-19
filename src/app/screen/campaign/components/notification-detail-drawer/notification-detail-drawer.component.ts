import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import {
  CampaignNotification,
  PushNotificationDetail,
  EmailNotificationDetail,
  SmsNotificationDetail
} from '@data/model/campaign-notification.model';
import { CampaignNotificationRepository } from '@data/repository/campaign-notification.repository';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-notification-detail-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="drawer-overlay" [class.open]="isOpen" (click)="close()">
      <div class="drawer-content" [class.open]="isOpen" (click)="$event.stopPropagation()">
        <!-- Header -->
        <header class="drawer-header">
          <div class="header-main">
            <h2 class="drawer-title">Notification Details</h2>
            <button class="close-btn" (click)="close()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="header-status" *ngIf="notification">
             <span class="badge" [ngClass]="'badge--' + notification.channel.toLowerCase()">{{ notification.channel }}</span>
             <span class="badge" [ngClass]="'badge--' + notification.status.toLowerCase()">{{ notification.status }}</span>
          </div>
        </header>

        <!-- Body -->
        <div class="drawer-body" *ngIf="notification">
          <!-- Notification Info -->
          <section class="info-section">
            <div class="info-group">
              <label>Title</label>
              <div class="info-value title">{{ notification.title }}</div>
            </div>
            <div class="info-group">
              <label>Body Content</label>
              <div class="info-value body">{{ notification.body }}</div>
            </div>
            <div class="info-meta-grid">
              <div class="info-group">
                <label>User</label>
                <div class="info-value">{{ notification.userName }} ({{ notification.userId }})</div>
              </div>
              <div class="info-group">
                <label>Sent At</label>
                <div class="info-value">{{ notification.sentAt | date:'MMM d, yyyy HH:mm:ss' }}</div>
              </div>
              <div class="info-group">
                <label>Retry Count</label>
                <div class="info-value">{{ notification.count }}</div>
              </div>
            </div>
          </section>

          <div class="divider"></div>

          <!-- Delivery Details -->
          <section class="delivery-section">
            <h3 class="section-title">Delivery Details</h3>
            
            <div class="loading-state" *ngIf="isLoadingDetails">
              <div class="spinner"></div>
              <span>Fetching delivery logs...</span>
            </div>

            <div class="details-content" *ngIf="!isLoadingDetails && details">
              <!-- PUSH Table -->
              <div class="table-container" *ngIf="notification.channel === 'PUSH'">
                <table class="detail-table">
                  <thead>
                    <tr>
                      <th>Device Name</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th>Retries</th>
                      <th>Updated At</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let d of asPushDetails(details)">
                      <td>{{ d.deviceName }}</td>
                      <td class="address-cell">
                        <span class="truncate">{{ d.address }}</span>
                        <button class="copy-btn" (click)="copyToClipboard(d.address)">
                           <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                        </button>
                      </td>
                      <td><span class="badge" [ngClass]="'badge--' + d.status.toLowerCase()">{{ d.status }}</span></td>
                      <td>{{ d.retryCount }}</td>
                      <td>{{ d.updatedAt | date:'HH:mm:ss' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- EMAIL Layout -->
              <div class="simple-detail" *ngIf="notification.channel === 'EMAIL'">
                <div class="detail-item" *ngFor="let d of asEmailDetails(details)">
                   <div class="detail-row">
                     <span class="detail-label">Target Email</span>
                     <span class="detail-value">{{ d.target }}</span>
                   </div>
                   <div class="detail-row">
                     <span class="detail-label">Status</span>
                     <span class="badge" [ngClass]="'badge--' + d.status.toLowerCase()">{{ d.status }}</span>
                   </div>
                   <div class="detail-row" *ngIf="d.errorMessage">
                     <span class="detail-label">Error</span>
                     <span class="error-text">{{ d.errorMessage }}</span>
                   </div>
                </div>
              </div>

              <!-- SMS Layout -->
              <div class="simple-detail" *ngIf="notification.channel === 'SMS'">
                 <div class="detail-item" *ngFor="let d of asSmsDetails(details)">
                   <div class="detail-row">
                     <span class="detail-label">Phone Number</span>
                     <span class="detail-value">{{ d.target }}</span>
                   </div>
                   <div class="detail-row">
                     <span class="detail-label">Status</span>
                     <span class="badge" [ngClass]="'badge--' + d.status.toLowerCase()">{{ d.status }}</span>
                   </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Footer -->
        <footer class="drawer-footer">
          <button class="btn-retry" [disabled]="isRetrying || notification?.status?.trim()?.toUpperCase() !== 'FAILED'" (click)="onRetry()">
            <div class="spinner spinner--sm" *ngIf="isRetrying"></div>
            {{ isRetrying ? 'Retrying...' : 'Retry Notification' }}
          </button>
          <button class="btn-secondary" (click)="close()">Close</button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .drawer-overlay {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }
    .drawer-overlay.open {
      opacity: 1;
      visibility: visible;
    }
    .drawer-content {
      position: absolute;
      top: 0;
      right: -100%;
      width: 100%;
      max-width: 600px;
      height: 100%;
      background: white;
      box-shadow: -10px 0 40px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .drawer-content.open {
      right: 0;
    }

    .drawer-header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .drawer-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .close-btn {
      background: #f1f5f9;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }
    .close-btn:hover {
      background: #e2e8f0;
      color: #1e293b;
    }
    .header-status {
      display: flex;
      gap: 0.5rem;
    }

    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }
    .info-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .info-group label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }
    .info-value {
      font-size: 0.9375rem;
      font-weight: 500;
      color: #334155;
      line-height: 1.5;
    }
    .info-value.title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1e293b;
    }
    .info-value.body {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
    }
    .info-meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .divider {
      height: 1px;
      background: #e2e8f0;
      margin: 2rem 0;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 1.25rem 0;
    }

    /* Table styles */
    .table-container {
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .detail-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    .detail-table th {
      background: #f8fafc;
      text-align: left;
      padding: 0.75rem 1rem;
      color: #64748b;
      font-weight: 700;
      border-bottom: 1px solid #e2e8f0;
    }
    .detail-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .address-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      max-width: 180px;
    }
    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .copy-btn {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 2px;
      display: flex;
    }
    .copy-btn:hover { color: #7c3aed; }

    /* Simple detail items (Email/SMS) */
    .detail-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
    }
    .detail-label { font-size: 0.75rem; font-weight: 600; color: #64748b; }
    .detail-value { font-size: 0.875rem; font-weight: 700; color: #1e293b; }
    .error-text { color: #dc2626; font-size: 0.8125rem; font-weight: 600; }

    .drawer-footer {
      padding: 1.5rem 2rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 1rem;
    }
    .btn-retry {
      flex: 1;
      background: #7c3aed;
      color: white;
      border: none;
      padding: 0.75rem;
      border-radius: 0.5rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }
    .btn-retry:hover:not(:disabled) { background: #6d28d9; transform: translateY(-1px); }
    .btn-retry:disabled { opacity: 0.45; cursor: not-allowed; pointer-events: none; }
    
    .btn-secondary {
      padding: 0.75rem 1.5rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      color: #475569;
      font-weight: 700;
      cursor: pointer;
    }

    /* Badges */
    .badge {
      font-size: 0.625rem;
      font-weight: 800;
      padding: 0.25rem 0.625rem;
      border-radius: 2rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge--push { background: #f5f3ff; color: #7c3aed; }
    .badge--email { background: #eff6ff; color: #2563eb; }
    .badge--sms { background: #f0f9ff; color: #0369a1; }
    .badge--sent { background: #ecfdf5; color: #059669; }
    .badge--failed { background: #fef2f2; color: #dc2626; }
    .badge--pending { background: #fff7ed; color: #ea580c; }

    /* Spinner */
    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #f1f5f9;
      border-top-color: #7c3aed;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .spinner--sm { width: 16px; height: 16px; border-width: 2px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      color: #64748b;
      font-size: 0.875rem;
    }

    @media (max-width: 480px) {
      .info-meta-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      .drawer-body {
        padding: 1.25rem;
      }
      .drawer-header {
        padding: 1rem 1.25rem;
      }
      .drawer-footer {
        padding: 1rem 1.25rem;
      }
      .address-cell {
        max-width: 140px;
      }
    }
  `]
})
export class NotificationDetailDrawerComponent {
  private pageService = inject(CampaignNotificationRepository);
  private toast = inject(ToastService);

  @Input() isOpen = false;
  @Input() notification: CampaignNotification | null = null;
  @Output() closeDrawer = new EventEmitter<void>();

  details: any = null;
  isLoadingDetails = false;
  isRetrying = false;

  ngOnChanges() {
    if (this.isOpen && this.notification) {
      this.fetchDetails();
    } else {
      this.details = null;
    }
  }

  fetchDetails() {
    if (!this.notification) return;
    this.isLoadingDetails = true;
    this.pageService.getNotificationDetails(this.notification.id)
      .pipe(finalize(() => this.isLoadingDetails = false))
      .subscribe({
        next: (res) => this.details = res,
        error: (err) => console.error('Failed to fetch details', err)
      });
  }

  onRetry() {
    if (!this.notification || this.notification.status.trim().toUpperCase() !== 'FAILED') return;
    this.isRetrying = true;
    this.pageService.retryNotification(this.notification.id)
      .pipe(finalize(() => this.isRetrying = false))
      .subscribe({
        next: () => {
          this.toast.success('Retry Initiated', 'Manual retry request sent successfully.');
          this.fetchDetails();
        },
        error: (err) => {
          this.toast.error('Retry Failed', 'Unable to retry notification sending.');
          console.error('Retry failed', err);
        }
      });
  }

  close() {
    this.isOpen = false;
    this.closeDrawer.emit();
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  asPushDetails(d: any): PushNotificationDetail[] {
    return Array.isArray(d) ? d : [d];
  }

  asEmailDetails(d: any): EmailNotificationDetail[] {
    return Array.isArray(d) ? d : [d];
  }

  asSmsDetails(d: any): SmsNotificationDetail[] {
    return Array.isArray(d) ? d : [d];
  }
}
