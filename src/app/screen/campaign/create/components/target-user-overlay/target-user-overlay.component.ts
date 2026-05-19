import { Component, inject, HostListener, effect, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';

import { CampaignCreateFacade } from '@data/facade/campaign-create.facade';
import { VirtualUserListComponent } from '../virtual-user-list/virtual-user-list.component';

@Component({
  selector: 'app-target-user-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule, A11yModule, VirtualUserListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overlay-backdrop" *ngIf="facade.isOverlayOpen()" (click)="close()">
      
      <!-- Trap focus inside the modal for A11y -->
      <div 
        class="overlay-panel" 
        (click)="$event.stopPropagation()"
        cdkTrapFocus 
        [cdkTrapFocusAutoCapture]="true"
      >
        <!-- HEADER -->
        <header class="overlay-header">
          <h2>Select Target Users</h2>
          <button class="close-btn" (click)="close()" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </header>

        <!-- SEARCH BAR -->
        <div class="search-section">
          <div class="search-input-wrapper">
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              [ngModel]="facade.searchKeyword()"
              (ngModelChange)="onSearchChange($event)"
              #searchInput
              autocomplete="off"
            />
          </div>
        </div>

        <!-- TARGET MODE TABS -->
        <div class="tabs-section">
          <div class="tabs-container">
            <button 
              *ngFor="let mode of ['ALL', 'ACTIVE', 'INACTIVE', 'SPECIFIC']"
              class="tab-btn"
              [class.active]="facade.baseTargetRule() === mode"
              [class.auto-active]="facade.activeTargetType() === mode"
              (click)="setBaseRule(mode)"
            >
              {{ mode }}
            </button>
          </div>
          <div class="auto-detect-badge" *ngIf="facade.activeTargetType() !== facade.baseTargetRule()">
            Auto-switched to: <strong>{{ facade.activeTargetType() }}</strong>
          </div>
        </div>

        <!-- VIRTUAL LIST -->
        <div class="list-section">
          <app-virtual-user-list
            [users]="facade.flattenedUsers()"
            [includedIds]="facade.includedIds()"
            [excludedIds]="facade.excludedIds()"
            [baseRule]="facade.baseTargetRule()"
            [isFetchingNextPage]="facade.usersQuery.isFetchingNextPage()"
            (toggleUser)="onToggleUser($event)"
            (loadMore)="onLoadMore()"
          />
        </div>

        <!-- FOOTER -->
        <footer class="overlay-footer">
          <div class="selection-info">
            <span class="info-label">Base Mode:</span>
            <span class="info-value">{{ facade.baseTargetRule() }}</span>
            <span class="info-divider">|</span>
            <span class="info-label">Current Type:</span>
            <span class="info-value highlight">{{ facade.activeTargetType() }}</span>
          </div>
          <button class="btn-primary" (click)="close()">Done</button>
        </footer>

      </div>
    </div>
  `,
  styles: [`
    .overlay-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    }
    
    .overlay-panel {
      background: #ffffff;
      border-radius: 12px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .overlay-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .overlay-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #0f172a;
    }

    .close-btn {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .close-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .search-section {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      color: #94a3b8;
    }

    .search-input-wrapper input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      outline: none;
      transition: all 0.2s;
    }

    .search-input-wrapper input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .tabs-section {
      padding: 0.75rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .tabs-container {
      display: flex;
      gap: 0.5rem;
    }

    .tab-btn {
      padding: 0.375rem 0.75rem;
      border: 1px solid transparent;
      background: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      background: #f1f5f9;
    }

    .tab-btn.active {
      background: #eff6ff;
      color: #2563eb;
    }

    .auto-detect-badge {
      font-size: 0.75rem;
      background: #fef9c3;
      color: #854d0e;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
      animation: pulse 2s infinite;
    }

    .list-section {
      flex: 1;
      overflow: hidden;
      min-height: 400px;
    }

    .overlay-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      border-radius: 0 0 12px 12px;
    }

    .selection-info {
      font-size: 0.875rem;
      color: #64748b;
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .info-label {
      font-weight: 500;
    }

    .info-value {
      color: #0f172a;
    }
    
    .info-value.highlight {
      color: #ea580c;
      font-weight: 600;
    }

    .info-divider {
      color: #cbd5e1;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.5rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class TargetUserOverlayComponent {
  public readonly facade = inject(CampaignCreateFacade);
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor() {
    effect(() => {
      if (this.facade.isOverlayOpen() && this.searchInput) {
        setTimeout(() => this.searchInput.nativeElement.focus(), 100);
      }
    });
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: Event) {
    if (this.facade.isOverlayOpen()) {
      this.close();
    }
  }

  onSearchChange(val: string): void {
    this.facade.setSearchKeyword(val);
  }

  setBaseRule(mode: string): void {
    this.facade.setBaseTargetRule(mode as any);
  }

  onToggleUser(event: { user: any, isBaseRuleSatisfied: boolean }): void {
    this.facade.toggleUser(event.user.id, event.isBaseRuleSatisfied);
  }

  onLoadMore(): void {
    if (this.facade.usersQuery.hasNextPage() && !this.facade.usersQuery.isFetchingNextPage()) {
      this.facade.usersQuery.fetchNextPage();
    }
  }

  close(): void {
    this.facade.setOverlayOpen(false);
  }
}
