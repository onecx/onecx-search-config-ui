import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { OneCXSearchConfigComponent } from './search-config.component';
import {
  ReplaySubject,
  debounceTime,
  of,
  take,
  takeLast,
  throwError,
} from 'rxjs';
import { TranslateTestingModule } from 'ngx-translate-testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import {
  BASE_URL,
  RemoteComponentConfig,
} from '@onecx/angular-remote-components';
import {
  AppConfigService,
  AppStateService,
} from '@onecx/angular-integration-interface';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { OneCXSearchConfigHarness } from './search-config.harness';
import { FakeTopic } from '@onecx/angular-integration-interface/mocks';
import {
  SEARCH_CONFIG_STORE_NAME,
  SEARCH_CONFIG_TOPIC,
  SearchConfigMessage,
  SearchConfigStore,
} from 'src/app/shared/search-config.store';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CreateOrEditSearchConfigDialogComponent } from 'src/app/shared/components/create-or-edit-search-config-dialog/create-or-edit-search-config-dialog.component';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  IfPermissionDirective,
  PortalDialogService,
  PortalMessageService,
  SearchConfigInfo,
} from '@onecx/portal-integration-angular';
import {
  Configuration,
  SearchConfigAPIService,
} from 'src/app/shared/generated';
import { DialogService } from 'primeng/dynamicdialog';
import { advancedViewMode, basicViewMode } from 'src/app/shared/constants';
import { TooltipModule } from 'primeng/tooltip';

@NgModule({
  imports: [],
  declarations: [IfPermissionDirective],
  exports: [IfPermissionDirective],
})
class PortalDependencyModule {}

const createSpyObj = (
  baseName: string,
  methodNames: Array<string>,
): { [key: string]: any } => {
  let obj: any = {};

  for (let i = 0; i < methodNames.length; i++) {
    obj[methodNames[i]] = jest.fn();
  }

  return obj;
};

