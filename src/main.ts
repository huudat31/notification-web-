import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/application.config';
import { ApplicationComponent } from './app/application.component';

bootstrapApplication(ApplicationComponent, appConfig)
  .catch((err) => console.error(err));
