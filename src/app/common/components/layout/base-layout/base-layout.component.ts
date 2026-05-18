import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '@common/components/layout/sidebar/sidebar.component';
import { HeaderComponent } from '@common/components/layout/header/header.component';
import { ToastComponent } from '@common/components/notify/toast/toast.component';

@Component({
  selector: 'app-base-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, ToastComponent],
  templateUrl: './base-layout.component.html',
  styleUrls: ['./base-layout.component.css']
})
export class BaseLayoutComponent { }
