import { Topic } from '@onecx/accelerator';
import { SearchConfigMessage } from './search-config.model';

export class SearchConfigTopic extends Topic<SearchConfigMessage> {
  constructor() {
    super('searchConfig', 1);
  }
}
