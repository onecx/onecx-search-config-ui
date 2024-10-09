import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { AngularAuthModule } from '@onecx/angular-auth';
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents';
import { environment } from 'src/environments/environment';
import { OneCXSearchConfigComponent } from './search-config.component';
import { UserService } from '@onecx/portal-integration-angular';

function userProfileInitializer(userService: UserService) {
  return async () => {
    await userService.isInitialized;
  };
}

bootstrapRemoteComponent(
  OneCXSearchConfigComponent,
  'ocx-search-config-component',
  environment.production,
  [
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(AngularAuthModule),
    importProvidersFrom(BrowserModule),
    importProvidersFrom(BrowserAnimationsModule),
    {
      provide: APP_INITIALIZER,
      useFactory: userProfileInitializer,
      deps: [UserService],
      multi: true,
    },
  ],
);
