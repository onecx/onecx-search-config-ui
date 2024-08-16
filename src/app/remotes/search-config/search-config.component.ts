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
import { BehaviorSubject, ReplaySubject, catchError, combineLatest, filter, map, mergeMap, of } from 'rxjs'
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
import { PrimeIcons } from 'primeng/api'

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
    displayedColumns: string[]
  }> = new EventEmitter()
  configSelected = false

  addSearchConfigOption = {
    id: '',
    name: ''
  }
  plusIcon = PrimeIcons.PLUS
  editIcon = PrimeIcons.PENCIL
  deleteIcon = PrimeIcons.TRASH
  searchConfigs$: BehaviorSubject<SearchConfigInfo[]> = new BehaviorSubject<SearchConfigInfo[]>([])
  formGroup: FormGroup | undefined

  constructor(
    @Inject(BASE_URL) private baseUrl: ReplaySubject<string>,
    private userService: UserService,
    private translateService: TranslateService,
    private searchConfigService: SearchConfigAPIService,
    private portalDialogService: PortalDialogService,
    private portalMessageService: PortalMessageService
  ) {
    this.userService.lang$.subscribe((lang) => this.translateService.use(lang))

    combineLatest([this.baseUrl, this._pageName])
      .pipe(
        filter(([_, pageName]) => pageName.length > 0),
        mergeMap(([_, pageName]) => {
          return this.searchConfigService
            .getSearchConfigInfos({ page: pageName })
            .pipe(map((response) => response.configs))
        })
      )
      .subscribe(this.searchConfigs$)
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
    this.searchConfigService.configuration = new Configuration({
      basePath: Location.joinWithSlash(config.baseUrl, environment.apiPrefix)
    })
    this.baseUrl.next(config.baseUrl)
  }

  onSearchConfigChange(event: { originalEvent: Event; value: SearchConfigInfo }) {
    if (!event.value.id) {
      this.saveSearchConfig()
    }

    this.searchConfigService
      .getSearchConfig({
        id: event.value.id
      })
      .subscribe(
        // TODO: Fix openAPI
        (config: any) => {
          this.configSelected = true
          this.searchConfigSelected.emit({
            inputValues: config.values,
            displayedColumns: config.columns
          })
        }
      )
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes)

    if (this.configSelected) this.configSelected = false
    else if (this.hasInputsChanged(changes) || this.hasColumnsChanged(changes)) {
      this.searchConfigSelected.emit(undefined)
      this.setSearchConfig(null)
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
          if (dialogResult?.button !== 'primary') {
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
            columns: dialogResult.result?.saveColumns ? this.displayedColumns.map((column) => column.id) : [],
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
        })
      )
      .subscribe((result) => {
        if (result) {
          this.searchConfigs$.next(result.configs)
          this.setSearchConfig(this.searchConfigs$.getValue().find((config) => config.name === result.newConfigName))
        }
      })
  }

  editSearchConfig(event: Event, searchConfigInfo: SearchConfigInfo) {
    event.stopPropagation()

    this.searchConfigService
      .getSearchConfig({
        id: searchConfigInfo.id
      })
      .pipe(
        // TODO: fix openAPI
        mergeMap((config: any) => {
          const searchConfig = config
          return this.portalDialogService
            .openDialog<CreateOrEditSearchDialogContent>(
              'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_HEADER',
              {
                type: CreateOrEditSearchConfigDialogComponent,
                inputs: {
                  searchConfigName: searchConfig.name,
                  saveInputValues: Object.keys(searchConfig.values ?? {}).length > 0,
                  saveColumns: (searchConfig.columns ?? []).length > 0
                }
              },
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
                    page: searchConfig.page,
                    fieldListVersion: 0,
                    name: dialogResult.result?.searchConfigName ?? searchConfig.name ?? '',
                    modificationCount: searchConfig.modificationCount + 1,
                    // TODO
                    isReadonly: false,
                    // TODO
                    isAdvanced: false,
                    columns: dialogResult.result?.saveColumns ? this.displayedColumns.map((column) => column.id) : [],
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
              })
            )
        })
      )
      .subscribe(() => {})
  }

  deleteSearchConfig(event: Event, searchConfigInfo: SearchConfigInfo) {
    event.stopPropagation()

    this.searchConfigService
      .deleteSearchConfig({ configId: searchConfigInfo.id })
      .pipe(
        catchError((error) => {
          console.error(error)
          this.portalMessageService.error({
            summaryKey: 'SEARCH_CONFIG.DELETE_FAILURE'
          })
          return of(undefined)
        })
      )
      .subscribe((result) => {
        if (result !== undefined) {
          this.portalMessageService.info({
            summaryKey: 'SEARCH_CONFIG.DELETE_SUCCESS'
          })
          this.searchConfigs$.next(this.searchConfigs$.getValue().filter((config) => config.id !== searchConfigInfo.id))
        }
      })
  }

  private hasInputsChanged(changes: SimpleChanges): boolean {
    return (
      JSON.stringify(changes['currentInputFieldValues'].currentValue) !==
      JSON.stringify(changes['currentInputFieldValues'].previousValue)
    )
  }

  private hasColumnsChanged(changes: SimpleChanges): boolean {
    return (
      changes['displayedColumns'] &&
      !changes['displayedColumns'].firstChange &&
      changes['displayedColumns'].currentValue.map((column: DataTableColumn) => column.id) !==
        changes['displayedColumns'].previousValue.map((column: DataTableColumn) => column.id)
    )
  }

  private setSearchConfig(value: SearchConfigInfo | undefined | null) {
    this.formGroup?.get('searchConfig')?.setValue(value)
  }
}
