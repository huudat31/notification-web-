import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CampaignRepository } from '@data/repository/campaign.repository';
import { CampaignFilterBarComponent, FilterChangeEvent } from '../components/campaign-filter-bar/campaign-filter-bar.component';
import { CampaignCardComponent } from '../components/campaign-card/campaign-card.component';
import { CampaignSkeletonComponent } from '../components/campaign-skeleton/campaign-skeleton.component';

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
  providers: [CampaignRepository],
  templateUrl: './campaign-list.component.html',
  styleUrls: ['./campaign-list.component.css']
})
export class CampaignListComponent {
  private readonly pageService = inject(CampaignRepository);

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

    if (scrolled >= total - 200) {
      this.state$.subscribe(state => {
        if (!state.isLoading && state.hasMore) {
          this.pageService.loadNextPage();
        }
      }).unsubscribe();
    }
  }
}
