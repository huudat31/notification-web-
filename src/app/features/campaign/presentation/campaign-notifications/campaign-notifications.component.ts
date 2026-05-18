import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CampaignNotificationPageService } from './services/campaign-notification.service';
import { CampaignOverviewCardsComponent } from './components/campaign-overview-cards/campaign-overview-cards.component';
import { NotificationFilterBarComponent } from './components/notification-filter-bar/notification-filter-bar.component';
import { NotificationListComponent } from './components/notification-list/notification-list.component';
import { NotificationDetailDrawerComponent } from './components/notification-detail-drawer/notification-detail-drawer.component';

import { CampaignNotification, CampaignNotificationFilter } from '../../domain/models/campaign-notification.model';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-campaign-notifications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CampaignOverviewCardsComponent,
    NotificationFilterBarComponent,
    NotificationListComponent,
    NotificationDetailDrawerComponent
  ],
  providers: [CampaignNotificationPageService],
  template: `
    <div class="dashboard-shell" *ngIf="campaign$ | async as campaign">
      
      <!-- HEADER -->
      <header class="page-header">
        <div class="header-top">
          <nav class="breadcrumb">
            <span [routerLink]="['/campaigns']" class="breadcrumb-item link">Campaigns</span>
            <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            <span class="breadcrumb-item link" [routerLink]="['/campaigns']">{{ campaign.name }}</span>
            <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            <span class="breadcrumb-item active">Notifications</span>
          </nav>
        </div>

        <div class="header-bottom">
          <div class="title-container">
            <button class="back-btn" [routerLink]="['/campaigns']" title="Back to Campaigns">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <div class="title-group">
              <h1 class="page-title">Campaign Notifications</h1>
              <p class="page-subtitle" *ngIf="state$ | async as state">
                Showing total <span class="count-badge">{{ state.totalElements }}</span> notifications sent for this campaign.
              </p>
            </div>
          </div>
          <div class="header-actions">
             <button class="btn-primary" [routerLink]="['/campaigns/create']">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                New Notification
             </button>
          </div>
        </div>
      </header>

      <!-- CONTENT -->
      <main class="main-content">
        <!-- Summary Cards -->
        <app-campaign-overview-cards [stats]="(stats$ | async)!"></app-campaign-overview-cards>

        <!-- Search & Filters -->
        <app-notification-filter-bar 
          (filterChange)="onFilterChange($event)"
          (refresh)="refresh()">
        </app-notification-filter-bar>

        <!-- Notifications Table -->
        <ng-container *ngIf="state$ | async as state">
          <!-- Error banner -->
          <div class="error-banner" *ngIf="state.error">
             <div class="error-msg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <span>{{ state.error }}</span>
             </div>
             <button class="btn-retry-main" (click)="refresh()">Try Again</button>
          </div>

          <app-notification-list 
            [notifications]="state.notifications" 
            [isLoading]="state.isLoading"
            (viewDetails)="openDetail($event)"
            (retryNotification)="onRetry($event)">
          </app-notification-list>
        </ng-container>
      </main>

      <!-- DETAIL DRAWER -->
      <app-notification-detail-drawer
        [isOpen]="isDrawerOpen"
        [notification]="selectedNotification"
        (closeDrawer)="closeDetail()">
      </app-notification-detail-drawer>
    </div>
  `,
  styles: [`
    .dashboard-shell {
      min-height: 100vh;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
    }

    .page-header {
      padding: 1.5rem 2.5rem;
      background: white;
      border-bottom: 1px solid #e2e8f0;
    }
    .header-top { margin-bottom: 1.5rem; }
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 600;
    }
    .breadcrumb-item { color: #64748b; }
    .breadcrumb-item.active { color: #0f172a; }
    .breadcrumb-item.link { cursor: pointer; transition: color 0.2s; }
    .breadcrumb-item.link:hover { color: #7c3aed; }
    .chevron { color: #cbd5e1; }

    .header-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title-container {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .back-btn {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: 1px solid #e2e8f0;
      background: white;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
    }
    .back-btn:hover {
      background: #f8fafc;
      color: #7c3aed;
      border-color: #ddd6fe;
      transform: translateX(-3px);
      box-shadow: 0 4px 10px rgba(124, 58, 237, 0.1);
    }
    .page-title {
      font-size: 1.875rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.25rem 0;
      letter-spacing: -0.025em;
    }
    .page-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }
    .count-badge {
      background: #f1f5f9;
      color: #1e293b;
      padding: 0.125rem 0.5rem;
      border-radius: 0.375rem;
      font-weight: 700;
      margin: 0 0.125rem;
    }

    .btn-primary {
      background: #0f172a;
      color: white;
      border: none;
      padding: 0.625rem 1.25rem;
      border-radius: 0.5rem;
      font-weight: 700;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary:hover { background: #1e293b; transform: translateY(-1px); }

    .main-content {
      flex: 1;
      padding: 2rem 2.5rem;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    .error-banner {
      background: #fff1f2;
      border: 1px solid #ffe4e6;
      padding: 1rem 1.5rem;
      border-radius: 0.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      color: #e11d48;
    }
    .error-msg { display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; font-weight: 600; }
    .btn-retry-main {
      background: white;
      border: 1px solid #ffe4e6;
      padding: 0.4rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #e11d48;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-retry-main:hover { background: #ffe4e6; }

    @media (max-width: 768px) {
      .header-bottom { flex-direction: column; align-items: flex-start; gap: 1rem; }
    }
  `]
})
export class CampaignNotificationsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private pageService = inject(CampaignNotificationPageService);
  private toast = inject(ToastService);

  readonly campaign$ = this.pageService.campaign$;
  readonly stats$ = this.pageService.stats$;
  readonly state$ = this.pageService.state$;

  // Drawer state
  isDrawerOpen = false;
  selectedNotification: CampaignNotification | null = null;

  ngOnInit() {
    const campaignId = this.route.snapshot.paramMap.get('campaignId');
    if (campaignId) {
      this.pageService.setCampaignId(campaignId);
    }
  }

  onFilterChange(filters: Partial<CampaignNotificationFilter>): void {
    this.pageService.updateFilters(filters);
  }

  refresh(): void {
    const campaignId = this.route.snapshot.paramMap.get('campaignId');
    if (campaignId) this.pageService.setCampaignId(campaignId);
  }

  openDetail(n: CampaignNotification) {
    this.selectedNotification = n;
    this.isDrawerOpen = true;
  }

  closeDetail() {
    this.isDrawerOpen = false;
    this.selectedNotification = null;
  }

  onRetry(n: CampaignNotification) {
    if (n.status.trim().toUpperCase() !== 'FAILED') return;
    this.pageService.retryNotification(n.id).subscribe({
      next: () => {
         this.toast.success('Retry Initiated', 'Manual retry request sent successfully.');
         this.refresh();
      },
      error: (err) => {
         this.toast.error('Retry Failed', 'Unable to retry notification sending.');
         console.error('Retry failed', err);
      }
    });
  }

  @HostListener('window:scroll', [])
  onScroll() {
    const pos = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.offsetHeight;
    const max = document.documentElement.scrollHeight;

    this.state$.subscribe(state => {
      if (pos > max - 200 && !state.isLoading && state.hasMore) {
        this.pageService.loadNextPage();
      }
    }).unsubscribe();
  }
}
