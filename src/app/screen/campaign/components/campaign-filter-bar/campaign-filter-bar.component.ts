import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type StatusFilter = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | '';
export type SortDirection = 'ASC' | 'DESC';

export interface FilterChangeEvent {
  campaignName?: string;
  status?: StatusFilter;
  sortDirection?: SortDirection;
}

interface StatusTab {
  label: string;
  value: StatusFilter;
}

@Component({
  selector: 'app-campaign-filter-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './campaign-filter-bar.component.html',
  styleUrl: './campaign-filter-bar.component.css'
})
export class CampaignFilterBarComponent {
  private readonly fb = inject(FormBuilder);

  @Output() filterChange = new EventEmitter<FilterChangeEvent>();

  readonly searchControl: FormControl<string> = this.fb.nonNullable.control('');
  readonly sortControl: FormControl<SortDirection> = this.fb.nonNullable.control('DESC');

  activeStatus: StatusFilter = '';

  readonly statusTabs: StatusTab[] = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Expired', value: 'EXPIRED' }
  ];

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(campaignName => {
      this.filterChange.emit({ campaignName });
    });

    this.sortControl.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(sortDirection => {
      this.filterChange.emit({ sortDirection });
    });
  }

  selectStatus(status: StatusFilter): void {
    this.activeStatus = status;
    this.filterChange.emit({ status });
  }
}
