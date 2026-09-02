import { AsyncPipe } from '@angular/common';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
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

import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { TooltipModule } from 'primeng/tooltip';
import { PopoverModule } from 'primeng/popover';
import { FocusTrapModule } from 'primeng/focustrap';

import {
  REMOTE_COMPONENT_CONFIG,
  RemoteComponentConfig,
} from '@onecx/angular-utils';
import { FakeTopic } from '@onecx/angular-integration-interface/mocks';
import { PortalDialogService } from '@onecx/angular-accelerator';
import { PortalMessageService } from '@onecx/angular-integration-interface';
import { IfPermissionDirective } from '@onecx/angular-accelerator';

import {
  SEARCH_CONFIG_STORE_NAME,
  SEARCH_CONFIG_TOPIC,
  SearchConfigMessage,
  SearchConfigStore,
} from 'src/app/shared/search-config.store';
import { advancedViewMode } from 'src/app/shared/constants';
import {
  Configuration,
  SearchConfigAPIService,
} from 'src/app/shared/generated';
import { CreateOrEditSearchConfigDialogComponent } from 'src/app/shared/components/create-or-edit-search-config-dialog/create-or-edit-search-config-dialog.component';
import { OneCXColumnGroupSelectionHarness } from './column-group-selection.harness';
import { OneCXColumnGroupSelectionComponent } from './column-group-selection.component';

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
  let component: OneCXColumnGroupSelectionComponent;
  let fixture: ComponentFixture<OneCXColumnGroupSelectionComponent>;
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
    const columnGroupHarness =
      await TestbedHarnessEnvironment.harnessForFixture(
        localFixture,
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
          en: require('./src/assets/i18n/en.json'),
          de: require('./src/assets/i18n/de.json'),
        }).withDefaultLanguage('en'),
        NoopAnimationsModule,
        AsyncPipe,
        PortalDependencyModule,
        TooltipModule,
        CreateOrEditSearchConfigDialogComponent,
        ButtonModule,
        PopoverModule,
        FocusTrapModule,
        OneCXColumnGroupSelectionComponent,
      ],
      providers: [
        DialogService,
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
    });

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

    fixture = TestBed.createComponent(OneCXColumnGroupSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    (component as any).portalDialogService = portalDialogSpy;
    (component as any).portalMessageService = portalMessageSpy;
    (component as any).searchConfigService = searchConfigServiceSpy as any;

    store = TestBed.inject(SearchConfigStore);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update store on selectedGroupKey input set', fakeAsync(() => {
    const spy = jest.spyOn(store, 'setSelectedGroupKey');

    component.selectedGroupKey = 'my-key';
    tick(500);

    expect(spy).toHaveBeenCalledWith('my-key');
  }));

  it('should not update store on when selectedGroupKey input is undefined', fakeAsync(() => {
    const spy = jest.spyOn(store, 'setSelectedGroupKey');

    component.selectedGroupKey = undefined;
    tick(500);

    expect(spy).toHaveBeenCalledTimes(0);
  }));

  it('should update store on customGroupKey input set', fakeAsync(() => {
    const spy = jest.spyOn(store, 'setCustomGroupKey');

    component.customGroupKey = 'my-key';
    tick(500);

    expect(spy).toHaveBeenCalledWith('my-key');
  }));

  it('should update store on displayedColumnsIds input set', fakeAsync(() => {
    const spy = jest.spyOn(store, 'updateDisplayedColumnsIds');

    component.displayedColumnsIds = ['col-1'];
    tick(500);

    expect(spy).toHaveBeenCalledWith(['col-1']);
  }));

  it('should update store on layout input set', fakeAsync(() => {
    const spy = jest.spyOn(store, 'updateLayout');

    component.layout = 'grid';
    tick(500);

    expect(spy).toHaveBeenCalledWith('grid');
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
  });
  describe('overlay content', () => {
    it('should display overlay with configs that have only columns', async () => {
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
  });

  describe('on edit actions', () => {
    it('should cancel edit mode on edit cancel button click', async () => {
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
      const enterEditModeSpy = jest.spyOn(store, 'enterEditMode');

      component.onSearchConfigEdit(undefined);

      tick(500);

      expect(enterEditModeSpy).toHaveBeenCalledTimes(0);
    }));
  });

  describe('on delete actions', () => {
    it('should delete config', async () => {
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

      component.onSearchConfigDelete(undefined);

      tick(500);

      expect(dialogSpy).toHaveBeenCalledTimes(0);
    }));
  });

  describe('on edit save', () => {
    it('should cancel edit if edit was not confirmed', async () => {
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
    it('should save columns', async () => {
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
    it('should cancel edit if get search config call failed', async () => {
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
      const cancelEditSpy = jest.spyOn(store, 'cancelEdit');

      component.onSearchConfigSaveEdit(undefined);

      tick(500);

      expect(cancelEditSpy).toHaveBeenCalledTimes(1);
    }));
  });

  describe('on dataToRevert change', () => {
    it('should not emit if data does not contain columnGroupKey', fakeAsync(() => {
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

    it('should emit if no search config group key was set', async () => {
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

  describe('focusManageButton', () => {
    it('should not throw when manage button is undefined', () => {
      component.manageButton = undefined;

      expect(() => component.focusManageButton()).not.toThrow();
    });
  });
});
