import {
  ComponentHarness,
  ContentContainerComponentHarness,
} from '@angular/cdk/testing';
import {
  PButtonDirectiveHarness,
  PButtonHarness,
} from '@onecx/angular-testing';

export class OneCXColumnGroupSelectionListItemHarness extends ComponentHarness {
  static hostSelector = 'li';

  getSpan = this.locatorFor('span');
  getEditButton = this.locatorForOptional('button.search_config_edit_button');
  getDeleteButton = this.locatorForOptional(
    'button.search_config_delete_button',
  );
  getSelectButton = this.locatorForOptional(
    'button.search_config_select_button',
  );

  async getText() {
    return (await this.getSpan()).text();
  }
}

export class OneCXColumnGroupSelectionHarness extends ContentContainerComponentHarness {
  static readonly hostSelector = 'app-ocx-column-group-selection';

  getSaveEditButton = this.locatorForOptional(
    PButtonDirectiveHarness.with({
      id: 'sc_column_group_selection_save_search_config_edit',
    }),
  );
  getCancelEditButton = this.locatorForOptional(
    PButtonDirectiveHarness.with({
      id: 'sc_column_group_selection_cancel_search_config_edit',
    }),
  );
  getManageButton = this.locatorForOptional(
    PButtonHarness.with({
      id: 'sc_column_group_selection_manage_column_group',
    }),
  );

  async getHarnessLoaderForOverlay() {
    return this.documentRootLocatorFactory().harnessLoaderForOptional(
      '.p-overlaypanel',
    );
  }

  async isOpen(): Promise<boolean> {
    return !!(await this.getHarnessLoaderForOverlay());
  }

  async open() {
    if (!(await this.isOpen())) {
      await (await this.getManageButton())?.click();
    } else {
      console.warn('Unable to open overlay, because it is already open.');
    }
  }

  async getItems() {
    await this.open();
    const overlay = await this.getHarnessLoaderForOverlay();
    return await overlay?.getAllHarnesses(
      OneCXColumnGroupSelectionListItemHarness,
    );
  }
}
