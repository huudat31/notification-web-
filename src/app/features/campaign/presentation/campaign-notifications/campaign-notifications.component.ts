import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CampaignNotificationPageService } from './services/campaign-notification.service';
import { CampaignOverviewCardsComponent } from './components/campaign-overview-cards/campaign-overview-cards.component';
import { NotificationFilterBarComponent } from './components/notification-filter-bar/notification-filter-bar.component';
import { NotificationListComponent } from './components/notification-list/notification-list.component';

import { CampaignNotificationFilter } from '../../domain/models/campaign-notification.model';

@Component({
  selector: 'app-campaign-notifications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CampaignOverviewCardsComponent,
    NotificationFilterBarComponent,
    NotificationListComponent
  ],
  providers: [CampaignNotificationPageService],
  template: `
    <div class="page-container" *ngIf="campaign$ | async as campaign">
      <!-- Header -->
      <header class="page-header">
        <div class="header-top">
          <button class="back-btn" [routerLink]="['/campaigns']">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Campaigns
          </button>
          <div class="breadcrumb">
             <span>Campaigns</span> / <span>Notifications</span>
          </div>
        </div>

        <div class="header-content">
          <div class="title-section">
            <h1 class="page-title">
              <span class="emoji">🔥</span>
              {{ campaign.name }}
            </h1>
            <p class="page-desc">Detailed activity logs and delivery status for this campaign.</p>
          </div>
          <div class="meta-section">
            <div class="meta-item">
              <span class="meta-label">Created At</span>
              <span class="meta-value">{{ campaign.createdAt | date:'MMM d, yyyy' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Channel</span>
              <span class="meta-value">{{ campaign.channel }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="page-content">
        <!-- Stats -->
        <app-campaign-overview-cards [stats]="(stats$ | async)!"></app-campaign-overview-cards>

        <!-- Filters -->
        <app-notification-filter-bar (filterChange)="onFilterChange($event)"></app-notification-filter-bar>

        <!-- List State -->
        <ng-container *ngIf="state$ | async as state">
          <!-- Error State -->
          <div class="error-alert" *ngIf="state.error">
            <div class="error-content">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ state.error }}</span>
            </div>
            <button class="retry-btn" (click)="retry()">Retry</button>
          </div>

          <!-- List -->
          <app-notification-list 
            [notifications]="state.notifications" 
            [isLoading]="state.isLoading">
          </app-notification-list>
        </ng-container>
      </main>
    </div>
  `,
  styles: [`
    .page-container {
      min-height: 100vh;
      background: #f8fafc;
    }
    .page-header {
      background: white;
      padding: 1.5rem 2.5rem 2.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .back-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0.5rem 0.75rem;
      margin-left: -0.75rem;
      border-radius: 0.5rem;
      transition: all 0.2s;
    }
    .back-btn:hover {
      background: #f1f5f9;
      color: #1e293b;
    }
    .breadcrumb {
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .page-title {
      font-size: 2.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      letter-spacing: -0.025em;
    }
    .page-desc {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0;
    }
    .meta-section {
      display: flex;
      gap: 2rem;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      align-items: flex-end;
    }
    .meta-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .meta-value {
      font-size: 0.875rem;
      font-weight: 700;
      color: #475569;
    }

    .page-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 2.5rem;
    }

    .error-alert {
      background: #fef2f2;
      border: 1px solid #fee2e2;
      padding: 1rem 1.5rem;
      border-radius: 0.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      color: #991b1b;
    }
    .error-content { display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; font-weight: 500; }
    .retry-btn {
      background: white;
      border: 1px solid #fee2e2;
      padding: 0.4rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #991b1b;
      cursor: pointer;
      transition: all 0.2s;
    }
    .retry-btn:hover { background: #fee2e2; }

    @media (max-width: 768px) {
      .header-content { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
      .meta-section { align-self: flex-start; }
      .meta-item { align-items: flex-start; }
    }
  `]
})
export class CampaignNotificationsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private pageService = inject(CampaignNotificationPageService);

  readonly campaign$ = this.pageService.campaign$;
  readonly stats$ = this.pageService.stats$;
  readonly state$ = this.pageService.state$;

  ngOnInit() {
    const campaignId = this.route.snapshot.paramMap.get('campaignId');
    if (campaignId) {
      this.pageService.setCampaignId(campaignId);
    }
  }

  onFilterChange(filters: Partial<CampaignNotificationFilter>): void {
    this.pageService.updateFilters(filters);
  }

  retry(): void {
    // Re-trigger the current filters by setting id again
    const campaignId = this.route.snapshot.paramMap.get('campaignId');
    if (campaignId) this.pageService.setCampaignId(campaignId);
  }

  @HostListener('window:scroll', [])
  onScroll() {
    const pos = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.offsetHeight;
    const max = document.documentElement.scrollHeight;

    // If we are near the bottom and not currently loading, load next page
    this.state$.subscribe(state => {
      if (pos > max - 200 && !state.isLoading && state.hasMore) {
        this.pageService.loadNextPage();
      }
    }).unsubscribe(); // Be careful with scroll listeners and async pipe
  }
}
