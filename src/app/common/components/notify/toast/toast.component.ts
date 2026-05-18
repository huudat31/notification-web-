import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toastService.toasts | async" 
           class="toast-item" 
           [class]="toast.type">
        <div class="toast-icon">
          <!-- Success Icon -->
          <svg *ngIf="toast.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          
          <!-- Error Icon -->
          <svg *ngIf="toast.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          
          <!-- Info Icon -->
          <svg *ngIf="toast.type === 'info'" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>

          <!-- Warning Icon -->
          <svg *ngIf="toast.type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        
        <div class="toast-content">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-message" *ngIf="toast.message">{{ toast.message }}</div>
        </div>

        <button class="toast-close" (click)="toastService.remove(toast.id)">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 32px;
      right: 32px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 16px;
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      min-width: 320px;
      max-width: 420px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      animation: slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
    }

    .toast-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 6px;
      transition: background 0.3s ease;
    }

    @keyframes slide-in {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .toast-item.success { border-color: #dcfce7; }
    .toast-item.success .toast-icon { color: #22c55e; }
    .toast-item.success::before { background: #22c55e; }

    .toast-item.error { border-color: #fee2e2; }
    .toast-item.error .toast-icon { color: #ef4444; }
    .toast-item.error::before { background: #ef4444; }

    .toast-item.info { border-color: #dbeafe; }
    .toast-item.info .toast-icon { color: #3b82f6; }
    .toast-item.info::before { background: #3b82f6; }

    .toast-item.warning { border-color: #fef9c3; }
    .toast-item.warning .toast-icon { color: #eab308; }
    .toast-item.warning::before { background: #eab308; }

    .toast-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-content {
      flex: 1;
      padding-right: 8px;
    }

    .toast-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #0f172a;
      line-height: 1.4;
    }

    .toast-message {
      font-size: 0.8125rem;
      color: #64748b;
      margin-top: 2px;
      line-height: 1.4;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      padding: 4px;
      cursor: pointer;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
      align-self: flex-start;
      margin-top: -4px;
      margin-right: -8px;
    }

    .toast-close:hover {
      background: #f1f5f9;
      color: #475569;
    }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
