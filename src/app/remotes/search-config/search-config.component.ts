import { CommonModule, Location } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Component, EventEmitter, Inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { DataTableColumn, createRemoteComponentTranslateLoader } from '@onecx/angular-accelerator'
import { PortalCoreModule, UserService } from '@onecx/portal-integration-angular'
import {
  AngularRemoteComponentsModule,
  BASE_URL,
  RemoteComponentConfig,
  ocxRemoteComponent,
  ocxRemoteWebcomponent,
  provideTranslateServiceForRoot
} from '@onecx/angular-remote-components'
import { BehaviorSubject, Observable, ReplaySubject, combineLatest, filter, map, mergeMap } from 'rxjs'
import { Configuration, SearchConfigAPIService, SearchConfigInfo } from 'src/app/shared/generated'
import { SharedModule } from 'src/app/shared/shared.module'
import { environment } from 'src/environments/environment'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'

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
    ReactiveFormsModule
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
        useFactory: createRemoteComponentTranslateLoader,
        deps: [HttpClient, BASE_URL]
      }
    })
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

  // _currentInputFieldValues: { [key: string]: unknown } = {}
  // @Input() get currentInputFieldValues(): { [key: string]: unknown } {
  //   return this._currentInputFieldValues
  // }
  // set currentInputFieldValues(value: { [key: string]: unknown }) {
  //   this._currentInputFieldValues = value
  // }

  // _displayedColumns: DataTableColumn[] = []
  // @Input() get displayedColumns(): DataTableColumn[] {
  //   return this._displayedColumns
  // }
  // set displayedColumns(value: DataTableColumn[]) {
  //   this._displayedColumns = value
  // }

  constructor(
    @Inject(BASE_URL) private baseUrl: ReplaySubject<string>,
    private userService: UserService,
    private translateService: TranslateService,
    private searchConfigService: SearchConfigAPIService
  ) {
    this.userService.lang$.subscribe((lang) => this.translateService.use(lang))

    this.searchConfigs$ = combineLatest([this.baseUrl, this._pageName]).pipe(
      filter(([_, pageName]) => pageName.length > 0),
      mergeMap(([_, pageName]) => {
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

  onSearchConfigChange(event: { value: SearchConfigInfo }) {
    this.searchConfigSelected.emit({
      inputValues: {},
      displayedColumns: []
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes)

    if (this.hasPropChanged(changes, 'currentInputFieldValues') || this.hasPropChanged(changes, 'displayedColumns')) {
      this.searchConfigSelected.emit(undefined)
      // TODO: change displayed searchConfig
    }
  }

  hasPropChanged(changes: SimpleChanges, propName: string) {
    return (
      changes[propName] &&
      !changes[propName].firstChange &&
      changes[propName].previousValue !== changes[propName].currentValue
    )
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
}
