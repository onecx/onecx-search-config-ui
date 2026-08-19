import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { importProvidersFrom, inject, provideAppInitializer } from '@angular/core';
import { AngularAuthModule } from '@onecx/angular-auth';
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents';
import { environment } from 'src/environments/environment';
import { OneCXSearchConfigComponent } from './search-config.component';
import { UserService } from '@onecx/angular-integration-interface';
import { createTranslateLoader, provideThemeConfig } from '@onecx/angular-utils';
import { provideTranslateServiceForRoot } from '@onecx/angular-remote-components';
import { TranslateLoader } from '@ngx-translate/core';
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
    provideAppInitializer(() => {
      const initializerFn = userProfileInitializer(inject(UserService))
      return initializerFn()
    }),
    provideThemeConfig(),
    provideTranslateServiceForRoot({
      isolate: true,
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
  ],
);
