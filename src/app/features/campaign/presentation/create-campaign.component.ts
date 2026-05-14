import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-campaign',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-campaign.component.html',
  styleUrls: ['./create_campaign.component.css'],

})
export class CreateCampaignComponent {
  previewTab: 'push' | 'email' = 'push';
  isSubmitting = false;
  campaignForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.campaignForm = this.fb.group({
      name: ['', Validators.required],
      startTime: [''],
      endTime: [''],
      audience: ['Chỉ User Active'],
      channel: ['Gửi cả Email & Push'],
      speed: [1000],
      template: [''],
      notifTitle: [''],
      body: [''],
      actionUrl: ['']
    });
  }

  isInvalid(f: string): boolean {
    const c = this.campaignForm.get(f);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  goBack(): void { this.router.navigate(['/dashboard']); }

  onSubmit(): void {
    if (this.campaignForm.invalid) { this.campaignForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    setTimeout(() => {
      this.isSubmitting = false;
      this.router.navigate(['/notifications']);
    }, 1500);
  }
}
