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
    <div class="filter-bar">
      <div class="search-input-wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" 
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input [formControl]="filterForm.controls.keyword" type="text" placeholder="Tìm theo user name..." class="search-input">
      </div>

      <div class="select-group">
        <div class="select-wrap">
          <label>Channel</label>
          <select [formControl]="filterForm.controls.channel">
            <option value="">All</option>
            <option value="PUSH">PUSH</option>
            <option value="EMAIL">EMAIL</option>
            <option value="SMS">SMS</option>
          </select>
        </div>

        <div class="select-wrap">
          <label>Status</label>
          <select [formControl]="filterForm.controls.status">
            <option value="">All</option>
            <option value="SENT">SENT</option>
            <option value="FAILED">FAILED</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      background: white;
      padding: 1.25rem;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      margin-bottom: 2rem;
      align-items: center;
    }
    .search-input-wrap {
      position: relative;
      flex: 1;
      min-width: 280px;
    }
    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: all 0.2s;
    }
    .search-input:focus {
      outline: none;
      border-color: #7c3aed;
      background: white;
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    }
    .select-group {
      display: flex;
      gap: 1rem;
    }
    .select-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .select-wrap label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    select {
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      outline: none;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.5rem center;
      background-size: 1rem;
    }
    select:focus {
      border-color: #7c3aed;
    }
  `]
})
export class NotificationFilterBarComponent {
  private fb = inject(FormBuilder);

  @Output() filterChange = new EventEmitter<any>();

  filterForm = this.fb.group({
    keyword: [''],
    channel: [''],
    status: ['']
  });

  constructor() {
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntilDestroyed()
    ).subscribe(value => {
      this.filterChange.emit(value);
    });
  }
}
