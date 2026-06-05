import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Campaign } from '@data/models/campaign.model';

@Component({
  selector: 'app-campaign-card',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './campaign-card.component.html',
  styleUrls: ['./campaign-card.component.css']
})
export class CampaignCardComponent {
  @Input({ required: true }) campaign!: Campaign;

  get statusClass(): string {
    switch (this.campaign.status) {
      case 'ACTIVE': return 'status-processing';
      case 'COMPLETED': return 'status-completed';
      case 'EXPIRED': return 'status-failed';
      default: return '';
    }
  }

  get channelLabel(): string {
    if (this.campaign.channel === 'MULTI') return 'MULTI-CHANNEL';
    return `${this.campaign.channel} ONLY`;
  }

  get dateLabel(): string {
    return this.campaign.status === 'ACTIVE' ? 'Scheduled' : 'Created';
  }

  get dateValue(): string {
    return this.campaign.status === 'ACTIVE'
      ? (this.campaign.scheduledTime ?? this.campaign.createdAt)
      : this.campaign.createdAt;
  }

  formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    return n.toString();
  }
}
