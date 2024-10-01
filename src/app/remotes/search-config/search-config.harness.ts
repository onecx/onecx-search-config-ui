import { ComponentHarness } from '@angular/cdk/testing';
import {
  PDropdownHarness,
  PButtonDirectiveHarness,
} from '@onecx/angular-testing';

export class OneCXSearchConfigHarness extends ComponentHarness {
  static readonly hostSelector = 'app-ocx-search-config';

  getDropdown = this.locatorForOptional(PDropdownHarness);
  getEditButton = this.locatorForOptional(
    PButtonDirectiveHarness.with({ id: 'sc_search_config_edit_search_config' }),
  );
  getDeleteButton = this.locatorForOptional(
    PButtonDirectiveHarness.with({
      id: 'sc_search_config_delete_search_config',
    }),
  );
  getSaveEditButton = this.locatorForOptional(
    PButtonDirectiveHarness.with({
      id: 'sc_search_config_save_search_config_edit',
    }),
  );
  getCancelEditButton = this.locatorForOptional(
    PButtonDirectiveHarness.with({
      id: 'sc_search_config_cancel_search_config_edit',
    }),
  );
}
