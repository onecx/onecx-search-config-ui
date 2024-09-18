import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  DialogButtonClicked,
  DialogPrimaryButtonDisabled,
  DialogResult,
  DialogState,
} from '@onecx/portal-integration-angular';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { Observable, map, startWith } from 'rxjs';

export type CreateOrEditSearchDialogContent = {
  searchConfigName: string;
  saveInputValues: boolean;
  saveColumns: boolean;
};
@Component({
  selector: 'app-ocx-create-or-edit-search-config-dialog',
  templateUrl: './create-or-edit-search-config-dialog.component.html',
  styleUrls: ['./create-or-edit-search-config-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    CheckboxModule,
    InputTextModule,
  ],
})
export class CreateOrEditSearchConfigDialogComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<CreateOrEditSearchDialogContent>,
    DialogButtonClicked<CreateOrEditSearchConfigDialogComponent>,
    OnInit
{
  @Input()
  set searchConfigName(value: string | undefined) {
    this.searchConfigFormGroup.controls['searchConfigName'].setValue(value);
  }
  get searchConfigName(): string | undefined {
    return this.searchConfigFormGroup.controls['searchConfigName'].value;
  }

  @Input()
  set saveInputValues(value: boolean | undefined) {
    this.searchConfigFormGroup.controls['saveInputValues'].setValue(value);
  }
  get saveInputValues(): boolean | undefined {
    return this.searchConfigFormGroup.controls['saveInputValues'].value;
  }

  @Input()
  set saveColumns(value: boolean | undefined) {
    this.searchConfigFormGroup.controls['saveColumns'].setValue(value);
  }
  get saveColumns(): boolean | undefined {
    return this.searchConfigFormGroup.controls['saveColumns'].value;
  }

  _frozeColumnSaveOption = false;
  @Input()
  set frozeColumnSaveOption(value: boolean | undefined) {
    this._frozeColumnSaveOption = value !== undefined ? value : false;
    if (value) {
      this.searchConfigFormGroup.controls['saveColumns'].disable();
    } else {
      this.searchConfigFormGroup.controls['saveColumns'].enable();
    }
  }
  get frozeColumnSaveOption(): boolean {
    return this._frozeColumnSaveOption;
  }

  _frozeColumnSaveOptionExplanation = '';
  @Input()
  set frozeColumnSaveOptionExplanation(value: string | undefined) {
    this._frozeColumnSaveOptionExplanation = value !== undefined ? value : '';
  }
  get frozeColumnSaveOptionExplanation(): string {
    return this._frozeColumnSaveOptionExplanation;
  }

  @Output() primaryButtonEnabled: EventEmitter<boolean> = new EventEmitter();

  searchConfigFormGroup: FormGroup = new FormGroup({
    searchConfigName: new FormControl<string>(''),
    saveInputValues: new FormControl<boolean>(false),
    saveColumns: new FormControl<boolean>(false),
  });
  placeHolderKey = 'SEARCH_CONFIG.CREATE_EDIT_PLACEHOLDER';
  dialogResult: CreateOrEditSearchDialogContent = {
    searchConfigName: '',
    saveInputValues: false,
    saveColumns: false,
  };

  ngOnInit(): void {
    this.searchConfigFormGroup.valueChanges
      .pipe(
        startWith(this.searchConfigFormGroup.value),
        map(
          (dialogFormValues: CreateOrEditSearchDialogContent) =>
            !!dialogFormValues.searchConfigName &&
            (dialogFormValues.saveInputValues || dialogFormValues.saveColumns),
        ),
      )
      .subscribe(this.primaryButtonEnabled);
  }

  ocxDialogButtonClicked(
    _state: DialogState<CreateOrEditSearchConfigDialogComponent>,
  ): boolean | Observable<boolean> | Promise<boolean> | undefined {
    this.dialogResult = {
      searchConfigName:
        this.searchConfigFormGroup?.get('searchConfigName')?.value,
      saveInputValues:
        this.searchConfigFormGroup?.get('saveInputValues')?.value,
      saveColumns: this.searchConfigFormGroup?.get('saveColumns')?.value,
    };
    return true;
  }
}
