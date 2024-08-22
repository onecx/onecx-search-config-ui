import { bootstrapModule } from '@onecx/angular-webcomponents';
import { environment } from 'src/environments/environment';
import { OnecxSearchConfigModule } from './app/onecx-search-config-app.remote.module';

bootstrapModule(
  OnecxSearchConfigModule,
  'microfrontend',
  environment.production
);
