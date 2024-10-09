import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReplaySubject, of, throwError } from 'rxjs';
import { TranslateTestingModule } from 'ngx-translate-testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import {
  BASE_URL,
  RemoteComponentConfig,
} from '@onecx/angular-remote-components';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { OneCXColumnGroupSelectionHarness } from './column-group-selection.harness';
import { FakeTopic } from '@onecx/angular-integration-interface/mocks';
import {
  SEARCH_CONFIG_STORE_NAME,
  SEARCH_CONFIG_TOPIC,
  SearchConfigMessage,
  SearchConfigStore,
} from 'src/app/shared/search-config.store';
import { CreateOrEditSearchConfigDialogComponent } from 'src/app/shared/components/create-or-edit-search-config-dialog/create-or-edit-search-config-dialog.component';
import { ButtonModule } from 'primeng/button';
import {
  ColumnType,
  IfPermissionDirective,
  PortalDialogService,
  PortalMessageService,
} from '@onecx/portal-integration-angular';
import { AppConfigService } from '@onecx/angular-integration-interface';
import {
  Configuration,
  SearchConfigAPIService,
} from 'src/app/shared/generated';
import { DialogService } from 'primeng/dynamicdialog';
import { TooltipModule } from 'primeng/tooltip';
import { OneCXColumnGroupSelectionComponent } from './column-group-selection.component';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { FocusTrapModule } from 'primeng/focustrap';
import { advancedViewMode } from 'src/app/shared/constants';

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
  const obj: any = {};

  for (let i = 0; i < methodNames.length; i++) {
    obj[methodNames[i]] = jest.fn();
  }

  return obj;
};

