import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, filter, switchMap, takeUntil, tap, of, catchError } from 'rxjs';
import { CampaignApiService } from '../infrastructure/api/campaign-api.service';
import { CreateCampaignRequest, TemplatePreviewResponse } from '../domain/models/campaign.model';

// Custom Validator for scheduledTime > currentTime
export function futureDateTimeValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const startDate = group.get('startDate')?.value;
    const startClock = group.get('startClock')?.value;

    if (startDate && startClock) {
      const selectedDate = new Date(`${startDate}T${startClock}`);
      const now = new Date();
      if (selectedDate <= now) {
        return { futureDate: true };
      }
    }
    return null;
  };
}

@Component({
  selector: 'app-create-campaign',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-campaign.component.html',
  styleUrls: ['./create_campaign.component.css'],
})
export class CreateCampaignComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly campaignApi = inject(CampaignApiService);

  previewTab: 'push' | 'email' = 'push';
  isSubmitting = false;
  campaignForm: FormGroup;

  templatePreview: TemplatePreviewResponse | null = null;
  isLoadingPreview = false;
  minTime: string | null = null;

  private readonly destroy$ = new Subject<void>();

  // Mock data for placeholders
  private readonly mockData: Record<string, string> = {
    name: 'Nguyễn Văn A'
  };

  constructor() {
    this.campaignForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      startDate: ['', [Validators.required]],
      startClock: ['', [Validators.required]],
      audience: ['Chỉ User Active'],
      channel: ['Gửi cả Email & Push'],
      speed: [1000000, [Validators.required, Validators.min(1), Validators.max(1000000)]],
      template: [''],
      notifTitle: ['', [Validators.required]],
      body: ['', [Validators.required]],
      actionUrl: ['', [this.urlValidator]]
    }, { validators: futureDateTimeValidator() });
  }

  ngOnInit(): void {
    this.setupTemplateLogic();
    this.setupDateLogic();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDateLogic(): void {
    this.campaignForm.get('startDate')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(date => {
      if (!date) return;
      const today = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

      if (date === todayStr) {
        this.minTime = `${pad(today.getHours())}:${pad(today.getMinutes())}`;
      } else {
        this.minTime = null;
      }
    });
  }

  private urlValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    try {
      new URL(control.value);
      return null;
    } catch {
      return { invalidUrl: true };
    }
  }

  private setupTemplateLogic(): void {
    const templateControl = this.campaignForm.get('template');
    const notifTitleControl = this.campaignForm.get('notifTitle');
    const bodyControl = this.campaignForm.get('body');

    templateControl?.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(500),
      distinctUntilChanged(),
      tap(templateName => {
        if (templateName) {
          notifTitleControl?.disable();
          bodyControl?.disable();
          this.isLoadingPreview = true;
        } else {
          notifTitleControl?.enable();
          bodyControl?.enable();
          this.templatePreview = null;
          this.isLoadingPreview = false;
        }
      }),
      filter(templateName => !!templateName),
      switchMap(templateName => {
        return this.campaignApi.previewTemplate(templateName).pipe(
          catchError(() => {
            // Handle error, maybe show toast
            return of(null);
          })
        );
      }),
      tap(previewResponse => {
        this.isLoadingPreview = false;
        if (previewResponse) {
          this.templatePreview = previewResponse;
        }
      })
    ).subscribe();
  }

  isInvalid(f: string): boolean {
    const c = this.campaignForm.get(f);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  get previewTitle(): string {
    const rawText = this.templatePreview ? this.templatePreview.subject : this.campaignForm.get('notifTitle')?.value || '';
    return this.replacePlaceholders(rawText);
  }

  get previewBody(): string {
    const rawText = this.templatePreview ? this.templatePreview.content : this.campaignForm.get('body')?.value || '';
    return this.replacePlaceholders(rawText);
  }

  private replacePlaceholders(text: string): string {
    if (!text) return '';
    return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
      return this.mockData[key] || match;
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  onSubmit(): void {
    if (this.campaignForm.invalid) {
      this.campaignForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const formValues = this.campaignForm.getRawValue();
    const payload = this.mapToPayload(formValues);

    this.campaignApi.createCampaign(payload).pipe(
      takeUntil(this.destroy$),
      tap(() => {
        this.isSubmitting = false;
        // In real app, trigger toast success here
        console.log('Campaign created successfully');
        this.router.navigate(['/notifications']);
      }),
      catchError(error => {
        this.isSubmitting = false;
        // In real app, trigger toast error here
        console.error('Failed to create campaign', error);
        return of(null);
      })
    ).subscribe();
  }

  private mapToPayload(formValues: any): CreateCampaignRequest {
    return {
      name: formValues.name,
      targetType: this.mapAudience(formValues.audience),
      channel: this.mapChannel(formValues.channel),
      ratePerHour: Number(formValues.speed),
      templateName: formValues.template || '',
      pushTitle: formValues.notifTitle || '',
      pushBody: formValues.body || '',
      pushActionUrl: formValues.actionUrl || null,
      scheduledTime: this.createIsoDateTime(formValues.startDate, formValues.startClock),
      endTime: null
    };
  }

  private mapAudience(audienceLabel: string): 'ACTIVE' | 'ALL' | 'INACTIVE' {
    switch (audienceLabel) {
      case 'Tất cả User': return 'ALL';
      case 'Nhóm cụ thể': return 'INACTIVE';
      case 'Chỉ User Active':
      default: return 'ACTIVE';
    }
  }

  private mapChannel(channelLabel: string): Array<'EMAIL' | 'PUSH'> {
    switch (channelLabel) {
      case 'Gửi cả Email & Push': return ['EMAIL', 'PUSH'];
      case 'Chỉ Email': return ['EMAIL'];
      case 'Chỉ Push': return ['PUSH'];
      default: return ['PUSH']; // Safe default
    }
  }

  createIsoDateTime(date: string, time: string): string {
    if (!date || !time) return '';
    return `${date}T${time}:00`;
  }
}
