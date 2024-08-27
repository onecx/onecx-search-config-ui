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
import {
  CreateOrEditSearchConfigDialogComponent,
  CreateOrEditSearchDialogContent,
} from './create-or-edit-search-config-dialog/create-or-edit-search-config-dialog.component';
import { DropdownModule } from 'primeng/dropdown';
import { MfeInfo } from '@onecx/integration-interface';
import {
  ConfigData,
  SearchConfigStore,
} from '../../shared/search-config.store';
import { PrimeIcons } from 'primeng/api';

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
    SearchConfigStore,
  ],
})
export class OneCXSearchConfigComponent
  implements ocxRemoteComponent, ocxRemoteWebcomponent, OnInit
{
  @Input() set pageName(value: string) {
    this.searchConfigStore.setPageName(value);
  }
  @Input() set currentInputFieldValues(value: { [key: string]: unknown }) {
    this.searchConfigStore.updateFieldValues({
      values: value,
    });
  }
  @Input() set displayedColumns(value: string[]) {
    this.searchConfigStore.updateDisplayedColumns({
      newDisplayedColumns: value,
    });
  }

  @Input() searchConfigSelected: EventEmitter<{
    inputValues: { [key: string]: unknown };
    displayedColumns: string[];
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
      this.searchConfigStore.searchConfigs$,
      this.searchConfigStore.pageName$,
      this.appStateService.currentMfe$.asObservable(),
    ])
      .pipe(
        filter(
          ([_, configs, pageName, currentMfe]) =>
            pageName.length > 0 && configs.length <= 0,
        ),
        mergeMap(([_, __, pageName, currentMfe]) => {
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
          newSearchConfigs: searchConfigs,
        });
      });

    // this.searchConfigStore.currentRevertConfig$.subscribe((config) => {
    //   this.searchConfigSelected.emit(
    //     config
    //       ? {
    //           inputValues: config?.values,
    //           displayedColumns: config?.columns,
    //         }
    //       : undefined,
    //   );
    //   this.setSearchConfigControl(null);
    // });

    this.searchConfigStore.currentConfig$.subscribe((config) => {
      console.log('config', config);
      this.searchConfigSelected.emit(
        config
          ? {
              inputValues: config?.values,
              displayedColumns: config?.columns,
            }
          : undefined,
      );
      this.setSearchConfigControl(config ?? null);
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
      newCurrentConfig: event.value,
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
          this.searchConfigStore.state$,
        ),
        mergeMap(([dialogResult, currentMfe, state]) => {
          if (dialogResult?.button !== 'primary') {
            return of(undefined);
          }
          return this.saveSearchConfig(dialogResult.result, currentMfe, {
            pageName: state.pageName,
            values: state.fieldValues,
            columns: state.displayedColumns
          });
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
              newSearchConfig: config,
            });
          config &&
            this.searchConfigStore.setCurrentConfig({
              newCurrentConfig: config,
            });
        } else {
          this.setSearchConfigControl(null);
        }
      });
  }

  private saveSearchConfig(
    configData: CreateOrEditSearchDialogContent | undefined,
    currentMfe: MfeInfo,
    data: ConfigData,
  ) {
    const request: CreateSearchConfigRequest = {
      appId: currentMfe.appId,
      productName: currentMfe.productName,
      page: data.pageName,
      fieldListVersion: 0,
      name: configData?.searchConfigName ?? '',
      isReadonly: false,
      // TODO
      isAdvanced: false,
      columns: configData?.saveColumns ? data.columns : [],
      values: configData?.saveInputValues
        ? Object.fromEntries(
            Object.entries(data.values).map(([name, value]) => [
              name,
              String(value),
            ]),
          )
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

  onSearchConfigEdit(event: Event, searchConfig: SearchConfigInfo) {
    //   event.stopPropagation();
    //   this.searchConfigStore.setEditMode();
    //   this.searchConfigStore.setCurrentConfig(searchConfig);
  }

  onSearchConfigSaveEdit(event: Event) {
    //   event.stopPropagation();
    //   const searchConfig = this.getSearchConfigControl();
    //   this.portalDialogService
    //     .openDialog<CreateOrEditSearchDialogContent>(
    //       'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_HEADER',
    //       {
    //         type: CreateOrEditSearchConfigDialogComponent,
    //         inputs: {
    //           searchConfigName: searchConfig.name,
    //           saveInputValues: Object.keys(searchConfig.values ?? {}).length > 0,
    //           saveColumns: (searchConfig.columns ?? []).length > 0,
    //         },
    //       },
    //       'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CONFIRM',
    //       'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CANCEL',
    //     )
    //     .pipe(
    //       mergeMap((dialogResult) => {
    //         return this.getSearchConfig(searchConfig).pipe(
    //           map((response) => {
    //             return {
    //               config: response?.config,
    //               result: dialogResult,
    //             };
    //           }),
    //         );
    //       }),
    //       withLatestFrom(this.searchConfigStore.currentData$),
    //       mergeMap(([{ config, result }, data]) => {
    //         if (!config) {
    //           return of(undefined);
    //         }
    //         if (result.button !== 'primary') {
    //           return of(undefined);
    //         }
    //         return this.editSearchConfig(config, result.result, data);
    //       }),
    //     )
    //     .subscribe((response) => {
    //       if (response) {
    //         this.portalMessageService.info({
    //           summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_SUCCESS',
    //         });
    //         const config = response.configs.find((c) => c.id === searchConfig.id);
    //         config && this.setSearchConfigControl(config);
    //         config && this.searchConfigStore.editSearchConfig(config);
    //       } else {
    //         this.setSearchConfigControl(null);
    //       }
    //       this.searchConfigStore.saveEdit();
    //     });
  }

  onSearchConfigCancelEdit(event: Event) {
    //   this.searchConfigStore.cancelEdit();
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
    data: ConfigData,
  ) {
    const request: UpdateSearchConfigRequest = {
      searchConfig: {
        ...config,
        name: configData?.searchConfigName ?? config.name ?? '',
        columns: configData?.saveColumns ? data.columns : [],
        values: configData?.saveInputValues
          ? Object.fromEntries(
              Object.entries(data.values).map(([name, value]) => [
                name,
                String(value),
              ]),
            )
          : {},
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

  private setSearchConfigControl(value: SearchConfigInfo | undefined | null) {
    this.formGroup?.get('searchConfig')?.setValue(value);
  }

  private getSearchConfigControl(): SearchConfigInfo {
    return this.formGroup?.get('searchConfig')?.value;
  }
}
