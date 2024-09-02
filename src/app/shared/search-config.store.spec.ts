import { TestBed } from '@angular/core/testing';
import { skip, take } from 'rxjs';
import { FakeTopic } from '@onecx/angular-integration-interface/mocks';

import { SearchConfigStore } from './search-config.store';
import { SearchConfigInfo } from './generated';
import { SearchConfigTopic } from './topics/search-config/v1/search-config.topic';
import { SearchConfigMessage } from './topics/search-config/v1/search-config.model';
import { advancedViewMode, basicViewMode } from './constants';

describe('SearchConfigStore', () => {
  let store: SearchConfigStore;
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

  const testConfigAdvanced: SearchConfigInfo = {
    ...testConfigBase,
    id: 'testConfigAdvanced',
    name: 'testConfigAdvanced',
    isAdvanced: true,
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

  const testConfigValuesAndColumnsAdvanced: SearchConfigInfo = {
    ...testConfigAdvanced,
    id: 'testConfigValuesAndColumnsAdvanced',
    name: 'testConfigValuesAndColumnsAdvanced',
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

  let mockSearchConfigStoreTopic: FakeTopic<SearchConfigMessage>;

  beforeEach(() => {
    mockSearchConfigStoreTopic = new FakeTopic<SearchConfigMessage>();
    TestBed.configureTestingModule({
      imports: [],
      providers: [],
    });

    store = new SearchConfigStore(
      mockSearchConfigStoreTopic as any as SearchConfigTopic,
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

      store.setCustomGroupKey({ customGroupKey: 'custom-key' });

      store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.customGroupKey).toBe('custom-key');
        done();
      });
    });

    it('should not update columnSelectionVm$ selector with no change', () => {
      store.patchState({
        customGroupKey: 'custom-key',
      });

      store.setCustomGroupKey({ customGroupKey: 'custom-key' });

      store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should send update message', (done) => {
      store.patchState({
        storeName: 'store-1',
      });

      store.setCustomGroupKey({
        customGroupKey: 'custom-key',
      });

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.name).toBe('setCustomGroupKey');
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.customGroupKey).toStrictEqual('custom-key');
        done();
      });
    });
  });

  describe('set search configs', () => {
    it('should update searchConfigVm$ selector on change', (done) => {
      store.patchState({});

      store.setSearchConfigs({
        searchConfigs: [testConfigOnlyValues],
      });

      store.searchConfigVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.searchConfigs).toStrictEqual([testConfigOnlyValues]);
        done();
      });
    });

    it('should not update searchConfigVm$ selector with no change', () => {
      store.patchState({
        searchConfigs: [testConfigOnlyValues],
      });

      store.setSearchConfigs({
        searchConfigs: [testConfigOnlyValues],
      });

      store.searchConfigVm$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should update columnSelectionVm$ selector on change', (done) => {
      store.patchState({
        searchConfigs: [],
      });

      store.setSearchConfigs({
        searchConfigs: [testConfigOnlyColumns, testConfigValuesAndColumns],
      });

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

      store.setSearchConfigs({
        searchConfigs: [testConfigOnlyColumns, testConfigValuesAndColumns],
      });

      store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should send update message', (done) => {
      store.patchState({
        storeName: 'store-1',
      });

      store.setSearchConfigs({
        searchConfigs: [testConfigBase, testConfigOnlyValues],
      });

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.name).toBe('setSearchConfigs');
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.searchConfigs).toStrictEqual([
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

      store.setNonSearchConfigGroupKeys({
        nonSearchConfigGroupKeys: ['1'],
      });

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

      store.setNonSearchConfigGroupKeys({
        nonSearchConfigGroupKeys: ['1'],
      });

      store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should send update message', (done) => {
      store.patchState({
        storeName: 'store-1',
      });

      store.setNonSearchConfigGroupKeys({
        nonSearchConfigGroupKeys: ['default', 'extended'],
      });

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.name).toBe('setNonSearchConfigGroupKeys');
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.nonSearchConfigGroupKeys).toStrictEqual([
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

        store.addSearchConfig({
          searchConfig: testConfigOnlyValues,
        });

        store.searchConfigVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.searchConfigs).toStrictEqual([testConfigOnlyValues]);
          done();
        });
      });

      it('should not update columnSelectionVm$ selector', () => {
        store.patchState({});

        store.addSearchConfig({
          searchConfig: testConfigOnlyValues,
        });

        store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('with values and columns search config', () => {
      it('should update searchConfigVm$ selector', (done) => {
        store.patchState({});

        store.addSearchConfig({
          searchConfig: testConfigValuesAndColumns,
        });

        store.searchConfigVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.searchConfigs).toStrictEqual([testConfigValuesAndColumns]);
          done();
        });
      });

      it('should update columnSelectionVm$ selector', (done) => {
        store.patchState({});

        store.addSearchConfig({
          searchConfig: testConfigValuesAndColumns,
        });

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

        store.addSearchConfig({
          searchConfig: testConfigOnlyColumns,
        });

        store.searchConfigVm$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update columnSelectionVm$ selector', (done) => {
        store.patchState({});

        store.addSearchConfig({
          searchConfig: testConfigOnlyColumns,
        });

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
      store.patchState({
        storeName: 'store-1',
      });

      store.addSearchConfig({
        searchConfig: testConfigValuesAndColumns,
      });

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.name).toBe('addSearchConfig');
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.searchConfig).toStrictEqual(
          testConfigValuesAndColumns,
        );
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

        store.deleteSearchConfig({
          searchConfig: testConfigOnlyValues,
        });

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

        store.deleteSearchConfig({
          searchConfig: testConfigOnlyValues,
        });

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

        store.deleteSearchConfig({
          searchConfig: testConfigValuesAndColumns,
        });

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

        store.deleteSearchConfig({
          searchConfig: testConfigValuesAndColumns,
        });

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

        store.deleteSearchConfig({
          searchConfig: testConfigOnlyColumns,
        });

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

        store.deleteSearchConfig({
          searchConfig: testConfigOnlyColumns,
        });

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
        storeName: 'store-1',
        searchConfigs: [
          testConfigOnlyValues,
          testConfigValuesAndColumns,
          testConfigOnlyColumns,
        ],
      });

      store.deleteSearchConfig({
        searchConfig: testConfigOnlyColumns,
      });

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.name).toBe('deleteSearchConfig');
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.searchConfig).toStrictEqual(testConfigOnlyColumns);
        done();
      });
    });

    it('should update columnSelectionVm$ selector if it was current config', (done) => {
      store.patchState({
        currentSearchConfig: testConfigBase,
      });

      store.deleteSearchConfig({
        searchConfig: testConfigBase,
      });

      store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.currentConfig).toStrictEqual(undefined);
        done();
      });
    });

    it('should update currentConfig$ selector if it was current config', (done) => {
      store.patchState({
        currentSearchConfig: testConfigBase,
      });

      store.deleteSearchConfig({
        searchConfig: testConfigBase,
      });

      store.currentConfig$.pipe(take(1)).subscribe((config) => {
        expect(config).toStrictEqual(undefined);
        done();
      });
    });

    describe('selectedGroupKey$ selector', () => {
      it('should not update if current key is same as current config and other is deleted', () => {
        store.patchState({
          currentSearchConfig: testConfigBase,
          selectedGroupKey: testConfigBase.name,
        });

        store.deleteSearchConfig({
          searchConfig: testConfigOnlyColumns,
        });

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

        store.deleteSearchConfig({
          searchConfig: testConfigBase,
        });

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

      store.setCurrentConfig({
        config: testConfigOnlyColumns,
      });

      store.currentConfig$.pipe(take(1)).subscribe((config) => {
        expect(config).toStrictEqual(testConfigOnlyColumns);
        done();
      });
    });

    it('should not update currentConfig$ selector with no change', () => {
      store.patchState({
        currentSearchConfig: testConfigBase,
      });

      store.setCurrentConfig({
        config: testConfigBase,
      });

      store.currentConfig$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should update columnSelectionVm$ selector on change', (done) => {
      store.patchState({
        currentSearchConfig: testConfigBase,
      });

      store.setCurrentConfig({
        config: testConfigOnlyColumns,
      });

      store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.currentConfig).toStrictEqual(testConfigOnlyColumns);
        done();
      });
    });

    it('should update columnSelectionVm$ selector with no change', () => {
      store.patchState({
        currentSearchConfig: testConfigBase,
      });

      store.setCurrentConfig({
        config: testConfigBase,
      });

      store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    describe('selectedGroupKey$ selector', () => {
      it('should not update if current key is same as config', () => {
        store.patchState({
          currentSearchConfig: testConfigBase,
          selectedGroupKey: testConfigBase.name,
        });

        store.setCurrentConfig({
          config: testConfigBase,
        });

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

        store.setCurrentConfig({
          config: testConfigValuesAndColumns,
        });

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

        store.setCurrentConfig({
          config: testConfigOnlyColumns,
        });

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

        store.setCurrentConfig({
          config: testConfigOnlyValues,
        });

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

        store.setCurrentConfig({
          config: testConfigOnlyValues,
        });

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

        store.setCurrentConfig({
          config: undefined as any,
        });

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

        store.setCurrentConfig({
          config: undefined as any,
        });

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe('custom-key');
          done();
        });
      });
    });

    it('should send update message', (done) => {
      store.patchState({
        storeName: 'store-1',
        currentSearchConfig: testConfigBase,
      });

      store.setCurrentConfig({
        config: testConfigOnlyColumns,
      });

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.name).toBe('setCurrentConfig');
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.config).toStrictEqual(testConfigOnlyColumns);
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
          values: {
            key: 'v2',
          },
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
          fieldValues: {
            key: testConfigBase.values,
          },
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

    describe('columnSelectionVm$ selector', () => {
      it('should not update on edit mode', () => {
        store.patchState({
          fieldValues: {
            ...testConfigBase.values,
          },
          currentSearchConfig: testConfigBase,
          editMode: true,
        });

        store.updateFieldValues({
          values: {
            ...testConfigBase.values,
            key: 'v2',
          },
        });

        store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
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

        store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should unset config if current config had values not equal to new ones', (done) => {
        store.patchState({
          fieldValues: {
            ...testConfigOnlyValues.values,
          },
          currentSearchConfig: testConfigOnlyValues,
        });

        store.updateFieldValues({
          values: {
            ...testConfigOnlyValues.values,
            key_1: 'val_1-update',
          },
        });

        store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.currentConfig).toBe(undefined);
          done();
        });
      });

      it('should not update if current config had values equal to new ones', () => {
        store.patchState({
          fieldValues: {
            ...testConfigOnlyValues.values,
          },
          currentSearchConfig: testConfigOnlyValues,
        });

        store.updateFieldValues({
          values: {
            ...testConfigOnlyValues.values,
          },
        });

        store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    it('should send update message', (done) => {
      store.patchState({
        fieldValues: {
          key: 'v1',
        },
        storeName: 'store-1',
      });

      store.updateFieldValues({
        values: {
          key: 'v2',
        },
      });

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.name).toBe('updateFieldValues');
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.values).toStrictEqual({
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
          displayedColumns: ['col_1'],
        });

        store.updateDisplayedColumns({
          displayedColumns: ['col_2'],
        });

        store.pageData$.pipe(take(1)).subscribe((data) => {
          expect(data.displayedColumIds).toStrictEqual(['col_2']);
          done();
        });
      });

      it('should not update if columns did not change', () => {
        store.patchState({
          displayedColumns: ['col_1'],
        });

        store.updateDisplayedColumns({
          displayedColumns: ['col_1'],
        });

        store.pageData$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('currentConfig$ selector', () => {
      it('should not update on edit mode', () => {
        store.patchState({
          displayedColumns: testConfigBase.columns,
          currentSearchConfig: testConfigBase,
          editMode: true,
        });

        store.updateDisplayedColumns({
          displayedColumns: ['col_2'],
        });

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if current config was undefined', () => {
        store.patchState({
          displayedColumns: ['col_1'],
          currentSearchConfig: undefined,
        });

        store.updateDisplayedColumns({
          displayedColumns: ['col_2'],
        });

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should unset config if current config has colums not equal to new ones', (done) => {
        store.patchState({
          displayedColumns: testConfigValuesAndColumns.columns,
          currentSearchConfig: testConfigValuesAndColumns,
        });

        store.updateDisplayedColumns({
          displayedColumns: ['col_2'],
        });

        store.currentConfig$.pipe(take(1)).subscribe((config) => {
          expect(config).toBe(undefined);
          done();
        });
      });

      it('should not update if current config has values equal to new ones', () => {
        store.patchState({
          displayedColumns: testConfigValuesAndColumns.columns,
          currentSearchConfig: testConfigValuesAndColumns,
        });

        store.updateDisplayedColumns({
          displayedColumns: testConfigValuesAndColumns.columns,
        });

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('selectedGroupKey$ selector', () => {
      it('should not update in edit mode', () => {
        store.patchState({
          displayedColumns: testConfigBase.columns,
          currentSearchConfig: testConfigBase,
          editMode: true,
          selectedGroupKey: 'deafult-key',
        });

        store.updateDisplayedColumns({
          displayedColumns: [...testConfigBase.columns, 'newCol'],
        });

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if current config was undefined', () => {
        store.patchState({
          displayedColumns: ['col_1'],
          currentSearchConfig: undefined,
          selectedGroupKey: 'deafult-key',
        });

        store.updateDisplayedColumns({
          displayedColumns: ['col_2'],
        });

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if config with only inputs is unset', () => {
        store.patchState({
          displayedColumns: testConfigOnlyValues.columns,
          currentSearchConfig: testConfigOnlyValues,
          selectedGroupKey: 'default-key',
        });

        store.updateDisplayedColumns({
          displayedColumns: [...testConfigBase.columns, 'newCol'],
        });

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update if config with both inputs and columns is unset', (done) => {
        store.patchState({
          searchConfigs: [testConfigValuesAndColumns],
          displayedColumns: testConfigValuesAndColumns.columns,
          currentSearchConfig: testConfigValuesAndColumns,
          selectedGroupKey: testConfigValuesAndColumns.name,
          customGroupKey: 'custom-key',
        });

        store.updateDisplayedColumns({
          displayedColumns: [...testConfigValuesAndColumns.columns, 'newCol'],
        });

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe('custom-key');
          done();
        });
      });

      it('should not update if current config had columns equal to new ones', () => {
        store.patchState({
          displayedColumns: testConfigValuesAndColumns.columns,
          currentSearchConfig: testConfigOnlyValues,
          selectedGroupKey: testConfigValuesAndColumns.name,
        });

        store.updateDisplayedColumns({
          displayedColumns: testConfigValuesAndColumns.columns,
        });

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('columnSelectionVm$ selector', () => {
      it('should not update on edit mode', () => {
        store.patchState({
          displayedColumns: testConfigBase.columns,
          currentSearchConfig: testConfigBase,
          editMode: true,
        });

        store.updateDisplayedColumns({
          displayedColumns: ['col_2'],
        });

        store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if current config was undefined', () => {
        store.patchState({
          displayedColumns: ['col_1'],
          currentSearchConfig: undefined,
        });

        store.updateDisplayedColumns({
          displayedColumns: ['col_2'],
        });

        store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should unset config if current config has colums not equal to new ones', (done) => {
        store.patchState({
          displayedColumns: testConfigValuesAndColumns.columns,
          currentSearchConfig: testConfigValuesAndColumns,
        });

        store.updateDisplayedColumns({
          displayedColumns: ['col_2'],
        });

        store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.currentConfig).toBe(undefined);
          done();
        });
      });

      it('should not update if current config has values equal to new ones', () => {
        store.patchState({
          displayedColumns: testConfigValuesAndColumns.columns,
          currentSearchConfig: testConfigValuesAndColumns,
        });

        store.updateDisplayedColumns({
          displayedColumns: testConfigValuesAndColumns.columns,
        });

        store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    it('should send update message', (done) => {
      store.patchState({
        displayedColumns: ['col_1', 'col_2'],
        storeName: 'store-1',
      });

      store.updateDisplayedColumns({
        displayedColumns: ['col_2'],
      });

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.name).toBe('updateDisplayedColumns');
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.displayedColumns).toStrictEqual(['col_2']);
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

        store.updateViewMode({
          viewMode: basicViewMode,
        });

        store.pageData$.pipe(take(1)).subscribe((data) => {
          expect(data.viewMode).toStrictEqual(basicViewMode);
          done();
        });
      });

      it('should not update if columns did not change', () => {
        store.patchState({
          viewMode: advancedViewMode,
        });

        store.updateViewMode({
          viewMode: advancedViewMode,
        });

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

        store.updateViewMode({
          viewMode: advancedViewMode,
        });

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if current config was undefined', () => {
        store.patchState({
          viewMode: basicViewMode,
          currentSearchConfig: undefined,
        });

        store.updateViewMode({
          viewMode: advancedViewMode,
        });

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

        store.updateViewMode({
          viewMode: testConfigValuesAndColumns.isAdvanced
            ? basicViewMode
            : advancedViewMode,
        });

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

        store.updateViewMode({
          viewMode: testConfigValuesAndColumns.isAdvanced
            ? advancedViewMode
            : basicViewMode,
        });

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

        store.updateViewMode({
          viewMode: testConfigBase.isAdvanced
            ? basicViewMode
            : advancedViewMode,
        });

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

        store.updateViewMode({
          viewMode: advancedViewMode,
        });

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

        store.updateViewMode({
          viewMode: testConfigOnlyValues.isAdvanced
            ? basicViewMode
            : advancedViewMode,
        });

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

        store.updateViewMode({
          viewMode: testConfigValuesAndColumns.isAdvanced
            ? basicViewMode
            : advancedViewMode,
        });

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

        store.updateViewMode({
          viewMode: testConfigOnlyValues.isAdvanced
            ? advancedViewMode
            : basicViewMode,
        });

        store.currentConfig$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('columnSelectionVm$ selector', () => {
      it('should not update on edit mode', () => {
        store.patchState({
          viewMode: testConfigBase.isAdvanced
            ? advancedViewMode
            : basicViewMode,
          currentSearchConfig: testConfigBase,
          editMode: true,
        });

        store.updateViewMode({
          viewMode: testConfigBase.isAdvanced
            ? basicViewMode
            : advancedViewMode,
        });

        store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should not update if current config was undefined', () => {
        store.patchState({
          viewMode: basicViewMode,
          currentSearchConfig: undefined,
        });

        store.updateViewMode({
          viewMode: advancedViewMode,
        });

        store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
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

        store.updateViewMode({
          viewMode: testConfigValuesAndColumns.isAdvanced
            ? basicViewMode
            : advancedViewMode,
        });

        store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.currentConfig).toBe(undefined);
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

        store.updateViewMode({
          viewMode: testConfigValuesAndColumns.isAdvanced
            ? advancedViewMode
            : basicViewMode,
        });

        store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    it('should send update message', (done) => {
      store.patchState({
        viewMode: basicViewMode,
        storeName: 'store-1',
      });

      store.updateViewMode({
        viewMode: advancedViewMode,
      });

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.name).toBe('updateViewMode');
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.viewMode).toStrictEqual(advancedViewMode);
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

        store.setSelectedGroupKey({
          selectedGroupKey: '1',
        });

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

        store.setSelectedGroupKey({
          selectedGroupKey: '2',
        });

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

        store.setSelectedGroupKey({
          selectedGroupKey: 'default',
        });

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

        store.setSelectedGroupKey({
          selectedGroupKey: 'custom-key',
        });

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

        store.setSelectedGroupKey({
          selectedGroupKey: testConfigOnlyColumns.name,
        });

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

        store.setSelectedGroupKey({
          selectedGroupKey: 'extended',
        });

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

        store.setSelectedGroupKey({
          selectedGroupKey: 'custom-key',
        });

        store.columnSelectionVm$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('currentConfig$ selector', () => {
      it('should update if config and selected key for config was set and new key is predefined', (done) => {
        store.patchState({
          selectedGroupKey: testConfigValuesAndColumns.name,
          currentSearchConfig: testConfigValuesAndColumns,
          nonSearchConfigGroupKeys: ['default'],
          searchConfigs: [testConfigValuesAndColumns],
        });

        store.setSelectedGroupKey({
          selectedGroupKey: 'default',
        });

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

        store.setSelectedGroupKey({
          selectedGroupKey: 'custom-key',
        });

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

        store.setSelectedGroupKey({
          selectedGroupKey: testConfigOnlyColumns.name,
        });

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

        store.setSelectedGroupKey({
          selectedGroupKey: 'extended',
        });

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

        store.setSelectedGroupKey({
          selectedGroupKey: 'custom-key',
        });

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

        store.setSelectedGroupKey({
          selectedGroupKey: '1',
        });

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update if selected group key changed', (done) => {
        store.patchState({
          selectedGroupKey: '1',
        });

        store.setSelectedGroupKey({
          selectedGroupKey: '2',
        });

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe('2');
          done();
        });
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

      store.setSelectedGroupKey({
        selectedGroupKey: '1',
      });

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

      store.setSelectedGroupKey({
        selectedGroupKey: 'non-1',
      });

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
});
