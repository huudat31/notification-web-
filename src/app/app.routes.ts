import { Routes } from '@angular/router';
import { authGuard } from './core/auth/presentation/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginsComponent } from './features/logins/logins.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { CreateCampaignComponent } from './features/create_campaign/create-campaign.component';
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
      { path: 'campaigns', component: CreateCampaignComponent },
      { path: 'settings', component: SettingsComponent },
    ],
  },

  { path: '**', redirectTo: '' },
];
