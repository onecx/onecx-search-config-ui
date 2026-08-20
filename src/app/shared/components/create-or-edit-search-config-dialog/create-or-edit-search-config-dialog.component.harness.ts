import {
  ComponentHarness,
  ContentContainerComponentHarness,
} from '@angular/cdk/testing';
import { InputHarness } from '@onecx/angular-testing';

class CheckboxInputHarness extends ComponentHarness {
  static hostSelector = '.p-checkbox-input';

  async click(): Promise<void> {
    await (await this.host()).click();
  }

  async isChecked(): Promise<boolean> {
    return await (await this.host()).getProperty<boolean>('checked');
  }
}

class SaveInputValuesCheckboxHarness extends CheckboxInputHarness {
  static override hostSelector = '#saveInputValuesId.p-checkbox-input';
}

class SaveColumnsCheckboxHarness extends CheckboxInputHarness {
  static override hostSelector = '#saveColumnsId.p-checkbox-input';
}

export class CreateOrEditSearchConfigDialogHarness extends ContentContainerComponentHarness {
  static hostSelector = 'ocx-create-or-edit-search-config-dialog';

  getSaveInputValuesCheckboxHarness(): Promise<SaveInputValuesCheckboxHarness> {
    return this.getHarness(SaveInputValuesCheckboxHarness);
  }

  getSaveColumnsCheckboxHarness(): Promise<SaveColumnsCheckboxHarness> {
    return this.getHarness(SaveColumnsCheckboxHarness);
  }

  getSearchConfigInputHarness() {
    return this.getHarness(InputHarness.with({ id: 'searchConfigName' }));
  }

  async getSaveColumnsLabel(): Promise<string | null | undefined> {
    const labels = await this.locatorForAll('div > label')();
    return labels.at(1)?.text();
  }
}
