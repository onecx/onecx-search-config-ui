import { ContentContainerComponentHarness } from '@angular/cdk/testing';
import {
  PCheckboxHarness,
  InputHarness,
  DivHarness,
} from '@onecx/angular-testing';

export class CreateOrEditSearchConfigDialogHarness extends ContentContainerComponentHarness {
  static hostSelector = 'ocx-create-or-edit-search-config-dialog';

  getSaveInputValuesCheckboxHarness() {
    return this.getHarness(
      PCheckboxHarness.with({ inputid: 'saveInputValuesId' }),
    );
  }

  getSaveColumnsCheckboxHarness() {
    return this.getHarness(PCheckboxHarness.with({ inputid: 'saveColumnsId' }));
  }

  getSearchConfigInputHarness() {
    return this.getHarness(InputHarness.with({ id: 'searchConfigName' }));
  }

  async getSaveColumnsLabel(): Promise<string | null | undefined> {
    const labels = await this.locatorForAll('div > label')();
    return labels.at(1)?.text();
  }
}
