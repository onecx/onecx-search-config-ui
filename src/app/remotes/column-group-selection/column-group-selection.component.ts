import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  EnvironmentInjector,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  inject,
  runInInjectionContext,
} from '@angular/core';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import {
  AsyncTranslateLoader,
  CachingTranslateLoader,
  DataTableColumn,
  TranslateCombinedLoader,
  TranslationCacheService,
  createRemoteComponentTranslateLoader,
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
  ReplaySubject,
  catchError,
  combineLatest,
  filter,
  map,
  mergeMap,
  of,
  withLatestFrom,
} from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';
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
  ConfigData,
  SearchConfigStore,
} from '../../shared/search-config.store';
import { PrimeIcons } from 'primeng/api';
import {
  CreateOrEditSearchConfigDialogComponent,
  CreateOrEditSearchDialogContent,
} from 'src/app/shared/components/create-or-edit-search-config-dialog/create-or-edit-search-config-dialog.component';

export function createTranslateLoader(
  httpClient: HttpClient,
  baseUrl: ReplaySubject<string>,
  translationCacheService: TranslationCacheService,
  appStateService: AppStateService,
) {
  const injector = inject(EnvironmentInjector);
  return new AsyncTranslateLoader(
    appStateService.currentMfe$.pipe(
      map((currentMfe) => {
        return new TranslateCombinedLoader(
          runInInjectionContext(injector, () =>
            createRemoteComponentTranslateLoader(httpClient, baseUrl),
          ),
          new CachingTranslateLoader(
            translationCacheService,
            httpClient,
            Location.joinWithSlash(currentMfe.remoteBaseUrl, 'assets/i18n/'),
            '.json',
          ),
        );
      }),
    ),
  );
}

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
  ],
  providers: [
    PortalMessageService,
    {
      provide: BASE_URL,
      useValue: new ReplaySubject<string>(1),
    },
    providePortalDialogService(),
    provideTranslateServiceForRoot({
      isolate: true,
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient, BASE_URL, TranslationCacheService, AppStateService],
      },
    }),
    SearchConfigStore,
  ],
})
export class OneCXColumnGroupSelectionComponent
  implements ocxRemoteComponent, ocxRemoteWebcomponent, OnInit
{
  @Input() set pageName(value: string) {
    this.searchConfigStore.setPageName(value);
  }

  @Input() set selectedGroupKey(value: string) {
    this.searchConfigStore.setSelectedGroupKey({ groupKey: value });
  }

  columns$ = new BehaviorSubject<DataTableColumn[]>([]);
  @Input()
  get columns(): DataTableColumn[] {
    return this.columns$.getValue();
  }
  set columns(value: DataTableColumn[]) {
    this.columns$.next(value);
  }

  @Input() defaultGroupKey = '';
  @Input() customGroupKey = '';
  @Input() placeholderKey = '';

  @Input() groupSelectionChanged: EventEmitter<{
    activeColumns: DataTableColumn[];
    groupKey: string;
  }> = new EventEmitter();

  storeName = 'ocx-column-group-selection-component-store';
  editIcon = PrimeIcons.PENCIL;
  deleteIcon = PrimeIcons.TRASH;
  stopIcon = PrimeIcons.TIMES;
  saveIcon = PrimeIcons.CHECK;

  readonly vm$ = this.searchConfigStore.columnSelectionVm$;

  constructor(
    @Inject(BASE_URL) private baseUrl: ReplaySubject<string>,
    private userService: UserService,
    private translateService: TranslateService,
    private searchConfigService: SearchConfigAPIService,
    private appStateService: AppStateService,
    private searchConfigStore: SearchConfigStore,
    private portalDialogService: PortalDialogService,
    private portalMessageService: PortalMessageService,
  ) {
    this.userService.lang$.subscribe((lang) => this.translateService.use(lang));

    this.searchConfigStore.setStoreName(this.storeName);

    this.searchConfigStore.currentRevertConfig$.subscribe((config) => {
      config &&
        this.searchConfigStore.setSelectedGroupKey({
          groupKey: config.columnGroupKey,
        });
    });

    this.searchConfigStore.currentConfig$
      .pipe(
        withLatestFrom(
          this.searchConfigStore.selectedGroupKey$,
          this.searchConfigStore.groupKeys$,
          this.searchConfigStore.searchConfigsWithOnlyColumns$,
        ),
      )
      .subscribe(([config, selectedGroupKey, groupKeys, searchConfigs]) => {
        if (
          config &&
          config.columns.length > 0 &&
          Object.keys(config.values).length <= 0
        ) {
          if (selectedGroupKey !== config.name) {
            const activeColumns = this.columns.filter((c) =>
              config.columns.includes(c.id),
            );
            this.groupSelectionChanged.emit({
              activeColumns,
              groupKey: config.name,
            });
          }
          return;
        } else if (
          config &&
          config.columns.length > 0 &&
          Object.keys(config.values).length > 0
        ) {
          this.searchConfigStore.setSelectedGroupKey({
            groupKey: config?.name,
          });
          return;
        } else if (
          groupKeys.includes(selectedGroupKey) ||
          selectedGroupKey === this.customGroupKey
        ) {
          return;
        } else {
          this.searchConfigStore.setSelectedGroupKey({
            groupKey: this.customGroupKey,
          });
          return;
        }
      });

    this.searchConfigStore.selectedGroupKey$
      .pipe(
        withLatestFrom(
          this.searchConfigStore.currentConfig$,
          this.searchConfigStore.groupKeys$,
          this.searchConfigStore.searchConfigsWithOnlyColumns$,
        ),
      )
      .subscribe(([selectedGroupKey, config, groupKeys, searchConfigs]) => {
        if (selectedGroupKey === '') {
          return;
        } else if (selectedGroupKey === this.customGroupKey) {
          return;
        }

        if (groupKeys.includes(selectedGroupKey)) {
          const activeColumns = this.columns.filter((c) =>
            c.predefinedGroupKeys?.includes(selectedGroupKey),
          );
          this.groupSelectionChanged.emit({
            activeColumns,
            groupKey: selectedGroupKey,
          });
        } else if (
          searchConfigs.map((c) => c.name).includes(selectedGroupKey)
        ) {
          const searchConfig = searchConfigs.find(
            (c) => c.name === selectedGroupKey,
          );
          searchConfig &&
            this.searchConfigStore.setCurrentConfig({
              newCurrentConfig: searchConfig,
            });
          const activeColumns = this.columns.filter((c) =>
            searchConfig?.columns.includes(c.id),
          );
          searchConfig &&
            this.groupSelectionChanged.emit({
              activeColumns,
              groupKey: selectedGroupKey,
            });
        } else {
          const activeColumns = this.columns.filter((c) =>
            config?.columns.includes(c.id),
          );
          this.groupSelectionChanged.emit({
            activeColumns,
            groupKey: selectedGroupKey,
          });
        }
      });

    combineLatest([
      this.baseUrl,
      this.searchConfigStore.searchConfigs$,
      this.searchConfigStore.pageName$,
      this.appStateService.currentMfe$.asObservable(),
    ])
      .pipe(
        filter(
          ([_, configs, pageName, __]) =>
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

  ngOnInit() {
    combineLatest([this.columns$])
      .pipe(
        map(([columns]) =>
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
        this.searchConfigStore.setGroupKeys({ groupKeys: groupKeys });
      });
  }

  onSearchConfigEdit(event: Event, searchConfig: SearchConfigInfo | undefined) {
    event.stopPropagation();

    if (searchConfig === undefined) {
      return;
    }

    this.searchConfigStore.setEditMode({});
    this.searchConfigStore.setCurrentConfig({
      newCurrentConfig: searchConfig,
    });
  }

  onSearchConfigSaveEdit(event: Event, config: SearchConfigInfo | undefined) {
    event.stopPropagation();

    if (config === undefined) {
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
        withLatestFrom(this.searchConfigStore.state$),
        mergeMap(([{ config, result }, state]) => {
          if (!config) {
            return of(undefined);
          }
          if (result.button !== 'primary') {
            return of(undefined);
          }
          return this.editSearchConfig(config, result.result, {
            values: state.fieldValues,
            columns: state.displayedColumns,
            pageName: state.pageName,
            columnGroupKey: state.selectedGroupKey,
          });
        }),
      )
      .subscribe((response: UpdateSearchConfigResponse | undefined) => {
        if (response) {
          this.portalMessageService.info({
            summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_SUCCESS',
          });
          const searchConfig = response.configs.find((c) => c.id === config.id);
          searchConfig &&
            this.searchConfigStore.editSearchConfig({
              searchConfig: searchConfig,
            });
        }
        this.searchConfigStore.saveEdit();
      });
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

  onSearchConfigCancelEdit(event: Event) {
    this.searchConfigStore.cancelEdit();
  }

  onSearchConfigDelete(
    event: Event,
    searchConfig: SearchConfigInfo | undefined,
  ) {
    event.stopPropagation();

    if (searchConfig === undefined) {
      return;
    }

    this.deleteSearchConfig(searchConfig.id).subscribe((result) => {
      if (result !== undefined) {
        this.portalMessageService.info({
          summaryKey: 'SEARCH_CONFIG.DELETE_SUCCESS',
        });
        this.searchConfigStore.deleteSearchConfig({
          searchConfig: searchConfig,
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

  changeGroupSelection(event: { value: string }) {
    this.searchConfigStore.setSelectedGroupKey({ groupKey: event.value });
  }

  clearGroupSelection() {
    this.searchConfigStore.setSelectedGroupKey({
      groupKey: this.defaultGroupKey,
    });
  }

  hasConfig(configs: SearchConfigInfo[], name: string): boolean {
    return configs.find((c) => c.name === name) !== undefined;
  }

  isReadonly(configs: SearchConfigInfo[], name: string): boolean {
    return configs.find((c) => c.name === name)?.isReadonly ?? false;
  }

  getConfigByName(
    configs: SearchConfigInfo[],
    name: string,
  ): SearchConfigInfo | undefined {
    return configs.find((c) => c.name === name);
  }
}
