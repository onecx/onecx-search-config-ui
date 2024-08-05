import { CommonModule, Location } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Component, EventEmitter, Inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { DataTableColumn, createRemoteComponentTranslateLoader } from '@onecx/angular-accelerator'
import {
  PortalCoreModule,
  PortalDialogService,
  PortalMessageService,
  UserService,
  providePortalDialogService
} from '@onecx/portal-integration-angular'
import {
  AngularRemoteComponentsModule,
  BASE_URL,
  RemoteComponentConfig,
  ocxRemoteComponent,
  ocxRemoteWebcomponent,
  provideTranslateServiceForRoot
} from '@onecx/angular-remote-components'
import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  catchError,
  combineLatest,
  filter,
  map,
  mergeMap,
  of,
  tap
} from 'rxjs'
import {
  Configuration,
  CreateSearchConfigRequest,
  SearchConfigAPIService,
  SearchConfigInfo,
  UpdateSearchConfigRequest
} from 'src/app/shared/generated'
import { SharedModule } from 'src/app/shared/shared.module'
import { environment } from 'src/environments/environment'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ButtonModule } from 'primeng/button'
import {
  CreateOrEditSearchConfigDialogComponent,
  CreateOrEditSearchDialogContent
} from './create-or-edit-search-config-dialog/create-or-edit-search-config-dialog.component'
import { DropdownModule } from 'primeng/dropdown'

@Component({
  selector: 'app-ocx-search-config',
  standalone: true,
  templateUrl: './search-config.component.html',
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
    DropdownModule
  ],
  providers: [
    PortalMessageService,
    {
      provide: BASE_URL,
      useValue: new ReplaySubject<string>(1)
    },
    provideTranslateServiceForRoot({
      isolate: true,
      loader: {
        provide: TranslateLoader,
        useFactory: createRemoteComponentTranslateLoader,
        deps: [HttpClient, BASE_URL]
      }
    }),
    providePortalDialogService()
  ]
})
export class OneCXSearchConfigComponent implements ocxRemoteComponent, ocxRemoteWebcomponent, OnChanges, OnInit {
  private _pageName = new BehaviorSubject<string>('')
  @Input() get pageName(): string {
    return this._pageName.getValue()
  }
  set pageName(value: string) {
    this._pageName.next(value)
  }
  @Input() currentInputFieldValues: { [key: string]: unknown } = {}
  @Input() displayedColumns: DataTableColumn[] = []
  @Input() searchConfigSelected: EventEmitter<{
    inputValues: { [key: string]: unknown }
    displayedColumns: DataTableColumn[]
  }> = new EventEmitter()

  searchConfigs$: Observable<SearchConfigInfo[]>
  formGroup: FormGroup | undefined
  searchConfigReload$: BehaviorSubject<undefined> = new BehaviorSubject(undefined)