describe('OneCXColumnGroupSelectionComponent', () => {
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
    const fixture = TestBed.createComponent(OneCXColumnGroupSelectionComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    return { fixture, component };
  }

  async function setUpWithHarnessAndInit(permissions: Array<string>) {
    const fixture = TestBed.createComponent(OneCXColumnGroupSelectionComponent);
    const component = fixture.componentInstance;
    component.ocxInitRemoteComponent({
      baseUrl: 'base_url',
      permissions: permissions,
    } as any);
    fixture.detectChanges();
    const columnGroupHarness =
      await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        OneCXColumnGroupSelectionHarness,
      );

    return { fixture, component, columnGroupHarness };
  }

  async function selectItem(
    index: number,
    harness: OneCXColumnGroupSelectionHarness,
  ) {
    const items = await harness.getItems();
    const selectButton = await items?.at(index)?.getSelectButton();
    await selectButton?.click();
    return items?.at(index);
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
      .overrideComponent(OneCXColumnGroupSelectionComponent, {
        set: {
          imports: [
            PortalDependencyModule,
            TranslateTestingModule,
            CommonModule,
            TooltipModule,
            CreateOrEditSearchConfigDialogComponent,
            ButtonModule,
            OverlayPanelModule,
            FocusTrapModule,
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

  it('should update store on selectedGroupKey input set', fakeAsync(() => {
    const store = TestBed.inject(SearchConfigStore);
    const spy = jest.spyOn(store, 'setSelectedGroupKey');

    const { component } = setUp();

    component.selectedGroupKey = 'my-key';
    tick(500);

    expect(spy).toHaveBeenCalledWith('my-key');
  }));

  it('should not update store on when selectedGroupKey input is undefined', fakeAsync(() => {
    const store = TestBed.inject(SearchConfigStore);
    const spy = jest.spyOn(store, 'setSelectedGroupKey');

    const { component } = setUp();

    component.selectedGroupKey = undefined;
    tick(500);

    expect(spy).toHaveBeenCalledTimes(0);
  }));

  it('should update store on customGroupKey input set', fakeAsync(() => {
    const store = TestBed.inject(SearchConfigStore);
    const spy = jest.spyOn(store, 'setCustomGroupKey');

    const { component } = setUp();

    component.customGroupKey = 'my-key';
    tick(500);

    expect(spy).toHaveBeenCalledWith('my-key');
  }));

  it('should update store on displayedColumnsIds input set', fakeAsync(() => {
    const store = TestBed.inject(SearchConfigStore);
    const spy = jest.spyOn(store, 'updateDisplayedColumnsIds');

    const { component } = setUp();

    component.displayedColumnsIds = ['col-1'];
    tick(500);

    expect(spy).toHaveBeenCalledWith(['col-1']);
  }));

  it('should update store on layout input set', fakeAsync(() => {
    const store = TestBed.inject(SearchConfigStore);
    const spy = jest.spyOn(store, 'updateLayout');

    const { component } = setUp();

    component.layout = 'grid';
    tick(500);

    expect(spy).toHaveBeenCalledWith('grid');
  }));

  it('should update columns on columns input set', fakeAsync(() => {
    const { component } = setUp();

    component.columns = [{ id: '1' } as any, { id: '2' }];
    tick(500);

    expect(component.columns$.getValue()).toEqual([
      { id: '1' } as any,
      { id: '2' },
    ]);
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

    it('should set non search config group keys on columns update', fakeAsync(() => {
      const store = TestBed.inject(SearchConfigStore);
      const spy = jest.spyOn(store, 'setNonSearchConfigGroupKeys');

      const { component } = setUp();

      component.defaultGroupKey = 'default';

      component.columns = [
        {
          id: '1',
          nameKey: 'col-1',
          columnType: ColumnType.STRING,
          predefinedGroupKeys: ['default', 'extended'],
        },
        {
          id: '1',
          nameKey: 'col-1',
          columnType: ColumnType.STRING,
          predefinedGroupKeys: ['default'],
        },
        {
          id: '1',
          nameKey: 'col-1',
          columnType: ColumnType.STRING,
          predefinedGroupKeys: ['full'],
        },
      ];

      tick(500);

      expect(spy).toHaveBeenCalledWith(['default', 'extended', 'full']);
    }));
  });
  describe('overlay content', () => {
    it('should not display manage button with layout set to list or grid', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [],
        nonSearchConfigGroupKeys: ['default'],
        customGroupKey: 'custom',
        layout: 'grid',
      });
      const { columnGroupHarness } = await setUpWithHarnessAndInit(['']);

      const manageButton = await columnGroupHarness.getManageButton();
      expect(manageButton).toBeFalsy();
    });

    it('should not display manage button with no view permission', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [],
        nonSearchConfigGroupKeys: ['default'],
        customGroupKey: 'custom',
        layout: 'table',
      });
      const { columnGroupHarness } = await setUpWithHarnessAndInit(['']);

      const manageButton = await columnGroupHarness.getManageButton();
      expect(manageButton).toBeFalsy();
    });

    it('should display overlay with configs that have only columns', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [config, onlyValuesConfig, onlyColumnsConfig],
        nonSearchConfigGroupKeys: [],
        customGroupKey: 'custom',
        layout: 'table',
      });
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(viewOnlyPermissions);

      const items = await columnGroupHarness.getItems();
      expect(items?.length).toBe(1);
      expect(await items?.at(0)?.getText()).toEqual(onlyColumnsConfig.name);
    });

    it('should display editing message on edit mode', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
      });
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

      const editButton = await item?.getEditButton();
      await editButton?.click();
      const manageButton = await columnGroupHarness.getManageButton();
      expect(await manageButton?.getLabel()).toEqual('Editing: config-3');
    });

    it('should display all group keys', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [config, onlyValuesConfig, onlyColumnsConfig],
        nonSearchConfigGroupKeys: ['def', 'full'],
        customGroupKey: 'custom',
        selectedGroupKey: 'def',
        layout: 'table',
      });
      jest
        .spyOn(store, 'setNonSearchConfigGroupKeys')
        .mockImplementation(jest.fn());
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(viewOnlyPermissions);

      const items = await columnGroupHarness.getItems();
      expect(items?.length).toBe(3);
      expect(await items?.at(0)?.getText()).toEqual('def');
      expect(await items?.at(1)?.getText()).toEqual('full');
      expect(await items?.at(2)?.getText()).toEqual(onlyColumnsConfig.name);
    });

    it('should display edit/delete next to items', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
      });
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const items = await columnGroupHarness.getItems();
      expect(items?.length).toBe(1);
      expect(await items?.at(0)?.getEditButton()).toBeDefined();
      expect(await items?.at(0)?.getDeleteButton()).toBeDefined();
    });
    it('should not display edit/delete if config is readonly', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [
          {
            ...onlyColumnsConfig,
            isReadonly: true,
          },
        ],
        layout: 'table',
      });
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const items = await columnGroupHarness.getItems();
      expect(items?.length).toBe(1);
      expect(await items?.at(0)?.getEditButton()).toBeNull();
      expect(await items?.at(0)?.getDeleteButton()).toBeNull();
    });
    it('should not display edit/delete if no permissions ', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [
          {
            ...onlyColumnsConfig,
            isReadonly: true,
          },
        ],
        layout: 'table',
      });
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(viewOnlyPermissions);

      const items = await columnGroupHarness.getItems();
      expect(items?.length).toBe(1);
      expect(await items?.at(0)?.getEditButton()).toBeNull();
      expect(await items?.at(0)?.getDeleteButton()).toBeNull();
    });
  });

  describe('on edit mode', () => {
    it('should display save/cancel options', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
      });
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

      const editButton = await item?.getEditButton();
      await editButton?.click();

      const saveEditButton = await columnGroupHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      const cancelEditButton = await columnGroupHarness.getCancelEditButton();
      expect(cancelEditButton).toBeTruthy();
    });
    it('should not display save/cancel options when not in charge of edit', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [config],
        editMode: true,
        inChargeOfEdit: 'other-store-name',
        currentSearchConfig: config,
        layout: 'table',
      });
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const saveEditButton = await columnGroupHarness.getSaveEditButton();
      expect(saveEditButton).toBeFalsy();
      const cancelEditButton = await columnGroupHarness.getCancelEditButton();
      expect(cancelEditButton).toBeFalsy();
    });
  });

  describe('on key change', () => {
    it('should set current config', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
      });
      const storeSpy = jest.spyOn(store, 'setSelectedGroupKey');
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      await selectItem(0, columnGroupHarness);

      expect(storeSpy).toHaveBeenCalledWith(onlyColumnsConfig.name);
      const manageButton = await columnGroupHarness.getManageButton();
      expect(await manageButton?.getLabel()).toEqual(
        `Active: ${onlyColumnsConfig.name}`,
      );
    });
  });

  describe('on edit actions', () => {
    it('should set edit mode on edit button click', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const editModeSpy = jest.spyOn(store, 'enterEditMode');
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
      });
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

      const editButton = await item?.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      expect(editModeSpy).toHaveBeenCalledTimes(1);
    });

    it('should cancel edit mode on edit cancel button click', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const cancelEditSpy = jest.spyOn(store, 'cancelEdit');
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
      });
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

      const editButton = await item?.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const cancelButton = await columnGroupHarness.getCancelEditButton();
      expect(cancelButton).toBeTruthy();
      await cancelButton?.click();
      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    });

    it('should not set edit mode if config is not set', fakeAsync(() => {
      const store = TestBed.inject(SearchConfigStore);
      const enterEditModeSpy = jest.spyOn(store, 'enterEditMode');

      const { component } = setUp();

      component.onSearchConfigEdit(undefined);

      tick(500);

      expect(enterEditModeSpy).toHaveBeenCalledTimes(0);
    }));
  });

  describe('on delete actions', () => {
    it('should open confirmation dialog on delete button click', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const dialogSpy = jest.spyOn(portalDialogSpy, 'openDialog');
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
      });
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

      const deleteButton = await item?.getDeleteButton();
      expect(deleteButton).toBeTruthy();
      await deleteButton?.click();

      expect(dialogSpy).toHaveBeenCalledWith(
        'SEARCH_CONFIG.DELETE_DIALOG.HEADER',
        {
          key: 'SEARCH_CONFIG.DELETE_DIALOG.MESSAGE',
          parameters: {
            config: onlyColumnsConfig.name,
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
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
      });

      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          button: 'primary',
        } as any),
      );
      jest
        .spyOn(searchConfigServiceSpy, 'deleteSearchConfig')
        .mockReturnValue(of({} as any));
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

      const deleteButton = await item?.getDeleteButton();
      expect(deleteButton).toBeTruthy();
      await deleteButton?.click();

      expect(portalMessageSpy.info).toHaveBeenCalledWith({
        summaryKey: 'SEARCH_CONFIG.DELETE_SUCCESS',
      });
      expect(deleteSpy).toHaveBeenCalledWith(onlyColumnsConfig);
    });
    it('should not delete config if dialog was closed', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const deleteSpy = jest.spyOn(store, 'deleteSearchConfig');
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
      });

      jest
        .spyOn(portalDialogSpy, 'openDialog')
        .mockReturnValue(of(undefined as any));
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

      const deleteButton = await item?.getDeleteButton();
      expect(deleteButton).toBeTruthy();
      await deleteButton?.click();

      expect(deleteSpy).toHaveBeenCalledTimes(0);
    });
    it('should not delete config if secondary button was chosen', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const deleteSpy = jest.spyOn(store, 'deleteSearchConfig');
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
      });

      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          button: 'secondary',
        } as any),
      );
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

      const deleteButton = await item?.getDeleteButton();
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
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
      });

      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          button: 'primary',
        } as any),
      );
      jest
        .spyOn(searchConfigServiceSpy, 'deleteSearchConfig')
        .mockReturnValue(throwError(() => error));
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

      const deleteButton = await item?.getDeleteButton();
      expect(deleteButton).toBeTruthy();
      await deleteButton?.click();

      expect(deleteSpy).toHaveBeenCalledTimes(0);
      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(portalMessageSpy.error).toHaveBeenCalledWith({
        summaryKey: 'SEARCH_CONFIG.DELETE_FAILURE',
      });
    });
    it('should not open dialog if config is not set', fakeAsync(() => {
      const dialogSpy = jest.spyOn(portalDialogSpy, 'openDialog');

      const { component } = setUp();

      component.onSearchConfigDelete(undefined);

      tick(500);

      expect(dialogSpy).toHaveBeenCalledTimes(0);
    }));
  });

  describe('on edit save', () => {
    it('should use config info to fill dialog', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
        columnGroupComponentActive: true,
      });
      const dialogServiceSpy = jest.spyOn(portalDialogSpy, 'openDialog');

      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

      const editButton = await item?.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await columnGroupHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(dialogServiceSpy).toHaveBeenCalledWith(
        'SEARCH_CONFIG.CREATE_EDIT_DIALOG.EDIT_HEADER',
        {
          type: CreateOrEditSearchConfigDialogComponent,
          inputs: {
            searchConfigName: onlyColumnsConfig.name,
            saveInputValues: false,
            saveColumns: true,
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
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
        columnGroupComponentActive: true,
      });
      jest.spyOn(searchConfigServiceSpy, 'getSearchConfig').mockReturnValue(
        of({
          config: onlyColumnsConfig,
        } as any),
      );

      jest
        .spyOn(portalDialogSpy, 'openDialog')
        .mockReturnValue(of(undefined as any));
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

      const editButton = await item?.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await columnGroupHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    });
    it('should cancel edit if edit was not confirmed', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const cancelEditSpy = jest.spyOn(store, 'cancelEdit');
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
        columnGroupComponentActive: true,
      });
      jest.spyOn(searchConfigServiceSpy, 'getSearchConfig').mockReturnValue(
        of({
          config: onlyColumnsConfig,
        } as any),
      );

      jest.spyOn(portalDialogSpy, 'openDialog').mockReturnValue(
        of({
          button: 'secondary',
        } as any),
      );
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

      const editButton = await item?.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await columnGroupHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    });
    it('should save edit config if edit was confirmed', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const saveEditSpy = jest.spyOn(store, 'saveEdit');
      const updatedConfig = {
        ...onlyColumnsConfig,
        name: 'conf-1',
        values: {
          k: 'v-2',
        },
      };
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
        columnGroupComponentActive: true,
      });
      jest.spyOn(searchConfigServiceSpy, 'getSearchConfig').mockReturnValue(
        of({
          config: onlyColumnsConfig,
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
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

      const editButton = await item?.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await columnGroupHarness.getSaveEditButton();
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
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
        columnGroupComponentActive: true,
      };
      store.patchState(initState as any);
      jest.spyOn(searchConfigServiceSpy, 'getSearchConfig').mockReturnValue(
        of({
          config: onlyColumnsConfig,
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

      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

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

      const saveEditButton = await columnGroupHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(updateSpy).toHaveBeenCalledWith(onlyColumnsConfig.id, {
        searchConfig: {
          ...onlyColumnsConfig,
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
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
        columnGroupComponentActive: true,
      };
      store.patchState(initState as any);
      jest.spyOn(searchConfigServiceSpy, 'getSearchConfig').mockReturnValue(
        of({
          config: onlyColumnsConfig,
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

      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

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

      const saveEditButton = await columnGroupHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(updateSpy).toHaveBeenCalledWith(onlyColumnsConfig.id, {
        searchConfig: {
          ...onlyColumnsConfig,
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
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
        columnGroupComponentActive: true,
      };
      store.patchState(initState as any);
      jest.spyOn(searchConfigServiceSpy, 'getSearchConfig').mockReturnValue(
        of({
          config: onlyColumnsConfig,
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

      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

      const editButton = await item?.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();

      store.patchState({
        ...initState,
        displayedColumnsIds: ['col-2'],
      } as any);

      const saveEditButton = await columnGroupHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(updateSpy).toHaveBeenCalledWith(onlyColumnsConfig.id, {
        searchConfig: {
          ...onlyColumnsConfig,
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
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
        columnGroupComponentActive: true,
      };
      store.patchState(initState as any);
      jest.spyOn(searchConfigServiceSpy, 'getSearchConfig').mockReturnValue(
        of({
          config: onlyColumnsConfig,
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

      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

      const editButton = await item?.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();

      store.patchState({
        ...initState,
        displayedColumnsIds: ['col-2'],
      } as any);

      const saveEditButton = await columnGroupHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(updateSpy).toHaveBeenCalledWith(onlyColumnsConfig.id, {
        searchConfig: {
          ...onlyColumnsConfig,
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
        searchConfigs: [onlyColumnsConfig],
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
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

      const editButton = await item?.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await columnGroupHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    });
    it('should cancel edit if update search config call failed', async () => {
      const store = TestBed.inject(SearchConfigStore);
      const cancelEditSpy = jest.spyOn(store, 'cancelEdit');
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
        layout: 'table',
        columnGroupComponentActive: true,
      });
      const error = new Error('my-msg');
      jest.spyOn(searchConfigServiceSpy, 'getSearchConfig').mockReturnValue(
        of({
          config: onlyColumnsConfig,
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
      const { columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);

      const item = await selectItem(0, columnGroupHarness);

      const editButton = await item?.getEditButton();
      expect(editButton).toBeTruthy();
      await editButton?.click();
      const saveEditButton = await columnGroupHarness.getSaveEditButton();
      expect(saveEditButton).toBeTruthy();
      await saveEditButton?.click();

      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    });

    it('should cancel edit if config is not set', fakeAsync(() => {
      const store = TestBed.inject(SearchConfigStore);
      const cancelEditSpy = jest.spyOn(store, 'cancelEdit');

      const { component } = setUp();

      component.onSearchConfigSaveEdit(undefined);

      tick(500);

      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    }));
  });

  describe('on dataToRevert change', () => {
    it('should not emit if data does not contain columnGroupKey', fakeAsync(() => {
      const store = TestBed.inject(SearchConfigStore);

      const { component } = setUp();
      const emitterSpy = jest.spyOn(component.groupSelectionChanged, 'emit');

      store.patchState({
        dataToRevert: {
          fieldValues: { k: 'v' },
          viewMode: advancedViewMode,
          displayedColumnsIds: ['col-2'],
          columnGroupKey: undefined,
        },
      });

      tick(500);

      expect(emitterSpy).toHaveBeenCalledTimes(0);
    }));
    it('should emit searchConfigSelected', fakeAsync(() => {
      const store = TestBed.inject(SearchConfigStore);

      const { component } = setUp();
      component.columns = [
        {
          id: 'col-1',
        } as any,
        {
          id: 'col-2',
        },
        {
          id: 'col-3',
        } as any,
      ];
      const emitterSpy = jest.spyOn(component.groupSelectionChanged, 'emit');

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
        activeColumns: [{ id: 'col-2' }],
        groupKey: 'default',
      });
    }));
  });

  describe('on selectedGroupKey change', () => {
    it('should emit if config with columns was set', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
        currentSearchConfig: undefined,
        layout: 'table',
        selectedGroupKey: 'default',
      });

      const configColumns = onlyColumnsConfig.columns.map((c) => ({ id: c }));

      const { component, columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      component.columns = [
        {
          id: 'my-col',
        } as any,
        ...configColumns,
      ];
      const emitterSpy = jest.spyOn(component.groupSelectionChanged, 'emit');
      await selectItem(0, columnGroupHarness);

      expect(emitterSpy).toHaveBeenCalledWith({
        activeColumns: configColumns,
        groupKey: onlyColumnsConfig.name,
      });
    });

    it('should not emit if customGroupKey was set', fakeAsync(() => {
      const store = TestBed.inject(SearchConfigStore);

      const { component } = setUp();
      component.columns = [
        {
          id: 'col-1',
        } as any,
        {
          id: 'col-2',
        },
        {
          id: 'col-3',
        } as any,
      ];
      const emitterSpy = jest.spyOn(component.groupSelectionChanged, 'emit');

      store.patchState({
        selectedGroupKey: 'custom',
        customGroupKey: 'custom',
      });

      tick(500);

      expect(emitterSpy).toHaveBeenCalledTimes(0);
    }));

    it('should emit if no search config group key was set', async () => {
      const store = TestBed.inject(SearchConfigStore);
      store.patchState({
        searchConfigs: [onlyColumnsConfig],
        currentSearchConfig: undefined,
        layout: 'table',
        selectedGroupKey: 'default',
        customGroupKey: 'custom',
        nonSearchConfigGroupKeys: ['def', 'full'],
      });
      jest
        .spyOn(store, 'setNonSearchConfigGroupKeys')
        .mockImplementation(jest.fn());

      const { component, columnGroupHarness } =
        await setUpWithHarnessAndInit(allPermissions);
      component.columns = [
        {
          id: 'my-col',
          predefinedGroupKeys: ['def', 'full'],
        } as any,
        {
          id: 'second-col',
          predefinedGroupKeys: ['full'],
        } as any,
      ];
      const emitterSpy = jest.spyOn(component.groupSelectionChanged, 'emit');
      await selectItem(1, columnGroupHarness);

      expect(emitterSpy).toHaveBeenCalledWith({
        activeColumns: [
          {
            id: 'my-col',
            predefinedGroupKeys: ['def', 'full'],
          } as any,
          {
            id: 'second-col',
            predefinedGroupKeys: ['full'],
          } as any,
        ],
        groupKey: 'full',
      });
    });
  });
});
