import { ComponentHarness, ContentContainerComponentHarness } from '@angular/cdk/testing'

import { PButtonHarness } from '@onecx/angular-testing'

export class OneCXColumnGroupSelectionListItemHarness extends ComponentHarness {
  public static hostSelector = 'li'

  getSpan = this.locatorFor('span')
  getEditButton = this.locatorForOptional('p-button.search_config_edit_button')
  getDeleteButton = this.locatorForOptional('p-button.search_config_delete_button')
  getSelectButton = this.locatorForOptional('p-button.search_config_select_button')

  async getText() {
    return (await this.getSpan()).text()
  }
}

export class OneCXColumnGroupSelectionHarness extends ContentContainerComponentHarness {
  static readonly hostSelector = 'app-ocx-column-group-selection'

  private readonly _saveEditPButton = this.locatorForOptional(
    PButtonHarness.with({
      id: 'sc_column_group_selection_save_search_config_edit'
    })
  )
  private readonly _cancelEditPButton = this.locatorForOptional(
    PButtonHarness.with({
      id: 'sc_column_group_selection_cancel_search_config_edit'
    })
  )
  private readonly _managePButton = this.locatorForOptional(
    PButtonHarness.with({
      id: 'sc_column_group_selection_manage_column_group'
    })
  )

  async getSaveEditButton() {
    return await this._saveEditPButton()
  }

  async getCancelEditButton() {
    return await this._cancelEditPButton()
  }

  async getManageButton() {
    return await this._managePButton()
  }

  async getHarnessLoaderForOverlay() {
    return this.documentRootLocatorFactory().harnessLoaderForOptional('.p-popover')
  }

  async isOpen(): Promise<boolean> {
    return !!(await this.getHarnessLoaderForOverlay())
  }

  async open() {
    if (!(await this.isOpen())) {
      await (await this.getManageButton())?.click()
    } else {
      console.warn('Unable to open overlay, because it is already open.')
    }
  }

  async getItems() {
    await this.open()
    const overlay = await this.getHarnessLoaderForOverlay()
    return await overlay?.getAllHarnesses(OneCXColumnGroupSelectionListItemHarness)
  }
}
