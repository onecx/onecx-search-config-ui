import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  MissingTranslationHandler,
  MissingTranslationHandlerParams,
  TranslateLoader,
  TranslateModule,
  TranslateParser,
  TranslateService,
} from '@ngx-translate/core';
import {
  CachingTranslateLoader,
  DataTableColumn,
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
  tap,
  withLatestFrom,
} from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';
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
import { parseFieldValues } from 'src/app/shared/search-config.utils';
import { TooltipModule } from 'primeng/tooltip';

class MfeTranslationHandler implements MissingTranslationHandler {
  mfeTranslations = new BehaviorSubject<any>({});
  constructor(
    private httpClient: HttpClient,
    private userSerivce: UserService,
    private translationCacheService: TranslationCacheService,
    private appStateService: AppStateService,
    private translateParser: TranslateParser,
  ) {
    userSerivce.lang$
      .pipe(
        withLatestFrom(appStateService.currentMfe$.asObservable()),
        mergeMap(([lang, mfe]) => {
          const cachingTranslateLoader = new CachingTranslateLoader(
            translationCacheService,
            httpClient,
            Location.joinWithSlash(mfe.remoteBaseUrl, 'assets/i18n/'),
            '.json',
          );
          return cachingTranslateLoader.getTranslation(lang);
        }),
        tap((v) => {
          console.log(v);
        }),
      )
      .subscribe(this.mfeTranslations);
  }

  handle(params: MissingTranslationHandlerParams) {
    return this.translateParser.getValue(
      this.mfeTranslations.getValue(),
      params.key,
    );
  }
}

function createMissingTranslationHandler(
  httpClient: HttpClient,
  userSerivce: UserService,
  translationCacheService: TranslationCacheService,
  appStateService: AppStateService,
  translateParser: TranslateParser,
) {
  return new MfeTranslationHandler(
    httpClient,
    userSerivce,
    translationCacheService,
    appStateService,
    translateParser,
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
    TooltipModule,
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
        deps: [HttpClient, BASE_URL, TranslationCacheService],
      },
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useFactory: createMissingTranslationHandler,
        deps: [
          HttpClient,
          UserService,
          TranslationCacheService,
          AppStateService,
          TranslateParser,
        ],
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
  @Input() set selectedGroupKey(selectedGroupKey: string | undefined) {
    if (selectedGroupKey === undefined) return;

    setTimeout(() => {
      this.searchConfigStore.setSelectedGroupKey(selectedGroupKey);
    });
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
  @Input() set customGroupKey(key: string) {
    setTimeout(() => {
      this.searchConfigStore.setCustomGroupKey(key);
    });
  }
  @Input() placeholderKey = '';

  @Input() groupSelectionChanged: EventEmitter<{
    activeColumns: DataTableColumn[];
    groupKey: string;
  }> = new EventEmitter();

  readonly vm$ = this.searchConfigStore.columnSelectionVm$.pipe(
    debounceTime(50),
  );

  dataRevertSub: Subscription | undefined;
  selectedGroupKeySub: Subscription | undefined;

  editIcon = PrimeIcons.PENCIL;
  deleteIcon = PrimeIcons.TRASH;
  stopIcon = PrimeIcons.TIMES;
  saveIcon = PrimeIcons.CHECK;

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
    combineLatest([
      this.userService.lang$.asObservable(),
      this.appStateService.currentMfe$.asObservable(),
    ]).subscribe(([lang, _]) => {
      this.translateService.use(lang);
    });

    this.dataRevertSub = this.searchConfigStore.dataToRevert$
      .pipe(
        debounceTime(20),
        filter(
          (dataToRevert) => dataToRevert !== undefined,
        ) as OperatorFunction<RevertData | undefined, RevertData>,
      )
      .subscribe((dataToRevert) => {
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
  }

  onSearchConfigEdit(event: Event, searchConfig: SearchConfigInfo | undefined) {
    event.stopPropagation();

    if (searchConfig === undefined) {
      return;
    }

    setTimeout(() => {
      this.searchConfigStore.enterEditMode(searchConfig);
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

  onSearchConfigDelete(
    event: Event,
    searchConfig: SearchConfigInfo | undefined,
  ) {
    event.stopPropagation();

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

  changeGroupSelection(event: { value: string }) {
    if (event.value) {
      setTimeout(() => {
        this.searchConfigStore.setSelectedGroupKey(event.value);
      });
    }
  }

  clearGroupSelection() {
    setTimeout(() => {
      this.searchConfigStore.setSelectedGroupKey(this.defaultGroupKey);
    });
  }

  isSearchConfig(
    name: string,
    nonSearchConfigGroupKeys: string[],
    customGroupKey: string,
  ): boolean {
    if (name === customGroupKey || nonSearchConfigGroupKeys.includes(name))
      return false;
    return true;
  }

  isReadonly(configs: SearchConfigInfo[], name: string): boolean {
    return this.getConfigByName(configs, name)?.isReadonly ?? false;
  }

  getConfigByName(
    configs: SearchConfigInfo[],
    name: string,
  ): SearchConfigInfo | undefined {
    return configs.find((c) => c.name === name);
  }
}
