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
import { PageData, SearchConfigStore } from '../../shared/search-config.store';
import { PrimeIcons } from 'primeng/api';
import {
  CreateOrEditSearchConfigDialogComponent,
  CreateOrEditSearchDialogContent,
} from 'src/app/shared/components/create-or-edit-search-config-dialog/create-or-edit-search-config-dialog.component';
import {
  SEARCH_CONFIG_STORE_TOPIC,
  SearchConfigTopic,
} from 'src/app/shared/topics/search-config/v1/search-config.topic';
import { advancedViewMode } from 'src/app/shared/constants';

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
    {
      provide: SEARCH_CONFIG_STORE_TOPIC,
      useClass: SearchConfigTopic,
    },
    SearchConfigStore,
  ],
})
export class OneCXColumnGroupSelectionComponent
  implements ocxRemoteComponent, ocxRemoteWebcomponent, OnInit
{
  @Input() set pageName(pageName: string) {
    this.searchConfigStore.setPageName(pageName);
  }

  @Input() set selectedGroupKey(selectedGroupKey: string) {
    this.searchConfigStore.setSelectedGroupKey({
      selectedGroupKey: selectedGroupKey,
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
    this.searchConfigStore.setCustomGroupKey(key);
  }
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

    // this.searchConfigStore.currentRevertConfig$.subscribe((config) => {
    //   config &&
    //     this.searchConfigStore.setSelectedGroupKey({
    //       groupKey: config.columnGroupKey,
    //     });
    // });

    this.searchConfigStore.selectedGroupKey$
      .pipe(withLatestFrom(this.vm$))
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
        this.searchConfigStore.setNonSearchConfigGroupKeys({
          nonSearchConfigGroupKeys: groupKeys,
        });
      });
  }

  onSearchConfigEdit(event: Event, searchConfig: SearchConfigInfo | undefined) {
    event.stopPropagation();

    if (searchConfig === undefined) {
      return;
    }

    // this.searchConfigStore.setEditMode({});
    this.searchConfigStore.setCurrentConfig({
      config: searchConfig,
    });
  }

  onSearchConfigSaveEdit(event: Event, config: SearchConfigInfo | undefined) {
    event.stopPropagation();

    // if (config === undefined) {
    //   return;
    // }

    // this.portalDialogService
    //   .openDialog<CreateOrEditSearchDialogContent>(
    //     'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_HEADER',
    //     {
    //       type: CreateOrEditSearchConfigDialogComponent,
    //       inputs: {
    //         searchConfigName: config?.name,
    //         saveInputValues: Object.keys(config?.values ?? {}).length > 0,
    //         saveColumns: (config?.columns ?? []).length > 0,
    //       },
    //     },
    //     'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CONFIRM',
    //     'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CANCEL',
    //   )
    //   .pipe(
    //     mergeMap((dialogResult) => {
    //       return this.getSearchConfig(config).pipe(
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
    //   .subscribe((response: UpdateSearchConfigResponse | undefined) => {
    //     if (response) {
    //       this.portalMessageService.info({
    //         summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_SUCCESS',
    //       });
    //       const searchConfig = response.configs.find((c) => c.id === config.id);
    //       searchConfig &&
    //         this.searchConfigStore.editSearchConfig({
    //           searchConfig: searchConfig,
    //         });
    //     }
    //     this.searchConfigStore.saveEdit();
    //   });
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
    //             .filter(([_, value]) => value !== null)
    //             .map(([name, value]) => [
    //               name,
    //               value === undefined ? '' : String(value),
    //             ]),
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
    // this.searchConfigStore.cancelEdit();
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
    this.searchConfigStore.setSelectedGroupKey({
      selectedGroupKey: event.value,
    });
  }

  clearGroupSelection() {
    this.searchConfigStore.setSelectedGroupKey({
      selectedGroupKey: this.defaultGroupKey,
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
    else if (configs.find((c) => c.name === name)) return true;
    return true;
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
