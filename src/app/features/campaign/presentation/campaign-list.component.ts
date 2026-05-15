import { Component, inject, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CampaignPageService, CampaignPageState } from './campaign-list-page/services/campaign.service';
import { CampaignFilterBarComponent, FilterChangeEvent } from './campaign-list-page/components/campaign-filter-bar/campaign-filter-bar.component';
import { CampaignCardComponent } from './campaign-list-page/components/campaign-card/campaign-card.component';
import { CampaignSkeletonComponent } from './campaign-list-page/components/campaign-skeleton/campaign-skeleton.component';

@Component({
  selector: 'app-campaign-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CampaignFilterBarComponent,
    CampaignCardComponent,
    CampaignSkeletonComponent
  ],
  providers: [CampaignPageService],
  templateUrl: './campaign-list.component.html',
  styleUrls: ['./campaign-list.component.css']
})
export class CampaignListComponent {
  private readonly pageService = inject(CampaignPageService);

  readonly state$ = this.pageService.state$;

  trackById(_index: number, campaign: { id: string }): string {
    return campaign.id;
  }

  onFilterChange(event: FilterChangeEvent): void {
    this.pageService.updateFilters(event);
  }

  onRetry(): void {
    this.pageService.retry();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrolled = document.documentElement.scrollTop + document.documentElement.clientHeight;
    const total = document.documentElement.scrollHeight;

    // Trigger when user is within 200px of the bottom
    if (scrolled >= total - 200) {
      this.state$.subscribe(state => {
        if (!state.isLoading && state.hasMore) {
          this.pageService.loadNextPage();
        }
      }).unsubscribe();
    }
  }
}
