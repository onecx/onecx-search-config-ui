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
  SEARCH_CONFIG_STORE_NAME,
  SearchConfigStore,
} from '../../shared/search-config.store';
import {
  CreateOrEditSearchConfigDialogComponent,
  CreateOrEditSearchDialogContent,
} from 'src/app/shared/components/create-or-edit-search-config-dialog/create-or-edit-search-config-dialog.component';
import { advancedViewMode } from 'src/app/shared/constants';
import { parseFieldValues } from 'src/app/shared/search-config.utils';

export function createTranslateLoader(
  httpClient: HttpClient,
  baseUrl: ReplaySubject<string>,
  translationCacheService: TranslationCacheService,
  appStateService: AppStateService,
) {
  return new AsyncTranslateLoader(
    appStateService.currentMfe$.pipe(
      map((currentMfe) => {
        return new TranslateCombinedLoader(
          createRemoteComponentTranslateLoader(
            httpClient,
            baseUrl,
            translationCacheService,
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
    {
      provide: SEARCH_CONFIG_STORE_NAME,
      useValue: 'ocx-column-group-selection-component-store',
    },
    SearchConfigStore,
  ],
})
export class OneCXColumnGroupSelectionComponent
  implements ocxRemoteComponent, ocxRemoteWebcomponent, OnInit, OnDestroy
{
  @Input() set selectedGroupKey(selectedGroupKey: string) {
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

  editIcon = PrimeIcons.PENCIL;
  deleteIcon = PrimeIcons.TRASH;
  stopIcon = PrimeIcons.TIMES;
  saveIcon = PrimeIcons.CHECK;

  readonly vm$ = this.searchConfigStore.columnSelectionVm$;
  pageDataRevertSub: Subscription | undefined;
  selectedGroupKeySub: Subscription | undefined;

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

    this.pageDataRevertSub = this.searchConfigStore.pageDataToRevert$
      .pipe(
        debounceTime(50),
        filter((data) => data !== undefined),
        withLatestFrom(this.searchConfigStore.state$),
      )
      .subscribe(([pageData, state]) => {
        const columnsData = pageData?.displayedColumnsIds;
        if (columnsData) {
          this.groupSelectionChanged.emit({
            activeColumns: this.columns.filter((c) =>
              columnsData.includes(c.id),
            ),
            groupKey: state.selectedGroupKey,
          });
        }
      });

    this.searchConfigStore.selectedGroupKey$
      .pipe(
        debounceTime(50),
        withLatestFrom(this.vm$, this.searchConfigStore.state$),
      )
      .subscribe(([selectedGroupKey, vm, state]) => {
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
          const displayedColumns =
            state.currentSearchConfig &&
            state.currentSearchConfig.columns.length > 0
              ? state.currentSearchConfig.columns
              : state.displayedColumnsIds;
          this.groupSelectionChanged.emit({
            activeColumns: this.columns.filter((c) =>
              displayedColumns.includes(c.id),
            ),
            groupKey: selectedGroupKey,
          });
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
    this.pageDataRevertSub?.unsubscribe();
    this.selectedGroupKeySub?.unsubscribe();
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
        withLatestFrom(this.searchConfigStore.pageData$),
        mergeMap(([{ config, result }, pageData]) => {
          if (!config) {
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

  onSearchConfigCancelEdit(event: Event) {
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

    this.deleteSearchConfig(searchConfig.id).subscribe((result) => {
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
    configs: SearchConfigInfo[],
    nonSearchConfigGroupKeys: string[],
    customGroupKey: string,
  ): boolean {
    if (name === customGroupKey || nonSearchConfigGroupKeys.includes(name))
      return false;
    else if (this.getConfigByName(configs, name)) return true;
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
