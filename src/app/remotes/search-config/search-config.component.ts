import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
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
  BehaviorSubject,
  Observable,
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
import { PrimeIcons } from 'primeng/api';
import { EventsTopic, MfeInfo } from '@onecx/integration-interface';

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
  ],
})
export class OneCXSearchConfigComponent
  implements ocxRemoteComponent, ocxRemoteWebcomponent, OnChanges, OnInit
{
  private eventsTopic$ = new EventsTopic();

  private _pageName = new BehaviorSubject<string>('');
  @Input() get pageName(): string {
    return this._pageName.getValue();
  }
  set pageName(value: string) {
    this._pageName.next(value);
  }
  @Input() currentInputFieldValues: { [key: string]: unknown } = {};
  @Input() displayedColumns: string[] = [];
  @Input() searchConfigSelected: EventEmitter<{
    inputValues: { [key: string]: unknown };
    displayedColumns: string[];
  }> = new EventEmitter();

  searchConfigs$: BehaviorSubject<SearchConfigInfo[]> = new BehaviorSubject<
    SearchConfigInfo[]
  >([]);
  searchConfigsWithInputs$: Observable<SearchConfigInfo[]>;
  formGroup: FormGroup | undefined;

  addSearchConfigOption: any = {
    id: 'ocx-add-search-config-option',
  };
  plusIcon = PrimeIcons.PLUS;
  editIcon = PrimeIcons.PENCIL;
  deleteIcon = PrimeIcons.TRASH;

  constructor(
    @Inject(BASE_URL) private baseUrl: ReplaySubject<string>,
    private userService: UserService,
    private translateService: TranslateService,
    private searchConfigService: SearchConfigAPIService,
    private portalDialogService: PortalDialogService,
    private portalMessageService: PortalMessageService,
    private appStateService: AppStateService,
  ) {
    this.userService.lang$.subscribe((lang) => this.translateService.use(lang));

    combineLatest([
      this.baseUrl,
      this._pageName,
      this.appStateService.currentMfe$.asObservable(),
    ])
      .pipe(
        filter(([_, pageName, currentMfe]) => pageName.length > 0),
        mergeMap(([_, pageName, currentMfe]) => {
          return this.searchConfigService
            .getSearchConfigInfos({
              appId: currentMfe.appId,
              page: pageName,
              productName: currentMfe.productName,
            })
            .pipe(map((response) => response.configs));
        }),
      )
      .subscribe(this.searchConfigs$);

    this.searchConfigsWithInputs$ = this.searchConfigs$.asObservable().pipe(
      map((configs) => {
        return configs.filter(
          (config) => Object.keys(config.values).length > 0,
        );
      }),
    );
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

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
    if (this.hasInputsChanged(changes) || this.hasColumnsChanged(changes)) {
      this.searchConfigSelected.emit(undefined);
      this.setSearchConfigControl(undefined);
      this.eventsTopic$.publish({
        type: 'searchConfig#configChange',
        payload: {
          config: null,
        },
      });
    }
  }

  onSearchConfigChange(event: {
    originalEvent: Event;
    value: SearchConfigInfo;
  }) {
    if (event.value.id === this.addSearchConfigOption.id) {
      return this.onSearchConfigSave();
    }

    this.searchConfigSelected.emit({
      inputValues: event.value.values,
      displayedColumns: event.value.columns,
    });
    this.eventsTopic$.publish({
      type: 'searchConfig#configChange',
      payload: {
        config: event.value,
      },
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
        withLatestFrom(this.appStateService.currentMfe$.asObservable()),
        mergeMap(([dialogResult, currentMfe]) => {
          if (dialogResult?.button !== 'primary') {
            return of(undefined);
          }
          return this.saveSearchConfig(dialogResult.result, currentMfe);
        }),
      )
      .subscribe((response) => {
        if (response) {
          this.portalMessageService.info({
            summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CREATE_SUCCESS',
          });
          debugger;
          this.searchConfigs$.next(response.configs);
          const config = response.configs.find(
            (config) => config.id === response.id,
          );
          this.eventsTopic$.publish({
            type: 'searchConfig#configCreate',
            payload: {
              config: config,
            },
          });
          this.setSearchConfigControl(config);
        }
      });
  }

  private saveSearchConfig(
    configData: CreateOrEditSearchDialogContent | undefined,
    currentMfe: MfeInfo,
  ) {
    const request: CreateSearchConfigRequest = {
      appId: currentMfe.appId,
      productName: currentMfe.productName,
      page: this._pageName.getValue(),
      fieldListVersion: 0,
      name: configData?.searchConfigName ?? '',
      isReadonly: false,
      // TODO
      isAdvanced: false,
      columns: configData?.saveColumns ? this.displayedColumns : [],
      values: configData?.saveInputValues
        ? Object.fromEntries(
            Object.entries(this.currentInputFieldValues).map(
              ([name, value]) => [name, String(value)],
            ),
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
    event.stopPropagation();

    this.portalDialogService
      .openDialog<CreateOrEditSearchDialogContent>(
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_HEADER',
        {
          type: CreateOrEditSearchConfigDialogComponent,
          inputs: {
            searchConfigName: searchConfig.name,
            saveInputValues: Object.keys(searchConfig.values ?? {}).length > 0,
            saveColumns: (searchConfig.columns ?? []).length > 0,
          },
        },
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CONFIRM',
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CANCEL',
      )
      .pipe(
        mergeMap((dialogResult) => {
          return this.getSearchConfig(searchConfig).pipe(
            map((response) => {
              return {
                config: response?.config,
                result: dialogResult,
              };
            }),
          );
        }),
        mergeMap(({ config, result }) => {
          if (!config) {
            return of(undefined);
          }
          if (result.button !== 'primary') {
            return of(undefined);
          }

          return this.editSearchConfig(config, result.result);
        }),
      )
      .subscribe((response) => {
        if (response) {
          this.portalMessageService.info({
            summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_SUCCESS',
          });
          this.searchConfigs$.next(response.configs);
          const config = response.configs.find((c) => c.id === searchConfig.id);
          this.eventsTopic$.publish({
            type: 'searchConfig#configUpdate',
            payload: {
              config: config,
            },
          });
        }
      });
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
  ) {
    const request: UpdateSearchConfigRequest = {
      searchConfig: {
        ...config,
        name: configData?.searchConfigName ?? config.name ?? '',
        columns: configData?.saveColumns ? this.displayedColumns : [],
        values: configData?.saveInputValues
          ? Object.fromEntries(
              Object.entries(this.currentInputFieldValues).map(
                ([name, value]) => [name, String(value)],
              ),
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
        this.searchConfigs$.next(
          this.searchConfigs$
            .getValue()
            .filter((config) => config.id !== searchConfig.id),
        );
        this.eventsTopic$.publish({
          type: 'searchConfig#configDelete',
          payload: {
            id: searchConfig.id,
          },
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

  private hasInputsChanged(changes: SimpleChanges): boolean {
    return (
      changes['currentInputFieldValues'] &&
      !changes['currentInputFieldValues'].firstChange &&
      !Object.entries(this.getCurrentSearchConfig().values).every(
        ([key, value]) => {
          return value === changes['currentInputFieldValues'].currentValue[key];
        },
      )
    );
  }

  private hasColumnsChanged(changes: SimpleChanges): boolean {
    return (
      changes['displayedColumns'] &&
      !changes['displayedColumns'].firstChange &&
      !(
        (changes['displayedColumns'].currentValue as string[]).length ===
          this.getCurrentSearchConfig().columns.length &&
        this.getCurrentSearchConfig().columns.every((column) =>
          (changes['displayedColumns'].currentValue as string[]).includes(
            column,
          ),
        )
      )
    );
  }

  private setSearchConfigControl(value: SearchConfigInfo | undefined | null) {
    this.formGroup?.get('searchConfig')?.setValue(value);
  }

  private getCurrentSearchConfig(): SearchConfigInfo {
    return this.formGroup?.get('searchConfig')?.value;
  }
}