  constructor(
    @Inject(BASE_URL) private baseUrl: ReplaySubject<string>,
    private userService: UserService,
    private translateService: TranslateService,
    private searchConfigService: SearchConfigAPIService,
    private portalDialogService: PortalDialogService,
    private portalMessageService: PortalMessageService
  ) {
    this.userService.lang$.subscribe((lang) => this.translateService.use(lang))

    this.searchConfigs$ = combineLatest([this.baseUrl, this._pageName, this.searchConfigReload$]).pipe(
      filter(([_, pageName, __]) => pageName.length > 0),
      mergeMap(([_, pageName, __]) => {
        return this.searchConfigService
          .getSearchConfigInfos({ page: pageName })
          .pipe(map((response) => response.configs))
      })
    )
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      searchConfig: new FormControl<SearchConfigInfo | null>(null)
    })
  }

  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.baseUrl.next(config.baseUrl)
    this.searchConfigService.configuration = new Configuration({
      basePath: Location.joinWithSlash(config.baseUrl, environment.apiPrefix)
    })
  }

  onSearchConfigChange(event: { value: SearchConfigInfo }) {
    // TODO: Fetch config data
    // TODO: Emit data
    // this.searchConfigSelected.emit({
    //   inputValues: {},
    //   displayedColumns: []
    // })
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes)

    if (this.hasPropChanged(changes, 'currentInputFieldValues') || this.hasPropChanged(changes, 'displayedColumns')) {
      this.searchConfigSelected.emit(undefined)
      this.formGroup?.setControl('searchConfig', null)
    }
  }

  saveSearchConfig() {
    this.portalDialogService
      .openDialog<CreateOrEditSearchDialogContent>(
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CREATE_HEADER',
        CreateOrEditSearchConfigDialogComponent,
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CONFIRM',
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CANCEL'
      )
      .pipe(
        mergeMap((dialogResult) => {
          if (dialogResult.button !== 'primary') {
            return of(undefined)
          }

          const request: CreateSearchConfigRequest = {
            page: this._pageName.getValue(),
            fieldListVersion: 0,
            name: dialogResult.result?.searchConfigName ?? '',
            // TODO
            isReadonly: false,
            // TODO
            isAdvanced: false,
            columns: dialogResult.result?.saveColumns ? this.displayedColumns.map((column) => column.nameKey) : [],
            values: dialogResult.result?.saveInputValues
              ? Object.fromEntries(
                  Object.entries(this.currentInputFieldValues).map(([name, value]) => [name, String(value)])
                )
              : {}
          }
          return this.searchConfigService.createSearchConfig({ createSearchConfigRequest: request }).pipe(
            map((response) => {
              this.portalMessageService.info({
                summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CREATE_SUCCESS'
              })
              return {
                configs: response.configs,
                newConfigName: dialogResult.result?.searchConfigName
              }
            }),
            catchError((error) => {
              console.error(error)
              this.portalMessageService.error({
                summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CREATE_FAILURE'
              })
              return of(undefined)
            })
          )
        }),
        tap((result) => {
          if (result?.configs) {
            this.searchConfigReload$.next(undefined)
          }
        })
      )
      .subscribe((result) => {
        // TODO: change form value to created search config
        // this.formGroup?.setControl('searchConfig', result?.newConfigName)
      })
  }

  editSearchConfig(searchConfigInfo: SearchConfigInfo) {
    // TODO: Load search config
    let searchConfig: any
    this.portalDialogService
      .openDialog<CreateOrEditSearchDialogContent>(
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_HEADER',
        CreateOrEditSearchConfigDialogComponent,
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CONFIRM',
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CANCEL'
      )
      .pipe(
        mergeMap((dialogResult) => {
          if (dialogResult.button !== 'primary') {
            return of(undefined)
          }

          const request: UpdateSearchConfigRequest = {
            searchConfig: {
              id: searchConfig.id,
              page: this._pageName.getValue(),
              fieldListVersion: 0,
              name: dialogResult.result?.searchConfigName ?? '',
              modificationCount: searchConfig.modificationCount + 1,
              // TODO
              isReadonly: false,
              // TODO
              isAdvanced: false,
              columns: dialogResult.result?.saveColumns ? this.displayedColumns.map((column) => column.nameKey) : [],
              values: dialogResult.result?.saveInputValues
                ? Object.fromEntries(
                    Object.entries(this.currentInputFieldValues).map(([name, value]) => [name, String(value)])
                  )
                : {}
            }
          }
          return this.searchConfigService
            .updateSearchConfig({ configId: searchConfigInfo.id, updateSearchConfigRequest: request })
            .pipe(
              map((response) => {
                this.portalMessageService.info({
                  summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_SUCCESS'
                })
                return {
                  configs: response.configs,
                  updatedConfigName: dialogResult.result?.searchConfigName
                }
              }),
              catchError((error) => {
                console.error(error)
                this.portalMessageService.error({
                  summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_FAILURE'
                })
                return of(undefined)
              })
            )
        }),
        tap((result) => {
          if (result?.configs) {
            this.searchConfigReload$.next(undefined)
          }
        })
      )
      .subscribe((result) => {
        // TODO: change form value to updated search config
        // this.formGroup?.setControl('searchConfig', result?.newConfigName)
      })
  }

  deleteSearchConfig(searchConfigInfo: SearchConfigInfo) {
    this.searchConfigService
      .deleteSearchConfig({ configId: searchConfigInfo.id })
      .pipe(
        tap((result) => {
          if (result?.configs) {
            this.searchConfigReload$.next(undefined)
          }
        }),
        catchError((error) => {
          console.error(error)
          this.portalMessageService.error({
            summaryKey: 'SEARCH_CONFIG.DELETE_FAILURE'
          })
          return of(undefined)
        })
      )
      .subscribe((result) => {
        if (result) {
          this.portalMessageService.info({
            summaryKey: 'SEARCH_CONFIG.DELETE_SUCCESS'
          })
        }
      })
    // TODO: Update config options in dropdown
  }

  private hasPropChanged(changes: SimpleChanges, propName: string) {
    return (
      changes[propName] &&
      !changes[propName].firstChange &&
      changes[propName].previousValue !== changes[propName].currentValue
    )
  }
}
