import { CommonModule, Location } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Component, EventEmitter, Inject, Input, OnInit } from '@angular/core'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import {
  AsyncTranslateLoader,
  CachingTranslateLoader,
  DataTableColumn,
  TranslateCombinedLoader,
  TranslationCacheService,
  createRemoteComponentTranslateLoader
} from '@onecx/angular-accelerator'
import { AppStateService, PortalCoreModule, UserService } from '@onecx/portal-integration-angular'
import {
  AngularRemoteComponentsModule,
  BASE_URL,
  RemoteComponentConfig,
  ocxRemoteComponent,
  ocxRemoteWebcomponent,
  provideTranslateServiceForRoot
} from '@onecx/angular-remote-components'
import { BehaviorSubject, Observable, ReplaySubject, combineLatest, filter, map, mergeMap } from 'rxjs'
import { SharedModule } from 'src/app/shared/shared.module'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ButtonModule } from 'primeng/button'
import { DropdownModule } from 'primeng/dropdown'
import { Configuration, SearchConfigAPIService, SearchConfigInfo } from 'src/app/shared/generated'
import { environment } from 'src/environments/environment'
import { EventsTopic } from '@onecx/integration-interface'

// TODO: its giving injection error
export function createTranslateLoader(
  httpClient: HttpClient,
  baseUrl: ReplaySubject<string>,
  translationCacheService: TranslationCacheService,
  appStateService: AppStateService
) {
  return new AsyncTranslateLoader(
    appStateService.currentMfe$.pipe(
      map((currentMfe) => {
        return new TranslateCombinedLoader(
          createRemoteComponentTranslateLoader(httpClient, baseUrl),
          new CachingTranslateLoader(
            translationCacheService,
            httpClient,
            Location.joinWithSlash(currentMfe.remoteBaseUrl, 'assets/i18n/'),
            '.json'
          )
        )
      })
    )
  )
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
    DropdownModule
  ],
  providers: [
    {
      provide: BASE_URL,
      useValue: new ReplaySubject<string>(1)
    },
    provideTranslateServiceForRoot({
      isolate: true,
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient, BASE_URL, TranslationCacheService, AppStateService]
      }
    })
  ]
})
export class OneCXColumnGroupSelectionComponent implements ocxRemoteComponent, ocxRemoteWebcomponent, OnInit {
  private eventsTopic$ = new EventsTopic()

  private _pageName = new BehaviorSubject<string>('')
  @Input() get pageName(): string {
    return this._pageName.getValue()
  }
  set pageName(value: string) {
    this._pageName.next(value)
  }
  selectedGroupKey$ = new BehaviorSubject<string>('')
  @Input()
  get selectedGroupKey(): string {
    return this.selectedGroupKey$.getValue()
  }
  set selectedGroupKey(value: string) {
    this.selectedGroupKey$.next(value)
  }
  columns$ = new BehaviorSubject<DataTableColumn[]>([])
  @Input()
  get columns(): DataTableColumn[] {
    return this.columns$.getValue()
  }
  set columns(value: DataTableColumn[]) {
    this.columns$.next(value)
  }

  @Input() defaultGroupKey = ''
  @Input() customGroupKey = ''
  @Input() placeholderKey = ''

  @Input() groupSelectionChanged: EventEmitter<{ activeColumns: DataTableColumn[]; groupKey: string }> =
    new EventEmitter()

  allGroupKeys$: Observable<string[]> | undefined
  searchConfigs$: BehaviorSubject<SearchConfigInfo[]> = new BehaviorSubject<SearchConfigInfo[]>([])
  searchConfigsWithColumns$: Observable<SearchConfigInfo[]>

