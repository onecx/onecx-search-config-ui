import { TestBed } from '@angular/core/testing';
import { skip, take } from 'rxjs';
import { FakeTopic } from '@onecx/angular-integration-interface/mocks';

import {
  PageData,
  SearchConfigState,
  SearchConfigStore,
} from './search-config.store';
import { SearchConfigInfo } from './generated';
import { advancedViewMode, basicViewMode } from './constants';
import { FakeSyncableTopic } from '../mocks/fake-syncable-topic';

describe('SearchConfigStore', () => {
  let store: SearchConfigStore;
  let secondStore: SearchConfigStore;

  const testConfigBase: SearchConfigInfo = {
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

  const testConfigOnlyValues: SearchConfigInfo = {
    ...testConfigBase,
    id: 'testConfigOnlyValues',
    name: 'testConfigOnlyValues',
    columns: [],
    values: {
      key_1: 'val_1',
      key_2: 'val_2',
    },
  };

  const testConfigValuesAndColumns: SearchConfigInfo = {
    ...testConfigBase,
    id: 'testConfigValuesAndColumns',
    name: 'testConfigValuesAndColumns',
    columns: ['col_1', 'col_2'],
    values: {
      key_1: 'val_1',
      key_2: 'val_2',
    },
  };

  const testConfigOnlyColumns: SearchConfigInfo = {
    ...testConfigBase,
    id: 'testConfigOnlyColumns',
    name: 'testConfigOnlyColumns',
    columns: ['col_1', 'col_2'],
    values: {},
  };

  let mockSearchConfigStoreTopic: FakeSyncableTopic<SearchConfigMessage>;

  beforeEach(() => {
    mockSearchConfigStoreTopic = new FakeSyncableTopic<SearchConfigMessage>();
    TestBed.configureTestingModule({
      imports: [],
      providers: [],
    });

    store = new SearchConfigStore(
      mockSearchConfigStoreTopic as any as SearchConfigTopic,
      'store-1',
    );

    secondStore = new SearchConfigStore(
      mockSearchConfigStoreTopic as any as SearchConfigTopic,
      'store-2',
    );
  });

  describe('set page name', () => {
    it('should update pageName$ selector on change', (done) => {
      store.patchState({});

      store.setPageName('my-page');

      store.pageName$.pipe(take(1)).subscribe((page) => {
        expect(page).toBe('my-page');
        done();
      });
    });

    it('should not update pageName$ selector with no change', () => {
      store.patchState({
        pageName: 'my-page',
      });

      store.setPageName('my-page');

      store.pageName$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should update searchConfigVm$ selector on change', (done) => {
      store.patchState({});

      store.setPageName('my-page');

      store.searchConfigVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.pageName).toBe('my-page');
        done();
      });
    });

    it('should not update searchConfigVm$ selector with no change', () => {
      store.patchState({
        pageName: 'my-page',
      });

      store.setPageName('my-page');

      store.searchConfigVm$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });
  });

  describe('set custom group key', () => {
    it('should update columnSelectionVm$ selector on change', (done) => {
      store.patchState({});

      store.setCustomGroupKey('custom-key');

      store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.customGroupKey).toBe('custom-key');
        done();
      });
    });

    it('should not update columnSelectionVm$ selector with no change', () => {
      store.patchState({
        customGroupKey: 'custom-key',
      });

      store.setCustomGroupKey('custom-key');

      store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should send update message', (done) => {
      store.patchState({});

      store.setCustomGroupKey('custom-key');

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.state.customGroupKey).toStrictEqual('custom-key');
        done();
      });
    });
  });

  describe('set search configs', () => {
    it('should update searchConfigVm$ selector on change', (done) => {
      store.patchState({});

      store.setSearchConfigs([testConfigOnlyValues]);

      store.searchConfigVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.searchConfigs).toStrictEqual([testConfigOnlyValues]);
        done();
      });
    });

    it('should not update searchConfigVm$ selector with no change', () => {
      store.patchState({
        searchConfigs: [testConfigOnlyValues],
      });

      store.setSearchConfigs([testConfigOnlyValues]);

      store.searchConfigVm$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should update columnSelectionVm$ selector on change', (done) => {
      store.patchState({
        searchConfigs: [],
      });

      store.setSearchConfigs([
        testConfigOnlyColumns,
        testConfigValuesAndColumns,
      ]);

      store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.searchConfigsOnlyColumns).toStrictEqual([
          testConfigOnlyColumns,
        ]);
        expect(vm.searchConfigsWithColumns).toStrictEqual([
          testConfigOnlyColumns,
          testConfigValuesAndColumns,
        ]);
        expect(vm.allGroupKeys).toStrictEqual([testConfigOnlyColumns.name]);
        done();
      });
    });

    it('should not update columnSelectionVm$ selector with no change', () => {
      store.patchState({
        searchConfigs: [testConfigOnlyColumns, testConfigValuesAndColumns],
      });

      store.setSearchConfigs([
        testConfigOnlyColumns,
        testConfigValuesAndColumns,
      ]);

      store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should update currentConfig$ selector when config was chosen and not in config list anymore', (done) => {
      store.patchState({
        currentSearchConfig: testConfigOnlyColumns,
        searchConfigs: [testConfigOnlyColumns, testConfigValuesAndColumns],
      });

      store.setSearchConfigs([testConfigValuesAndColumns]);

      store.currentConfig$.pipe(take(1)).subscribe((config) => {
        expect(config).toBe(undefined);
        done();
      });
    });

    it('should not update currentConfig$ selector when config not chosen', () => {
      store.patchState({
        currentSearchConfig: undefined,
        searchConfigs: [testConfigOnlyColumns, testConfigValuesAndColumns],
      });

      store.setSearchConfigs([testConfigValuesAndColumns]);

      store.currentConfig$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should not update currentConfig$ selector when config is in new config list', () => {
      store.patchState({
        currentSearchConfig: testConfigOnlyColumns,
        searchConfigs: [testConfigOnlyColumns, testConfigValuesAndColumns],
      });

      store.setSearchConfigs([testConfigOnlyColumns]);

      store.currentConfig$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should not update currentConfig$ selector when in edit mode', () => {
      store.patchState({
        currentSearchConfig: testConfigOnlyColumns,
        searchConfigs: [testConfigOnlyColumns, testConfigValuesAndColumns],
        editMode: true,
      });

      store.setSearchConfigs([testConfigValuesAndColumns]);

      store.currentConfig$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should update selectedGroupKey$ selector when config with selected key name not in config list anymore', (done) => {
      store.patchState({
        selectedGroupKey: testConfigOnlyColumns.name,
        searchConfigs: [testConfigOnlyColumns, testConfigValuesAndColumns],
        customGroupKey: 'custom-key',
      });

      store.setSearchConfigs([testConfigValuesAndColumns]);

      store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
        expect(key).toBe('custom-key');
        done();
      });
    });

    it('should not update selectedGroupKey$ selector key name was predefined', () => {
      store.patchState({
        selectedGroupKey: 'default',
        nonSearchConfigGroupKeys: ['default'],
        searchConfigs: [testConfigOnlyColumns, testConfigValuesAndColumns],
      });

      store.setSearchConfigs([testConfigOnlyColumns]);

      store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should not update selectedGroupKey$ selector when config with selected key name is in new config list', () => {
      store.patchState({
        selectedGroupKey: testConfigOnlyColumns.name,
        searchConfigs: [testConfigOnlyColumns, testConfigValuesAndColumns],
      });

      store.setSearchConfigs([testConfigOnlyColumns]);

      store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should not update selectedGroupKey$ selector when in edit mode', () => {
      store.patchState({
        selectedGroupKey: testConfigOnlyColumns.name,
        searchConfigs: [testConfigOnlyColumns, testConfigValuesAndColumns],
        editMode: true,
      });

      store.setSearchConfigs([testConfigValuesAndColumns]);

      store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should send update message', (done) => {
      store.patchState({});

      store.setSearchConfigs([testConfigBase, testConfigOnlyValues]);

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.state.searchConfigs).toStrictEqual([
          testConfigBase,
          testConfigOnlyValues,
        ]);
        done();
      });
    });
  });

  describe('set non search config group keys', () => {
    it('should update columnSelectionVm$ selector on change', (done) => {
      store.patchState({});

      store.setNonSearchConfigGroupKeys(['1']);

      store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.nonSearchConfigGroupKeys).toStrictEqual(['1']);
        expect(vm.allGroupKeys).toStrictEqual(['1']);
        done();
      });
    });

    it('should not update columnSelectionVm$ selector with no change', () => {
      store.patchState({
        nonSearchConfigGroupKeys: ['1'],
      });

      store.setNonSearchConfigGroupKeys(['1']);

      store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should send update message', (done) => {
      store.patchState({});

      store.setNonSearchConfigGroupKeys(['default', 'extended']);

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.state.nonSearchConfigGroupKeys).toStrictEqual([
          'default',
          'extended',
        ]);
        done();
      });
    });
  });

  describe('add search config', () => {
    describe('with only values search config', () => {
      it('should update searchConfigVm$ selector', (done) => {
        store.patchState({});

        store.addSearchConfig(testConfigOnlyValues);

        store.searchConfigVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.searchConfigs).toStrictEqual([testConfigOnlyValues]);
          done();
        });
      });

      it('should not update columnSelectionVm$ selector', () => {
        store.patchState({});

        store.addSearchConfig(testConfigOnlyValues);

        store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('with values and columns search config', () => {
      it('should update searchConfigVm$ selector', (done) => {
        store.patchState({});

        store.addSearchConfig(testConfigValuesAndColumns);

        store.searchConfigVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.searchConfigs).toStrictEqual([testConfigValuesAndColumns]);
          done();
        });
      });

      it('should update columnSelectionVm$ selector', (done) => {
        store.patchState({});

        store.addSearchConfig(testConfigValuesAndColumns);

        store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.searchConfigsOnlyColumns).toStrictEqual([]);
          expect(vm.searchConfigsWithColumns).toStrictEqual([
            testConfigValuesAndColumns,
          ]);
          expect(vm.allGroupKeys).toStrictEqual([]);
          done();
        });
      });
    });

    describe('with only columns search config', () => {
      it('should not update searchConfigVm$ selector', () => {
        store.patchState({});

        store.addSearchConfig(testConfigOnlyColumns);

        store.searchConfigVm$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update columnSelectionVm$ selector', (done) => {
        store.patchState({});

        store.addSearchConfig(testConfigOnlyColumns);

        store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.searchConfigsWithColumns).toStrictEqual([
            testConfigOnlyColumns,
          ]);
          expect(vm.searchConfigsOnlyColumns).toStrictEqual([
            testConfigOnlyColumns,
          ]);
          expect(vm.allGroupKeys).toStrictEqual([testConfigOnlyColumns.name]);
          done();
        });
      });
    });

    it('should send update message', (done) => {
      store.patchState({});

      store.addSearchConfig(testConfigValuesAndColumns);

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.state.searchConfigs).toStrictEqual([
          testConfigValuesAndColumns,
        ]);
        done();
      });
    });
  });

  describe('delete search config', () => {
    describe('with only values search config', () => {
      it('should update searchConfigVm$ selector', (done) => {
        store.patchState({
          searchConfigs: [
            testConfigOnlyValues,
            testConfigValuesAndColumns,
            testConfigOnlyColumns,
          ],
        });

        store.deleteSearchConfig(testConfigOnlyValues);

        store.searchConfigVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.searchConfigs).toStrictEqual([testConfigValuesAndColumns]);
          done();
        });
      });

      it('should not update columnSelectionVm$ selector', () => {
        store.patchState({
          searchConfigs: [
            testConfigOnlyValues,
            testConfigValuesAndColumns,
            testConfigOnlyColumns,
          ],
        });

        store.deleteSearchConfig(testConfigOnlyValues);

        store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('with values and columns search config', () => {
      it('should update searchConfigVm$ selector', (done) => {
        store.patchState({
          searchConfigs: [
            testConfigOnlyValues,
            testConfigValuesAndColumns,
            testConfigOnlyColumns,
          ],
        });

        store.deleteSearchConfig(testConfigValuesAndColumns);

        store.searchConfigVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.searchConfigs).toStrictEqual([testConfigOnlyValues]);
          done();
        });
      });

      it('should update columnSelectionVm$ selector', (done) => {
        store.patchState({
          searchConfigs: [
            testConfigOnlyValues,
            testConfigValuesAndColumns,
            testConfigOnlyColumns,
          ],
        });

        store.deleteSearchConfig(testConfigValuesAndColumns);

        store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.searchConfigsWithColumns).toStrictEqual([
            testConfigOnlyColumns,
          ]);
          expect(vm.searchConfigsOnlyColumns).toStrictEqual([
            testConfigOnlyColumns,
          ]);
          expect(vm.allGroupKeys).toStrictEqual([testConfigOnlyColumns.name]);
          done();
        });
      });
    });

    describe('with only columns search config', () => {
      it('should not update searchConfigVm$ selector', () => {
        store.patchState({
          searchConfigs: [
            testConfigOnlyValues,
            testConfigValuesAndColumns,
            testConfigOnlyColumns,
          ],
        });

        store.deleteSearchConfig(testConfigOnlyColumns);

        store.searchConfigVm$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update columnSelectionVm$ selector', (done) => {
        store.patchState({
          searchConfigs: [
            testConfigOnlyValues,
            testConfigValuesAndColumns,
            testConfigOnlyColumns,
          ],
        });

        store.deleteSearchConfig(testConfigOnlyColumns);

        store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.searchConfigsOnlyColumns).toStrictEqual([]);
          expect(vm.searchConfigsWithColumns).toStrictEqual([
            testConfigValuesAndColumns,
          ]);
          expect(vm.allGroupKeys).toStrictEqual([]);
          done();
        });
      });
    });

    it('should send update message', (done) => {
      store.patchState({
        searchConfigs: [
          testConfigOnlyValues,
          testConfigValuesAndColumns,
          testConfigOnlyColumns,
        ],
      });

      store.deleteSearchConfig(testConfigOnlyColumns);

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.state.searchConfigs).toStrictEqual([
          testConfigOnlyValues,
          testConfigValuesAndColumns,
        ]);
        done();
      });
    });

    it('should update currentConfig$ selector if it was current config', (done) => {
      store.patchState({
        currentSearchConfig: testConfigBase,
      });

      store.deleteSearchConfig(testConfigBase);

      store.currentConfig$.pipe(take(1)).subscribe((config) => {
        expect(config).toStrictEqual(undefined);
        done();
      });
    });

    describe('selectedGroupKey$ selector', () => {
      it('should not update if in edit mode', () => {
        store.patchState({
          currentSearchConfig: testConfigBase,
          selectedGroupKey: testConfigBase.name,
          editMode: true,
        });

        store.deleteSearchConfig(testConfigBase);

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
      it('should not update if current key is same as current config and other is deleted', () => {
        store.patchState({
          currentSearchConfig: testConfigBase,
          selectedGroupKey: testConfigBase.name,
        });

        store.deleteSearchConfig(testConfigOnlyColumns);

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update if current key is search config name', (done) => {
        store.patchState({
          searchConfigs: [testConfigBase],
          currentSearchConfig: testConfigBase,
          selectedGroupKey: testConfigBase.name,
          customGroupKey: 'custom-key',
        });

        store.deleteSearchConfig(testConfigBase);

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe('custom-key');
          done();
        });
      });
    });
  });

  describe('set search config', () => {
    it('should update currentConfig$ selector on change', (done) => {
      store.patchState({
        currentSearchConfig: testConfigBase,
      });

      store.setCurrentConfig(testConfigOnlyColumns);

      store.currentConfig$.pipe(take(1)).subscribe((config) => {
        expect(config).toStrictEqual(testConfigOnlyColumns);
        done();
      });
    });

    it('should not update currentConfig$ selector in edit mode', () => {
      store.patchState({
        currentSearchConfig: testConfigBase,
        editMode: true,
      });

      store.setCurrentConfig(testConfigOnlyColumns);

      store.currentConfig$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should not update currentConfig$ selector with no change', () => {
      store.patchState({
        currentSearchConfig: testConfigBase,
      });

      store.setCurrentConfig(testConfigBase);

      store.currentConfig$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    describe('selectedGroupKey$ selector', () => {
      it('should not update in edit mode', () => {
        store.patchState({
          currentSearchConfig: testConfigBase,
          selectedGroupKey: testConfigBase.name,
          editMode: true,
        });

        store.setCurrentConfig(testConfigValuesAndColumns);

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if current key is same as config', () => {
        store.patchState({
          currentSearchConfig: testConfigBase,
          selectedGroupKey: testConfigBase.name,
        });

        store.setCurrentConfig(testConfigBase);

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update if config has columns and values', (done) => {
        store.patchState({
          searchConfigs: [testConfigValuesAndColumns],
          currentSearchConfig: undefined,
          selectedGroupKey: '',
        });

        store.setCurrentConfig(testConfigValuesAndColumns);

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe(testConfigValuesAndColumns.name);
          done();
        });
      });

      it('should update if config has columns', (done) => {
        store.patchState({
          searchConfigs: [testConfigOnlyColumns],
          currentSearchConfig: undefined,
          selectedGroupKey: '',
        });

        store.setCurrentConfig(testConfigOnlyColumns);

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe(testConfigOnlyColumns.name);
          done();
        });
      });

      it('should not update if config has only values and key is not search config', () => {
        store.patchState({
          searchConfigs: [testConfigOnlyValues],
          currentSearchConfig: undefined,
          selectedGroupKey: 'default-key',
        });

        store.setCurrentConfig(testConfigOnlyValues);

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update if config has only values and key is search config', (done) => {
        store.patchState({
          searchConfigs: [testConfigOnlyValues, testConfigOnlyColumns],
          currentSearchConfig: testConfigOnlyColumns,
          selectedGroupKey: testConfigOnlyColumns.name,
          customGroupKey: 'custom-key',
        });

        store.setCurrentConfig(testConfigOnlyValues);

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe('custom-key');
          done();
        });
      });

      it('should not update if config is not defined and key is not search config', () => {
        store.patchState({
          searchConfigs: [testConfigOnlyValues, testConfigOnlyColumns],
          currentSearchConfig: testConfigOnlyValues,
          selectedGroupKey: 'default-key',
        });

        store.setCurrentConfig(undefined);

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update if config is not defined and key is search config', (done) => {
        store.patchState({
          searchConfigs: [testConfigOnlyValues, testConfigOnlyColumns],
          currentSearchConfig: testConfigOnlyColumns,
          selectedGroupKey: testConfigOnlyColumns.name,
          customGroupKey: 'custom-key',
        });

        store.setCurrentConfig(undefined);

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe('custom-key');
          done();
        });
      });
    });

    it('should send update message', (done) => {
      store.patchState({
        currentSearchConfig: testConfigBase,
      });

      store.setCurrentConfig(testConfigOnlyColumns);

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.state.currentSearchConfig).toStrictEqual(
          testConfigOnlyColumns,
        );
        done();
      });
    });
  });

  describe('update field values', () => {
    describe('pageData$ selector', () => {
      it('should update if new values are not the same as old ones', (done) => {
        store.patchState({
          fieldValues: {
            key: 'v1',
          },
        });

        store.updateFieldValues({
          key: 'v2',
        });

        store.pageData$.pipe(take(1)).subscribe((data) => {
          expect(data.fieldValues).toStrictEqual({
            key: 'v2',
          });
          done();
        });
      });

      it('should not update if values did not change', () => {
        store.patchState({
          fieldValues: {
            key: 'v1',
          },
        });

        store.updateFieldValues({
          values: {
            key: 'v1',
          },
        });

        store.pageData$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('currentConfig$ selector', () => {
      it('should not update on edit mode', () => {
        store.patchState({
          fieldValues: testConfigBase.values,
          currentSearchConfig: testConfigBase,
          editMode: true,
        });

        store.updateFieldValues({
          values: {
            key: 'v2',
          },
        });

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if current config was undefined', () => {
        store.patchState({
          fieldValues: {
            key: 'v1',
          },
          currentSearchConfig: undefined,
        });

        store.updateFieldValues({
          values: {
            key: 'v2',
          },
        });

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should unset config if current config had values not equal to new ones', (done) => {
        store.patchState({
          fieldValues: testConfigOnlyValues.values,
          currentSearchConfig: testConfigOnlyValues,
        });

        store.updateFieldValues({
          values: {
            ...testConfigOnlyValues.values,
            key_1: 'val_1-update',
          },
        });

        store.currentConfig$.pipe(take(1)).subscribe((config) => {
          expect(config).toBe(undefined);
          done();
        });
      });

      it('should not update if current config had values equal to new ones', () => {
        store.patchState({
          fieldValues: testConfigOnlyValues.values,
          currentSearchConfig: testConfigOnlyValues,
        });

        store.updateFieldValues({
          values: {
            ...testConfigOnlyValues.values,
          },
        });

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('selectedGroupKey$ selector', () => {
      it('should not update in edit mode', () => {
        store.patchState({
          fieldValues: {
            ...testConfigBase.values,
          },
          currentSearchConfig: testConfigBase,
          editMode: true,
          selectedGroupKey: 'deafult-key',
        });

        store.updateFieldValues({
          values: {
            ...testConfigBase.values,
            key: 'v2',
          },
        });

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if current config was undefined', () => {
        store.patchState({
          fieldValues: {
            key: 'v1',
          },
          currentSearchConfig: undefined,
          selectedGroupKey: 'deafult-key',
        });

        store.updateFieldValues({
          values: {
            key: 'v2',
          },
        });

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if config with only inputs is unset', () => {
        store.patchState({
          fieldValues: {
            ...testConfigOnlyValues.values,
          },
          currentSearchConfig: testConfigOnlyValues,
          selectedGroupKey: 'default-key',
        });

        store.updateFieldValues({
          values: {
            ...testConfigOnlyValues.values,
            key_1: 'val_1-update',
          },
        });

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update if config with both inputs and columns is unset', (done) => {
        store.patchState({
          searchConfigs: [testConfigValuesAndColumns],
          fieldValues: {
            ...testConfigValuesAndColumns.values,
          },
          currentSearchConfig: testConfigValuesAndColumns,
          selectedGroupKey: testConfigValuesAndColumns.name,
          customGroupKey: 'custom-key',
        });

        store.updateFieldValues({
          values: {
            ...testConfigValuesAndColumns.values,
            key_1: 'val_1-update',
          },
        });

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe('custom-key');
          done();
        });
      });

      it('should not update if current config had values equal to new ones', () => {
        store.patchState({
          fieldValues: {
            ...testConfigOnlyValues.values,
          },
          currentSearchConfig: testConfigOnlyValues,
          selectedGroupKey: 'default-key',
        });

        store.updateFieldValues({
          values: {
            ...testConfigOnlyValues.values,
          },
        });

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    it('should send update message', (done) => {
      store.patchState({
        fieldValues: {
          key: 'v1',
        },
      });

      store.updateFieldValues({
        key: 'v2',
      });

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.state.fieldValues).toStrictEqual({
          key: 'v2',
        });
        done();
      });
    });
  });

  describe('update displayed columns', () => {
    describe('pageData$ selector', () => {
      it('should update if new columns are not the same as old ones', (done) => {
        store.patchState({
          displayedColumnsIds: ['col_1'],
        });

        store.updateDisplayedColumnsIds(['col_2']);

        store.pageData$.pipe(take(1)).subscribe((data) => {
          expect(data.displayedColumnsIds).toStrictEqual(['col_2']);
          done();
        });
      });

      it('should not update if columns did not change', () => {
        store.patchState({
          displayedColumnsIds: ['col_1'],
        });

        store.updateDisplayedColumnsIds(['col_1']);

        store.pageData$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('currentConfig$ selector', () => {
      it('should not update on edit mode', () => {
        store.patchState({
          displayedColumnsIds: testConfigBase.columns,
          currentSearchConfig: testConfigBase,
          editMode: true,
        });

        store.updateDisplayedColumnsIds(['col_2']);

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if current config was undefined', () => {
        store.patchState({
          displayedColumnsIds: ['col_1'],
          currentSearchConfig: undefined,
        });

        store.updateDisplayedColumnsIds(['col_2']);

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should unset config if current config has colums not equal to new ones', (done) => {
        store.patchState({
          displayedColumnsIds: testConfigValuesAndColumns.columns,
          currentSearchConfig: testConfigValuesAndColumns,
        });

        store.updateDisplayedColumnsIds(['col_2']);

        store.currentConfig$.pipe(take(1)).subscribe((config) => {
          expect(config).toBe(undefined);
          done();
        });
      });

      it('should not update if current config has values equal to new ones', () => {
        store.patchState({
          displayedColumnsIds: testConfigValuesAndColumns.columns,
          currentSearchConfig: testConfigValuesAndColumns,
        });

        store.updateDisplayedColumnsIds(testConfigValuesAndColumns.columns);

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('selectedGroupKey$ selector', () => {
      it('should not update in edit mode', () => {
        store.patchState({
          displayedColumnsIds: testConfigBase.columns,
          currentSearchConfig: testConfigBase,
          editMode: true,
          selectedGroupKey: 'deafult-key',
        });

        store.updateDisplayedColumnsIds([...testConfigBase.columns, 'newCol']);

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if current config was undefined', () => {
        store.patchState({
          displayedColumnsIds: ['col_1'],
          currentSearchConfig: undefined,
          selectedGroupKey: 'deafult-key',
        });

        store.updateDisplayedColumnsIds(['col_2']);

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if config with only inputs is unset', () => {
        store.patchState({
          displayedColumnsIds: testConfigOnlyValues.columns,
          currentSearchConfig: testConfigOnlyValues,
          selectedGroupKey: 'default-key',
        });

        store.updateDisplayedColumnsIds([...testConfigBase.columns, 'newCol']);

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update if config with both inputs and columns is unset', (done) => {
        store.patchState({
          searchConfigs: [testConfigValuesAndColumns],
          displayedColumnsIds: testConfigValuesAndColumns.columns,
          currentSearchConfig: testConfigValuesAndColumns,
          selectedGroupKey: testConfigValuesAndColumns.name,
          customGroupKey: 'custom-key',
        });

        store.updateDisplayedColumnsIds([
          ...testConfigValuesAndColumns.columns,
          'newCol',
        ]);

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe('custom-key');
          done();
        });
      });

      it('should not update if current config had columns equal to new ones', () => {
        store.patchState({
          displayedColumnsIds: testConfigValuesAndColumns.columns,
          currentSearchConfig: testConfigOnlyValues,
          selectedGroupKey: testConfigValuesAndColumns.name,
        });

        store.updateDisplayedColumnsIds(testConfigValuesAndColumns.columns);

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    it('should send update message', (done) => {
      store.patchState({
        displayedColumnsIds: ['col_1', 'col_2'],
      });

      store.updateDisplayedColumnsIds(['col_2']);

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.state.displayedColumns).toStrictEqual(['col_2']);
        done();
      });
    });
  });

  describe('update view mode', () => {
    describe('pageData$ selector', () => {
      it('should update if view mode changed', (done) => {
        store.patchState({
          viewMode: advancedViewMode,
        });

        store.updateViewMode(basicViewMode);

        store.pageData$.pipe(take(1)).subscribe((data) => {
          expect(data.viewMode).toStrictEqual(basicViewMode);
          done();
        });
      });

      it('should not update if columns did not change', () => {
        store.patchState({
          viewMode: advancedViewMode,
        });

        store.updateViewMode(advancedViewMode);

        store.pageData$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('currentConfig$ selector', () => {
      it('should not update on edit mode', () => {
        store.patchState({
          viewMode: testConfigBase.isAdvanced
            ? advancedViewMode
            : basicViewMode,
          currentSearchConfig: testConfigBase,
          editMode: true,
        });

        store.updateViewMode(advancedViewMode);

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if current config was undefined', () => {
        store.patchState({
          viewMode: basicViewMode,
          currentSearchConfig: undefined,
        });

        store.updateViewMode(advancedViewMode);

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should unset config if current config has view mode not equal to new one', (done) => {
        store.patchState({
          viewMode: testConfigValuesAndColumns.isAdvanced
            ? advancedViewMode
            : basicViewMode,
          currentSearchConfig: testConfigValuesAndColumns,
        });

        store.updateViewMode(
          testConfigValuesAndColumns.isAdvanced
            ? basicViewMode
            : advancedViewMode,
        );

        store.currentConfig$.pipe(take(1)).subscribe((config) => {
          expect(config).toBe(undefined);
          done();
        });
      });

      it('should not update if current config has values equal to new ones', () => {
        store.patchState({
          viewMode: testConfigValuesAndColumns.isAdvanced
            ? advancedViewMode
            : basicViewMode,
          currentSearchConfig: testConfigValuesAndColumns,
        });

        store.updateViewMode(
          testConfigValuesAndColumns.isAdvanced
            ? advancedViewMode
            : basicViewMode,
        );

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('selectedGroupKey$ selector', () => {
      it('should not update in edit mode', () => {
        store.patchState({
          viewMode: testConfigBase.isAdvanced
            ? advancedViewMode
            : basicViewMode,
          currentSearchConfig: testConfigBase,
          editMode: true,
          selectedGroupKey: 'deafult-key',
        });

        store.updateViewMode(
          testConfigBase.isAdvanced ? basicViewMode : advancedViewMode,
        );

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if current config was undefined', () => {
        store.patchState({
          viewMode: basicViewMode,
          currentSearchConfig: undefined,
          selectedGroupKey: 'deafult-key',
        });

        store.updateViewMode(advancedViewMode);

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if config with only inputs is unset', () => {
        store.patchState({
          viewMode: testConfigOnlyValues.isAdvanced
            ? advancedViewMode
            : basicViewMode,
          currentSearchConfig: testConfigOnlyValues,
          selectedGroupKey: 'default-key',
        });

        store.updateViewMode(
          testConfigOnlyValues.isAdvanced ? basicViewMode : advancedViewMode,
        );

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update if config with both inputs and columns is unset', (done) => {
        store.patchState({
          searchConfigs: [testConfigValuesAndColumns],
          viewMode: testConfigValuesAndColumns.isAdvanced
            ? advancedViewMode
            : basicViewMode,
          currentSearchConfig: testConfigValuesAndColumns,
          selectedGroupKey: testConfigValuesAndColumns.name,
          customGroupKey: 'custom-key',
        });

        store.updateViewMode(
          testConfigValuesAndColumns.isAdvanced
            ? basicViewMode
            : advancedViewMode,
        );

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe('custom-key');
          done();
        });
      });

      it('should not update if current config had values equal to new ones', () => {
        store.patchState({
          viewMode: testConfigOnlyValues.isAdvanced
            ? advancedViewMode
            : basicViewMode,
          currentSearchConfig: testConfigOnlyValues,
          selectedGroupKey: 'default-key',
        });

        store.updateViewMode(
          testConfigOnlyValues.isAdvanced ? advancedViewMode : basicViewMode,
        );

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    it('should send update message', (done) => {
      store.patchState({
        viewMode: basicViewMode,
      });

      store.updateViewMode(advancedViewMode);

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.state.viewMode).toStrictEqual(advancedViewMode);
        done();
      });
    });
  });

  describe('set selected group key', () => {
    describe('columnSelectionVm$ selector', () => {
      it('should not update if selected group key did not change', () => {
        store.patchState({
          selectedGroupKey: '1',
        });

        store.setSelectedGroupKey('1');

        store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update if selected group key changed', (done) => {
        store.patchState({
          selectedGroupKey: '1',
          nonSearchConfigGroupKeys: [],
          searchConfigs: [],
        });

        store.setSelectedGroupKey('2');

        store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.selectedGroupKey).toBe('2');
          expect(vm.allGroupKeys).toStrictEqual(['2']);
          done();
        });
      });

      it('should update if config and selected key for config was set and new key is predefined', (done) => {
        store.patchState({
          selectedGroupKey: testConfigValuesAndColumns.name,
          currentSearchConfig: testConfigValuesAndColumns,
          nonSearchConfigGroupKeys: ['default'],
          searchConfigs: [testConfigValuesAndColumns],
        });

        store.setSelectedGroupKey('default');

        store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.currentConfig).toBe(undefined);
          done();
        });
      });

      it('should update if config and selected key for config was set and new key is custom group key', (done) => {
        store.patchState({
          selectedGroupKey: testConfigValuesAndColumns.name,
          currentSearchConfig: testConfigValuesAndColumns,
          nonSearchConfigGroupKeys: ['default'],
          searchConfigs: [testConfigValuesAndColumns],
          customGroupKey: 'custom-key',
        });

        store.setSelectedGroupKey('custom-key');

        store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.currentConfig).toBe(undefined);
          done();
        });
      });

      it('should update if only values config was selected and new key is search config', (done) => {
        store.patchState({
          selectedGroupKey: 'default',
          currentSearchConfig: testConfigOnlyValues,
          nonSearchConfigGroupKeys: ['default'],
          searchConfigs: [testConfigOnlyValues, testConfigOnlyColumns],
        });

        store.setSelectedGroupKey(testConfigOnlyColumns.name);

        store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.currentConfig).toStrictEqual(testConfigOnlyColumns);
          done();
        });
      });

      it('should not update if no config was chosen and new key is predefined', () => {
        store.patchState({
          selectedGroupKey: 'default',
          currentSearchConfig: undefined,
          nonSearchConfigGroupKeys: ['default', 'extended'],
          searchConfigs: [testConfigOnlyValues, testConfigOnlyColumns],
        });

        store.setSelectedGroupKey('extended');

        store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if no config was chosen and new key is custom group key', () => {
        store.patchState({
          selectedGroupKey: 'default',
          currentSearchConfig: undefined,
          nonSearchConfigGroupKeys: ['default', 'extended'],
          searchConfigs: [testConfigOnlyValues, testConfigOnlyColumns],
          customGroupKey: 'custom-key',
        });

        store.setSelectedGroupKey('custom-key');

        store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('currentConfig$ selector', () => {
      it('should not update in edit mode', () => {
        store.patchState({
          editMode: true,
        });

        store.setSelectedGroupKey('any');

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update if config and selected key for config was set and new key is predefined', (done) => {
        store.patchState({
          selectedGroupKey: testConfigValuesAndColumns.name,
          currentSearchConfig: testConfigValuesAndColumns,
          nonSearchConfigGroupKeys: ['default'],
          searchConfigs: [testConfigValuesAndColumns],
        });

        store.setSelectedGroupKey('default');

        store.currentConfig$.pipe(take(1)).subscribe((config) => {
          expect(config).toBe(undefined);
          done();
        });
      });

      it('should update if config and selected key for config was set and new key is custom group key', (done) => {
        store.patchState({
          selectedGroupKey: testConfigValuesAndColumns.name,
          currentSearchConfig: testConfigValuesAndColumns,
          nonSearchConfigGroupKeys: ['default'],
          searchConfigs: [testConfigValuesAndColumns],
          customGroupKey: 'custom-key',
        });

        store.setSelectedGroupKey('custom-key');

        store.currentConfig$.pipe(take(1)).subscribe((config) => {
          expect(config).toBe(undefined);
          done();
        });
      });

      it('should update if only values config was selected and new key is search config', (done) => {
        store.patchState({
          selectedGroupKey: 'default',
          currentSearchConfig: testConfigOnlyValues,
          nonSearchConfigGroupKeys: ['default'],
          searchConfigs: [testConfigOnlyValues, testConfigOnlyColumns],
        });

        store.setSelectedGroupKey(testConfigOnlyColumns.name);

        store.currentConfig$.pipe(take(1)).subscribe((config) => {
          expect(config).toStrictEqual(testConfigOnlyColumns);
          done();
        });
      });

      it('should not update if no config was chosen and new key is predefined', () => {
        store.patchState({
          selectedGroupKey: 'default',
          currentSearchConfig: undefined,
          nonSearchConfigGroupKeys: ['default', 'extended'],
          searchConfigs: [testConfigOnlyValues, testConfigOnlyColumns],
        });

        store.setSelectedGroupKey('extended');

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if no config was chosen and new key is custom group key', () => {
        store.patchState({
          selectedGroupKey: 'default',
          currentSearchConfig: undefined,
          nonSearchConfigGroupKeys: ['default', 'extended'],
          searchConfigs: [testConfigOnlyValues, testConfigOnlyColumns],
          customGroupKey: 'custom-key',
        });

        store.setSelectedGroupKey('custom-key');

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('selectedGroupKey$ selector', () => {
      it('should not update if selected group key did not change', () => {
        store.patchState({
          selectedGroupKey: '1',
        });

        store.setSelectedGroupKey('1');

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update if selected group key changed', (done) => {
        store.patchState({
          selectedGroupKey: '1',
        });

        store.setSelectedGroupKey('2');

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe('2');
          done();
        });
      });
    });

    it('should send update message', (done) => {
      store.patchState({});

      store.setSelectedGroupKey('2');

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.state.selectedGroupKey).toStrictEqual('2');
        done();
      });
    });
  });

  describe('edit search config', () => {
    it('should update searchConfigVm$ selector on change', (done) => {
      store.patchState({
        searchConfigs: [testConfigBase],
      });

      store.editSearchConfig({
        ...testConfigBase,
        name: 'modified-test-config-base',
      });

      store.searchConfigVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.searchConfigs).toStrictEqual([
          {
            ...testConfigBase,
            name: 'modified-test-config-base',
          },
        ]);
        done();
      });
    });

    it('should not update searchConfigVm$ selector with no change', () => {
      store.patchState({
        searchConfigs: [testConfigBase],
      });

      store.editSearchConfig(testConfigBase);

      store.searchConfigVm$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should update columnSelectionVm$ selector on change', (done) => {
      store.patchState({
        searchConfigs: [testConfigOnlyColumns],
      });

      store.editSearchConfig({
        ...testConfigOnlyColumns,
        name: 'modified-test-only-columns',
      });

      store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.searchConfigsOnlyColumns).toStrictEqual([
          {
            ...testConfigOnlyColumns,
            name: 'modified-test-only-columns',
          },
        ]);
        expect(vm.searchConfigsWithColumns).toStrictEqual([
          {
            ...testConfigOnlyColumns,
            name: 'modified-test-only-columns',
          },
        ]);
        expect(vm.allGroupKeys).toStrictEqual(['modified-test-only-columns']);
        done();
      });
    });

    it('should not update columnSelectionVm$ selector with no change', () => {
      store.patchState({
        searchConfigs: [testConfigOnlyColumns],
      });

      store.editSearchConfig(testConfigOnlyColumns);

      store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should send update message', (done) => {
      store.patchState({
        searchConfigs: [testConfigOnlyColumns],
      });

      store.editSearchConfig({
        ...testConfigOnlyColumns,
        name: 'modified-test-only-columns',
      });

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.state.searchConfigs).toStrictEqual([
          {
            ...testConfigOnlyColumns,
            name: 'modified-test-only-columns',
          },
        ]);
        done();
      });
    });
  });

  describe('set edit mode', () => {
    it('should update editMode and editStore columnSelectionVm$ selector', (done) => {
      store.patchState({
        editMode: false,
      });

      store.setEditMode();

      store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.editMode).toBe(true);
        expect(vm.isInChargeOfEdit).toBe(true);
        done();
      });
    });

    it('should update editMode only on external update for columnSelectionVm$ selector', (done) => {
      store.patchState({
        editMode: false,
      });

      store.setEditMode();

      store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.editMode).toBe(true);
        expect(vm.isInChargeOfEdit).toBe(true);
        done();
      });
    });

    it('should update searchConfigVm$ selector', (done) => {
      store.patchState({
        editMode: false,
      });

      store.setEditMode();

      store.searchConfigVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.editMode).toBe(true);
        expect(vm.isInChargeOfEdit).toBe(true);
        done();
      });
    });

    it('should update editMode only on external update for searchConfigVm$ selector', (done) => {
      store.patchState({
        editMode: false,
      });

      store.setEditMode();

      store.searchConfigVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.editMode).toBe(true);
        expect(vm.isInChargeOfEdit).toBe(true);
        done();
      });
    });

    it('should send update message', (done) => {
      store.patchState({
        editMode: false,
      });

      store.setEditMode();

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.state.editMode).toBe(true);
        done();
      });
    });
  });

  describe('cancel edit mode', () => {
    it('should update columnSelectionVm$ selector', (done) => {
      store.patchState({
        editMode: true,
      });

      store.cancelEditMode();

      store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.editMode).toBe(false);
        expect(vm.isInChargeOfEdit).toBe(false);
        done();
      });
    });

    it('should update searchConfigVm$ selector', (done) => {
      store.patchState({
        editMode: true,
      });

      store.cancelEditMode();

      store.searchConfigVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.editMode).toBe(false);
        expect(vm.isInChargeOfEdit).toBe(false);
        done();
      });
    });

    it('should send update message', (done) => {
      store.patchState({
        editMode: true,
      });

      store.cancelEditMode();

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.state.editMode).toBe(false);
        done();
      });
    });
  });

  describe('take snapshot', () => {
    it('should update preEditStateSnapshot$ selector', (done) => {
      const state: any = {
        pageName: 'page-name',
        desc: 'should-be-SearchConfigState-type',
      };
      store.setState(state);

      store.takeSnapshot();

      store.preEditStateSnapshot$.pipe(take(1)).subscribe((snapshot) => {
        expect(snapshot).toStrictEqual(state);
        done();
      });
    });

    it('should send update message', (done) => {
      const state: any = {
        pageName: 'page-name',
        desc: 'should-be-SearchConfigState-type',
      };
      store.setState(state);

      store.takeSnapshot();

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        done();
      });
    });
  });

  describe('revert page data', () => {
    it('should update pageDataToRevert$ selector', (done) => {
      const state: any = {
        pageName: 'page-name',
        fieldValues: {
          key: 'v',
        },
        displayedColumnsIds: ['col_1'],
        viewMode: advancedViewMode,
        selectedGroupKey: 'def-1',
      };
      store.setState({
        preEditStateSnapshot: state,
      } as any);

      store.revertPageData();

      store.pageDataToRevert$.pipe(take(1)).subscribe((data) => {
        expect(data).toStrictEqual({
          pageName: 'page-name',
          fieldValues: {
            key: 'v',
          },
          displayedColumnsIds: ['col_1'],
          viewMode: advancedViewMode,
          columnGroupKey: 'def-1',
        } satisfies PageData);
        done();
      });
    });

    it('should send update message', (done) => {
      const state: any = {
        pageName: 'page-name',
        fieldValues: {
          key: 'v',
        },
        displayedColumnsIds: ['col_1'],
        viewMode: advancedViewMode,
        selectedGroupKey: 'def-1',
      };
      store.setState({
        preEditStateSnapshot: state,
      } as any);

      store.revertPageData();

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        done();
      });
    });
  });

  describe('columnSelectionVm$ selector', () => {
    it('should contain search configs, selected key and non search config keys in all group keys', (done) => {
      store.patchState({
        selectedGroupKey: 'different-than-1',
        searchConfigs: [testConfigOnlyColumns],
        nonSearchConfigGroupKeys: ['non-1'],
      });

      store.setSelectedGroupKey('1');

      store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.allGroupKeys.length).toEqual(3);
        expect(vm.allGroupKeys.includes('1')).toBeTruthy();
        expect(vm.allGroupKeys.includes('non-1')).toBeTruthy();
        expect(
          vm.allGroupKeys.includes(testConfigOnlyColumns.name),
        ).toBeTruthy();
        done();
      });
    });

    it('should not duplicate selected key in all groups', (done) => {
      store.patchState({
        selectedGroupKey: 'different-than-1',
        searchConfigs: [testConfigOnlyColumns],
        nonSearchConfigGroupKeys: ['non-1'],
      });

      store.setSelectedGroupKey('non-1');

      store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.allGroupKeys.length).toEqual(2);
        expect(vm.allGroupKeys.includes('non-1')).toBeTruthy();
        expect(
          vm.allGroupKeys.includes(testConfigOnlyColumns.name),
        ).toBeTruthy();
        done();
      });
    });
  });

  describe('enterEditMode effect', () => {
    it('should activate config and set edit mode', (done) => {
      store.patchState({
        currentSearchConfig: undefined,
        searchConfigs: [testConfigValuesAndColumns],
        selectedGroupKey: 'default',
        nonSearchConfigGroupKeys: ['default'],
        editMode: false,
      });

      store.enterEditMode(testConfigValuesAndColumns);

      store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.currentConfig).toStrictEqual(testConfigValuesAndColumns);
        expect(vm.editMode).toBe(true);
        done();
      });
    });
  });

  describe('saveEdit effect', () => {
    it('should edit config in config list, cancel edit mode and set current config', (done) => {
      store.patchState({
        currentSearchConfig: testConfigValuesAndColumns,
        searchConfigs: [testConfigValuesAndColumns],
        selectedGroupKey: testConfigValuesAndColumns.name,
        nonSearchConfigGroupKeys: ['default'],
        editMode: true,
      });

      store.saveEdit({
        ...testConfigValuesAndColumns,
        name: 'new-name-for-config',
      });

      store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.currentConfig).toStrictEqual({
          ...testConfigValuesAndColumns,
          name: 'new-name-for-config',
        });
        expect(vm.searchConfigsWithColumns).toStrictEqual([
          {
            ...testConfigValuesAndColumns,
            name: 'new-name-for-config',
          },
        ]);
        expect(vm.editMode).toBe(false);
        done();
      });
    });
  });

  describe('cancelEdit effect', () => {
    it('should update currentConfig$ selector if config was set in snapshot', (done) => {
      store.patchState({
        currentSearchConfig: testConfigValuesAndColumns,
        preEditStateSnapshot: {
          currentSearchConfig: testConfigBase,
        } as any,
      });

      store.cancelEdit();

      store.currentConfig$.pipe(take(1)).subscribe((config) => {
        expect(config).toStrictEqual(testConfigBase);
        done();
      });
    });
    it('should not update pageDataToRevert$ selector if values + columns config was set in snapshot', () => {
      store.patchState({
        currentSearchConfig: testConfigBase,
        preEditStateSnapshot: {
          currentSearchConfig: testConfigValuesAndColumns,
        } as any,
      });

      store.cancelEdit();

      store.pageDataToRevert$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });
    it('should update pageDataToRevert$ selector if values only config was set in snapshot', (done) => {
      store.patchState({
        currentSearchConfig: testConfigValuesAndColumns,
        preEditStateSnapshot: {
          currentSearchConfig: testConfigOnlyValues,
          pageName: 'page-name',
          fieldValues: {
            key: 'v',
          },
          displayedColumnsIds: ['col_1'],
          viewMode: advancedViewMode,
          selectedGroupKey: 'def-1',
        } as any,
      });

      store.cancelEdit();

      store.pageDataToRevert$.pipe(take(1)).subscribe((data) => {
        expect(data).toStrictEqual({
          pageName: 'page-name',
          fieldValues: {
            key: 'v',
          },
          displayedColumnsIds: ['col_1'],
          viewMode: advancedViewMode,
          columnGroupKey: 'def-1',
        } satisfies PageData);
        done();
      });
    });
    it('should update pageDataToRevert$ selector if columns only config was set in snapshot', (done) => {
      store.patchState({
        currentSearchConfig: testConfigValuesAndColumns,
        preEditStateSnapshot: {
          currentSearchConfig: testConfigOnlyColumns,
          pageName: 'page-name',
          fieldValues: {
            key: 'v',
          },
          displayedColumnsIds: ['col_1'],
          viewMode: advancedViewMode,
          selectedGroupKey: 'def-1',
        } as any,
      });

      store.cancelEdit();

      store.pageDataToRevert$.pipe(take(1)).subscribe((data) => {
        expect(data).toStrictEqual({
          pageName: 'page-name',
          fieldValues: {
            key: 'v',
          },
          displayedColumnsIds: ['col_1'],
          viewMode: advancedViewMode,
          columnGroupKey: 'def-1',
        } satisfies PageData);
        done();
      });
    });
    it('should update pageDataToRevert$ selector if config was not set in snapshot', (done) => {
      store.patchState({
        currentSearchConfig: testConfigValuesAndColumns,
        preEditStateSnapshot: {
          currentSearchConfig: undefined,
          pageName: 'page-name',
          fieldValues: {
            key: 'v',
          },
          displayedColumnsIds: ['col_1'],
          viewMode: advancedViewMode,
          selectedGroupKey: 'def-1',
        } as any,
      });

      store.cancelEdit();

      store.pageDataToRevert$.pipe(take(1)).subscribe((data) => {
        expect(data).toStrictEqual({
          pageName: 'page-name',
          fieldValues: {
            key: 'v',
          },
          displayedColumnsIds: ['col_1'],
          viewMode: advancedViewMode,
          columnGroupKey: 'def-1',
        } satisfies PageData);
        done();
      });
    });
    it('should not update currentConfig$ selector if config was not set in snapshot', () => {
      store.patchState({
        currentSearchConfig: testConfigValuesAndColumns,
        preEditStateSnapshot: {
          currentSearchConfig: undefined,
        } as any,
      });

      store.cancelEdit();

      store.currentConfig$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });
  });

  describe('storeUpdate effect', () => {
    const initState = {
      editMode: false,
      currentSearchConfig: undefined,
      selectedGroupKey: '',
      nonSearchConfigGroupKeys: [],
      customGroupKey: 'custom',
      searchConfigs: [],
      fieldValues: {},
      displayedColumns: [],
      viewMode: basicViewMode,
      inChargeOfEdit: '',
    };
    it('should update search configs in other store', (done) => {
      const spy = jest.spyOn(secondStore, 'patchState');
      store.setState(initState as any);

      store.setSearchConfigs([testConfigBase, testConfigOnlyValues]);

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initState,
          searchConfigs: [testConfigBase, testConfigOnlyValues],
          selectedGroupKey: 'custom',
        });
        done();
      });
    });

    it('should update current search config in other store', (done) => {
      const spy = jest.spyOn(secondStore, 'patchState');
      store.setState({
        ...initState,
      } as any);

      store.setCurrentConfig(testConfigValuesAndColumns);

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initState,
          currentSearchConfig: testConfigValuesAndColumns,
          selectedGroupKey: testConfigValuesAndColumns.name,
        });
        done();
      });
    });

    it('should delete search config in other store', (done) => {
      const spy = jest.spyOn(secondStore, 'patchState');
      store.setState({
        ...initState,
        searchConfigs: [testConfigValuesAndColumns],
      } as any);

      store.deleteSearchConfig(testConfigValuesAndColumns);

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initState,
          searchConfigs: [],
        });
        done();
      });
    });

    it('should add search config in other store', (done) => {
      const spy = jest.spyOn(secondStore, 'patchState');
      store.setState({
        searchConfigs: [],
      } as any);

      store.addSearchConfig(testConfigValuesAndColumns);

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          searchConfigs: [testConfigValuesAndColumns],
        });
        done();
      });
    });

    it('should update field values in other store', (done) => {
      const spy = jest.spyOn(secondStore, 'patchState');
      store.setState({
        ...initState,
      } as any);

      store.updateFieldValues({
        key: 'val-1',
      });

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initState,
          fieldValues: {
            key: 'val-1',
          },
        });
        done();
      });
    });

    it('should update displayed columns in other store', (done) => {
      const spy = jest.spyOn(secondStore, 'patchState');
      store.setState({
        ...initState,
      } as any);

      store.updateDisplayedColumnsIds(['my-col-1']);

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initState,
          displayedColumns: ['my-col-1'],
        });
        done();
      });
    });

    it('should update view mode in other store', (done) => {
      const spy = jest.spyOn(secondStore, 'patchState');
      store.setState({
        ...initState,
      } as any);

      store.updateViewMode(advancedViewMode);

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initState,
          viewMode: advancedViewMode,
        });
        done();
      });
    });

    it('should set edit mode in other store', (done) => {
      const spy = jest.spyOn(secondStore, 'patchState');
      store.setState({
        ...initState,
      } as any);

      store.setEditMode();

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initState,
          editMode: true,
          inChargeOfEdit: 'store-1',
        });
        done();
      });
    });

    it('should cancel edit mode in other store', (done) => {
      const spy = jest.spyOn(secondStore, 'patchState');
      store.setState({
        ...initState,
      } as any);

      store.cancelEditMode();

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initState,
          editMode: false,
        });
        done();
      });
    });

    it('should edit search config in other store', (done) => {
      const spy = jest.spyOn(secondStore, 'patchState');
      store.setState({
        ...initState,
        searchConfigs: [testConfigOnlyColumns],
      } as any);

      store.editSearchConfig({
        ...testConfigOnlyColumns,
        name: 'test-other-name',
      });

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initState,
          searchConfigs: [
            {
              ...testConfigOnlyColumns,
              name: 'test-other-name',
            },
          ],
        });
        done();
      });
    });

    it('should set non search config group keys in other store', (done) => {
      const spy = jest.spyOn(secondStore, 'patchState');
      store.setState({
        ...initState,
      } as any);

      store.setNonSearchConfigGroupKeys(['default', 'extended']);

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initState,
          nonSearchConfigGroupKeys: ['default', 'extended'],
        });
        done();
      });
    });

    it('should set selected group key in other store', (done) => {
      const spy = jest.spyOn(secondStore, 'patchState');
      store.setState({
        ...initState,
      } as any);

      store.setSelectedGroupKey('2');

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initState,
          selectedGroupKey: '2',
        });
        done();
      });
    });

    it('should take snapshot in other store', (done) => {
      const spy = jest.spyOn(secondStore, 'patchState');
      store.setState({
        ...initState,
      } as any);

      store.takeSnapshot();

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initState,
          preEditStateSnapshot: initState,
        });
        done();
      });
    });

    it('should set custom group key in other store', (done) => {
      const spy = jest.spyOn(secondStore, 'patchState');
      store.setState({
        ...initState,
      } as any);

      store.setCustomGroupKey('custom-key');

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initState,
          customGroupKey: 'custom-key',
        });
        done();
      });
    });

    it('should revert page data in other store', (done) => {
      const spy = jest.spyOn(secondStore, 'patchState');
      store.setState({
        ...initState,
      } as any);

      store.revertPageData();

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initState,
          pageDataToRevert: undefined,
        });
        done();
      });
    });
  });
});
