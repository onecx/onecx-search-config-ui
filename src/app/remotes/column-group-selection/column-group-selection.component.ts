import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import {
  DataTableColumn,
  TranslationCacheService,
  createRemoteComponentAndMfeTranslateLoader,
  ColumnGroupData,
} from '@onecx/angular-accelerator';
import {
  AppStateService,
  PortalCoreModule,
  PortalDialogService,
  PortalMessageService,
  UserService,
  providePortalDialogService,
} from '@onecx/portal-integration-angular';
import {
  AngularRemoteComponentsModule,
  BASE_URL,
  RemoteComponentConfig,
  ocxRemoteComponent,
  ocxRemoteWebcomponent,
  provideTranslateServiceForRoot,
} from '@onecx/angular-remote-components';
import {
  BehaviorSubject,
  OperatorFunction,
  ReplaySubject,
  Subscription,
  catchError,
  debounceTime,
  filter,
  map,
  mergeMap,
  of,
  withLatestFrom,
} from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Button, ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { PrimeIcons } from 'primeng/api';
import { SharedModule } from 'src/app/shared/shared.module';
import {
  Configuration,
  SearchConfig,
  SearchConfigAPIService,
  SearchConfigInfo,
  UpdateSearchConfigRequest,
  UpdateSearchConfigResponse,
} from 'src/app/shared/generated';
import { environment } from 'src/environments/environment';
import {
  ColumnSelectionViewModel,
  PageData,
  RevertData,
  SEARCH_CONFIG_STORE_NAME,
  SEARCH_CONFIG_TOPIC,
  SearchConfigStore,
  SearchConfigTopic,
} from '../../shared/search-config.store';
import {
  CreateOrEditSearchConfigDialogComponent,
  CreateOrEditSearchDialogContent,
} from 'src/app/shared/components/create-or-edit-search-config-dialog/create-or-edit-search-config-dialog.component';
import {
  advancedViewMode,
  columngGroupSelectionStoreName,
} from 'src/app/shared/constants';
import {
  hasOnlyColumns,
  parseFieldValues,
} from 'src/app/shared/search-config.utils';
import { TooltipModule } from 'primeng/tooltip';
import { FocusTrapModule } from 'primeng/focustrap';

