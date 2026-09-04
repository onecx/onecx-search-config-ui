import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { TranslateTestingModule } from 'ngx-translate-testing';
import { ReplaySubject, of, throwError } from 'rxjs';
import { DialogService } from 'primeng/dynamicdialog';

import { PortalDialogService } from '@onecx/angular-accelerator';
import { PortalMessageService } from '@onecx/angular-integration-interface';
import { AppStateService } from '@onecx/angular-integration-interface';
import { FakeTopic } from '@onecx/angular-integration-interface/mocks';
import {
  REMOTE_COMPONENT_CONFIG,
  RemoteComponentConfig,
} from '@onecx/angular-utils';

import {
  SEARCH_CONFIG_STORE_NAME,
  SEARCH_CONFIG_TOPIC,
  SearchConfigMessage,
  SearchConfigStore,
} from 'src/app/shared/search-config.store';
import { CreateOrEditSearchConfigDialogComponent } from 'src/app/shared/components/create-or-edit-search-config-dialog/create-or-edit-search-config-dialog.component';
import {
  Configuration,
  SearchConfigAPIService,
} from 'src/app/shared/generated';
import { advancedViewMode, basicViewMode } from 'src/app/shared/constants';
import { OneCXSearchConfigComponent } from './search-config.component';
import { OneCXSearchConfigHarness } from './search-config.harness';

const createSpyObj = (
  baseName: string,
  methodNames: Array<string>,
): { [key: string]: any } => {
  const obj: any = {};

  for (let i = 0; i < methodNames.length; i++) {
    obj[methodNames[i]] = jest.fn();
  }

  return obj;
};

