import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  importProvidersFrom,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { TranslateLoader } from '@ngx-translate/core';
import { ReplaySubject } from 'rxjs';

import {
  AngularAcceleratorModule,
  providePortalDialogService,
} from '@onecx/angular-accelerator';
import { AngularAuthModule } from '@onecx/angular-auth';
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents';
import { UserService } from '@onecx/angular-integration-interface';
import {
  createTranslateLoader,
  provideThemeConfig,
  provideTranslationPathFromMeta,
  REMOTE_COMPONENT_CONFIG,
  RemoteComponentConfig,
} from '@onecx/angular-utils';
import { provideTranslateServiceForRoot } from '@onecx/angular-remote-components';

import { environment } from 'src/environments/environment';
import { OneCXSearchConfigComponent } from './search-config.component';

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
    {
      provide: REMOTE_COMPONENT_CONFIG,
      useValue: new ReplaySubject<RemoteComponentConfig>(1),
    },
    importProvidersFrom(AngularAcceleratorModule),
    importProvidersFrom(AngularAuthModule),
    importProvidersFrom(BrowserAnimationsModule),
    provideAppInitializer(() => {
      const initializerFn = userProfileInitializer(inject(UserService));
      return initializerFn();
    }),
    providePortalDialogService(),
    provideTranslationPathFromMeta(import.meta.url, 'assets/i18n/'),
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
