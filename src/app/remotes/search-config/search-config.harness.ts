import { ComponentHarness, ContentContainerComponentHarness } from '@angular/cdk/testing'

import { PButtonHarness } from '@onecx/angular-testing'

export class OneCXSearchConfigListItemHarness extends ComponentHarness {
  public static hostSelector = 'li'

  getSpan = this.locatorFor('span')
  getEditButton = this.locatorForOptional('p-button.search_config_edit_button')
  getDeleteButton = this.locatorForOptional('p-button.search_config_delete_button')
  getSelectButton = this.locatorForOptional('p-button.search_config_select_button')

  async getText() {
    return (await this.getSpan()).text()
  }
}

export class OneCXSearchConfigHarness extends ContentContainerComponentHarness {
  static readonly hostSelector = 'app-ocx-search-config'

  private readonly _saveEditPButton = this.locatorForOptional(
    PButtonHarness.with({ id: 'sc_search_config_save_search_config_edit' })
  )
  private readonly _cancelEditPButton = this.locatorForOptional(
    PButtonHarness.with({ id: 'sc_search_config_cancel_search_config_edit' })
  )

  private readonly _managePButton = this.locatorForOptional(
    PButtonHarness.with({ id: 'sc_search_config_manage_search_config' })
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

  async getAddItem() {
    await this.open()
    const overlay = await this.getHarnessLoaderForOverlay()
    if (!overlay) return null
    try {
      return await overlay.getHarness(PButtonHarness)
    } catch (err) {
      return null
    }
  }

  async getItems() {
    await this.open()
    const overlay = await this.getHarnessLoaderForOverlay()
    return await overlay?.getAllHarnesses(OneCXSearchConfigListItemHarness)
  }
}
