import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CampaignNotificationRepository } from '@data/repository/campaign-notification.repository';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campaign-notifications.component.html',
  styleUrls: ['./campaign-notifications.component.scss']
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

    // Transactional optimistic update with rollback support
    const snapshot = this.pageService.applyOptimisticStatus(n.id, 'PENDING');

    this.pageService.retryNotification(n.id).subscribe({
      next: () => {
        this.toast.success('Retry Initiated', 'Manual retry request sent successfully.');
      },
      error: (err) => {
        this.toast.error('Retry Failed', 'Unable to retry notification sending.');
        console.error('Retry failed', err);
        // Transactional Rollback
        this.pageService.rollbackStatus(n.id, snapshot);
      }
    });
  }

  onScrollIndexChange(index: number): void {
    const state = this.pageService.state();
    if (index >= state.notifications.length - 10 && !state.isLoading && !state.isFetchingNextPage && state.hasMore) {
      this.pageService.loadNextPage();
    }
  }
}
