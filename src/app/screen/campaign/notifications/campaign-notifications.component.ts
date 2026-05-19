import { Component, OnInit, inject, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CampaignNotificationRepository, NotificationPageState } from '@data/repository/campaign-notification.repository';
import { ToastService } from '@core/services/toast.service';
import { CampaignNotification, CampaignNotificationFilter } from '@data/model/campaign-notification.model';
import { CampaignOverviewCardsComponent } from '../components/campaign-overview-cards/campaign-overview-cards.component';
import { NotificationFilterBarComponent } from '../components/notification-filter-bar/notification-filter-bar.component';
import { NotificationListComponent } from '../components/notification-list/notification-list.component';
import { NotificationDetailDrawerComponent } from '../components/notification-detail-drawer/notification-detail-drawer.component';

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
  providers: [CampaignNotificationRepository],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pageService.campaignQuery.data(); as campaign) {
      <div class="dashboard-shell">
        
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
                 <p class="page-subtitle">
                   Showing total <span class="count-badge">{{ pageService.state().totalElements }}</span> notifications sent for this campaign.
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

        <!-- STATS OVERVIEW CARDS -->
        <app-campaign-overview-cards [stats]="pageService.stats()" />

        <!-- FILTER BAR -->
        <app-notification-filter-bar (filterChange)="onFilterChange($event)" />

        <!-- MAIN CONTENT -->
        <main class="page-content">
           <div class="card notification-card">
             <app-notification-list 
               [notifications]="pageService.state().notifications"
               [isLoading]="pageService.state().isLoading"
               (viewDetails)="openDetail($event)"
               (retryNotification)="onRetry($event)"
             />
             
             @if (pageService.state().isFetchingNextPage) {
               <div class="infinite-scroll-loading">
                  <div class="spinner"></div>
                  <span>Loading more notifications...</span>
               </div>
             }
           </div>
        </main>

        <!-- DETAIL DRAWER -->
        <app-notification-detail-drawer 
          [isOpen]="isDrawerOpen"
          [notification]="selectedNotification"
          (closeDrawer)="closeDetail()"
        />

      </div>
    }
  `,
  styles: [`
    .dashboard-shell {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
      min-height: 100vh;
      background: #f8fafc;
    }
    
    .page-header {
      margin-bottom: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .header-top {
      display: flex;
      align-items: center;
    }
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
      padding: 0.75rem 1.25rem;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
    }
    .btn-primary:hover {
      background: #1e293b;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
    }

    .card {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.03), 0 2px 4px -2px rgba(15, 23, 42, 0.03);
      overflow: hidden;
    }
    
    .notification-card {
      margin-top: 1.5rem;
    }
    
    .infinite-scroll-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 600;
    }
    
    .spinner {
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid #cbd5e1;
      border-top-color: #7c3aed;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class CampaignNotificationsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  readonly pageService = inject(CampaignNotificationRepository);
  private toast = inject(ToastService);

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
    this.pageService.setActiveNotificationId(n.id);
  }

  closeDetail() {
    this.isDrawerOpen = false;
    this.selectedNotification = null;
    this.pageService.setActiveNotificationId(null);
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

    const state = this.pageService.state();
    if (pos > max - 200 && !state.isLoading && !state.isFetchingNextPage && state.hasMore) {
      this.pageService.loadNextPage();
    }
  }
}
