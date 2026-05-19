import { Injectable, inject, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { injectInfiniteQuery } from '@tanstack/angular-query-experimental';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';

import { CampaignTargetStore } from '../stores/campaign-target.store';
import { UserSearchRepository } from '../api/user-search.repository';
import { CampaignPayloadBuilder } from '../domain/campaign-payload.builder';
import { CampaignApi } from '../api/campaign.api';

@Injectable({ providedIn: 'root' })
export class CampaignCreateFacade {
  private readonly store = inject(CampaignTargetStore);
  private readonly userApi = inject(UserSearchRepository);
  private readonly campaignApi = inject(CampaignApi);
  private readonly payloadBuilder = inject(CampaignPayloadBuilder);

  // Expose purely UI-driven state
  readonly isOverlayOpen = this.store.isOverlayOpen;
  readonly baseTargetRule = this.store.baseTargetRule;
  readonly activeTargetType = this.store.activeTargetType;
  readonly searchKeyword = this.store.searchKeyword;

  readonly includedIds = this.store.includedIds;
  readonly excludedIds = this.store.excludedIds;

  // Reactively debounced search stream (NO side-effects)
  readonly debouncedSearch$ = toObservable(this.store.searchKeyword).pipe(
    debounceTime(300),
    distinctUntilChanged()
  );

  // TanStack Infinite Query Setup (Memory Leak Safe)
  readonly usersQuery = injectInfiniteQuery(() => ({
    queryKey: ['users-search', this.store.searchKeyword()],
    queryFn: ({ pageParam = 0 }) => lastValueFrom(
      this.userApi.searchUsers({
        keyword: this.store.searchKeyword(),
        page: pageParam as number,
        size: 50
      })
    ),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.last ? undefined : lastPage.number + 1,
    gcTime: 1000 * 60 * 5, // 5 minutes Garbage Collection
    staleTime: 1000 * 10,  // 10 seconds stale
    maxPages: 3,           // Cap DOM explosion
  }));

  // Flattened users for CDK Virtual Scroll Viewport
  readonly flattenedUsers = computed(() => {
    const data = this.usersQuery.data();
    return data?.pages.flatMap(page => page.content) ?? [];
  });

  // UI Actions
  setOverlayOpen(isOpen: boolean): void {
    this.store.setOverlayOpen(isOpen);
  }

  setSearchKeyword(keyword: string): void {
    this.store.setSearchKeyword(keyword);
  }

  setBaseTargetRule(rule: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SPECIFIC'): void {
    this.store.setBaseTargetRule(rule);
  }

  toggleUser(userId: number, isBaseRuleSatisfied: boolean): void {
    this.store.toggleUserSelection(userId, isBaseRuleSatisfied);
  }

  // Domain Submission Logic
  async submitCampaign(formValue: any): Promise<void> {
    const selectionState = {
      targetType: this.store.activeTargetType(),
      baseRule: this.store.baseTargetRule() === 'SPECIFIC' ? null : this.store.baseTargetRule(),
      includedIds: this.store.includedIds(),
      excludedIds: this.store.excludedIds()
    };

    const payload = this.payloadBuilder.buildCreatePayload(formValue, selectionState as any);

    // Convert observable to promise to maintain clean component boundary
    await lastValueFrom(this.campaignApi.createCampaign(payload));
  }
}
