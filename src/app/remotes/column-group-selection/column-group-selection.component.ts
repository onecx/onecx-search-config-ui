import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Inject, Input, OnInit } from '@angular/core';
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
  UserService,
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
  Observable,
  ReplaySubject,
  combineLatest,
  filter,
  map,
  mergeMap,
} from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import {
  Configuration,
  SearchConfigAPIService,
  SearchConfigInfo,
} from 'src/app/shared/generated';
import { environment } from 'src/environments/environment';
import { SearchConfigStore } from '../../shared/search-config.store';

// TODO: its giving injection error
// export function createTranslateLoader(
//   httpClient: HttpClient,
//   baseUrl: ReplaySubject<string>,
//   translationCacheService: TranslationCacheService,
//   appStateService: AppStateService,
// ) {
//   return new AsyncTranslateLoader(
//     appStateService.currentMfe$.pipe(
//       map((currentMfe) => {
//         return new TranslateCombinedLoader(
//           createRemoteComponentTranslateLoader(httpClient, baseUrl),
//           new CachingTranslateLoader(
//             translationCacheService,
//             httpClient,
//             Location.joinWithSlash(currentMfe.remoteBaseUrl, 'assets/i18n/'),
//             '.json',
//           ),
//         );
//       }),
//     ),
//   );
// }

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
  ],
  providers: [
    {
      provide: BASE_URL,
      useValue: new ReplaySubject<string>(1),
    },
    provideTranslateServiceForRoot({
      isolate: true,
      loader: {
        provide: TranslateLoader,
        useFactory: createRemoteComponentTranslateLoader,
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
    this.searchConfigStore.setSelectedGroupKey(value);
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

  readonly vm$ = this.searchConfigStore.columnSelectionVm$;

  constructor(
    @Inject(BASE_URL) private baseUrl: ReplaySubject<string>,
    private userService: UserService,
    private translateService: TranslateService,
    private searchConfigService: SearchConfigAPIService,
    private appStateService: AppStateService,
    private searchConfigStore: SearchConfigStore,
  ) {
    this.userService.lang$.subscribe((lang) => this.translateService.use(lang));

    this.searchConfigStore.setStoreName(this.storeName);

    this.searchConfigStore.currentColumnsData$.subscribe(
      ({
        currentSearchConfig,
        selectedGroupKey,
        groupKeys,
        searchConfigsWithOnlyColumns,
      }) => {
        if (
          selectedGroupKey === '' ||
          groupKeys.length <= 0 ||
          searchConfigsWithOnlyColumns.length <= 0
        ) {
          return;
        }

        // if we already have correct combo just leave it
        if (currentSearchConfig?.name === selectedGroupKey) return;
        else if (currentSearchConfig === undefined) {
          // search config will reset and we have only columns set
          // or will reset and we have a input + columns config
          if (
            selectedGroupKey !== '' &&
            (searchConfigsWithOnlyColumns
              .map((config) => config.id)
              .includes(selectedGroupKey) ||
              !groupKeys.includes(selectedGroupKey))
          ) {
            this.searchConfigStore.setSelectedGroupKey(this.customGroupKey);
          }
          // rest we leave what was selected
        } else if (currentSearchConfig.columns.length > 0) {
          const activeColumns = this.columns.filter((c) =>
            currentSearchConfig.columns.includes(c.id),
          );
          this.groupSelectionChanged.emit({
            activeColumns,
            groupKey: currentSearchConfig.name,
          });
          this.searchConfigStore.setSelectedGroupKey(currentSearchConfig.name);
        } else if (currentSearchConfig.columns.length <= 0) {
          if (
            selectedGroupKey !== '' &&
            (searchConfigsWithOnlyColumns
              .map((config) => config.id)
              .includes(selectedGroupKey) ||
              !groupKeys.includes(selectedGroupKey))
          ) {
            this.searchConfigStore.setSelectedGroupKey(this.customGroupKey);
          }
        }
      },
    );

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
        this.searchConfigStore.setGroupKeys(groupKeys);
      });
  }

  changeGroupSelection(event: { value: string }) {
    this.searchConfigStore.setSelectedGroupKey(event.value);
  }

  clearGroupSelection() {
    this.searchConfigStore.setSelectedGroupKey(this.defaultGroupKey);
  }
}
