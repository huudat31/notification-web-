import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthFacade } from './features/auth/application/facade/auth.facade';
import { BroadcastService } from './core/services/broadcast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: [`:host { display: block; height: 100vh; }`],
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly authFacade = inject(AuthFacade);
  private readonly broadcast = inject(BroadcastService);
  private logoutSub?: Subscription;

  ngOnInit(): void {
    this.logoutSub = this.broadcast.listenForLogout().subscribe(() => {
      this.authFacade.forceLogout();
    });
  }

  ngOnDestroy(): void {
    this.logoutSub?.unsubscribe();
  }
}
