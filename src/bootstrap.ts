import { bootstrapModule } from '@onecx/angular-webcomponents';
import { environment } from 'src/environments/environment';
import { SearchConfigModule } from './app/search-config-app.remote.module';

bootstrapModule(SearchConfigModule, 'microfrontend', environment.production);