  constructor(
    @Inject(BASE_URL) private baseUrl: ReplaySubject<string>,
    private userService: UserService,
    private translateService: TranslateService,
    private searchConfigService: SearchConfigAPIService,
    private appStateService: AppStateService
  ) {
    this.userService.lang$.subscribe((lang) => this.translateService.use(lang))

    this.eventsTopic$.pipe(filter((e) => e.type === 'searchConfig#configChange')).subscribe((e) => {
      console.log(e)
      const payload: any = e.payload
      const config: SearchConfigInfo = payload.config

      if (config && config.columns.length > 0) {
        this.selectedGroupKey = config.name
        this.changeGroupSelection({ value: config.name })
      } else {
        if (this.isSearchConfigSelected()) {
          this.selectedGroupKey = this.customGroupKey
          this.changeGroupSelection({ value: this.customGroupKey })
        }
      }
    })

    this.eventsTopic$.pipe(filter((e) => e.type === 'searchConfig#configCreate')).subscribe((e) => {
      // const payload: any = e.payload
      // const config: SearchConfigInfo = payload.config
    })

    this.eventsTopic$.pipe(filter((e) => e.type === 'searchConfig#configUpdate')).subscribe((e) => {
      // const payload: any = e.payload
      // const config: SearchConfigInfo = payload.config
    })

    this.eventsTopic$.pipe(filter((e) => e.type === 'searchConfig#configDelete')).subscribe((e) => {
      // const payload: any = e.payload
      // const config: SearchConfigInfo = payload.config
    })

    combineLatest([this.baseUrl, this._pageName, this.appStateService.currentMfe$.asObservable()])
      .pipe(
        filter(([_, pageName, currentMfe]) => pageName.length > 0),
        mergeMap(([_, pageName, currentMfe]) => {
          return this.searchConfigService
            .getSearchConfigInfos({
              getSearchConfigInfosRequest: {
                appId: currentMfe.appId,
                page: pageName,
                productName: currentMfe.productName
              }
            })
            .pipe(map((response) => response.configs))
        })
      )
      .subscribe(this.searchConfigs$)

    this.searchConfigsWithColumns$ = this.searchConfigs$
      .asObservable()
      .pipe(map((configs) => configs.filter((config) => config.columns.length > 0)))
  }

  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.searchConfigService.configuration = new Configuration({
      basePath: Location.joinWithSlash(config.baseUrl, environment.apiPrefix)
    })
    this.baseUrl.next(config.baseUrl)
  }

  ngOnInit() {
    this.allGroupKeys$ = combineLatest([this.columns$, this.selectedGroupKey$, this.searchConfigsWithColumns$]).pipe(
      map(([columns, selectedGroupKey, configs]) =>
        columns
          .map((keys) => keys.predefinedGroupKeys || [])
          .flat()
          .concat([this.defaultGroupKey])
          .concat([selectedGroupKey])
          .concat(configs.map((config) => config.name ?? ''))
          .filter((value) => !!value)
          .filter((value, index, self) => self.indexOf(value) === index && value != null)
      )
    )
  }

  changeGroupSelection(event: { value: string }) {
    if (event.value === this.customGroupKey) {
      return
    }
    const searchConfig = this.searchConfigs$.getValue().find((config) => config.name === event.value)
    if (searchConfig === undefined) {
      const activeColumns = this.columns.filter((c) => c.predefinedGroupKeys?.includes(event.value))
      this.groupSelectionChanged.emit({ activeColumns, groupKey: event.value })
      return
    }

    const activeColumns = this.columns.filter((c) => searchConfig.columns.includes(c.id))
    this.groupSelectionChanged.emit({ activeColumns, groupKey: event.value })
  }

  clearGroupSelection() {
    let activeColumns = this.columns
    if (this.defaultGroupKey) {
      activeColumns = this.columns.filter((column) => column.predefinedGroupKeys?.includes(this.defaultGroupKey))
    }
    this.groupSelectionChanged.emit({ activeColumns, groupKey: this.defaultGroupKey })
  }

  private isSearchConfigSelected() {
    return this.searchConfigs$.getValue().find((c) => c.name === this.selectedGroupKey)
  }
}
