import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { OneCXSearchConfigComponent } from './search-config.component';
import { ReplaySubject } from 'rxjs';
import { TranslateTestingModule } from 'ngx-translate-testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { BASE_URL } from '@onecx/angular-remote-components';
import { AppConfigService } from '@onecx/angular-accelerator';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { OneCXSearchConfigHarness } from './search-config.harness';
import { SearchConfigStore } from 'src/app/shared/search-config.store';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CreateOrEditSearchConfigDialogComponent } from 'src/app/shared/components/create-or-edit-search-config-dialog/create-or-edit-search-config-dialog.component';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  PortalDialogService,
  PortalMessageService,
} from '@onecx/portal-integration-angular';

describe('OneCXSearchConfigComponent', () => {
  // const appConfigSpy = {
  //     init()
  // }

  //   const searchConfigStoreSpy

  //   const searchConfigServiceSpy

  // const portalDialogSpy

  // const portalMessageSpy

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
        RouterTestingModule.withRoutes([
          {
            path: 'admin/user-profile',
            component: {} as any,
          },
        ]),
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
          provide: AppConfigService,
          useValue: appConfigSpy,
        },
        {
          provide: SearchConfigStore,
          useValue: searchConfigSpy,
        },
        {
          provide: PortalDialogService,
          useValue: portalDialogSpy,
        },
        {
          provide: PortalMessageService,
          useValue: portalMessageSpy,
        },
      ],
    })
      .overrideComponent(OneCXSearchConfigComponent, {
        set: {
          imports: [
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
            // { provide: MenuItemAPIService, useValue: menuItemApiSpy },
          ],
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();

    baseUrlSubject.next('base_url_mock');

    // menuItemApiSpy.getMenuItems.calls.reset();
  });

  it('should create', () => {
    const { component } = setUp();

    expect(component).toBeTruthy();
  });
});
