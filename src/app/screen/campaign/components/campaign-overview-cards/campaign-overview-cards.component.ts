import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignStats } from '@data/models/campaign.model';

@Component({
  selector: 'app-campaign-overview-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-grid">
      <div class="stat-card" *ngFor="let card of cards">
        <div class="stat-card__icon" [ngClass]="card.class">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" 
               stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path [attr.d]="card.path" *ngIf="card.path"></path>
            <path *ngFor="let p of card.paths" [attr.d]="p"></path>
            <circle [attr.cx]="card.circle?.cx" [attr.cy]="card.circle?.cy" [attr.r]="card.circle?.r" *ngIf="card.circle"></circle>
            <line *ngFor="let l of card.lines" [attr.x1]="l.x1" [attr.y1]="l.y1" [attr.x2]="l.x2" [attr.y2]="l.y2"></line>
            <polyline *ngFor="let p of card.polylines" [attr.points]="p"></polyline>
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
      display: flex;
      flex-direction: row;
      gap: 0.75rem;
      margin-bottom: 2rem;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 0.5rem;
      width: 100%;
    }
    .stats-grid::-webkit-scrollbar {
      height: 4px;
    }
    .stats-grid::-webkit-scrollbar-track {
      background: transparent;
    }
    .stats-grid::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 2px;
    }
    .stat-card {
      background: white;
      padding: 0.875rem 1.125rem;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      flex: 1 0 auto;
      min-width: 140px;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      border-color: #cbd5e1;
    }
    .stat-card__icon {
      width: 40px;
      height: 40px;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .stat-card__label {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 0.125rem;
    }
    .stat-card__value {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.025em;
    }
    
    /* Variants */
    .bg-indigo { background: #f5f3ff; color: #7c3aed; }
    .bg-green { background: #ecfdf5; color: #059669; }
    .bg-amber { background: #fffbeb; color: #d97706; }
    .bg-rose { background: #fff1f2; color: #e11d48; }
    .bg-blue { background: #eff6ff; color: #2563eb; }
    .bg-sky { background: #f0f9ff; color: #0369a1; }
    .bg-slate { background: #f8fafc; color: #475569; }
  `]
})
export class CampaignOverviewCardsComponent {
  @Input() stats: CampaignStats = { sent: 0, failed: 0, pending: 0, total: 0 };

  get pushValue(): number {
    const ch = this.stats.channel;
    if (!ch) return Math.floor(this.stats.total * 0.6);
    if (ch === 'PUSH') return this.stats.total;
    if (ch === 'MULTI') return this.stats.total;
    return 0;
  }

  get emailValue(): number {
    const ch = this.stats.channel;
    if (!ch) return Math.floor(this.stats.total * 0.3);
    if (ch === 'EMAIL') return this.stats.total;
    if (ch === 'MULTI') return this.stats.total;
    return 0;
  }

  get smsValue(): number {
    const ch = this.stats.channel;
    if (!ch) return Math.floor(this.stats.total * 0.1);
    if (ch === 'SMS') return this.stats.total;
    return 0;
  }

  get cards(): any[] {
    return [
      { 
        label: 'Total', 
        value: this.stats.total, 
        class: 'bg-indigo', 
        path: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z',
        polylines: ['22,6 12,13 2,6']
      },
      { 
        label: 'Sent', 
        value: this.stats.sent, 
        class: 'bg-green', 
        path: 'M20 6L9 17l-5-5',
        polylines: []
      },
      { 
        label: 'Pending', 
        value: this.stats.pending, 
        class: 'bg-amber', 
        circle: { cx: 12, cy: 12, r: 10 },
        lines: [{ x1: 12, y1: 6, x2: 12, y2: 12 }, { x1: 12, y1: 12, x2: 16, y2: 14 }]
      },
      { 
        label: 'Failed', 
        value: this.stats.failed, 
        class: 'bg-rose', 
        circle: { cx: 12, cy: 12, r: 10 },
        lines: [{ x1: 12, y1: 8, x2: 12, y2: 12 }, { x1: 12, y1: 16, x2: 12.01, y2: 16 }]
      },
      { 
        label: 'Push', 
        value: this.pushValue, 
        class: 'bg-blue', 
        paths: [
          'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9',
          'M13.73 21a2 2 0 0 1-3.46 0'
        ]
      },
      { 
        label: 'Email', 
        value: this.emailValue, 
        class: 'bg-sky', 
        path: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z',
        polylines: ['22,6 12,13 2,6']
      },
      { 
        label: 'SMS', 
        value: this.smsValue, 
        class: 'bg-slate', 
        path: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'
      }
    ];
  }
}
