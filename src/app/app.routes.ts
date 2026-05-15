import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { LoginsComponent } from './features/auth/presentation/logins.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { CampaignListComponent } from './features/campaign/presentation/campaign-list.component';
import { CreateCampaignComponent } from './features/campaign/presentation/create-campaign.component';
import { SettingsComponent } from './features/settings/settings.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginsComponent,
  },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'campaigns', component: CampaignListComponent },
      { path: 'campaigns/create', component: CreateCampaignComponent },
      { path: 'settings', component: SettingsComponent },
      { 
        path: 'campaigns/:campaignId/notifications', 
        loadComponent: () => import('./features/campaign/presentation/campaign-notifications/campaign-notifications.component').then(m => m.CampaignNotificationsComponent)
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
