import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-notification-filter-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="filter-container">
      <div class="filter-main">
        <!-- Search -->
        <div class="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input [formControl]="filterForm.controls.keyword" type="text" placeholder="Search by username..." class="search-input">
        </div>

        <!-- Channel Filter -->
        <div class="select-field">
          <label>Channel</label>
          <select [formControl]="filterForm.controls.channel">
            <option value="">ALL CHANNELS</option>
            <option value="PUSH">PUSH</option>
            <option value="EMAIL">EMAIL</option>
            <option value="SMS">SMS</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="select-field">
          <label>Status</label>
          <select [formControl]="filterForm.controls.status">
            <option value="">ALL STATUS</option>
            <option value="SENT">SENT</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      <div class="filter-actions">
        <!-- Refresh -->
        <button class="icon-btn" (click)="onRefresh()" title="Refresh">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
        </button>
        
        <!-- Sorting (Mock) -->
        <button class="sort-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="9" y2="6"></line><line x1="21" y1="12" x2="9" y2="12"></line><line x1="21" y1="18" x2="9" y2="18"></line><polyline points="7 15 4 18 1 15"></polyline><polyline points="1 9 4 6 7 9"></polyline></svg>
          <span>Latest First</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .filter-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 1rem 1.25rem;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      margin-bottom: 1.5rem;
      gap: 1.5rem;
      position: sticky;
      top: 1rem;
      z-index: 20;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
    }
    .filter-main {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex: 1;
    }
    .search-box {
      position: relative;
      flex: 1;
      max-width: 400px;
    }
    .search-icon {
      position: absolute;
      left: 0.875rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    .search-input {
      width: 100%;
      padding: 0.625rem 1rem 0.625rem 2.5rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }
    .search-input:focus {
      outline: none;
      border-color: #7c3aed;
      background: white;
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    }

    .select-field {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }
    .select-field label {
      font-size: 0.6rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-left: 0.25rem;
    }
    select {
      padding: 0.5rem 2.25rem 0.5rem 0.75rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.625rem center;
      background-size: 1rem;
      transition: all 0.2s;
    }
    select:hover { border-color: #cbd5e1; background-color: #f1f5f9; }
    select:focus { border-color: #7c3aed; outline: none; }

    .filter-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .icon-btn {
      width: 36px;
      height: 36px;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
      background: white;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .icon-btn:hover { background: #f1f5f9; color: #1e293b; border-color: #cbd5e1; }

    .sort-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s;
    }
    .sort-btn:hover { background: #e2e8f0; color: #0f172a; }

    @media (max-width: 1024px) {
      .filter-container { flex-direction: column; align-items: stretch; gap: 1rem; }
      .filter-main { flex-wrap: wrap; }
      .search-box { min-width: 200px; flex: 1 1 100%; max-width: none; }
      .select-field { flex: 1; }
      .filter-actions { justify-content: flex-end; }
    }

    @media (max-width: 480px) {
      .filter-main { flex-direction: column; align-items: stretch; }
      .select-field { width: 100%; }
      select { width: 100%; }
    }
  `]
})
export class NotificationFilterBarComponent {
  private fb = inject(FormBuilder);

  @Output() filterChange = new EventEmitter<any>();
  @Output() refresh = new EventEmitter<void>();

  filterForm = this.fb.group({
    keyword: [''],
    channel: [''],
    status: ['']
  });

  constructor() {
    this.filterForm.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntilDestroyed()
    ).subscribe(value => {
      this.filterChange.emit(value);
    });
  }

  onRefresh() {
    this.refresh.emit();
  }
}
