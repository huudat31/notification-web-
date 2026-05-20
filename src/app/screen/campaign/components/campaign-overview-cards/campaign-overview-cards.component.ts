import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignNotificationRepository } from '@data/repository/campaign-notification.repository';

@Component({
  selector: 'app-campaign-overview-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (repo.overviewVM(); as vm) {
      <!-- ===== COMPACT HORIZONTAL HEALTH BANNER ===== -->
      <div class="health-banner"
           [class.health-banner--healthy]="vm.health.level === 'healthy' && !vm.isEmpty"
           [class.health-banner--warning]="vm.health.level === 'warning'"
           [class.health-banner--critical]="vm.health.level === 'critical'"
           [class.health-banner--empty]="vm.isEmpty">

        <!-- Decorative glow accent -->
        <div class="banner__glow" aria-hidden="true"></div>

        <!-- ── SEGMENT 1: Status badge ── -->
        <div class="banner__segment banner__segment--status">
          <div class="status-badge">
            <span class="status-badge__dot"></span>
            <span class="status-badge__label">
              {{ vm.isEmpty ? 'NO DATA' : vm.health.message | uppercase }}
            </span>
          </div>
        </div>

        <!-- ── DIVIDER ── -->
        <div class="banner__divider" aria-hidden="true"></div>

        <!-- ── SEGMENT 2: Percentage + Progress ── -->
        <div class="banner__segment banner__segment--progress">
          <div class="metric-row">
            <span class="metric-number">{{ vm.isEmpty ? 0 : vm.successRate }}<span class="metric-unit">%</span></span>
            <span class="metric-label">Delivery Success</span>
          </div>
          <div class="progress-track" role="progressbar"
               [attr.aria-valuenow]="vm.isEmpty ? 0 : vm.successRate"
               aria-valuemin="0" aria-valuemax="100">
            <div class="progress-track__fill progress-track__fill--success"
                 [style.width.%]="vm.isEmpty ? 0 : vm.successRate"></div>
            <div class="progress-track__fill progress-track__fill--pending"
                 [style.left.%]="vm.isEmpty ? 0 : vm.successRate"
                 [style.width.%]="vm.isEmpty ? 0 : (vm.total > 0 ? (vm.pending / vm.total * 100) : 0)"></div>
          </div>
        </div>

        <!-- ── DIVIDER ── -->
        <div class="banner__divider" aria-hidden="true"></div>

        <!-- ── SEGMENT 3: Inline stat pills ── -->
        <div class="banner__segment banner__segment--stats">
          <!-- Sent pill -->
          <div class="stat-pill stat-pill--sent">
            <svg class="stat-pill__icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span class="stat-pill__value">{{ vm.sent | number }}</span>
            <span class="stat-pill__label">sent</span>
          </div>
          <!-- Pending pill -->
          <div class="stat-pill stat-pill--pending">
            <svg class="stat-pill__icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span class="stat-pill__value">{{ vm.pending | number }}</span>
            <span class="stat-pill__label">pending</span>
          </div>
          <!-- Failed pill -->
          <div class="stat-pill" [class.stat-pill--failed]="vm.failed > 0" [class.stat-pill--failed-zero]="vm.failed === 0">
            <svg class="stat-pill__icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span class="stat-pill__value">{{ vm.failed | number }}</span>
            <span class="stat-pill__label">failed</span>
          </div>
        </div>

        <!-- ── DIVIDER ── -->
        <div class="banner__divider" aria-hidden="true"></div>

        <!-- ── SEGMENT 4: Operational message ── -->
        <div class="banner__segment banner__segment--message">
          <p class="op-message">{{ vm.health.description }}</p>
        </div>

      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    /* =========================================================
       HEALTH BANNER — compact horizontal layout
       ========================================================= */
    .health-banner {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.875rem;
      padding: 0.875rem 1.25rem;
      margin-bottom: 1.25rem;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.03);
      transition: border-color 0.25s ease, box-shadow 0.25s ease;
    }

    /* Decorative radial glow in top-right corner */
    .banner__glow {
      position: absolute;
      top: -40px;
      right: -40px;
      width: 130px;
      height: 130px;
      border-radius: 50%;
      filter: blur(48px);
      opacity: 0.12;
      pointer-events: none;
      transition: background 0.3s ease;
    }

    /* ── Segments ── */
    .banner__segment {
      display: flex;
      flex-direction: column;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }

    .banner__segment--status {
      min-width: 180px;
    }

    .banner__segment--progress {
      flex: 1;
      min-width: 0;
      padding: 0 1.5rem;
    }

    .banner__segment--stats {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
      padding: 0 1.5rem;
      flex-shrink: 0;
    }

    .banner__segment--message {
      flex: 1;
      min-width: 0;
      padding-left: 1.5rem;
    }

    /* ── Dividers ── */
    .banner__divider {
      width: 1px;
      height: 2.5rem;
      background: #e2e8f0;
      flex-shrink: 0;
      border-radius: 1px;
    }

    /* =========================================================
       SEGMENT 1 — Status Badge
       ========================================================= */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.3125rem 0.75rem;
      border-radius: 2rem;
      font-size: 0.6875rem;
      font-weight: 800;
      letter-spacing: 0.055em;
      white-space: nowrap;
    }

    .status-badge__dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
      position: relative;
    }
    .status-badge__dot::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      animation: badge-pulse 2s ease-in-out infinite;
    }
    @keyframes badge-pulse {
      0%   { transform: scale(1); opacity: 1; }
      100% { transform: scale(3); opacity: 0; }
    }

    /* =========================================================
       SEGMENT 2 — Percentage + Progress
       ========================================================= */
    .metric-row {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      margin-bottom: 0.4375rem;
    }

    .metric-number {
      font-size: 1.625rem;
      font-weight: 900;
      color: #0f172a;
      line-height: 1;
      letter-spacing: -0.035em;
    }
    .metric-unit {
      font-size: 1rem;
      font-weight: 700;
    }
    .metric-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      white-space: nowrap;
    }

    .progress-track {
      position: relative;
      height: 6px;
      background: #f1f5f9;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-track__fill {
      position: absolute;
      top: 0;
      bottom: 0;
      height: 100%;
      border-radius: 3px;
      transition: width 0.7s cubic-bezier(0.4, 0, 0.2, 1),
                  left  0.7s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .progress-track__fill--success {
      left: 0;
      z-index: 2;
    }
    .progress-track__fill--pending {
      z-index: 1;
      opacity: 0.55;
      background-image: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.2) 25%, transparent 25%,
        transparent 50%, rgba(255, 255, 255, 0.2) 50%,
        rgba(255, 255, 255, 0.2) 75%, transparent 75%, transparent
      );
      background-size: 0.75rem 0.75rem;
      animation: stripe-move 1s linear infinite;
    }
    @keyframes stripe-move {
      from { background-position: 0.75rem 0; }
      to   { background-position: 0 0; }
    }

    /* =========================================================
       SEGMENT 3 — Stat Pills
       ========================================================= */
    .stat-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.3125rem;
      padding: 0.3125rem 0.625rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      white-space: nowrap;
      border: 1px solid transparent;
    }

    .stat-pill__icon { flex-shrink: 0; }
    .stat-pill__value { font-weight: 800; }
    .stat-pill__label {
      font-size: 0.6875rem;
      font-weight: 600;
      opacity: 0.8;
    }

    .stat-pill--sent {
      background: #f0fdf4;
      color: #15803d;
      border-color: #dcfce7;
    }
    .stat-pill--pending {
      background: #fffbeb;
      color: #b45309;
      border-color: #fef9c3;
    }
    .stat-pill--failed {
      background: #fef2f2;
      color: #dc2626;
      border-color: #fee2e2;
    }
    .stat-pill--failed-zero {
      background: #f8fafc;
      color: #94a3b8;
      border-color: #f1f5f9;
    }

    /* =========================================================
       SEGMENT 4 — Operational Message
       ========================================================= */
    .op-message {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #475569;
      margin: 0;
      line-height: 1.45;
    }

    /* =========================================================
       SEMANTIC THEME VARIANTS
       ========================================================= */

    /* HEALTHY */
    .health-banner--healthy {
      border-color: rgba(16, 185, 129, 0.2);
      background: linear-gradient(90deg, #ffffff 0%, rgba(240, 253, 250, 0.35) 100%);
    }
    .health-banner--healthy .banner__glow   { background: #10b981; }
    .health-banner--healthy .status-badge   { background: #ecfdf5; color: #047857; }
    .health-banner--healthy .status-badge__dot,
    .health-banner--healthy .status-badge__dot::after { background: #10b981; }
    .health-banner--healthy .progress-track__fill--success {
      background: linear-gradient(90deg, #34d399 0%, #10b981 100%);
      box-shadow: 0 1px 4px rgba(16, 185, 129, 0.3);
    }
    .health-banner--healthy .progress-track__fill--pending { background-color: #fbbf24; }

    /* WARNING */
    .health-banner--warning {
      border-color: rgba(245, 158, 11, 0.25);
      background: linear-gradient(90deg, #ffffff 0%, rgba(254, 243, 199, 0.2) 100%);
    }
    .health-banner--warning .banner__glow   { background: #f59e0b; }
    .health-banner--warning .status-badge   { background: #fffbeb; color: #b45309; }
    .health-banner--warning .status-badge__dot,
    .health-banner--warning .status-badge__dot::after { background: #f59e0b; }
    .health-banner--warning .progress-track__fill--success {
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
    }
    .health-banner--warning .progress-track__fill--pending { background-color: #d97706; }
    .health-banner--warning .op-message { color: #78350f; }

    /* CRITICAL */
    .health-banner--critical {
      border-color: rgba(239, 68, 68, 0.25);
      background: linear-gradient(90deg, #ffffff 0%, rgba(254, 242, 242, 0.35) 100%);
    }
    .health-banner--critical .banner__glow   { background: #ef4444; opacity: 0.18; }
    .health-banner--critical .status-badge   {
      background: #fef2f2;
      color: #b91c1c;
      animation: shake 0.7s cubic-bezier(.36,.07,.19,.97) both;
    }
    .health-banner--critical .status-badge__dot,
    .health-banner--critical .status-badge__dot::after { background: #ef4444; }
    .health-banner--critical .progress-track__fill--success {
      background: linear-gradient(90deg, #34d399 0%, #10b981 100%);
    }
    .health-banner--critical .progress-track__fill--pending { background-color: #fbbf24; }
    .health-banner--critical .op-message { color: #991b1b; font-weight: 700; }
    @keyframes shake {
      10%, 90%  { transform: translate3d(-1px, 0, 0); }
      20%, 80%  { transform: translate3d( 2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
      40%, 60%  { transform: translate3d( 3px, 0, 0); }
    }

    /* EMPTY */
    .health-banner--empty {
      border-color: #e2e8f0;
      background: #f8fafc;
    }
    .health-banner--empty .banner__glow   { background: #94a3b8; opacity: 0.08; }
    .health-banner--empty .status-badge   { background: #f1f5f9; color: #475569; }
    .health-banner--empty .status-badge__dot,
    .health-banner--empty .status-badge__dot::after { background: #94a3b8; }
    .health-banner--empty .progress-track__fill { background: #cbd5e1; }
    .health-banner--empty .op-message { color: #64748b; font-weight: 500; }

    /* =========================================================
       RESPONSIVE
       ========================================================= */

    /* Tablet — collapse two right segments, keep badge+progress+stats */
    @media (max-width: 1024px) {
      .health-banner {
        flex-wrap: wrap;
        row-gap: 0.75rem;
      }
      .banner__segment--message {
        display: none; /* hide verbose message on tablet to save space */
      }
      .banner__divider:last-of-type { display: none; }
    }

    /* Mobile — stack everything vertically */
    @media (max-width: 640px) {
      .health-banner {
        flex-direction: column;
        align-items: flex-start;
        padding: 1rem;
        gap: 0.75rem;
      }
      .banner__divider { display: none; }
      .banner__segment--status,
      .banner__segment--progress,
      .banner__segment--stats,
      .banner__segment--message {
        padding: 0;
        width: 100%;
      }
      .banner__segment--message { display: flex; }
      .banner__segment--stats { flex-wrap: wrap; }
      .metric-number { font-size: 1.375rem; }
    }
  `]
})
export class CampaignOverviewCardsComponent {
  readonly repo = inject(CampaignNotificationRepository);
}
