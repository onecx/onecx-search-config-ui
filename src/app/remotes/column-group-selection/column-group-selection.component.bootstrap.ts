import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  importProvidersFrom,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { AngularAuthModule } from '@onecx/angular-auth';
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents';
import { environment } from 'src/environments/environment';
import { OneCXColumnGroupSelectionComponent } from './column-group-selection.component';
import { UserService } from '@onecx/angular-integration-interface';
import {
  createTranslateLoader,
  provideThemeConfig,
  provideTranslationPathFromMeta,
  REMOTE_COMPONENT_CONFIG,
  RemoteComponentConfig,
} from '@onecx/angular-utils';
import { ReplaySubject } from 'rxjs';
import { TranslateLoader } from '@ngx-translate/core';
import { provideTranslateServiceForRoot } from '@onecx/angular-remote-components';
import { providePortalDialogService } from '@onecx/angular-accelerator';

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
    {
      provide: REMOTE_COMPONENT_CONFIG,
      useValue: new ReplaySubject<RemoteComponentConfig>(1),
    },
    importProvidersFrom(AngularAuthModule),
    importProvidersFrom(BrowserModule),
    importProvidersFrom(BrowserAnimationsModule),
    providePortalDialogService(),
    provideAppInitializer(() => {
      const initializerFn = userProfileInitializer(inject(UserService));
      return initializerFn();
    }),
    provideTranslationPathFromMeta(import.meta.url, 'assets/i18n/'),
    provideTranslateServiceForRoot({
      isolate: true,
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
    provideThemeConfig(),
  ],
);