@Component({
  selector: 'app-ocx-column-group-selection',
  standalone: true,
  templateUrl: './column-group-selection.component.html',
  styleUrls: ['./column-group-selection.component.scss'],
  imports: [
    AngularRemoteComponentsModule,
    CommonModule,
    PortalCoreModule,
    TranslateModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DropdownModule,
    FloatLabelModule,
    TooltipModule,
    OverlayPanelModule,
    FocusTrapModule,
  ],
  providers: [
    PortalMessageService,
    {
      provide: BASE_URL,
      useValue: new ReplaySubject<string>(1),
    },
    provideTranslateServiceForRoot({
      isolate: true,
      loader: {
        provide: TranslateLoader,
        useFactory: createRemoteComponentAndMfeTranslateLoader,
        deps: [HttpClient, BASE_URL, TranslationCacheService, AppStateService],
      },
    }),
    providePortalDialogService(),
    {
      provide: SEARCH_CONFIG_STORE_NAME,
      useValue: columngGroupSelectionStoreName,
    },
    {
      provide: SEARCH_CONFIG_TOPIC,
      useValue: new SearchConfigTopic(),
    },
    SearchConfigStore,
  ],
})
export class OneCXColumnGroupSelectionComponent
  implements ocxRemoteComponent, ocxRemoteWebcomponent, OnInit, OnDestroy
{
  hasOnlyColumns = hasOnlyColumns;
  @Input() set selectedGroupKey(selectedGroupKey: string | undefined) {
    if (selectedGroupKey === undefined) return;

    setTimeout(() => {
      this.searchConfigStore.setSelectedGroupKey(selectedGroupKey);
    });
  }

  @Input() set customGroupKey(key: string) {
    setTimeout(() => {
      this.searchConfigStore.setCustomGroupKey(key);
    });
  }

  @Input() set displayedColumnsIds(columns: string[]) {
    setTimeout(() => {
      this.searchConfigStore.updateDisplayedColumnsIds(columns);
    });
  }

  @Input()
  set layout(layout: 'table' | 'grid' | 'list') {
    setTimeout(() => {
      this.searchConfigStore.updateLayout(layout);
    });
  }

  @Input() groupSelectionChanged: EventEmitter<ColumnGroupData> =
    new EventEmitter();

  columns$ = new BehaviorSubject<DataTableColumn[]>([]);
  @Input()
  get columns(): DataTableColumn[] {
    return this.columns$.getValue();
  }
  set columns(value: DataTableColumn[]) {
    this.columns$.next(value);
  }

  @Input() defaultGroupKey = '';
  @Input() placeholderKey = '';

  readonly vm$ = this.searchConfigStore.columnSelectionVm$.pipe(
    debounceTime(50),
  );

  dataRevertSub: Subscription | undefined;
  selectedGroupKeySub: Subscription | undefined;

  editIcon = PrimeIcons.PENCIL;
  deleteIcon = PrimeIcons.TRASH;
  stopIcon = PrimeIcons.TIMES;
  saveIcon = PrimeIcons.CHECK;
  selectIcon = PrimeIcons.CHECK;

  permissions: string[] = [];

  @ViewChild('op') op: OverlayPanel | undefined;
  @ViewChild('manageButton') manageButton: Button | undefined;

  constructor(
    @Inject(BASE_URL) private baseUrl: ReplaySubject<string>,
    private userService: UserService,
    private translateService: TranslateService,
    private searchConfigService: SearchConfigAPIService,
    private searchConfigStore: SearchConfigStore,
    private portalDialogService: PortalDialogService,
    private portalMessageService: PortalMessageService,
  ) {
    this.translateService.use(this.userService.lang$.getValue());

    this.dataRevertSub = this.searchConfigStore.dataToRevert$
      .pipe(
        debounceTime(20),
        filter(
          (dataToRevert) => dataToRevert !== undefined,
        ) as OperatorFunction<RevertData | undefined, RevertData>,
      )
      .subscribe((dataToRevert) => {
        if (!dataToRevert.columnGroupKey) return;
        this.groupSelectionChanged.emit({
          activeColumns: this.columns.filter((c) =>
            dataToRevert.displayedColumnsIds.includes(c.id),
          ),
          groupKey: dataToRevert.columnGroupKey,
        });
      });

    this.searchConfigStore.selectedGroupKey$
      .pipe(debounceTime(50), withLatestFrom(this.vm$))
      .subscribe(([selectedGroupKey, vm]) => {
        const configWithColumns = vm.searchConfigsWithColumns.find(
          (c) => c.name === selectedGroupKey,
        );
        if (configWithColumns) {
          const activeColumns = this.columns.filter((c) =>
            configWithColumns.columns.includes(c.id),
          );
          this.groupSelectionChanged.emit({
            activeColumns,
            groupKey: selectedGroupKey,
          });
        } else if (selectedGroupKey === vm.customGroupKey) {
          return;
        } else if (vm.nonSearchConfigGroupKeys.includes(selectedGroupKey)) {
          const activeColumns = this.columns.filter((c) =>
            c.predefinedGroupKeys?.includes(selectedGroupKey),
          );
          this.groupSelectionChanged.emit({
            activeColumns,
            groupKey: selectedGroupKey,
          });
        }
      });
  }
  ngOnDestroy(): void {
    this.dataRevertSub?.unsubscribe();
    this.selectedGroupKeySub?.unsubscribe();
  }

  ngOnInit() {
    this.columns$
      .pipe(
        map((columns) =>
          columns
            .map((keys) => keys.predefinedGroupKeys || [])
            .flat()
            .concat([this.defaultGroupKey])
            .filter((value) => !!value)
            .filter(
              (value, index, self) =>
                self.indexOf(value) === index && value != null,
            ),
        ),
      )
      .subscribe((groupKeys) => {
        setTimeout(() => {
          this.searchConfigStore.setNonSearchConfigGroupKeys(groupKeys);
        });
      });

    this.groupSelectionChanged.emit(undefined);
  }

  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config);
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.searchConfigService.configuration = new Configuration({
      basePath: Location.joinWithSlash(config.baseUrl, environment.apiPrefix),
    });
    this.baseUrl.next(config.baseUrl);
    this.permissions = config.permissions;
  }

  onColumnGroupChange(key: string) {
    this.op?.hide();

    setTimeout(() => {
      this.searchConfigStore.setSelectedGroupKey(key);
    });
  }

  focusManageButton() {
    this.manageButton?.focus();
  }

  overlayButtonText(vm: ColumnSelectionViewModel): {
    type: 'config' | 'key';
    key: string;
    params?: any;
  } {
    if (vm.editMode && vm.currentConfig) {
      return {
        type: 'config',
        key: 'COLUMN_GROUP_SELECTION.EDITING',
        params: { group: vm.currentConfig.name },
      };
    }
    return {
      type:
        vm.selectedGroupKey && this.isConfig(vm.selectedGroupKey, vm)
          ? 'config'
          : 'key',
      key: 'COLUMN_GROUP_SELECTION.ACTIVE',
      params: { group: vm.selectedGroupKey },
    };
  }

  onSearchConfigEdit(searchConfig: SearchConfigInfo | undefined) {
    this.op?.hide();

    if (searchConfig === undefined) {
      return;
    }

    setTimeout(() => {
      this.searchConfigStore.enterEditMode(searchConfig);
    });
  }

  onSearchConfigSaveEdit(config: SearchConfigInfo | undefined) {
    if (config === undefined) {
      setTimeout(() => {
        this.searchConfigStore.cancelEdit();
      });
      return;
    }

    this.portalDialogService
      .openDialog<CreateOrEditSearchDialogContent>(
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_HEADER',
        {
          type: CreateOrEditSearchConfigDialogComponent,
          inputs: {
            searchConfigName: config?.name,
            saveInputValues: Object.keys(config?.values ?? {}).length > 0,
            saveColumns: (config?.columns ?? []).length > 0,
          },
        },
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CONFIRM',
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CANCEL',
      )
      .pipe(
        mergeMap((dialogResult) => {
          return this.getSearchConfig(config).pipe(
            map((response) => {
              return {
                config: response?.config,
                result: dialogResult,
              };
            }),
          );
        }),
        withLatestFrom(this.searchConfigStore.currentPageData$),
        mergeMap(([{ config, result }, pageData]) => {
          if (!config || !result) {
            return of(undefined);
          }
          if (result.button !== 'primary') {
            return of(undefined);
          }
          return this.editSearchConfig(config, result.result, pageData);
        }),
      )
      .subscribe((response: UpdateSearchConfigResponse | undefined) => {
        const searchConfig = response?.configs.find((c) => c.id === config.id);
        if (response && searchConfig) {
          this.portalMessageService.info({
            summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_SUCCESS',
          });
          setTimeout(() => {
            this.searchConfigStore.saveEdit(searchConfig);
          });
        } else {
          setTimeout(() => {
            this.searchConfigStore.cancelEdit();
          });
        }
      });
  }

  private editSearchConfig(
    config: SearchConfig,
    configData: CreateOrEditSearchDialogContent | undefined,
    data: PageData,
  ) {
    const request: UpdateSearchConfigRequest = {
      searchConfig: {
        ...config,
        name: configData?.searchConfigName ?? config.name ?? '',
        columns: configData?.saveColumns ? data.displayedColumnsIds : [],
        values: configData?.saveInputValues
          ? parseFieldValues(data.fieldValues ?? {})
          : {},
        isAdvanced: data.viewMode === advancedViewMode,
      },
    };
    return this.searchConfigService.updateSearchConfig(config.id, request).pipe(
      catchError((error) => {
        console.error(error);
        this.portalMessageService.error({
          summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_FAILURE',
        });
        return of(undefined);
      }),
    );
  }

  private getSearchConfig(searchConfig: SearchConfigInfo) {
    return this.searchConfigService.getSearchConfig(searchConfig.id).pipe(
      catchError((error) => {
        console.error(error);
        this.portalMessageService.error({
          summaryKey: 'SEARCH_CONFIG.FETCH_FAILURE',
        });
        return of(undefined);
      }),
    );
  }

  onSearchConfigCancelEdit() {
    setTimeout(() => {
      this.searchConfigStore.cancelEdit();
    });
  }

  onSearchConfigDelete(searchConfig: SearchConfigInfo | undefined) {
    this.op?.hide();

    if (searchConfig === undefined) {
      return;
    }

    this.portalDialogService
      .openDialog(
        'SEARCH_CONFIG.DELETE_DIALOG.HEADER',
        {
          key: 'SEARCH_CONFIG.DELETE_DIALOG.MESSAGE',
          parameters: {
            config: searchConfig.name,
          },
        },
        'SEARCH_CONFIG.DELETE_DIALOG.CONFIRM',
        'SEARCH_CONFIG.DELETE_DIALOG.CANCEL',
      )
      .pipe(
        mergeMap((dialogResult) => {
          if (!dialogResult) return of(undefined);
          if (dialogResult.button !== 'primary') {
            return of(undefined);
          }
          return this.deleteSearchConfig(searchConfig.id);
        }),
      )
      .subscribe((result) => {
        if (result !== undefined) {
          this.portalMessageService.info({
            summaryKey: 'SEARCH_CONFIG.DELETE_SUCCESS',
          });
          setTimeout(() => {
            this.searchConfigStore.deleteSearchConfig(searchConfig);
          });
        }
      });
  }

  private deleteSearchConfig(id: string) {
    return this.searchConfigService.deleteSearchConfig(id).pipe(
      catchError((error) => {
        console.error(error);
        this.portalMessageService.error({
          summaryKey: 'SEARCH_CONFIG.DELETE_FAILURE',
        });
        return of(undefined);
      }),
    );
  }

  isReadonly(name: string, vm: ColumnSelectionViewModel): boolean {
    return (
      this.getConfigByName(vm.searchConfigsWithColumns, name)?.isReadonly ??
      false
    );
  }

  getConfigByName(
    configs: SearchConfigInfo[],
    name: string,
  ): SearchConfigInfo | undefined {
    return configs.find((c) => c.name === name);
  }

  isConfig(key: string, vm: ColumnSelectionViewModel): boolean {
    return this.getConfigByName(vm.searchConfigsWithColumns, key) !== undefined;
  }

  allGroupKeysWithoutCustom(vm: ColumnSelectionViewModel) {
    return vm.allGroupKeys.filter((k) => k !== vm.customGroupKey);
  }
}
