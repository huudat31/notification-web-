import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { UserSearchItem } from '@data/api/user-search.repository';

@Component({
  selector: 'app-virtual-user-list',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <cdk-virtual-scroll-viewport itemSize="60" class="virtual-viewport" (scrolledIndexChange)="onScroll($event)">
      <div *cdkVirtualFor="let user of users; trackBy: trackById" class="user-item">
        <label class="checkbox-container">
          <input 
            type="checkbox" 
            [checked]="isUserSelected(user)" 
            (change)="onToggle(user)"
          />
          <span class="checkmark"></span>
          <div class="user-info">
            <span class="user-name">{{ user.name }}</span>
            <span class="user-email">{{ user.email }}</span>
          </div>
          <span class="status-badge" [class.active]="user.status === 'ACTIVE'">
            {{ user.status }}
          </span>
        </label>
      </div>
      
      <!-- Loading Shimmer -->
      <div *ngIf="isFetchingNextPage" class="shimmer-loader">
        <div class="spinner"></div>
        <span>Loading more users...</span>
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .virtual-viewport {
      height: 400px;
      width: 100%;
      overflow-y: auto;
    }
    .user-item {
      height: 60px;
      display: flex;
      align-items: center;
      padding: 0 1rem;
      border-bottom: 1px solid #e2e8f0;
      transition: background-color 0.2s;
    }
    .user-item:hover {
      background-color: #f8fafc;
    }
    .checkbox-container {
      display: flex;
      align-items: center;
      width: 100%;
      cursor: pointer;
    }
    .user-info {
      display: flex;
      flex-direction: column;
      margin-left: 1rem;
      flex: 1;
    }
    .user-name {
      font-weight: 500;
      color: #0f172a;
    }
    .user-email {
      font-size: 0.875rem;
      color: #64748b;
    }
    .status-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      background: #f1f5f9;
      color: #64748b;
    }
    .status-badge.active {
      background: #dcfce7;
      color: #166534;
    }
    .shimmer-loader {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
      color: #94a3b8;
      font-size: 0.875rem;
      gap: 0.5rem;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class VirtualUserListComponent {
  @Input() users: UserSearchItem[] = [];
  @Input() includedIds: Set<number> = new Set();
  @Input() excludedIds: Set<number> = new Set();
  @Input() baseRule: string = 'ALL';
  @Input() isFetchingNextPage = false;

  @Output() toggleUser = new EventEmitter<{ user: UserSearchItem, isBaseRuleSatisfied: boolean }>();
  @Output() loadMore = new EventEmitter<void>();

  trackById(index: number, item: UserSearchItem): number {
    return item.id;
  }

  isUserSelected(user: UserSearchItem): boolean {
    if (this.baseRule === 'SPECIFIC') {
      return this.includedIds.has(user.id);
    }

    const isBaseRuleSatisfied = this.baseRule === 'ALL' || user.status === this.baseRule;

    if (isBaseRuleSatisfied) {
      return !this.excludedIds.has(user.id); // True unless explicitly excluded
    } else {
      return this.includedIds.has(user.id);  // False unless explicitly included
    }
  }

  onToggle(user: UserSearchItem): void {
    const isBaseRuleSatisfied = this.baseRule === 'ALL' || user.status === this.baseRule;
    this.toggleUser.emit({ user, isBaseRuleSatisfied });
  }

  onScroll(index: number): void {
    // If scrolled to within 5 items of the end, trigger load more
    if (this.users.length > 0 && index + 10 >= this.users.length) {
      this.loadMore.emit();
    }
  }
}
