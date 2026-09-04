import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { ReactiveFormsModule } from '@angular/forms'
import { TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { CheckboxModule } from 'primeng/checkbox'
import { InputTextModule } from 'primeng/inputtext'

import { DialogState } from '@onecx/angular-accelerator'

import { CreateOrEditSearchConfigDialogHarness } from './create-or-edit-search-config-dialog.component.harness'
import { CreateOrEditSearchConfigDialogComponent } from './create-or-edit-search-config-dialog.component'

describe('CreateOrEditSearchConfigDialogComponent', () => {
  let component: CreateOrEditSearchConfigDialogComponent
  let fixture: ComponentFixture<CreateOrEditSearchConfigDialogComponent>
  let translateService: TranslateService
  let dialogHarness: CreateOrEditSearchConfigDialogHarness

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [
        CheckboxModule,
        CreateOrEditSearchConfigDialogComponent,
        TranslateTestingModule.withTranslations({
          en: require('./src/assets/i18n/en.json'),
          de: require('./src/assets/i18n/de.json')
        }).withDefaultLanguage('en'),
        ReactiveFormsModule,
        InputTextModule
      ],
      providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    }).compileComponents()

    fixture = TestBed.createComponent(CreateOrEditSearchConfigDialogComponent)
    component = fixture.componentInstance

    translateService = TestBed.inject(TranslateService)
    translateService.setDefaultLang('en')
    translateService.use('en')

    fixture.detectChanges()
    dialogHarness = await TestbedHarnessEnvironment.harnessForFixture(fixture, CreateOrEditSearchConfigDialogHarness)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should load the CreateOrEditSearchConfigDialogHarness', async () => {
    expect(dialogHarness).toBeTruthy()
  })

  it('should disable saveColumns control if freeze set to true', () => {
    component.frozeColumnSaveOption = true

    expect(component.searchConfigFormGroup.controls['saveColumns'].disabled).toBeTruthy()

    component.frozeColumnSaveOption = false

    expect(component.searchConfigFormGroup.controls['saveColumns'].disabled).toBeFalsy()
  })

  it('should inform about column freeze', async () => {
    component.frozeColumnSaveOption = true
    component.frozeColumnSaveOptionExplanation = 'explanation'

    expect(await dialogHarness.getSaveColumnsLabel()).toEqual('Do you want to save the shown columns?  explanation')
  })

  it('should set frozeColumnSaveOptionExplanation to empty string when undefined is provided', () => {
    component.frozeColumnSaveOptionExplanation = undefined

    expect(component.frozeColumnSaveOptionExplanation).toBe('')
  })

  it('should set frozeColumnSaveOption to false when undefined is provided', () => {
    component.frozeColumnSaveOption = undefined

    expect(component.frozeColumnSaveOption).toBe(false)
    expect(component.searchConfigFormGroup.controls['saveColumns'].disabled).toBeFalsy()
  })

  it('should set the DialogResult of the saveInputValuesId checkbox to true when the saveInputValuesId checkbox is checked', async () => {
    const saveInputValuesCheckbox = await dialogHarness.getSaveInputValuesCheckboxHarness()
    await saveInputValuesCheckbox.click()
    const _state: DialogState<CreateOrEditSearchConfigDialogComponent> = {
      button: 'primary',
      result: undefined
    }
    component.ocxDialogButtonClicked(_state)
    const dialogResult = {
      searchConfigName: '',
      saveInputValues: true,
      saveColumns: false
    }
    expect(component.dialogResult).toEqual(dialogResult)
  })

  it('should set the DialogResult of the saveColumnsId checkbox initially false', async () => {
    const _state: DialogState<CreateOrEditSearchConfigDialogComponent> = {
      button: 'primary',
      result: undefined
    }
    await component.ocxDialogButtonClicked(_state)
    const dialogResult = {
      searchConfigName: '',
      saveInputValues: false,
      saveColumns: false
    }
    expect(component.dialogResult).toEqual(dialogResult)
  })

  it('should set the DialogResult of the searchConfig input Field to the entered value', async () => {
    await (await dialogHarness.getSearchConfigInputHarness()).setValue('search Config')
    const _state: DialogState<CreateOrEditSearchConfigDialogComponent> = {
      button: 'primary',
      result: undefined
    }
    await component.ocxDialogButtonClicked(_state)
    const dialogResult = {
      searchConfigName: 'search Config',
      saveInputValues: false,
      saveColumns: false
    }
    expect(component.dialogResult).toEqual(dialogResult)
  })

  it('should set search config name when provided', async () => {
    component.searchConfigName = 'my-config'
    const searchConfigName = await dialogHarness.getSearchConfigInputHarness()
    expect(await searchConfigName.getValue()).toEqual('my-config')
  })

  it('should set the saveColumnsId checkbox initially to unchecked', async () => {
    const saveInputValuesCheckbox = await dialogHarness.getSaveColumnsCheckboxHarness()
    const checked = await saveInputValuesCheckbox.isChecked()
    expect(checked).toBeFalsy()
  })

  it('should set the saveColumnsId checkbox to true when it is provided as true', async () => {
    component.saveColumns = true
    const saveInputValuesCheckbox = await dialogHarness.getSaveColumnsCheckboxHarness()
    const checked = await saveInputValuesCheckbox.isChecked()
    expect(checked).toBeTruthy()
  })

  it('should set the saveInputValues checkbox initially to unchecked', async () => {
    const saveInputValuesCheckbox = await dialogHarness.getSaveInputValuesCheckboxHarness()
    const checked = await saveInputValuesCheckbox.isChecked()
    expect(checked).toBeFalsy()
  })

  it('should set the saveInputValues checkbox to true when it is provided as true', async () => {
    component.saveInputValues = true
    const saveInputValuesCheckbox = await dialogHarness.getSaveInputValuesCheckboxHarness()
    const checked = await saveInputValuesCheckbox.isChecked()
    expect(checked).toBeTruthy()
  })

  it('should set the saveInputValues checkbox to true when it is clicked', async () => {
    const saveInputValuesCheckbox = await dialogHarness.getSaveInputValuesCheckboxHarness()
    await saveInputValuesCheckbox.click()
    const checked = await saveInputValuesCheckbox.isChecked()
    expect(checked).toBeTruthy()
  })

  it('should emit true when the searchConfig name is not an empty string and the saveColumnsCheckBox is clicked', async () => {
    let done: () => void
    const finished = new Promise<void>((resolve) => (done = resolve))
    let enabled = false
    component.primaryButtonEnabled.subscribe((v) => {
      enabled = v
      done()
    })

    const searchConfigInputHarness = await dialogHarness.getSearchConfigInputHarness()
    searchConfigInputHarness.setValue('test')
    const saveInputValuesCheckbox = await dialogHarness.getSaveColumnsCheckboxHarness()
    await saveInputValuesCheckbox.click()

    await finished
    expect(enabled).toEqual(true)
  })

  it('emit true when the searchConfig Name is not an empty string and the saveInputValuesCheckbox is clicked', async () => {
    let done: () => void
    const finished = new Promise<void>((resolve) => (done = resolve))
    let enabled = false
    component.primaryButtonEnabled.subscribe((v) => {
      enabled = v
      done()
    })

    const searchConfigInputHarness = await dialogHarness.getSearchConfigInputHarness()
    searchConfigInputHarness.setValue('test')
    const saveInputValuesCheckbox = await dialogHarness.getSaveInputValuesCheckboxHarness()
    await saveInputValuesCheckbox.click()

    await finished
    expect(enabled).toEqual(true)
  })

  it('should return undefined when second label does not exist', async () => {
    const harness = {
      locatorForAll: jest.fn().mockReturnValue(async () => []),
      getSaveColumnsLabel: CreateOrEditSearchConfigDialogHarness.prototype.getSaveColumnsLabel
    }

    const label = await harness.getSaveColumnsLabel()

    expect(label).toBeUndefined()
  })

  it('should handle undefined searchConfigFormGroup in ocxDialogButtonClicked', () => {
    component.searchConfigFormGroup = undefined as any

    const state: DialogState<CreateOrEditSearchConfigDialogComponent> = {
      button: 'primary',
      result: undefined
    }

    component.ocxDialogButtonClicked(state)

    expect(component.dialogResult).toEqual({
      searchConfigName: undefined,
      saveInputValues: undefined,
      saveColumns: undefined
    })
  })
})
