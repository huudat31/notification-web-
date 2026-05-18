import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { BaseLayoutComponent } from '@common/components/layout/base-layout/base-layout.component';
import { LoginComponent } from '@screen/auth/login/login.component';
import { DashboardComponent } from '@screen/dashboard/dashboard.component';
import { CampaignListComponent } from '@screen/campaign/list/campaign-list.component';
import { CreateCampaignComponent } from '@screen/campaign/create/create-campaign.component';
import { SettingsComponent } from '@screen/settings/settings.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },

  {
    path: '',
    component: BaseLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'campaigns', component: CampaignListComponent },
      { path: 'campaigns/create', component: CreateCampaignComponent },
      { path: 'settings', component: SettingsComponent },
      { 
        path: 'campaigns/:campaignId/notifications', 
        loadComponent: () => import('@screen/campaign/notifications/campaign-notifications.component').then(m => m.CampaignNotificationsComponent)
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
