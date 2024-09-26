import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { OneCXSearchConfigComponent } from './search-config.component';
import { ReplaySubject, debounceTime, take, takeLast } from 'rxjs';
import { TranslateTestingModule } from 'ngx-translate-testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import {
  BASE_URL,
  RemoteComponentConfig,
} from '@onecx/angular-remote-components';
import { AppConfigService } from '@onecx/angular-integration-interface';
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
} from '@onecx/portal-integration-angular';
import {
  Configuration,
  SearchConfigAPIService,
} from 'src/app/shared/generated';
import { DialogService } from 'primeng/dynamicdialog';
import { basicViewMode } from 'src/app/shared/constants';

@NgModule({
  imports: [],
  declarations: [IfPermissionDirective],
  exports: [IfPermissionDirective],
})
class PortalDependencyModule {}

describe('OneCXSearchConfigComponent', () => {
  const appConfigSpy = {};

  const searchConfigServiceSpy = {
    configuration: new Configuration({
      basePath: '',
    }),
  };

  const portalDialogSpy = {};

  const portalMessageSpy = {};

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
            RouterModule,
            DropdownModule,
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

  it('should update store on displayed columns input set', fakeAsync(() => {
    const store = TestBed.inject(SearchConfigStore);
    const spy = jest.spyOn(store, 'updateDisplayedColumnsIds');

    const columns = ['col-1', 'col-2'];
    const { component } = setUp();

    component.displayedColumnsIds = columns;
    tick(500);

    expect(spy).toHaveBeenCalledWith(columns);
  }));

  it('should update store on view mode input set', fakeAsync(() => {
    const store = TestBed.inject(SearchConfigStore);
    const spy = jest.spyOn(store, 'updateViewMode');

    const { component } = setUp();

    component.viewMode = basicViewMode;
    tick(500);

    expect(spy).toHaveBeenCalledWith(basicViewMode);
  }));

  it('should call ocxInitRemoteComponent with the correct config', () => {
    const mockConfig: RemoteComponentConfig = {
      appId: 'appId',
      productName: 'prodName',
      permissions: ['permission'],
      baseUrl: 'base',
    };

    const { component } = setUp();

    jest.spyOn(component, 'ocxInitRemoteComponent');

    component.ocxRemoteComponentConfig = mockConfig;

    expect(component.ocxInitRemoteComponent).toHaveBeenCalledWith(mockConfig);
  });

  it('should init remote component', (done) => {
    const { component } = setUp();

    component.ocxInitRemoteComponent({
      baseUrl: 'base_url',
    } as RemoteComponentConfig);

    expect(searchConfigServiceSpy.configuration.basePath).toEqual(
      'base_url/bff',
    );
    baseUrlSubject.asObservable().subscribe((item) => {
      expect(item).toEqual('base_url');
      done();
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
