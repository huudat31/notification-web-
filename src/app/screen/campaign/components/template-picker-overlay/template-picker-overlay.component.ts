import { Component, OnInit, OnDestroy, Output, EventEmitter, ElementRef, ViewChild, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Observable, combineLatest, map, startWith, catchError, of, finalize } from 'rxjs';
import { CampaignService } from '@core/campaign/campaign.service';
import { CampaignTemplate } from '@data/models/campaign.model';

@Component({
  selector: 'app-template-picker-overlay',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './template-picker-overlay.component.html',
  styleUrls: ['./template-picker-overlay.component.css']
})
export class TemplatePickerOverlayComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @Output() selectTemplate = new EventEmitter<CampaignTemplate>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private readonly campaignService = inject(CampaignService);

  searchControl = new FormControl('');

  templates$!: Observable<CampaignTemplate[]>;
  filteredTemplates$!: Observable<CampaignTemplate[]>;

  isLoading = true;
  hasError = false;

  skeletonItems = Array(4).fill(0);

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
    this.loadTemplates();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    }, 50);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onClose();
  }

  private loadTemplates(): void {
    this.isLoading = true;
    this.hasError = false;

    this.templates$ = this.campaignService.getAllTemplates().pipe(
      catchError(() => {
        this.hasError = true;
        return of([]);
      }),
      finalize(() => this.isLoading = false)
    );

    const searchTerm$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(term => (term || '').toLowerCase().trim())
    );

    this.filteredTemplates$ = combineLatest([this.templates$, searchTerm$]).pipe(
      map(([templates, term]) => {
        if (!term) return templates;
        return templates.filter(t =>
          t.templateName.toLowerCase().includes(term) ||
          t.subject.toLowerCase().includes(term)
        );
      })
    );
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('picker-backdrop')) {
      this.onClose();
    }
  }

  onSelect(template: CampaignTemplate): void {
    this.selectTemplate.emit(template);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.searchInput?.nativeElement?.focus();
  }
}
