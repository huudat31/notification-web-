import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-campaign-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-card" *ngFor="let i of [1, 2, 3, 4]">
      <div class="skeleton-left">
        <div class="skeleton-line title"></div>
        <div class="skeleton-line meta"></div>
      </div>
      <div class="skeleton-right">
        <div class="skeleton-stat"></div>
        <div class="skeleton-stat"></div>
        <div class="skeleton-stat"></div>
      </div>
    </div>
  `
})
export class CampaignSkeletonComponent { }