describe('OneCXSearchConfigComponent', () => {
  let component: OneCXSearchConfigComponent;
  let fixture: ComponentFixture<OneCXSearchConfigComponent>;
  let store: SearchConfigStore;

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

  async function setUpWithHarnessAndInit(permissions: Array<string>) {
    const localFixture = fixture;

    component.ocxInitRemoteComponent({
      baseUrl: 'base_url',
      permissions: permissions,
    } as any);
    localFixture.detectChanges();
    await localFixture.whenStable();
    const searchConfigHarness =
      await TestbedHarnessEnvironment.harnessForFixture(
        localFixture,
        OneCXSearchConfigHarness,
      );

    return { fixture, component, searchConfigHarness };
  }

  async function selectFirstConfig(harness: OneCXSearchConfigHarness) {
    const items = await harness.getItems();
    const selectButton = await items?.at(0)?.getSelectButton();
    await selectButton?.click();
    return items?.at(0);
  }

  let baseUrlSubject: ReplaySubject<any>;
  beforeEach(() => {
    baseUrlSubject = new ReplaySubject<any>(1);
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        OneCXSearchConfigComponent,
        NoopAnimationsModule,
        TranslateTestingModule.withTranslations({
          en: require('./src/assets/i18n/en.json'),
          de: require('./src/assets/i18n/de.json'),
        }).withDefaultLanguage('en'),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: REMOTE_COMPONENT_CONFIG,
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
        DialogService,
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
    }).compileComponents();

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

    fixture = TestBed.createComponent(OneCXSearchConfigComponent);
    component = fixture.componentInstance;
    (component as any).permissions = allPermissions;
    fixture.detectChanges();

    (component as any).portalDialogService = portalDialogSpy;
    (component as any).portalMessageService = portalMessageSpy;
    (component as any).searchConfigService = searchConfigServiceSpy as any;

    store = TestBed.inject(SearchConfigStore);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update store on view mode input set', fakeAsync(() => {
    const spy = jest.spyOn(store, 'updateViewMode');

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

      jest.spyOn(component, 'ocxInitRemoteComponent');
      component.ocxRemoteComponentConfig = config;

      expect(component.permissions).toEqual(['permission']);
      expect(component.ocxInitRemoteComponent).toHaveBeenCalledWith(config);
      expect(searchConfigServiceSpy.configuration.basePath).toEqual('base/bff');
      baseUrlSubject.asObservable().subscribe((item) => {
        expect(item).toEqual(config);
        done();
      });
    });

    it('should set search configs on page info update', fakeAsync(() => {
      const appState = TestBed.inject(AppStateService);
      const configs = [
        {
          name: 'config-1',
          values: {},
          columns: [],
        },
        {
          name: 'config-2',
          values: {},
          columns: [],
        },
      ];

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

      const setSearchConfigsSpy = jest.spyOn(store, 'setSearchConfigs');

      fixture.detectChanges();
      store.setSearchConfigs(configs as any);

      expect(setSearchConfigsSpy).toHaveBeenCalledWith(configs);
    }));
  });

  describe('overlay content', () => {
    it('getAddItem returns null when manage button is not available', async () => {
      const { searchConfigHarness } = await setUpWithHarnessAndInit(['']);

      const manageEl = document.querySelector(
        '#sc_search_config_manage_search_config',
      );
      if (manageEl) manageEl.remove();
      const addItem = await searchConfigHarness.getAddItem();
      expect(addItem).toBeNull();
    });

    it('getAddItem returns null when overlay has no p-button', async () => {
      const { fixture, searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const manage = await searchConfigHarness.getManageButton();
      await manage?.click();
      fixture.detectChanges();

      const popover = document.querySelector('.p-popover');
      const pbtn = popover?.querySelector('p-button');
      pbtn?.remove();

      const addItem = await searchConfigHarness.getAddItem();
      expect(addItem).toBeNull();
    });

    it('should display overlay with configs that have values', async () => {
      store.patchState({
        searchConfigs: [config, onlyValuesConfig, onlyColumnsConfig],
      });
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(viewOnlyPermissions);

      const items = await searchConfigHarness.getItems();
      expect(items?.length).toBe(2);
      expect(await items?.at(0)?.getText()).toEqual(config.name);
      expect(await items?.at(1)?.getText()).toEqual(onlyValuesConfig.name);
    });
  });

  describe('on config save', () => {
    it('should provide explanation for column freeze when column group component is inactive', async () => {
      store.patchState({
        columnGroupComponentActive: false,
        layout: 'table',
        searchConfigs: [],
      });
      const dialogServiceSpy = jest.spyOn(portalDialogSpy, 'openDialog');
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const addItem = await searchConfigHarness.getAddItem();
      expect(addItem).toBeDefined();
      await addItem?.click();
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
      store.patchState({
        columnGroupComponentActive: true,
        layout: 'list',
        searchConfigs: [],
      });
      const dialogServiceSpy = jest.spyOn(portalDialogSpy, 'openDialog');
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const addItem = await searchConfigHarness.getAddItem();
      expect(addItem).toBeDefined();
      await addItem?.click();
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

      const addItem = await searchConfigHarness.getAddItem();
      expect(addItem).toBeDefined();
      await addItem?.click();

      expect(addSpy).toHaveBeenCalledTimes(0);
      expect(setSpy).toHaveBeenCalledTimes(1);
      expect(setSpy).toHaveBeenCalledWith(undefined);
    });

    it('should not add config and reset if create was not confirmed', async () => {
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

      const addItem = await searchConfigHarness.getAddItem();
      expect(addItem).toBeDefined();
      await addItem?.click();

      expect(addSpy).toHaveBeenCalledTimes(0);
      expect(setSpy).toHaveBeenCalledTimes(1);
      expect(setSpy).toHaveBeenCalledWith(undefined);
    });

    it('should add and set config if create was confirmed', async () => {
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

      const addItem = await searchConfigHarness.getAddItem();
      expect(addItem).toBeDefined();
      await addItem?.click();

      expect(portalMessageSpy.info).toHaveBeenCalledWith({
        summaryKey: 'SEARCH_CONFIG.CREATE_EDIT_DIALOG.CREATE_SUCCESS',
      });
      expect(addSpy).toHaveBeenCalledWith(config);
      expect(setSpy).toHaveBeenCalledTimes(2);
      expect(setSpy).toHaveBeenCalledWith(undefined);
      expect(setSpy).toHaveBeenCalledWith(config);
    });

    it('should save inputs and viewMode', async () => {
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

      const addItem = await searchConfigHarness.getAddItem();
      expect(addItem).toBeDefined();
      await addItem?.click();

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

    it('should save columns', async () => {
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

      const addItem = await searchConfigHarness.getAddItem();
      expect(addItem).toBeDefined();
      await addItem?.click();

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

    it('should not add config and reset if create call failed', async () => {
      const error = new Error('my-error');
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

      const addItem = await searchConfigHarness.getAddItem();
      expect(addItem).toBeDefined();
      await addItem?.click();

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
      const editModeSpy = jest.spyOn(store, 'enterEditMode');
      store.patchState({
        searchConfigs: [config],
      });
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectFirstConfig(searchConfigHarness);
      const editButton = await item?.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      expect(editModeSpy).toHaveBeenCalledTimes(1);
    });

    it('should cancel edit mode on edit cancel button click', async () => {
      const cancelEditSpy = jest.spyOn(store, 'cancelEdit');
      store.patchState({
        searchConfigs: [config],
      });
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      const item = await selectFirstConfig(searchConfigHarness);

      const editButton = await item?.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const cancelButton = await searchConfigHarness.getCancelEditButton();
      expect(cancelButton).toBeTruthy();
      await cancelButton?.click();
      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('on delete actions', () => {
    it('should delete config', async () => {
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
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectFirstConfig(searchConfigHarness);

      const deleteButton = await item?.getDeleteButton();
      expect(deleteButton).toBeTruthy();
      await deleteButton?.click();

      expect(portalMessageSpy.info).toHaveBeenCalledWith({
        summaryKey: 'SEARCH_CONFIG.DELETE_SUCCESS',
      });
      expect(deleteSpy).toHaveBeenCalledWith(config);
    });
    it('should not delete config if dialog was closed', async () => {
      const deleteSpy = jest.spyOn(store, 'deleteSearchConfig');
      store.patchState({
        searchConfigs: [config],
      });

      jest
        .spyOn(portalDialogSpy, 'openDialog')
        .mockReturnValue(of(undefined as any));
      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      const item = await selectFirstConfig(searchConfigHarness);

      const deleteButton = await item?.getDeleteButton();
      expect(deleteButton).toBeTruthy();
      await deleteButton?.click();

      expect(deleteSpy).toHaveBeenCalledTimes(0);
    });
    it('should not delete config if secondary button was chosen', async () => {
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
      const item = await selectFirstConfig(searchConfigHarness);

      const deleteButton = await item?.getDeleteButton();
      expect(deleteButton).toBeTruthy();
      await deleteButton?.click();

      expect(deleteSpy).toHaveBeenCalledTimes(0);
    });
    it('should not delete config if delete call failed', async () => {
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
      const item = await selectFirstConfig(searchConfigHarness);

      const deleteButton = await item?.getDeleteButton();
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
      store.patchState({
        searchConfigs: [config],
        layout: 'table',
        columnGroupComponentActive: true,
      });
      const dialogServiceSpy = jest.spyOn(portalDialogSpy, 'openDialog');

      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      const item = await selectFirstConfig(searchConfigHarness);

      const editButton = await item?.getEditButton();
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
      store.patchState({
        searchConfigs: [config],
        layout: 'table',
        columnGroupComponentActive: false,
      });
      const dialogServiceSpy = jest.spyOn(portalDialogSpy, 'openDialog');

      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      const item = await selectFirstConfig(searchConfigHarness);

      const editButton = await item?.getEditButton();
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
      store.patchState({
        searchConfigs: [config],
        layout: 'list',
        columnGroupComponentActive: true,
      });
      const dialogServiceSpy = jest.spyOn(portalDialogSpy, 'openDialog');

      const { searchConfigHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      const item = await selectFirstConfig(searchConfigHarness);

      const editButton = await item?.getEditButton();
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
      const item = await selectFirstConfig(searchConfigHarness);

      const editButton = await item?.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    });
    it('should cancel edit if edit was not confirmed', async () => {
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
      const item = await selectFirstConfig(searchConfigHarness);

      const editButton = await item?.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    });
    it('should save edit config if edit was confirmed', async () => {
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
      const item = await selectFirstConfig(searchConfigHarness);

      const editButton = await item?.getEditButton();
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
      const item = await selectFirstConfig(searchConfigHarness);

      const editButton = await item?.getEditButton();
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
    it('should save columns', async () => {
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
      const item = await selectFirstConfig(searchConfigHarness);

      const editButton = await item?.getEditButton();
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
    it('should cancel edit if get search config call failed', async () => {
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
      const item = await selectFirstConfig(searchConfigHarness);

      const editButton = await item?.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    });
    it('should cancel edit if update search config call failed', async () => {
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
      const item = await selectFirstConfig(searchConfigHarness);

      const editButton = await item?.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await searchConfigHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    });

    it('should cancel edit if config is not set', fakeAsync(() => {
      const cancelEditSpy = jest.spyOn(store, 'cancelEdit');

      component.onSearchConfigSaveEdit({
        currentConfig: undefined,
      } as any);

      tick(500);

      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    }));
  });

  describe('on dataToRevert change', () => {
    it('should not emit if data does not contain viewMode', fakeAsync(() => {
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
  });

  describe('on currentConfig change', () => {
    it('should emit undefined', fakeAsync(() => {
      const localFixture = TestBed.createComponent(OneCXSearchConfigComponent);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();
      const localStore = (localComponent as any).searchConfigStore;

      localStore.patchState({
        searchConfigs: [config],
        currentSearchConfig: config,
        fieldValues: { k: 'v' },
      });

      const emitterSpy = jest.spyOn(
        localComponent.searchConfigSelected,
        'emit',
      );

      localComponent.currentFieldValues = { k: 'v_2' };
      tick(500);

      expect(emitterSpy).toHaveBeenCalledWith(undefined);
    }));
    it('should emit all config data ', async () => {
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
      const localFixture = TestBed.createComponent(OneCXSearchConfigComponent);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();
      const localStore = (localComponent as any).searchConfigStore;

      localStore.patchState({
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

      const emitterSpy = jest.spyOn(
        localComponent.searchConfigSelected,
        'emit',
      );
      localStore.patchState({
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

    it('should emit advancedViewMode when selected config is advanced', fakeAsync(() => {
      const advancedConfig = {
        ...config,
        isAdvanced: true,
      };

      const localFixture = TestBed.createComponent(OneCXSearchConfigComponent);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();
      const localStore = (localComponent as any).searchConfigStore;

      localStore.patchState({
        searchConfigs: [advancedConfig],
        currentSearchConfig: undefined,
        columnGroupComponentActive: true,
        displayedSearchData: {
          fieldValues: {
            my_k: 'my_v',
          },
          viewMode: basicViewMode,
          displayedColumnsIds: ['my_col'],
        },
      });

      const emitterSpy = jest.spyOn(
        localComponent.searchConfigSelected,
        'emit',
      );

      localStore.patchState({
        currentSearchConfig: advancedConfig,
      });

      tick(500);

      expect(emitterSpy).toHaveBeenCalledWith({
        name: advancedConfig.name,
        fieldValues: advancedConfig.values,
        displayedColumnsIds: advancedConfig.columns,
        viewMode: advancedViewMode,
      });
    }));
  });

  describe('focusManageButton', () => {
    it('should not throw when manage button is undefined', () => {
      component.manageButton = undefined;

      expect(() => component.focusManageButton()).not.toThrow();
    });
  });
});
