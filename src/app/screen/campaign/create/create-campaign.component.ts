import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '@core/services/toast.service';
import { CampaignCommandFacade } from '@data/facade/campaign-command.facade';
import { CreateCampaignRequest, CampaignTemplate } from '@data/model/campaign.model';
import { TemplatePickerOverlayComponent } from '../components/template-picker-overlay/template-picker-overlay.component';
import { TargetUserOverlayComponent } from './components/target-user-overlay/target-user-overlay.component';
import { CampaignCreateFacade } from '@data/facade/campaign-create.facade';
import { CampaignTargetStore } from '@data/stores/campaign-target.store';

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
  imports: [CommonModule, ReactiveFormsModule, TemplatePickerOverlayComponent, TargetUserOverlayComponent],
  providers: [CampaignCreateFacade, CampaignTargetStore],
  templateUrl: './create-campaign.component.html',
  styleUrls: ['./create-campaign.component.css'],
})
export class CreateCampaignComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly commandFacade = inject(CampaignCommandFacade);
  private readonly toast = inject(ToastService);
  public readonly facade = inject(CampaignCreateFacade);

  previewTab: 'push' | 'email' = 'push';
  campaignForm: FormGroup;

  isTemplatePickerOpen = false;
  templatePreview: any = null;
  minTime: string | null = null;

  private readonly destroy$ = new Subject<void>();

  private readonly mockData: Record<string, string> = {
    name: 'Nguyễn Văn A'
  };

  constructor() {
    this.campaignForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      startDate: ['', [Validators.required]],
      startClock: ['', [Validators.required]],
      channel: ['Gửi cả Email & Push'],
      speed: [1000000, [Validators.required, Validators.min(1), Validators.max(1000000)]],
      template: [''],
      notifTitle: ['', [Validators.required, Validators.maxLength(255)]],
      body: ['', [Validators.required]],
      actionUrl: ['', [this.urlValidator]]
    }, { validators: futureDateTimeValidator() });
  }

  ngOnInit(): void {
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

  isInvalid(f: string): boolean {
    const c = this.campaignForm.get(f);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  openTemplatePicker(): void {
    this.isTemplatePickerOpen = true;
  }

  closeTemplatePicker(): void {
    this.isTemplatePickerOpen = false;
  }

  onTemplateSelected(template: CampaignTemplate): void {
    const notifTitleCtrl = this.campaignForm.get('notifTitle');
    const bodyCtrl = this.campaignForm.get('body');

    const hasManualContent = (notifTitleCtrl?.value && notifTitleCtrl?.enabled) ||
      (bodyCtrl?.value && bodyCtrl?.enabled);

    if (hasManualContent) {
      const confirm = window.confirm('Chọn template sẽ ghi đè nội dung bạn đang soạn. Bạn có chắc chắn muốn tiếp tục?');
      if (!confirm) return;
    }

    this.applyTemplate(template);
    this.closeTemplatePicker();
  }

  private applyTemplate(template: CampaignTemplate): void {
    const templateCtrl = this.campaignForm.get('template');
    const notifTitleCtrl = this.campaignForm.get('notifTitle');
    const bodyCtrl = this.campaignForm.get('body');

    templateCtrl?.setValue(template.templateName);

    notifTitleCtrl?.setValue(template.subject);
    notifTitleCtrl?.disable();

    bodyCtrl?.setValue(template.content);
    bodyCtrl?.disable();

    this.templatePreview = {
      templateName: template.templateName,
      subject: template.subject,
      content: template.content
    };
  }

  clearTemplateState(): void {
    const templateCtrl = this.campaignForm.get('template');
    const notifTitleCtrl = this.campaignForm.get('notifTitle');
    const bodyCtrl = this.campaignForm.get('body');

    templateCtrl?.setValue('');

    notifTitleCtrl?.setValue('');
    notifTitleCtrl?.enable();

    bodyCtrl?.setValue('');
    bodyCtrl?.enable();

    this.templatePreview = null;
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
    this.router.navigate(['/campaigns']);
  }

  get isSubmitting(): boolean {
    return this.commandFacade.createCampaignMutation.isPending();
  }

  async onSubmit(): Promise<void> {
    if (this.campaignForm.invalid) {
      this.campaignForm.markAllAsTouched();
      return;
    }

    if (this.facade.activeTargetType() === 'SPECIFIC' && this.facade.includedIds().size === 0) {
      this.toast.error('Lỗi Đối Tượng', 'Vui lòng chọn ít nhất 1 người dùng khi ở chế độ SPECIFIC.');
      this.facade.setOverlayOpen(true);
      return;
    }

    const formValues = this.campaignForm.getRawValue();

    const domainFormValue = {
      name: formValues.name,
      channel: this.mapChannel(formValues.channel),
      ratePerHour: Number(formValues.speed),
      templateName: formValues.template || null,
      pushTitle: formValues.notifTitle || '',
      pushBody: formValues.body || '',
      pushActionUrl: formValues.actionUrl || null,
      scheduledTime: this.createIsoDateTime(formValues.startDate, formValues.startClock),
      endTime: null
    };

    try {
      await this.facade.submitCampaign(domainFormValue);
      this.toast.success('Thành công', 'Chiến dịch đã được đưa vào hàng đợi!');
      this.router.navigate(['/campaigns']);
    } catch (err) {
      this.toast.error('Lỗi', 'Không thể tạo chiến dịch. Hãy thử lại.');
    }
  }

  private mapChannel(channelLabel: string): Array<'EMAIL' | 'PUSH'> {
    switch (channelLabel) {
      case 'Gửi cả Email & Push': return ['EMAIL', 'PUSH'];
      case 'Chỉ Email': return ['EMAIL'];
      case 'Chỉ Push': return ['PUSH'];
      default: return ['PUSH'];
    }
  }

  createIsoDateTime(date: string, time: string): string {
    if (!date || !time) return '';
    return `${date}T${time}:00`;
  }
}
