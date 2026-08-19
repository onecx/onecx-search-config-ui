import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { importProvidersFrom, inject, provideAppInitializer } from '@angular/core';
import { AngularAuthModule } from '@onecx/angular-auth';
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents';
import { environment } from 'src/environments/environment';
import { OneCXColumnGroupSelectionComponent } from './column-group-selection.component';
import { UserService } from '@onecx/angular-integration-interface';
import { provideThemeConfig, provideTranslationPathFromMeta } from '@onecx/angular-utils';

function userProfileInitializer(userService: UserService) {
  return async () => {
    await userService.isInitialized;
  };
}

bootstrapRemoteComponent(
  OneCXColumnGroupSelectionComponent,
  'ocx-column-group-selection-component',
  environment.production,
  [
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(AngularAuthModule),
    importProvidersFrom(BrowserModule),
    importProvidersFrom(BrowserAnimationsModule),
    provideAppInitializer(() => {
      const initializerFn = userProfileInitializer(inject(UserService))
      return initializerFn()
    }),
    provideTranslationPathFromMeta(import.meta.url, 'assets/i18n/'),
    provideThemeConfig()
  ],
);
