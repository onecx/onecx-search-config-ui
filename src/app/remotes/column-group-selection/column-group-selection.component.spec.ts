import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReplaySubject, of } from 'rxjs';
import { TranslateTestingModule } from 'ngx-translate-testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import {
  BASE_URL,
  RemoteComponentConfig,
} from '@onecx/angular-remote-components';
import { AppConfigService } from '@onecx/angular-integration-interface';
import { CommonModule } from '@angular/common';
import { DropdownModule } from 'primeng/dropdown';
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
import { FloatLabelModule } from 'primeng/floatlabel';
import { CreateOrEditSearchConfigDialogComponent } from 'src/app/shared/components/create-or-edit-search-config-dialog/create-or-edit-search-config-dialog.component';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  ColumnType,
  IfPermissionDirective,
  PortalDialogService,
  PortalMessageService,
} from '@onecx/portal-integration-angular';
import {
  Configuration,
  SearchConfigAPIService,
} from 'src/app/shared/generated';
import { DialogService } from 'primeng/dynamicdialog';
import { TooltipModule } from 'primeng/tooltip';
import { OneCXColumnGroupSelectionComponent } from './column-group-selection.component';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { FocusTrapModule } from 'primeng/focustrap';

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

  async function setUpWithHarness() {
    const { fixture, component } = setUp();
    const searchConfigHarness =
      await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        OneCXColumnGroupSelectionHarness,
      );
    return { fixture, component, searchConfigHarness };
  }

  async function setUpWithHarnessAndInit(permissions: Array<string>) {
    const fixture = TestBed.createComponent(OneCXColumnGroupSelectionComponent);
    const component = fixture.componentInstance;
    component.ocxInitRemoteComponent({
      baseUrl: 'base_url',
      permissions: permissions,
    } as any);
    fixture.detectChanges();
    const searchConfigHarness =
      await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        OneCXColumnGroupSelectionHarness,
      );

    return { fixture, component, searchConfigHarness };
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
});
