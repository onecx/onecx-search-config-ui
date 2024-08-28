import { TestBed } from '@angular/core/testing';
import { combineLatest, take } from 'rxjs';
import { FakeTopic } from '@onecx/angular-integration-interface/mocks';

import { SearchConfigStore } from './search-config.store';
import { SearchConfigInfo } from './generated';
import { SEARCH_CONFIG_STORE_TOPIC } from './topics/search-config/v1/search-config.topic';
import { SearchConfigMessage } from './topics/search-config/v1/search-config.model';

describe('SearchConfigStore', () => {
  let store: SearchConfigStore;
  const testConfig: SearchConfigInfo = {
    id: 'test_id',
    name: 'test_name',
    columns: ['col_1', 'col_2'],
    values: {
      key_1: 'val_1',
      key_2: 'val_2',
    },
    isReadonly: false,
    isAdvanced: false,
  };
  let mockSearchConfigStoreTopic: FakeTopic<SearchConfigMessage>;

  beforeEach(() => {
    mockSearchConfigStoreTopic = new FakeTopic<SearchConfigMessage>();
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        SearchConfigStore,
        {
          provide: SEARCH_CONFIG_STORE_TOPIC,
          useValue: mockSearchConfigStoreTopic,
        },
      ],
    });

    store = TestBed.inject(SearchConfigStore);
  });

  describe('add search config', () => {
    it('should update search configs on search config addition', (done) => {
      store.patchState({
        searchConfigs: [],
      });

      store.addSearchConfig({
        newSearchConfig: testConfig,
      });

      store.searchConfigs$.pipe(take(1)).subscribe((configs) => {
        expect(configs).toStrictEqual([testConfig]);
        done();
      });
    });

    it('should update search configs with inputs on search config with inputs addition', (done) => {
      store.patchState({
        searchConfigs: [],
      });

      const configWithInputs: SearchConfigInfo = {
        ...testConfig,
        values: {
          key_1: 'val_1',
        },
      };

      store.addSearchConfig({
        newSearchConfig: configWithInputs,
      });

      combineLatest([
        store.searchConfigs$,
        store.searchConfigVm$,
        store.columnSelectionVm$,
      ])
        .pipe(take(1))
        .subscribe(([configs, scVm, cgVm]) => {
          expect(configs).toStrictEqual([configWithInputs]);
          expect(scVm.searchConfigs).toStrictEqual([configWithInputs]);
          expect(cgVm.searchConfigs).toStrictEqual([]);
          done();
        });
    });

    it('should update search configs with only columns on search config with only columns addition', (done) => {
      store.patchState({
        searchConfigs: [],
      });

      const configWithOnlyColumns: SearchConfigInfo = {
        ...testConfig,
        values: {},
        columns: ['col_1'],
      };

      store.addSearchConfig({
        newSearchConfig: configWithOnlyColumns,
      });

      combineLatest([
        store.searchConfigs$,
        store.searchConfigVm$,
        store.columnSelectionVm$,
      ])
        .pipe(take(1))
        .subscribe(([configs, scVm, cgVm]) => {
          expect(configs).toStrictEqual([configWithOnlyColumns]);
          expect(scVm.searchConfigs).toStrictEqual([]);
          expect(cgVm.searchConfigs).toStrictEqual([configWithOnlyColumns]);
          done();
        });
    });
    it('should dispatch update message with default params', (done) => {
      store.patchState({
        searchConfigs: [],
      });

      store.addSearchConfig({
        newSearchConfig: testConfig,
      });

      mockSearchConfigStoreTopic.subscribe((message) => {
        expect(message.payload.name).toBe('add');
        expect(message.payload.searchConfig).toStrictEqual(testConfig);
        done();
      });
    });
  });
  it('should update search configs on search config edit', () => {});
  it('should update search configs on search config delete', () => {});
  it('should update search configs on search configs set', () => {});
  it('should update search configs on search config addition', () => {});
});
