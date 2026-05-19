import { Injectable, signal, computed } from '@angular/core';
import { CampaignNotificationFilter } from '@data/model/campaign-notification.model';

@Injectable()
export class CampaignUiStore {
  readonly filters = signal<CampaignNotificationFilter>({ page: 0, size: 10 });
  readonly activeNotificationId = signal<number | null>(null);

  readonly currentPage = computed(() => this.filters().page);

  updateFilters(partial: Partial<CampaignNotificationFilter>): void {
    this.filters.update(prev => ({
      ...prev,
      ...partial,
      page: ('page' in partial) ? (partial.page ?? 0) : 0
    }));
  }

  nextPage(): void {
    this.filters.update(prev => ({ ...prev, page: prev.page + 1 }));
  }

  setActiveNotificationId(id: number | null): void {
    this.activeNotificationId.set(id);
  }
}
