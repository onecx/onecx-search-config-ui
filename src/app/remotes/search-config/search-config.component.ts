import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { createRemoteComponentTranslateLoader } from '@onecx/angular-accelerator';
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
  OperatorFunction,
  ReplaySubject,
  Subscription,
  catchError,
  combineLatest,
  debounceTime,
  filter,
  map,
  mergeMap,
  of,
  withLatestFrom,
} from 'rxjs';
import {
  Configuration,
  CreateSearchConfigRequest,
  SearchConfig,
  SearchConfigAPIService,
  SearchConfigInfo,
  UpdateSearchConfigRequest,
} from 'src/app/shared/generated';
import { SharedModule } from 'src/app/shared/shared.module';
import { environment } from 'src/environments/environment';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MfeInfo } from '@onecx/integration-interface';
import {
  FieldValues,
  PageData,
  RevertData,
  SEARCH_CONFIG_STORE_NAME,
  SEARCH_CONFIG_TOPIC,
  SearchConfigStore,
  SearchConfigTopic,
  UnparsedFieldValues,
} from '../../shared/search-config.store';
import { PrimeIcons } from 'primeng/api';
import {
  CreateOrEditSearchConfigDialogComponent,
  CreateOrEditSearchDialogContent,
} from 'src/app/shared/components/create-or-edit-search-config-dialog/create-or-edit-search-config-dialog.component';
import {
  advancedViewMode,
  advancedViewModeType,
  basicViewMode,
  basicViewModeType,
} from 'src/app/shared/constants';
import {
  hasColumns,
  hasValues,
  parseFieldValues,
} from 'src/app/shared/search-config.utils';

