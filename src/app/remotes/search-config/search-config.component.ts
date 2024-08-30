import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Inject, Input, OnInit } from '@angular/core';
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
  ReplaySubject,
  catchError,
  combineLatest,
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
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MfeInfo } from '@onecx/integration-interface';
import {
  FieldValues,
  PageData,
  SearchConfigStore,
} from '../../shared/search-config.store';
import { PrimeIcons } from 'primeng/api';
import {
  CreateOrEditSearchConfigDialogComponent,
  CreateOrEditSearchDialogContent,
} from 'src/app/shared/components/create-or-edit-search-config-dialog/create-or-edit-search-config-dialog.component';
import {
  SEARCH_CONFIG_STORE_TOPIC,
  SearchConfigTopic,
} from 'src/app/shared/topics/search-config/v1/search-config.topic';
import { advancedViewMode, basicViewMode } from 'src/app/shared/constants';

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
      provide: SEARCH_CONFIG_STORE_TOPIC,
      useClass: SearchConfigTopic,
    },
    SearchConfigStore,
  ],
})
export class OneCXSearchConfigComponent
  implements ocxRemoteComponent, ocxRemoteWebcomponent, OnInit
{
  @Input() set pageName(pageName: string) {
    this.searchConfigStore.setPageName(pageName);
  }
  @Input() set currentInputFieldValues(values: { [key: string]: unknown }) {
    this.searchConfigStore.updateFieldValues({
      values: values,
    });
  }
  @Input() set displayedColumns(columns: string[]) {
    this.searchConfigStore.updateDisplayedColumns({
      displayedColumns: columns,
    });
  }
  @Input() set viewMode(viewMode: 'basic' | 'advanced') {
    this.searchConfigStore.updateViewMode({
      viewMode: viewMode,
    });
  }

  @Input() searchConfigSelected: EventEmitter<{
    inputValues: { [key: string]: unknown };
    displayedColumns: string[];
    viewMode: string;
  }> = new EventEmitter();

  formGroup: FormGroup | undefined;

  readonly vm$ = this.searchConfigStore.searchConfigVm$;

  addSearchConfigOption: any = {
    id: 'ocx-add-search-config-option',
  };
  plusIcon = PrimeIcons.PLUS;
  editIcon = PrimeIcons.PENCIL;
  deleteIcon = PrimeIcons.TRASH;
  stopIcon = PrimeIcons.TIMES;
  saveIcon = PrimeIcons.CHECK;
  storeName = 'ocx-search-config-component-store';

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
    this.userService.lang$.subscribe((lang) => this.translateService.use(lang));

    this.searchConfigStore.setStoreName(this.storeName);

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
        this.searchConfigStore.setSearchConfigs({
          searchConfigs: searchConfigs,
        });
      });

    // this.searchConfigStore.currentRevertConfig$.subscribe((config) => {
    //   this.searchConfigSelected.emit(
    //     config
    //       ? {
    //           inputValues: config?.fieldValues,
    //           displayedColumns: config?.displayedColumIds,
    //           viewMode: config.viewMode,
    //         }
    //       : undefined,
    //   );
    //   this.setSearchConfigControl(null);
    // });

    this.searchConfigStore.currentConfig$
      .pipe(withLatestFrom(this.searchConfigStore.pageData$))
      .subscribe(([config, pageData]) => {
        this.searchConfigSelected.emit(
          config
            ? {
                inputValues:
                  Object.keys(config?.values).length > 0
                    ? config.values
                    : pageData.fieldValues,
                displayedColumns:
                  config?.columns.length > 0
                    ? config.columns
                    : pageData.displayedColumIds,
                viewMode:
                  Object.keys(config?.values).length > 0
                    ? config.isAdvanced
                      ? advancedViewMode
                      : basicViewMode
                    : pageData.viewMode,
              }
            : undefined,
        );
        this.setSearchConfigControl(
          config && Object.keys(config?.values).length > 0 ? config : null,
        );
      });
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

    this.searchConfigStore.setCurrentConfig({
      config: event.value,
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
          this.searchConfigStore.pageData$,
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
          config &&
            this.searchConfigStore.addSearchConfig({
              searchConfig: config,
            });
          config &&
            this.searchConfigStore.setCurrentConfig({
              config: config,
            });
        } else {
          this.setSearchConfigControl(null);
        }
      });
  }

  onSearchConfigEdit(event: Event, searchConfig: SearchConfigInfo) {
    event.stopPropagation();
    // this.searchConfigStore.setEditMode({});
    this.searchConfigStore.setCurrentConfig({
      config: searchConfig,
    });
  }

  onSearchConfigSaveEdit(event: Event) {
    event.stopPropagation();
    // const searchConfig = this.getSearchConfigControl();
    // this.portalDialogService
    //   .openDialog<CreateOrEditSearchDialogContent>(
    //     'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_HEADER',
    //     {
    //       type: CreateOrEditSearchConfigDialogComponent,
    //       inputs: {
    //         searchConfigName: searchConfig.name,
    //         saveInputValues: Object.keys(searchConfig.values ?? {}).length > 0,
    //         saveColumns: (searchConfig.columns ?? []).length > 0,
    //       },
    //     },
    //     'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CONFIRM',
    //     'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CANCEL',
    //   )
    //   .pipe(
    //     mergeMap((dialogResult) => {
    //       return this.getSearchConfig(searchConfig).pipe(
    //         map((response) => {
    //           return {
    //             config: response?.config,
    //             result: dialogResult,
    //           };
    //         }),
    //       );
    //     }),
    //     withLatestFrom(this.searchConfigStore.state$),
    //     mergeMap(([{ config, result }, state]) => {
    //       if (!config) {
    //         return of(undefined);
    //       }
    //       if (result.button !== 'primary') {
    //         return of(undefined);
    //       }
    //       return this.editSearchConfig(config, result.result, {
    //         fieldValues: state.fieldValues,
    //         displayedColumIds: state.displayedColumns,
    //         pageName: state.pageName,
    //         columnGroupKey: state.selectedGroupKey,
    //         viewMode: state.viewMode,
    //       });
    //     }),
    //   )
    //   .subscribe((response) => {
    //     if (response) {
    //       this.portalMessageService.info({
    //         summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_SUCCESS',
    //       });
    //       const config = response.configs.find((c) => c.id === searchConfig.id);
    //       config && this.setSearchConfigControl(config);
    //       config &&
    //         this.searchConfigStore.editSearchConfig({ searchConfig: config });
    //     } else {
    //       this.setSearchConfigControl(null);
    //     }
    //     this.searchConfigStore.saveEdit();
    //   });
  }

  onSearchConfigCancelEdit(event: Event) {
    // this.searchConfigStore.cancelEdit();
  }

  onSearchConfigDelete(event: Event, searchConfig: SearchConfigInfo) {
    event.stopPropagation();

    this.deleteSearchConfig(searchConfig.id).subscribe((result) => {
      if (result !== undefined) {
        this.portalMessageService.info({
          summaryKey: 'SEARCH_CONFIG.DELETE_SUCCESS',
        });
        this.searchConfigStore.deleteSearchConfig({
          searchConfig: searchConfig,
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
      columns: configData.saveColumns ? data.displayedColumIds : [],
      values: configData.saveInputValues
        ? this.parseFieldValues(data.fieldValues)
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
    // const request: UpdateSearchConfigRequest = {
    //   searchConfig: {
    //     ...config,
    //     name: configData?.searchConfigName ?? config.name ?? '',
    //     columns: configData?.saveColumns ? data.displayedColumIds : [],
    //     values: configData?.saveInputValues
    //       ? Object.fromEntries(
    //           Object.entries(data.fieldValues)
    //             .filter(([_, value]) => value)
    //             .map(([name, value]) => [name, String(value)]),
    //         )
    //       : {},
    //     isAdvanced: data.viewMode === advancedViewMode,
    //   },
    // };
    // return this.searchConfigService.updateSearchConfig(config.id, request).pipe(
    //   catchError((error) => {
    //     console.error(error);
    //     this.portalMessageService.error({
    //       summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_FAILURE',
    //     });
    //     return of(undefined);
    //   }),
    // );
  }

  private setSearchConfigControl(value: SearchConfigInfo | undefined | null) {
    this.formGroup?.get('searchConfig')?.setValue(value);
  }

  private getSearchConfigControl(): SearchConfigInfo {
    return this.formGroup?.get('searchConfig')?.value;
  }

  private parseFieldValues(values: FieldValues): { [key: string]: string } {
    return Object.fromEntries(
      Object.entries(values)
        .filter(([_, value]) => values !== null)
        .map(([name, value]) => [name, value ? String(value) : '']),
    );
  }
}