describe('OneCXSearchConfigComponent', () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  const appConfigSpy = createSpyObj('appConfig', []) as AppConfigService;

  const searchConfigServiceSpy = {
    ...createSpyObj('searchConfigService', [
      'getSearchConfigInfos',
      'createSearchConfig',
      'deleteSearchConfig',
      'getSearchConfig',
      'updateSearchConfig',
    ]),
    configuration: new Configuration({
      basePath: '',
    }),
  } as SearchConfigAPIService;

  const portalDialogSpy = createSpyObj('portalDialogService', [
    'openDialog',
  ]) as PortalDialogService;

  const portalMessageSpy = createSpyObj('portalMessageService', [
    'info',
    'error',
  ]) as PortalMessageService;

  const allPermissions = [
    'SEARCHCONFIG#VIEW',
    'SEARCHCONFIG#CREATE',
    'SEARCHCONFIG#EDIT',
    'SEARCHCONFIG#DELETE',
  ];

  const viewOnlyPermissions = ['SEARCHCONFIG#VIEW'];

  const config = {
    id: '1',
    name: 'config-1',
    columns: ['col-1'],
    values: {
      k1: 'v1',
    },
    isReadonly: false,
    isAdvanced: false,
  };

  const onlyValuesConfig = {
    id: '2',
    name: 'config-2',
    columns: [],
    values: {
      k2: 'v2',
    },
    isReadonly: false,
    isAdvanced: false,
  };

  const onlyColumnsConfig = {
    id: '3',
    name: 'config-3',
    columns: ['col-3'],
    values: {},
    isReadonly: false,
    isAdvanced: false,
  };

  function setUp() {
    const fixture = TestBed.createComponent(OneCXSearchConfigComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    return { fixture, component };
  }

  async function setUpWithHarness() {
    const { fixture, component } = setUp();
    const searchConfigHarness =
      await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        OneCXSearchConfigHarness,
      );
    return { fixture, component, searchConfigHarness };
  }

  async function setUpWithHarnessAndInit(permissions: Array<string>) {
    const fixture = TestBed.createComponent(OneCXSearchConfigComponent);
    const component = fixture.componentInstance;
    component.ocxInitRemoteComponent({
      baseUrl: 'base_url',
      permissions: permissions,
    } as any);
    fixture.detectChanges();
    const searchConfigHarness =
      await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        OneCXSearchConfigHarness,
      );

    return { fixture, component, searchConfigHarness };
  }

  async function selectFirstConfig(harness: OneCXSearchConfigHarness) {
    const dropdown = await harness.getDropdown();
    await dropdown?.open();
    const items = await dropdown?.getDropdownItems();
    await items?.at(1)?.selectItem();
  }

  let baseUrlSubject: ReplaySubject<any>;
  beforeEach(() => {
    baseUrlSubject = new ReplaySubject<any>(1);
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        TranslateTestingModule.withTranslations({
          en: require('../../../assets/i18n/en.json'),
        }).withDefaultLanguage('en'),
        NoopAnimationsModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: BASE_URL,
          useValue: baseUrlSubject,
        },
        {
          provide: SearchConfigStore,
          useClass: SearchConfigStore,
        },
        {
          provide: SEARCH_CONFIG_STORE_NAME,
          useValue: 'store',
        },
        {
          provide: SEARCH_CONFIG_TOPIC,
          useValue: new FakeTopic<SearchConfigMessage>(),
        },
      ],
    })
      .overrideComponent(OneCXSearchConfigComponent, {
        set: {
          imports: [
            PortalDependencyModule,
            TranslateTestingModule,
            CommonModule,
            DropdownModule,
            TooltipModule,
            FloatLabelModule,
            CreateOrEditSearchConfigDialogComponent,
            ButtonModule,
            ReactiveFormsModule,
            FormsModule,
          ],
          providers: [
            DialogService,
            {
              provide: AppConfigService,
              useValue: appConfigSpy,
            },
            {
              provide: PortalDialogService,
              useValue: portalDialogSpy,
            },
            {
              provide: PortalMessageService,
              useValue: portalMessageSpy,
            },
            {
              provide: SearchConfigAPIService,
              useValue: searchConfigServiceSpy,
            },
          ],
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();

    baseUrlSubject.next('base_url_mock');
    (portalDialogSpy.openDialog as jest.Mock).mockReset();
    (searchConfigServiceSpy.createSearchConfig as jest.Mock).mockReset();
    (searchConfigServiceSpy.deleteSearchConfig as jest.Mock).mockReset();
    (searchConfigServiceSpy.updateSearchConfig as jest.Mock).mockReset();
    (searchConfigServiceSpy.getSearchConfig as jest.Mock).mockReset();
    searchConfigServiceSpy.getSearchConfigInfos = () =>
      of({
        configs: [],
      } as any);
  });

  it('should create', () => {
    const { component } = setUp();

    expect(component).toBeTruthy();
  });

  it('should update store on pageName input set', fakeAsync(() => {
    const store = TestBed.inject(SearchConfigStore);
    const spy = jest.spyOn(store, 'setPageName');

    const { component } = setUp();

    component.pageName = 'my-page';
    tick(500);

    expect(spy).toHaveBeenCalledWith('my-page');
  }));

  it('should update store on current field values input set', fakeAsync(() => {
    const store = TestBed.inject(SearchConfigStore);
    const spy = jest.spyOn(store, 'updateFieldValues');

    const { component } = setUp();

    const values = {
      key: 'value',
    };
    component.currentFieldValues = values;
    tick(500);

    expect(spy).toHaveBeenCalledWith(values);
  }));

  it('should update store on view mode input set', fakeAsync(() => {
    const store = TestBed.inject(SearchConfigStore);
    const spy = jest.spyOn(store, 'updateViewMode');

    const { component } = setUp();

    component.viewMode = basicViewMode;
    tick(500);

    expect(spy).toHaveBeenCalledWith(basicViewMode);
  }));

  describe('setup', () => {
    it('should init remote component', (done) => {
      const config: RemoteComponentConfig = {
        appId: 'appId',
        productName: 'prodName',
        permissions: ['permission'],
        baseUrl: 'base',
      };

      const { component } = setUp();
      jest.spyOn(component, 'ocxInitRemoteComponent');
      component.ocxRemoteComponentConfig = config;

      expect(component.permissions).toEqual(['permission']);
      expect(component.ocxInitRemoteComponent).toHaveBeenCalledWith(config);
      expect(searchConfigServiceSpy.configuration.basePath).toEqual('base/bff');
      baseUrlSubject.asObservable().subscribe((item) => {
        expect(item).toEqual('base');
        done();
      });
    });

    it('should set baseOptions if permission is met', () => {
      const config: RemoteComponentConfig = {
        appId: 'appId',
        productName: 'prodName',
        permissions: ['SEARCHCONFIG#CREATE'],
        baseUrl: 'base',
      };

      const { component } = setUp();
      jest.spyOn(component, 'ocxInitRemoteComponent');
      component.ocxRemoteComponentConfig = config;

      expect(component.baseOptions).toEqual([
        {
          id: 'ocx-add-search-config-option',
        },
      ]);
    });

    it('should set search configs on page info update', fakeAsync(() => {
      const store = TestBed.inject(SearchConfigStore);
      const appState = TestBed.inject(AppStateService);
      const configs = [
        {
          name: 'config-1',
        },
        {
          name: 'config-2',
        },
      ];

      const setSearchConfigsSpy = jest.spyOn(store, 'setSearchConfigs');
      jest.spyOn(appState.currentMfe$, 'asObservable').mockReturnValue(
        of({
          appId: 'appId',
          productName: 'product',
        } as any),
      );
      jest
        .spyOn(searchConfigServiceSpy, 'getSearchConfigInfos')
        .mockReturnValue(
          of({
            configs: configs,
          } as any),
        );

      const { component } = setUp();

      baseUrlSubject.next('base_url');
      component.pageName = 'page_name';

      tick(500);

      expect(setSearchConfigsSpy).toHaveBeenCalledWith(configs);
    }));
  });

  describe('dropdown content', () => {
    it('should display dropdown with add option', async () => {
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const dropdown = await searchConfigHarness.getDropdown();
      expect(dropdown).toBeDefined();
      expect(await dropdown?.getDefaultText()).toEqual('Choose search config');
      await dropdown?.open();
      const items = await dropdown?.getDropdownItems();
      expect(items?.length).toBe(1);
      expect(await items?.at(0)?.getText()).toEqual('Add search config');
    });

    it('should not display dropdown with no view permission', async () => {
      const { searchConfigHarness } = await setUpWithHarnessAndInit(['']);

      const dropdown = await searchConfigHarness.getDropdown();
      expect(dropdown).toBeFalsy();
    });

    it('should display dropdown with configs that have values', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [config, onlyValuesConfig, onlyColumnsConfig],
      });
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(viewOnlyPermissions);

      const dropdown = await searchConfigHarness.getDropdown();
      expect(dropdown).toBeDefined();
      await dropdown?.open();
      const items = await dropdown?.getDropdownItems();
      expect(items?.length).toBe(2);
      expect(await items?.at(0)?.getText()).toEqual(config.name);
      expect(await items?.at(1)?.getText()).toEqual(onlyValuesConfig.name);
    });

    it('should display editing message on edit mode', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [config],
      });
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      await editButton?.click();
      const dropdown = await searchConfigHarness.getDropdown();
      expect(await dropdown?.getSelectedText()).toEqual(
        'Editing config-1 search config',
      );
    });
    it('should have correct aria label', async () => {
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const dropdown = await searchConfigHarness.getDropdown();
      expect(dropdown).toBeDefined();
      expect(await dropdown?.getAriaLabel()).toEqual('Search config');
    });
  });

  describe('with chosen config', () => {
    it('should display edit/delete', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [config],
      });
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeTruthy();
      const deleteButton = await searchConfigHarness.getDeleteButton();
      expect(deleteButton).toBeTruthy();
    });
    it('should not display edit/delete if config is not selected', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [config],
      });
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeFalsy();
      const deleteButton = await searchConfigHarness.getDeleteButton();
      expect(deleteButton).toBeFalsy();
    });
    it('should not display edit/delete if config is readonly', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [
          {
            ...config,
            isReadonly: true,
          },
        ],
      });
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeFalsy();
      const deleteButton = await searchConfigHarness.getDeleteButton();
      expect(deleteButton).toBeFalsy();
    });
    it('should not display edit/delete if config is columns only', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
      });
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeFalsy();
      const deleteButton = await searchConfigHarness.getDeleteButton();
      expect(deleteButton).toBeFalsy();
    });
    it('should not display edit/delete if no permissions ', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [config],
      });
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(viewOnlyPermissions);
      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeFalsy();
      const deleteButton = await searchConfigHarness.getDeleteButton();
      expect(deleteButton).toBeFalsy();
    });
  });

  describe('on edit mode', () => {
    it('should display save/cancel options', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [config],
      });
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);
      const editButton = await searchConfigHarness.getEditButton();
      await editButton?.click();

      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      const cancelEditButton = await searchConfigHarness.getCancelEditButton();
      expect(cancelEditButton).toBeTruthy();
    });
    it('should not display save/cancel options when not in charge of edit', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [config],
        editMode: true,
        inChargeOfEdit: 'other-store-name',
        currentSearchConfig: config,
      });
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeFalsy();
      const cancelEditButton = await searchConfigHarness.getCancelEditButton();
      expect(cancelEditButton).toBeFalsy();
    });
  });

  describe('on config change', () => {
    it('should set current config', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [config],
      });
      const storeSpy = jest.spyOn(store, 'setCurrentConfig');
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      expect(storeSpy).toHaveBeenCalledWith(config);
      const dropdown = await searchConfigHarness.getDropdown();
      expect(await dropdown?.getSelectedText()).toEqual(config.name);
    });
    it('should open dialog if user chose to add new config', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const dialogServiceSpy = jest
        .spyOn(portalDialogSpy, 'openDialog')
        .mockReturnValue(of(undefined as any));
      store.patchState({
        searchConfigs: [config],
      });
      const storeSpy = jest.spyOn(store, 'setCurrentConfig');
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const dropdown = await searchConfigHarness.getDropdown();
      expect(dropdown).toBeDefined();
      await dropdown?.open();
      const items = await dropdown?.getDropdownItems();
      await items?.at(0)?.selectItem();

      expect(dialogServiceSpy).toHaveReturnedTimes(1);
      expect(storeSpy).toHaveBeenCalledWith(undefined);
    });
  });

  describe('on config save', () => {
    it('should allow column saving when on table view and column group component is active', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        columnGroupComponentActive: true,
        layout: 'table',
        searchConfigs: [],
      });
      const dialogServiceSpy = jest.spyOn(portalDialogSpy, 'openDialog');
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const dropdown = await searchConfigHarness.getDropdown();
      expect(dropdown).toBeDefined();
      await dropdown?.open();
      const items = await dropdown?.getDropdownItems();
      await items?.at(0)?.selectItem();
      expect(dialogServiceSpy).toHaveBeenCalledWith(
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CREATE_HEADER',
        {
          type: CreateOrEditSearchConfigDialogComponent,
          inputs: {
            searchConfigName: '',
            saveInputValues: false,
            saveColumns: false,
            frozeColumnSaveOption: false,
            frozeColumnSaveOptionExplanation: '',
          },
        },
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CONFIRM',
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CANCEL',
      );
    });

    it('should provide explanation for column freeze when column group component is inactive', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        columnGroupComponentActive: false,
        layout: 'table',
        searchConfigs: [],
      });
      const dialogServiceSpy = jest.spyOn(portalDialogSpy, 'openDialog');
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const dropdown = await searchConfigHarness.getDropdown();
      expect(dropdown).toBeDefined();
      await dropdown?.open();
      const items = await dropdown?.getDropdownItems();
      await items?.at(0)?.selectItem();
      expect(dialogServiceSpy).toHaveBeenCalledWith(
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CREATE_HEADER',
        {
          type: CreateOrEditSearchConfigDialogComponent,
          inputs: {
            searchConfigName: '',
            saveInputValues: false,
            saveColumns: false,
            frozeColumnSaveOption: true,
            frozeColumnSaveOptionExplanation:
              'SEARCH_CONFIG.COLUMN_GROUP_COMPONENT_INACTIVE',
          },
        },
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CONFIRM',
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CANCEL',
      );
    });

    it('should provide explanation for column freeze when layout is not table', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        columnGroupComponentActive: true,
        layout: 'list',
        searchConfigs: [],
      });
      const dialogServiceSpy = jest.spyOn(portalDialogSpy, 'openDialog');
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const dropdown = await searchConfigHarness.getDropdown();
      expect(dropdown).toBeDefined();
      await dropdown?.open();
      const items = await dropdown?.getDropdownItems();
      await items?.at(0)?.selectItem();
      expect(dialogServiceSpy).toHaveBeenCalledWith(
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CREATE_HEADER',
        {
          type: CreateOrEditSearchConfigDialogComponent,
          inputs: {
            searchConfigName: '',
            saveInputValues: false,
            saveColumns: false,
            frozeColumnSaveOption: true,
            frozeColumnSaveOptionExplanation:
              'SEARCH_CONFIG.TABLE_VIEW_INACTIVE',
          },
        },
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CONFIRM',
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CANCEL',
      );
    });

    it('should not add config and reset if dialog was closed', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const appState = TestBed.inject(AppStateService);
      const addSpy = jest.spyOn(store, 'addSearchConfig');
      const setSpy = jest.spyOn(store, 'setCurrentConfig');
      jest.spyOn(appState.currentMfe$, 'asObservable').mockReturnValue(
        of({
          appId: 'appId',
          productName: 'product',
        } as any),
      );

      store.patchState({
        searchConfigs: [],
        pageName: 'page_name',
        fieldValues: {},
        displayedColumnsIds: [],
        viewMode: basicViewMode,
        selectedGroupKey: 'default',
      });
      jest
        .spyOn(portalDialogSpy, 'openDialog')
        .mockReturnValue(of(undefined as any));
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const dropdown = await searchConfigHarness.getDropdown();
      expect(dropdown).toBeDefined();
      await dropdown?.open();
      const items = await dropdown?.getDropdownItems();
      await items?.at(0)?.selectItem();

      expect(addSpy).toHaveBeenCalledTimes(0);
      expect(setSpy).toHaveBeenCalledTimes(1);
      expect(setSpy).toHaveBeenCalledWith(undefined);
    });

    it('should not add config and reset if create was not confirmed', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const appState = TestBed.inject(AppStateService);
      const addSpy = jest.spyOn(store, 'addSearchConfig');
      const setSpy = jest.spyOn(store, 'setCurrentConfig');
      jest.spyOn(appState.currentMfe$, 'asObservable').mockReturnValue(
        of({
          appId: 'appId',
          productName: 'product',
        } as any),
      );

      store.patchState({
        searchConfigs: [],
        pageName: 'page_name',
        fieldValues: {},
        displayedColumnsIds: [],
        viewMode: basicViewMode,
        selectedGroupKey: 'default',
      });
      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          result: {
            searchConfigName: 'config-to-add',
          },
          button: 'secondary',
        } as any),
      );
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const dropdown = await searchConfigHarness.getDropdown();
      expect(dropdown).toBeDefined();
      await dropdown?.open();
      const items = await dropdown?.getDropdownItems();
      await items?.at(0)?.selectItem();

      expect(addSpy).toHaveBeenCalledTimes(0);
      expect(setSpy).toHaveBeenCalledTimes(1);
      expect(setSpy).toHaveBeenCalledWith(undefined);
    });

    it('should add and set config if create was confirmed', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const appState = TestBed.inject(AppStateService);
      const addSpy = jest.spyOn(store, 'addSearchConfig');
      const setSpy = jest.spyOn(store, 'setCurrentConfig');
      jest.spyOn(appState.currentMfe$, 'asObservable').mockReturnValue(
        of({
          appId: 'appId',
          productName: 'product',
        } as any),
      );

      store.patchState({
        searchConfigs: [],
        pageName: 'page_name',
        fieldValues: {},
        displayedColumnsIds: [],
        viewMode: basicViewMode,
        selectedGroupKey: 'default',
      });
      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          result: {
            searchConfigName: config.name,
          },
          button: 'primary',
        } as any),
      );
      jest.spyOn(searchConfigServiceSpy, 'createSearchConfig').mockReturnValue(
        of({
          id: config.id,
          configs: [config],
        } as any),
      );
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const dropdown = await searchConfigHarness.getDropdown();
      expect(dropdown).toBeDefined();
      await dropdown?.open();
      const items = await dropdown?.getDropdownItems();
      await items?.at(0)?.selectItem();
      expect(items?.length).toBe(1);

      expect(portalMessageSpy.info).toHaveBeenCalledWith({
        summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CREATE_SUCCESS',
      });
      expect(addSpy).toHaveBeenCalledWith(config);
      expect(setSpy).toHaveBeenCalledTimes(2);
      expect(setSpy).toHaveBeenCalledWith(undefined);
      expect(setSpy).toHaveBeenCalledWith(config);
    });

    it('should save inputs and viewMode', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const appState = TestBed.inject(AppStateService);
      const createCallSpy = jest
        .spyOn(searchConfigServiceSpy, 'createSearchConfig')
        .mockReturnValue(of({} as any));
      jest.spyOn(appState.currentMfe$, 'asObservable').mockReturnValue(
        of({
          appId: 'my-app',
          productName: 'my-product',
        } as any),
      );

      store.patchState({
        searchConfigs: [],
        pageName: 'my_page',
        fieldValues: {
          k: 'v',
        },
        displayedColumnsIds: [],
        viewMode: advancedViewMode,
        selectedGroupKey: 'default',
      });
      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          result: {
            searchConfigName: config.name,
            saveInputValues: true,
            saveColumns: false,
          },
          button: 'primary',
        } as any),
      );
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const dropdown = await searchConfigHarness.getDropdown();
      expect(dropdown).toBeDefined();
      await dropdown?.open();
      const items = await dropdown?.getDropdownItems();
      await items?.at(0)?.selectItem();
      expect(items?.length).toBe(1);
      expect(createCallSpy).toHaveBeenCalledWith({
        appId: 'my-app',
        productName: 'my-product',
        fieldListVersion: 0,
        isReadonly: false,
        page: 'my_page',
        name: config.name,
        isAdvanced: true,
        columns: [],
        values: {
          k: 'v',
        },
      });
    });

    it('should not save inputs and viewMode', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const appState = TestBed.inject(AppStateService);
      const createCallSpy = jest
        .spyOn(searchConfigServiceSpy, 'createSearchConfig')
        .mockReturnValue(of({} as any));
      jest.spyOn(appState.currentMfe$, 'asObservable').mockReturnValue(
        of({
          appId: 'my-app',
          productName: 'my-product',
        } as any),
      );

      store.patchState({
        searchConfigs: [],
        pageName: 'my_page',
        fieldValues: {
          k: 'v',
        },
        displayedColumnsIds: [],
        viewMode: advancedViewMode,
        selectedGroupKey: 'default',
      });
      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          result: {
            searchConfigName: config.name,
            saveInputValues: false,
            saveColumns: false,
          },
          button: 'primary',
        } as any),
      );
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const dropdown = await searchConfigHarness.getDropdown();
      expect(dropdown).toBeDefined();
      await dropdown?.open();
      const items = await dropdown?.getDropdownItems();
      await items?.at(0)?.selectItem();
      expect(items?.length).toBe(1);
      expect(createCallSpy).toHaveBeenCalledWith({
        appId: 'my-app',
        productName: 'my-product',
        fieldListVersion: 0,
        isReadonly: false,
        page: 'my_page',
        name: config.name,
        isAdvanced: false,
        columns: [],
        values: {},
      });
    });

    it('should save columns', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const appState = TestBed.inject(AppStateService);
      const createCallSpy = jest
        .spyOn(searchConfigServiceSpy, 'createSearchConfig')
        .mockReturnValue(of({} as any));
      jest.spyOn(appState.currentMfe$, 'asObservable').mockReturnValue(
        of({
          appId: 'my-app',
          productName: 'my-product',
        } as any),
      );

      store.patchState({
        searchConfigs: [],
        pageName: 'my-page',
        fieldValues: {},
        displayedColumnsIds: ['my-col', 'my-col2'],
        viewMode: basicViewMode,
        selectedGroupKey: 'default',
      });
      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          result: {
            searchConfigName: config.name,
            saveInputValues: false,
            saveColumns: true,
          },
          button: 'primary',
        } as any),
      );
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const dropdown = await searchConfigHarness.getDropdown();
      expect(dropdown).toBeDefined();
      await dropdown?.open();
      const items = await dropdown?.getDropdownItems();
      await items?.at(0)?.selectItem();
      expect(items?.length).toBe(1);
      expect(createCallSpy).toHaveBeenCalledWith({
        appId: 'my-app',
        productName: 'my-product',
        fieldListVersion: 0,
        isReadonly: false,
        page: 'my-page',
        name: config.name,
        isAdvanced: false,
        columns: ['my-col', 'my-col2'],
        values: {},
      });
    });

    it('should not save columns', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const appState = TestBed.inject(AppStateService);
      const createCallSpy = jest
        .spyOn(searchConfigServiceSpy, 'createSearchConfig')
        .mockReturnValue(of({} as any));
      jest.spyOn(appState.currentMfe$, 'asObservable').mockReturnValue(
        of({
          appId: 'my-app',
          productName: 'my-product',
        } as any),
      );

      store.patchState({
        searchConfigs: [],
        pageName: 'my-page',
        fieldValues: {},
        displayedColumnsIds: ['my-col', 'my-col2'],
        viewMode: basicViewMode,
        selectedGroupKey: 'default',
      });
      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          result: {
            searchConfigName: config.name,
            saveInputValues: false,
            saveColumns: false,
          },
          button: 'primary',
        } as any),
      );
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const dropdown = await searchConfigHarness.getDropdown();
      expect(dropdown).toBeDefined();
      await dropdown?.open();
      const items = await dropdown?.getDropdownItems();
      await items?.at(0)?.selectItem();
      expect(items?.length).toBe(1);
      expect(createCallSpy).toHaveBeenCalledWith({
        appId: 'my-app',
        productName: 'my-product',
        fieldListVersion: 0,
        isReadonly: false,
        page: 'my-page',
        name: config.name,
        isAdvanced: false,
        columns: [],
        values: {},
      });
    });

    it('should not add config and reset if create call failed', async () => {
      const error = new Error('my-error');
      const store = TestBed.inject(SearchConfigStore);
      const appState = TestBed.inject(AppStateService);
      const addSpy = jest.spyOn(store, 'addSearchConfig');
      const setSpy = jest.spyOn(store, 'setCurrentConfig');
      const consoleSpy = jest.spyOn(console, 'error');
      jest.spyOn(appState.currentMfe$, 'asObservable').mockReturnValue(
        of({
          appId: 'appId',
          productName: 'product',
        } as any),
      );

      store.patchState({
        searchConfigs: [],
        pageName: 'page_name',
        fieldValues: {},
        displayedColumnsIds: [],
        viewMode: basicViewMode,
        selectedGroupKey: 'default',
      });
      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          result: {
            searchConfigName: config.name,
          },
          button: 'primary',
        } as any),
      );
      jest
        .spyOn(searchConfigServiceSpy, 'createSearchConfig')
        .mockReturnValue(throwError(() => error));
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const dropdown = await searchConfigHarness.getDropdown();
      expect(dropdown).toBeDefined();
      await dropdown?.open();
      const items = await dropdown?.getDropdownItems();
      await items?.at(0)?.selectItem();
      expect(items?.length).toBe(1);

      expect(portalMessageSpy.error).toHaveBeenCalledWith({
        summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CREATE_FAILURE',
      });
      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(addSpy).toHaveBeenCalledTimes(0);
      expect(setSpy).toHaveBeenCalledTimes(1);
      expect(setSpy).toHaveBeenCalledWith(undefined);
    });
  });

  describe('on edit actions', () => {
    it('should set edit mode on edit button click', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const editModeSpy = jest.spyOn(store, 'enterEditMode');
      store.patchState({
        searchConfigs: [config],
      });
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      expect(editModeSpy).toHaveBeenCalledTimes(1);
    });

    it('should cancel edit mode on edit cancel button click', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const cancelEditSpy = jest.spyOn(store, 'cancelEdit');
      store.patchState({
        searchConfigs: [config],
      });
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const cancelButton = await searchConfigHarness.getCancelEditButton();
      expect(cancelButton).toBeTruthy();
      await cancelButton?.click();
      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('on delete actions', () => {
    it('should open confirmation dialog on delete button click', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const dialogSpy = jest.spyOn(portalDialogSpy, 'openDialog');
      store.patchState({
        searchConfigs: [config],
      });
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const deleteButton = await searchConfigHarness.getDeleteButton();
      expect(deleteButton).toBeTruthy();
      await deleteButton?.click();

      expect(dialogSpy).toHaveBeenCalledWith(
        'SEARCH_CONFIG.DELETE_DIALOG.HEADER',
        {
          key: 'SEARCH_CONFIG.DELETE_DIALOG.MESSAGE',
          parameters: {
            config: config.name,
          },
        },
        'SEARCH_CONFIG.DELETE_DIALOG.CONFIRM',
        'SEARCH_CONFIG.DELETE_DIALOG.CANCEL',
      );
    });
    it('should delete config', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const deleteSpy = jest.spyOn(store, 'deleteSearchConfig');
      store.patchState({
        searchConfigs: [config],
      });

      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          button: 'primary',
        } as any),
      );
      jest
        .spyOn(searchConfigServiceSpy, 'deleteSearchConfig')
        .mockReturnValue(of({} as any));
      const { component, searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const formControlSpy = jest.spyOn(
        component.formGroup!.get('searchConfig')!,
        'setValue',
      );

      await selectFirstConfig(searchConfigHarness);

      const deleteButton = await searchConfigHarness.getDeleteButton();
      expect(deleteButton).toBeTruthy();
      await deleteButton?.click();

      expect(portalMessageSpy.info).toHaveBeenCalledWith({
        summaryKey: 'SEARCH_CONFIG.DELETE_SUCCESS',
      });
      expect(formControlSpy).toHaveBeenCalledWith(null);
      expect(deleteSpy).toHaveBeenCalledWith(config);
    });
    it('should not delete config if dialog was closed', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const deleteSpy = jest.spyOn(store, 'deleteSearchConfig');
      store.patchState({
        searchConfigs: [config],
      });

      jest
        .spyOn(portalDialogSpy, 'openDialog')
        .mockReturnValue(of(undefined as any));
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const deleteButton = await searchConfigHarness.getDeleteButton();
      expect(deleteButton).toBeTruthy();
      await deleteButton?.click();

      expect(deleteSpy).toHaveBeenCalledTimes(0);
    });
    it('should not delete config if secondary button was chosen', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const deleteSpy = jest.spyOn(store, 'deleteSearchConfig');
      store.patchState({
        searchConfigs: [config],
      });

      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          button: 'secondary',
        } as any),
      );
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const deleteButton = await searchConfigHarness.getDeleteButton();
      expect(deleteButton).toBeTruthy();
      await deleteButton?.click();

      expect(deleteSpy).toHaveBeenCalledTimes(0);
    });
    it('should not delete config if delete call failed', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const deleteSpy = jest.spyOn(store, 'deleteSearchConfig');
      const consoleSpy = jest.spyOn(console, 'error');
      const error = new Error('my-error-msg');
      store.patchState({
        searchConfigs: [config],
      });

      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          button: 'primary',
        } as any),
      );
      jest
        .spyOn(searchConfigServiceSpy, 'deleteSearchConfig')
        .mockReturnValue(throwError(() => error));
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const deleteButton = await searchConfigHarness.getDeleteButton();
      expect(deleteButton).toBeTruthy();
      await deleteButton?.click();

      expect(deleteSpy).toHaveBeenCalledTimes(0);
      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(portalMessageSpy.error).toHaveBeenCalledWith({
        summaryKey: 'SEARCH_CONFIG.DELETE_FAILURE',
      });
    });
  });

  describe('on edit save', () => {
    it('should use config info to fill dialog', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [config],
        layout: 'table',
        columnGroupComponentActive: true,
      });
      const dialogServiceSpy = jest.spyOn(portalDialogSpy, 'openDialog');

      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(dialogServiceSpy).toHaveBeenCalledWith(
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_HEADER',
        {
          type: CreateOrEditSearchConfigDialogComponent,
          inputs: {
            searchConfigName: config.name,
            saveInputValues: true,
            saveColumns: true,
            frozeColumnSaveOption: false,
            frozeColumnSaveOptionExplanation: '',
          },
        },
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CONFIRM',
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CANCEL',
      );
    });
    it('should provide explanation for column freeze when column group component is inactive', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [config],
        layout: 'table',
        columnGroupComponentActive: false,
      });
      const dialogServiceSpy = jest.spyOn(portalDialogSpy, 'openDialog');

      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(dialogServiceSpy).toHaveBeenCalledWith(
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_HEADER',
        {
          type: CreateOrEditSearchConfigDialogComponent,
          inputs: {
            searchConfigName: config.name,
            saveInputValues: true,
            saveColumns: true,
            frozeColumnSaveOption: true,
            frozeColumnSaveOptionExplanation:
              'SEARCH_CONFIG.COLUMN_GROUP_COMPONENT_INACTIVE',
          },
        },
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CONFIRM',
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CANCEL',
      );
    });

    it('should provide explanation for column freeze when layout is not table', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [config],
        layout: 'list',
        columnGroupComponentActive: true,
      });
      const dialogServiceSpy = jest.spyOn(portalDialogSpy, 'openDialog');

      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(dialogServiceSpy).toHaveBeenCalledWith(
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_HEADER',
        {
          type: CreateOrEditSearchConfigDialogComponent,
          inputs: {
            searchConfigName: config.name,
            saveInputValues: true,
            saveColumns: true,
            frozeColumnSaveOption: true,
            frozeColumnSaveOptionExplanation:
              'SEARCH_CONFIG.TABLE_VIEW_INACTIVE',
          },
        },
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CONFIRM',
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CANCEL',
      );
    });
    it('should cancel edit if dialog was closed', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const cancelEditSpy = jest.spyOn(store, 'cancelEdit');
      store.patchState({
        searchConfigs: [config],
        layout: 'table',
        columnGroupComponentActive: true,
      });
      jest.spyOn(searchConfigServiceSpy, 'getSearchConfig').mockReturnValue(
        of({
          config: config,
        } as any),
      );

      jest
        .spyOn(portalDialogSpy, 'openDialog')
        .mockReturnValue(of(undefined as any));
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    });
    it('should cancel edit if edit was not confirmed', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const cancelEditSpy = jest.spyOn(store, 'cancelEdit');
      store.patchState({
        searchConfigs: [config],
        layout: 'table',
        columnGroupComponentActive: true,
      });
      jest.spyOn(searchConfigServiceSpy, 'getSearchConfig').mockReturnValue(
        of({
          config: config,
        } as any),
      );

      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          button: 'secondary',
        } as any),
      );
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    });
    it('should save edit config if edit was confirmed', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const saveEditSpy = jest.spyOn(store, 'saveEdit');
      const updatedConfig = {
        ...config,
        name: 'conf-1',
        values: {
          k: 'v-2',
        },
      };
      store.patchState({
        searchConfigs: [config],
        layout: 'table',
        columnGroupComponentActive: true,
      });
      jest.spyOn(searchConfigServiceSpy, 'getSearchConfig').mockReturnValue(
        of({
          config: config,
        } as any),
      );
      jest.spyOn(searchConfigServiceSpy, 'updateSearchConfig').mockReturnValue(
        of({
          configs: [updatedConfig],
        } as any),
      );

      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          button: 'primary',
        } as any),
      );
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(portalMessageSpy.info).toHaveBeenCalledWith({
        summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_SUCCESS',
      });
      expect(saveEditSpy).toHaveBeenCalledWith(updatedConfig);
    });
    it('should save inputs and viewMode', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const updateSpy = jest
        .spyOn(searchConfigServiceSpy, 'updateSearchConfig')
        .mockReturnValue(of(undefined as any));
      const initState = {
        searchConfigs: [config],
        layout: 'table',
        columnGroupComponentActive: true,
      };
      store.patchState(initState as any);
      jest.spyOn(searchConfigServiceSpy, 'getSearchConfig').mockReturnValue(
        of({
          config: config,
        } as any),
      );
      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          result: {
            searchConfigName: 'new-name',
            saveInputValues: true,
          },
          button: 'primary',
        } as any),
      );

      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();

      store.patchState({
        ...initState,
        fieldValues: {
          k: 'v_2',
        },
        viewMode: advancedViewMode,
      } as any);

      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(updateSpy).toHaveBeenCalledWith('1', {
        searchConfig: {
          ...config,
          name: 'new-name',
          columns: [],
          values: {
            k: 'v_2',
          },
          isAdvanced: true,
        },
      });
    });
    it('should not save inputs and viewMode', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const updateSpy = jest
        .spyOn(searchConfigServiceSpy, 'updateSearchConfig')
        .mockReturnValue(of(undefined as any));
      const initState = {
        searchConfigs: [config],
        layout: 'table',
        columnGroupComponentActive: true,
      };
      store.patchState(initState as any);
      jest.spyOn(searchConfigServiceSpy, 'getSearchConfig').mockReturnValue(
        of({
          config: config,
        } as any),
      );
      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          result: {
            searchConfigName: 'new-name',
            saveInputValues: false,
          },
          button: 'primary',
        } as any),
      );

      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();

      store.patchState({
        ...initState,
        fieldValues: {
          k: 'v_2',
        },
        viewMode: advancedViewMode,
      } as any);

      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(updateSpy).toHaveBeenCalledWith('1', {
        searchConfig: {
          ...config,
          name: 'new-name',
          columns: [],
          values: {},
          isAdvanced: true,
        },
      });
    });
    it('should save columns', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const updateSpy = jest
        .spyOn(searchConfigServiceSpy, 'updateSearchConfig')
        .mockReturnValue(of(undefined as any));
      const initState = {
        searchConfigs: [config],
        layout: 'table',
        columnGroupComponentActive: true,
      };
      store.patchState(initState as any);
      jest.spyOn(searchConfigServiceSpy, 'getSearchConfig').mockReturnValue(
        of({
          config: config,
        } as any),
      );
      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          result: {
            searchConfigName: 'new-name',
            saveColumns: true,
          },
          button: 'primary',
        } as any),
      );

      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();

      store.patchState({
        ...initState,
        displayedColumnsIds: ['col-2'],
      } as any);

      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(updateSpy).toHaveBeenCalledWith('1', {
        searchConfig: {
          ...config,
          name: 'new-name',
          columns: ['col-2'],
          values: {},
          isAdvanced: false,
        },
      });
    });
    it('should not save columns', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const updateSpy = jest
        .spyOn(searchConfigServiceSpy, 'updateSearchConfig')
        .mockReturnValue(of(undefined as any));
      const initState = {
        searchConfigs: [config],
        layout: 'table',
        columnGroupComponentActive: true,
      };
      store.patchState(initState as any);
      jest.spyOn(searchConfigServiceSpy, 'getSearchConfig').mockReturnValue(
        of({
          config: config,
        } as any),
      );
      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          result: {
            searchConfigName: 'new-name',
            saveColumns: false,
          },
          button: 'primary',
        } as any),
      );

      const { component, searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();

      store.patchState({
        ...initState,
        displayedColumnsIds: ['col-2'],
      } as any);

      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(updateSpy).toHaveBeenCalledWith('1', {
        searchConfig: {
          ...config,
          name: 'new-name',
          columns: [],
          values: {},
          isAdvanced: false,
        },
      });
    });
    it('should cancel edit if get search config call failed', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const cancelEditSpy = jest.spyOn(store, 'cancelEdit');
      const error = new Error('my-msg');
      store.patchState({
        searchConfigs: [config],
        layout: 'table',
        columnGroupComponentActive: true,
      });
      jest
        .spyOn(searchConfigServiceSpy, 'getSearchConfig')
        .mockReturnValue(throwError(() => error));

      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          button: 'primary',
        } as any),
      );
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    });
    it('should cancel edit if update search config call failed', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const cancelEditSpy = jest.spyOn(store, 'cancelEdit');
      store.patchState({
        searchConfigs: [config],
        layout: 'table',
        columnGroupComponentActive: true,
      });
      const error = new Error('my-msg');
      jest.spyOn(searchConfigServiceSpy, 'getSearchConfig').mockReturnValue(
        of({
          config: config,
        } as any),
      );
      jest
        .spyOn(searchConfigServiceSpy, 'updateSearchConfig')
        .mockReturnValue(throwError(() => error));

      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          button: 'primary',
        } as any),
      );
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      await selectFirstConfig(searchConfigHarness);

      const editButton = await searchConfigHarness.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('on dataToRevert change', () => {
    it('should not emit if data does not contain fieldValues', fakeAsync(() => {
      const store = TestBed.inject(SearchConfigStore);

      const { component } = setUp();
      const emitterSpy = jest.spyOn(component.searchConfigSelected, 'emit');

      store.patchState({
        dataToRevert: {
          fieldValues: undefined,
          viewMode: advancedViewMode,
          displayedColumnsIds: ['col-2'],
          columnGroupKey: 'default',
        },
      });

      tick(500);

      expect(emitterSpy).toHaveBeenCalledTimes(0);
    }));
    it('should not emit if data does not contain viewMode', fakeAsync(() => {
      const store = TestBed.inject(SearchConfigStore);

      const { component } = setUp();
      const emitterSpy = jest.spyOn(component.searchConfigSelected, 'emit');

      store.patchState({
        dataToRevert: {
          fieldValues: {
            k: 'v',
          },
          viewMode: undefined,
          displayedColumnsIds: ['col-2'],
          columnGroupKey: 'default',
        },
      });

      tick(500);

      expect(emitterSpy).toHaveBeenCalledTimes(0);
    }));
    it('should emit searchConfigSelected', fakeAsync(() => {
      const store = TestBed.inject(SearchConfigStore);

      const { component } = setUp();
      const emitterSpy = jest.spyOn(component.searchConfigSelected, 'emit');

      store.patchState({
        dataToRevert: {
          fieldValues: {
            k: 'v_1',
          },
          viewMode: advancedViewMode,
          displayedColumnsIds: ['col-2'],
          columnGroupKey: 'default',
        },
      });

      tick(500);

      expect(emitterSpy).toHaveBeenCalledWith({
        name: undefined,
        fieldValues: {
          k: 'v_1',
        },
        displayedColumnsIds: ['col-2'],
        viewMode: advancedViewMode,
      });
    }));
  });

  describe('on currentConfig change', () => {
    it('should emit undefined', fakeAsync(() => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [config],
        currentSearchConfig: config,
        fieldValues: { k: 'v' },
      });

      const { component } = setUp();
      component.formGroup?.get('searchConfig')?.setValue(config);
      const emitterSpy = jest.spyOn(component.searchConfigSelected, 'emit');

      component.currentFieldValues = { k: 'v_2' };
      tick(500);

      expect(emitterSpy).toHaveBeenCalledWith(undefined);
    }));
    it('should emit all config data ', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [config],
        currentSearchConfig: undefined,
        columnGroupComponentActive: true,
        displayedSearchData: {
          fieldValues: {
            my_k: 'my_v',
          },
          viewMode: advancedViewMode,
          displayedColumnsIds: ['my_col'],
        },
      });

      const { component, searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      const emitterSpy = jest.spyOn(component.searchConfigSelected, 'emit');
      await selectFirstConfig(searchConfigHarness);

      expect(emitterSpy).toHaveBeenCalledWith({
        name: config.name,
        fieldValues: config.values,
        displayedColumnsIds: config.columns,
        viewMode: config.isAdvanced ? advancedViewMode : basicViewMode,
      });
    });
    it('should emit only values config', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [onlyValuesConfig],
        currentSearchConfig: undefined,
        columnGroupComponentActive: true,
        displayedSearchData: {
          fieldValues: {
            my_k: 'my_v',
          },
          viewMode: advancedViewMode,
          displayedColumnsIds: ['my_col'],
        },
      });

      const { component, searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      const emitterSpy = jest.spyOn(component.searchConfigSelected, 'emit');
      await selectFirstConfig(searchConfigHarness);

      expect(emitterSpy).toHaveBeenCalledWith({
        name: onlyValuesConfig.name,
        fieldValues: onlyValuesConfig.values,
        displayedColumnsIds: ['my_col'],
        viewMode: onlyValuesConfig.isAdvanced
          ? advancedViewMode
          : basicViewMode,
      });
    });
    it('should emit only columns config', fakeAsync(() => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
        currentSearchConfig: undefined,
        columnGroupComponentActive: true,
        displayedSearchData: {
          fieldValues: {
            my_k: 'my_v',
          },
          viewMode: advancedViewMode,
          displayedColumnsIds: ['my_col'],
        },
      });

      const { component } = setUp();
      const emitterSpy = jest.spyOn(component.searchConfigSelected, 'emit');
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
        currentSearchConfig: onlyColumnsConfig,
        columnGroupComponentActive: true,
        displayedSearchData: {
          fieldValues: {
            my_k: 'my_v',
          },
          viewMode: advancedViewMode,
          displayedColumnsIds: ['my_col'],
        },
      });

      tick(500);

      expect(emitterSpy).toHaveBeenCalledWith({
        name: onlyColumnsConfig.name,
        fieldValues: {
          my_k: 'my_v',
        },
        displayedColumnsIds: onlyColumnsConfig.columns,
        viewMode: advancedViewMode,
      });
    }));
    it('should emit only values config if column group component is not active', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [config],
        currentSearchConfig: undefined,
        columnGroupComponentActive: false,
        displayedSearchData: {
          fieldValues: {
            my_k: 'my_v',
          },
          viewMode: advancedViewMode,
          displayedColumnsIds: ['my_col'],
        },
      });

      const { component, searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      const emitterSpy = jest.spyOn(component.searchConfigSelected, 'emit');
      await selectFirstConfig(searchConfigHarness);

      expect(emitterSpy).toHaveBeenCalledWith({
        name: config.name,
        fieldValues: config.values,
        displayedColumnsIds: ['my_col'],
        viewMode: config.isAdvanced ? advancedViewMode : basicViewMode,
      });
    });
  });

  it('should unsubscribe on destroy', () => {
    const { component } = setUp();
    jest.spyOn(component.currentConfigSub!, 'unsubscribe');
    jest.spyOn(component.dataRevertSub!, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.currentConfigSub?.unsubscribe).toHaveBeenCalledTimes(1);
    expect(component.dataRevertSub?.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
