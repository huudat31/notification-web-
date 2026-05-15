import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignStats } from '../../../../domain/models/campaign-notification.model';

@Component({
  selector: 'app-campaign-overview-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-grid">
      <div class="stat-card" *ngFor="let card of cards">
        <div class="stat-card__icon" [ngClass]="card.class">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path [attr.d]="card.icon"></path>
          </svg>
        </div>
        <div class="stat-card__content">
          <span class="stat-card__label">{{ card.label }}</span>
          <h3 class="stat-card__value">{{ card.value | number }}</h3>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      display: flex;
      align-items: center;
      gap: 1.25rem;
      transition: transform 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
    }
    .stat-card__icon {
      width: 48px;
      height: 48px;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-card__label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    .stat-card__value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
    }
    /* Variants */
    .bg-green { background: #ecfdf5; color: #059669; }
    .bg-red { background: #fef2f2; color: #dc2626; }
    .bg-orange { background: #fff7ed; color: #ea580c; }
    .bg-purple { background: #f5f3ff; color: #7c3aed; }
  `]
})
export class CampaignOverviewCardsComponent {
  @Input() stats: CampaignStats = { sent: 0, failed: 0, pending: 0, total: 0 };

  get cards() {
    return [
      { label: 'Sent', value: this.stats.sent, class: 'bg-green', icon: 'M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2' },
      { label: 'Failed', value: this.stats.failed, class: 'bg-red', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { label: 'Pending', value: this.stats.pending, class: 'bg-orange', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
      { label: 'Total', value: this.stats.total, class: 'bg-purple', icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' }
    ];
  }
}