@Component({
  selector: 'app-ocx-search-config',
  standalone: true,
  templateUrl: './search-config.component.html',
  styleUrls: ['./search-config.component.scss'],
  imports: [
    AngularRemoteComponentsModule,
    CommonModule,
    PortalCoreModule,
    TranslateModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CreateOrEditSearchConfigDialogComponent,
    DropdownModule,
    FloatLabelModule,
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
        useFactory: createRemoteComponentTranslateLoader,
        deps: [HttpClient, BASE_URL],
      },
    }),
    providePortalDialogService(),
    {
      provide: SEARCH_CONFIG_STORE_NAME,
      useValue: 'ocx-search-config-component-store',
    },
    {
      provide: SEARCH_CONFIG_TOPIC,
      useValue: new SearchConfigTopic(),
    },
    SearchConfigStore,
  ],
})
export class OneCXSearchConfigComponent
  implements ocxRemoteComponent, ocxRemoteWebcomponent, OnInit, OnDestroy
{
  @Input() set pageName(pageName: string) {
    setTimeout(() => {
      this.searchConfigStore.setPageName(pageName);
    });
  }
  @Input() set currentFieldValues(values: UnparsedFieldValues) {
    setTimeout(() => {
      this.searchConfigStore.updateFieldValues(values);
    });
  }
  @Input() set displayedColumnsIds(columns: string[]) {
    setTimeout(() => {
      this.searchConfigStore.updateDisplayedColumnsIds(columns);
    });
  }
  @Input() set viewMode(viewMode: basicViewModeType | advancedViewModeType) {
    setTimeout(() => {
      this.searchConfigStore.updateViewMode(viewMode);
    });
  }

  @Input() searchConfigSelected: EventEmitter<
    | {
        fieldValues: FieldValues;
        displayedColumnsIds: string[];
        viewMode: basicViewModeType | advancedViewModeType;
      }
    | undefined
  > = new EventEmitter();

  formGroup: FormGroup | undefined;

  readonly vm$ = this.searchConfigStore.searchConfigVm$.pipe(debounceTime(50));

  dataRevertSub: Subscription | undefined;
  currentConfigSub: Subscription | undefined;

  addSearchConfigOption: any = {
    id: 'ocx-add-search-config-option',
  };
  plusIcon = PrimeIcons.PLUS;
  editIcon = PrimeIcons.PENCIL;
  deleteIcon = PrimeIcons.TRASH;
  stopIcon = PrimeIcons.TIMES;
  saveIcon = PrimeIcons.CHECK;

  constructor(
    @Inject(BASE_URL) private baseUrl: ReplaySubject<string>,
    private userService: UserService,
    private translateService: TranslateService,
    private searchConfigService: SearchConfigAPIService,
    private portalDialogService: PortalDialogService,
    private portalMessageService: PortalMessageService,
    private appStateService: AppStateService,
    private searchConfigStore: SearchConfigStore,
  ) {
    this.userService.lang$.subscribe((lang) => {
      this.translateService.use(lang);
    });

    combineLatest([
      this.baseUrl,
      this.searchConfigStore.pageName$,
      this.appStateService.currentMfe$.asObservable(),
    ])
      .pipe(
        filter(([_, pageName, currentMfe]) => pageName.length > 0),
        mergeMap(([_, pageName, currentMfe]) => {
          return this.searchConfigService
            .getSearchConfigInfos({
              appId: currentMfe.appId,
              page: pageName,
              productName: currentMfe.productName,
            })
            .pipe(map((response) => response.configs));
        }),
      )
      .subscribe((searchConfigs) => {
        setTimeout(() => {
          this.searchConfigStore.setSearchConfigs(searchConfigs);
        });
      });

    this.dataRevertSub = this.searchConfigStore.dataToRevert$
      .pipe(
        debounceTime(20),
        filter((data) => data !== undefined) as OperatorFunction<
          RevertData | undefined,
          RevertData
        >,
      )
      .subscribe((dataToRevert) => {
        this.searchConfigSelected.emit({
          fieldValues: dataToRevert.fieldValues,
          displayedColumnsIds: dataToRevert.displayedColumnsIds,
          viewMode: dataToRevert.viewMode,
        });
      });

    this.currentConfigSub = this.searchConfigStore.currentConfig$
      .pipe(
        debounceTime(50),
        withLatestFrom(this.searchConfigStore.currentEffectiveData$),
      )
      .subscribe(([config, currentData]) => {
        this.searchConfigSelected.emit(
          config
            ? {
                fieldValues: hasValues(config)
                  ? config.values
                  : currentData.fieldValues,
                displayedColumnsIds: hasColumns(config)
                  ? config.columns
                  : currentData.displayedColumnsIds,
                viewMode: hasValues(config)
                  ? config.isAdvanced
                    ? advancedViewMode
                    : basicViewMode
                  : currentData.viewMode,
              }
            : undefined,
        );
        this.setSearchConfigControl(
          config && hasValues(config) ? config : null,
        );
      });
  }
  ngOnDestroy(): void {
    this.currentConfigSub?.unsubscribe();
    this.dataRevertSub?.unsubscribe();
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      searchConfig: new FormControl<SearchConfigInfo | null>(null),
    });
  }

  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config);
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.searchConfigService.configuration = new Configuration({
      basePath: Location.joinWithSlash(config.baseUrl, environment.apiPrefix),
    });
    this.baseUrl.next(config.baseUrl);
  }

  onSearchConfigChange(event: {
    originalEvent: Event;
    value: SearchConfigInfo;
  }) {
    if (event.value.id === this.addSearchConfigOption.id) {
      return this.onSearchConfigSave();
    }

    setTimeout(() => {
      this.searchConfigStore.setCurrentConfig(event.value);
    });
  }

  onSearchConfigSave() {
    this.portalDialogService
      .openDialog<CreateOrEditSearchDialogContent>(
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CREATE_HEADER',
        CreateOrEditSearchConfigDialogComponent,
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CONFIRM',
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CANCEL',
      )
      .pipe(
        withLatestFrom(
          this.appStateService.currentMfe$.asObservable(),
          this.searchConfigStore.currentPageData$,
        ),
        mergeMap(([dialogResult, currentMfe, pageData]) => {
          if (!dialogResult || !dialogResult.result) {
            return of(undefined);
          }
          if (dialogResult.button !== 'primary') {
            return of(undefined);
          }
          return this.saveSearchConfig(
            dialogResult.result,
            currentMfe,
            pageData,
          );
        }),
      )
      .subscribe((response) => {
        if (response && response.id) {
          this.portalMessageService.info({
            summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CREATE_SUCCESS',
          });
          const config = response.configs.find(
            (config) => config.id === response.id,
          );
          config && this.setSearchConfigControl(config);
          setTimeout(() => {
            config && this.searchConfigStore.addSearchConfig(config);
          });
          setTimeout(() => {
            config && this.searchConfigStore.setCurrentConfig(config);
          });
        } else {
          this.setSearchConfigControl(null);
        }
      });
  }

  onSearchConfigEdit(event: Event, searchConfig: SearchConfigInfo) {
    event.stopPropagation();
    setTimeout(() => {
      this.searchConfigStore.enterEditMode(searchConfig);
    });
  }

  onSearchConfigSaveEdit(event: Event) {
    event.stopPropagation();
    const searchConfig = this.getSearchConfigControl();
    this.portalDialogService
      .openDialog<CreateOrEditSearchDialogContent>(
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_HEADER',
        {
          type: CreateOrEditSearchConfigDialogComponent,
          inputs: {
            searchConfigName: searchConfig.name,
            saveInputValues: Object.keys(searchConfig.values ?? {}).length > 0,
            saveColumns: (searchConfig.columns ?? []).length > 0,
          },
        },
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CONFIRM',
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CANCEL',
      )
      .pipe(
        mergeMap((dialogResult) => {
          return this.getSearchConfig(searchConfig).pipe(
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
      .subscribe((response) => {
        const config = response?.configs.find((c) => c.id === searchConfig.id);
        if (response && config) {
          this.portalMessageService.info({
            summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_SUCCESS',
          });
          setTimeout(() => {
            this.searchConfigStore.saveEdit(config);
          });
        } else {
          this.setSearchConfigControl(null);
          setTimeout(() => {
            this.searchConfigStore.cancelEdit();
          });
        }
      });
  }

  onSearchConfigCancelEdit() {
    setTimeout(() => {
      this.searchConfigStore.cancelEdit();
    });
  }

  onSearchConfigDelete(event: Event, searchConfig: SearchConfigInfo) {
    event.stopPropagation();

    this.deleteSearchConfig(searchConfig.id).subscribe((result) => {
      if (result !== undefined) {
        this.portalMessageService.info({
          summaryKey: 'SEARCH_CONFIG.DELETE_SUCCESS',
        });
        setTimeout(() => {
          this.searchConfigStore.deleteSearchConfig(searchConfig);
        });
        if (this.getSearchConfigControl() === searchConfig) {
          this.setSearchConfigControl(null);
        }
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

  private saveSearchConfig(
    configData: CreateOrEditSearchDialogContent,
    currentMfe: MfeInfo,
    data: PageData,
  ) {
    const request: CreateSearchConfigRequest = {
      appId: currentMfe.appId,
      productName: currentMfe.productName,
      fieldListVersion: 0,
      isReadonly: false,
      page: data.pageName,
      name: configData.searchConfigName ?? '',
      isAdvanced: configData.saveInputValues
        ? data.viewMode === advancedViewMode
        : false,
      columns: configData.saveColumns ? data.displayedColumnsIds : [],
      values: configData.saveInputValues
        ? parseFieldValues(data.fieldValues)
        : {},
    };
    return this.searchConfigService.createSearchConfig(request).pipe(
      catchError((error) => {
        console.error(error);
        this.portalMessageService.error({
          summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CREATE_FAILURE',
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
          ? parseFieldValues(data.fieldValues)
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

  private setSearchConfigControl(value: SearchConfigInfo | undefined | null) {
    this.formGroup?.get('searchConfig')?.setValue(value);
  }

  private getSearchConfigControl(): SearchConfigInfo {
    return this.formGroup?.get('searchConfig')?.value;
  }
}
