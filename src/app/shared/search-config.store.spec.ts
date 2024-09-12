import { TestBed } from '@angular/core/testing';
import { take } from 'rxjs';
import { FakeTopic } from '@onecx/angular-integration-interface/mocks';

import {
  SearchConfigMessage,
  SearchConfigStore,
  SearchConfigTopic,
  initialState,
} from './search-config.store';
import { SearchConfigInfo } from './generated';
import { advancedViewMode, basicViewMode } from './constants';

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

  let mockSearchConfigStoreTopic: FakeTopic<SearchConfigMessage>;

  beforeEach(() => {
    mockSearchConfigStoreTopic = new FakeTopic<SearchConfigMessage>();
    TestBed.configureTestingModule({
      imports: [],
      providers: [],
    });

    store = new SearchConfigStore(
      'store-1',
      mockSearchConfigStoreTopic as any as SearchConfigTopic,
    );

    secondStore = new SearchConfigStore(
      'store-2',
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

    it('should send update message', (done) => {
      store.patchState({});

      store.setPageName('my-page');

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.stateToUpdate).toStrictEqual({
          pageName: 'my-page',
        });
        done();
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
        expect(msg.payload.stateToUpdate).toStrictEqual({
          customGroupKey: 'custom-key',
        });
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

    it('should send update message', (done) => {
      store.patchState({});

      store.setSearchConfigs([testConfigBase, testConfigOnlyValues]);

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.stateToUpdate).toStrictEqual({
          searchConfigs: [testConfigBase, testConfigOnlyValues],
        });
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
        expect(msg.payload.stateToUpdate).toStrictEqual({
          nonSearchConfigGroupKeys: ['default', 'extended'],
        });
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
        expect(msg.payload.stateToUpdate).toStrictEqual({
          searchConfigs: [testConfigValuesAndColumns],
        });
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

    it('should send update message with minimal change', (done) => {
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
        expect(msg.payload.stateToUpdate).toStrictEqual({
          searchConfigs: [testConfigOnlyValues, testConfigValuesAndColumns],
        });
        done();
      });
    });

    it('should send update message with all changes', (done) => {
      store.patchState({
        currentSearchConfig: testConfigOnlyColumns,
        searchConfigs: [
          testConfigOnlyValues,
          testConfigValuesAndColumns,
          testConfigOnlyColumns,
        ],
        selectedGroupKey: testConfigOnlyColumns.name,
        customGroupKey: 'custom-key',
      });

      store.deleteSearchConfig(testConfigOnlyColumns);

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.stateToUpdate).toStrictEqual({
          searchConfigs: [testConfigOnlyValues, testConfigValuesAndColumns],
          currentSearchConfig: undefined,
          selectedGroupKey: 'custom-key',
        });
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

    it('should send update message with minimal changes', (done) => {
      store.patchState({
        currentSearchConfig: testConfigOnlyColumns,
        selectedGroupKey: testConfigOnlyColumns.name,
      });

      store.setCurrentConfig(testConfigOnlyColumns);

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.stateToUpdate).toStrictEqual({
          currentSearchConfig: testConfigOnlyColumns,
        });
        done();
      });
    });

    it('should send update message with all changes', (done) => {
      store.patchState({
        currentSearchConfig: testConfigBase,
      });

      store.setCurrentConfig(testConfigOnlyColumns);

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.stateToUpdate).toStrictEqual({
          currentSearchConfig: testConfigOnlyColumns,
          selectedGroupKey: testConfigOnlyColumns.name,
        });
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
        expect(msg.payload.stateToUpdate).toStrictEqual({
          searchConfigs: [
            {
              ...testConfigOnlyColumns,
              name: 'modified-test-only-columns',
            },
          ],
        });
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

    it('should send update message with minimal changes', (done) => {
      store.patchState({});

      store.setSelectedGroupKey('2');

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.stateToUpdate).toStrictEqual({
          selectedGroupKey: '2',
        });
        done();
      });
    });

    it('should send update message with all changes', (done) => {
      store.patchState({
        selectedGroupKey: testConfigBase.name,
        currentSearchConfig: testConfigBase,
      });

      store.setSelectedGroupKey('2');

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.stateToUpdate).toStrictEqual({
          selectedGroupKey: '2',
          currentSearchConfig: undefined,
        });
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

    it('should update data for dataToRevert$ selector', (done) => {
      store.patchState({
        dataToRevert: {
          fieldValues: {
            key: 'v',
          },
          displayedColumnsIds: ['col'],
          viewMode: basicViewMode,
          columnGroupKey: 'key',
        },
      });

      store.setEditMode();

      store.dataToRevert$.pipe(take(1)).subscribe((data) => {
        expect(data).toBe(undefined);
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
        expect(msg.payload.stateToUpdate).toStrictEqual({
          dataToRevert: undefined,
          editMode: true,
          inChargeOfEdit: 'store-1',
        });
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
        expect(msg.payload.stateToUpdate).toStrictEqual({
          editMode: false,
          inChargeOfEdit: '',
        });
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
        expect(msg.payload.stateToUpdate).toStrictEqual({
          preEditStateSnapshot: state,
        });
        done();
      });
    });
  });

  describe('revert page data', () => {
    it('should not update dataToRevert$ selector if snapshot not defined', () => {
      store.setState({} as any);

      store.revertData();

      store.dataToRevert$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should update dataToRevert$ selector with data for only columns config', (done) => {
      const state = {
        preEditStateSnapshot: {
          currentSearchConfig: testConfigOnlyColumns,
          fieldValues: {
            noConfigKey: 'val',
          },
          displayedColumnsIds: testConfigOnlyColumns.columns,
          viewMode: advancedViewMode,
          selectedGroupKey: testConfigOnlyColumns.name,
        },
      };
      store.setState(state as any);

      store.revertData();

      store.dataToRevert$.pipe(take(1)).subscribe((data) => {
        expect(data).toStrictEqual({
          fieldValues: state.preEditStateSnapshot.fieldValues,
          viewMode: state.preEditStateSnapshot.viewMode,
          displayedColumnsIds: testConfigOnlyColumns.columns,
          columnGroupKey: testConfigOnlyColumns.name,
        });
        done();
      });
    });

    it('should update dataToRevert$ selector with data for only values config', (done) => {
      const state = {
        preEditStateSnapshot: {
          currentSearchConfig: testConfigOnlyValues,
          fieldValues: testConfigOnlyValues.values,
          displayedColumnsIds: ['no-config-col'],
          viewMode: testConfigOnlyValues.isAdvanced
            ? advancedViewMode
            : basicViewMode,
          selectedGroupKey: 'def-key',
        },
      };
      store.setState(state as any);

      store.revertData();

      store.dataToRevert$.pipe(take(1)).subscribe((data) => {
        expect(data).toStrictEqual({
          fieldValues: testConfigOnlyValues.values,
          viewMode: testConfigOnlyValues.isAdvanced
            ? advancedViewMode
            : basicViewMode,
          displayedColumnsIds: state.preEditStateSnapshot.displayedColumnsIds,
          columnGroupKey: state.preEditStateSnapshot.selectedGroupKey,
        });
        done();
      });
    });

    it('should update currentConfig$ when other config was chosen before edit', (done) => {
      const state = {
        preEditStateSnapshot: {
          currentSearchConfig: testConfigOnlyValues,
        },
        currentSearchConfig: testConfigOnlyColumns,
      };
      store.setState(state as any);

      store.revertData();

      store.currentConfig$.pipe(take(1)).subscribe((config) => {
        expect(config).toBe(testConfigOnlyValues);
        done();
      });
    });

    it('should update currentConfig$ when config undefined ', (done) => {
      const state = {
        preEditStateSnapshot: {
          currentSearchConfig: undefined,
        },
        currentSearchConfig: testConfigOnlyColumns,
      };
      store.setState(state as any);

      store.revertData();

      store.currentConfig$.pipe(take(1)).subscribe((config) => {
        expect(config).toBe(undefined);
        done();
      });
    });

    it('should not update currentConfig$ when same config was chosen before edit ', () => {
      const state = {
        preEditStateSnapshot: {
          currentSearchConfig: testConfigOnlyColumns,
        },
        currentSearchConfig: testConfigOnlyColumns,
      };
      store.setState(state as any);

      store.revertData();

      store.currentConfig$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    describe('on no config saved', () => {
      it('should update selectedGroupKey$ selector with snapshot value on config with columns edit', (done) => {
        const state = {
          preEditStateSnapshot: {
            currentSearchConfig: undefined,
            selectedGroupKey: 'preEditVal',
          },
          currentSearchConfig: testConfigOnlyColumns,
          selectedGroupKey: testConfigOnlyColumns.name,
          customGroupKey: 'custom',
        };

        store.setState(state as any);

        store.revertData();

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe('preEditVal');
          done();
        });
      });

      it('should not update selectedGroupKey$ selector on config with values edit', () => {
        const state = {
          preEditStateSnapshot: {
            currentSearchConfig: undefined,
            selectedGroupKey: 'preEditVal',
          },
          currentSearchConfig: testConfigOnlyValues,
          selectedGroupKey: 'preEditVal',
          customGroupKey: 'custom',
        };

        store.setState(state as any);

        store.revertData();

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('on only columns config saved', () => {
      it('should update selectedGroupKey$ selector with snapshot value on config with no columns edit', (done) => {
        const state = {
          preEditStateSnapshot: {
            currentSearchConfig: testConfigOnlyColumns,
            selectedGroupKey: testConfigOnlyColumns.name,
          },
          currentSearchConfig: testConfigOnlyValues,
          selectedGroupKey: 'custom',
          customGroupKey: 'custom',
        };

        store.setState(state as any);

        store.revertData();

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe(testConfigOnlyColumns.name);
          done();
        });
      });

      it('should update selectedGroupKey$ selector on config with columns edit', (done) => {
        const state = {
          preEditStateSnapshot: {
            currentSearchConfig: testConfigOnlyColumns,
            selectedGroupKey: testConfigOnlyColumns.name,
          },
          currentSearchConfig: testConfigValuesAndColumns,
          selectedGroupKey: testConfigValuesAndColumns.name,
          customGroupKey: 'custom',
        };

        store.setState(state as any);

        store.revertData();

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe(testConfigOnlyColumns.name);
          done();
        });
      });

      it('should not update selectedGroupKey$ selector when edited config was saved', () => {
        const state = {
          preEditStateSnapshot: {
            currentSearchConfig: testConfigOnlyColumns,
            selectedGroupKey: testConfigOnlyColumns.name,
          },
          currentSearchConfig: testConfigOnlyColumns,
          selectedGroupKey: testConfigOnlyColumns.name,
          customGroupKey: 'custom',
        };

        store.setState(state as any);

        store.revertData();

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    describe('on only values config saved', () => {
      it('should not update selectedGroupKey$ selector with snapshot value on config with no columns edit', () => {
        const state = {
          preEditStateSnapshot: {
            currentSearchConfig: testConfigOnlyValues,
            selectedGroupKey: 'preEditVal',
          },
          currentSearchConfig: testConfigOnlyValues,
          selectedGroupKey: 'preEditVal',
          customGroupKey: 'custom',
        };

        store.setState(state as any);

        store.revertData();

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update selectedGroupKey$ selector on config with columns edit', (done) => {
        const state = {
          preEditStateSnapshot: {
            currentSearchConfig: testConfigOnlyValues,
            selectedGroupKey: 'preEditVal',
          },
          currentSearchConfig: testConfigValuesAndColumns,
          selectedGroupKey: testConfigValuesAndColumns.name,
          customGroupKey: 'custom',
        };

        store.setState(state as any);

        store.revertData();

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe('preEditVal');
          done();
        });
      });
    });

    describe('on values and columns config saved', () => {
      it('should update selectedGroupKey$ selector with snapshot value on config with no columns edit', (done) => {
        const state = {
          preEditStateSnapshot: {
            currentSearchConfig: testConfigValuesAndColumns,
            selectedGroupKey: testConfigValuesAndColumns.name,
          },
          currentSearchConfig: testConfigOnlyValues,
          selectedGroupKey: 'custom',
          customGroupKey: 'custom',
        };

        store.setState(state as any);

        store.revertData();

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe(testConfigValuesAndColumns.name);
          done();
        });
      });

      it('should update selectedGroupKey$ selector on config with columns edit', (done) => {
        const state = {
          preEditStateSnapshot: {
            currentSearchConfig: testConfigValuesAndColumns,
            selectedGroupKey: testConfigValuesAndColumns.name,
          },
          currentSearchConfig: testConfigOnlyColumns,
          selectedGroupKey: testConfigOnlyColumns.name,
          customGroupKey: 'custom',
        };

        store.setState(state as any);

        store.revertData();

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe(testConfigValuesAndColumns.name);
          done();
        });
      });

      it('should not update selectedGroupKey$ selector when edited config was saved', () => {
        const state = {
          preEditStateSnapshot: {
            currentSearchConfig: testConfigValuesAndColumns,
            selectedGroupKey: testConfigValuesAndColumns.name,
          },
          currentSearchConfig: testConfigValuesAndColumns,
          selectedGroupKey: testConfigValuesAndColumns.name,
          customGroupKey: 'custom',
        };

        store.setState(state as any);

        store.revertData();

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });
    });

    it('should update currentConfig$ when same config was chosen before edit ', () => {
      const state = {
        preEditStateSnapshot: {
          currentSearchConfig: testConfigOnlyValues,
          selectedGroupKey: 'default',
        },
        currentSearchConfig: testConfigOnlyColumns,
      };
      store.setState(state as any);

      store.revertData();

      store.currentConfig$.pipe(take(1)).subscribe(() => {
        fail();
      });
    });

    it('should send update message', (done) => {
      store.setState({
        preEditStateSnapshot: {
          currentSearchConfig: undefined,
          fieldValues: {
            k: 'v',
          },
          displayedColumnsIds: ['c'],
          viewMode: basicViewMode,
          selectedGroupKey: 'default',
        },
        effectiveSearchData: {},
      } as any);

      store.revertData();

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.stateToUpdate).toStrictEqual({
          dataToRevert: {
            fieldValues: {
              k: 'v',
            },
            displayedColumnsIds: ['c'],
            viewMode: basicViewMode,
            columnGroupKey: 'default',
          },
          currentSearchConfig: undefined,
          selectedGroupKey: 'default',
          effectiveSearchData: {
            fieldValues: {
              k: 'v',
            },
            displayedColumnsIds: ['c'],
            viewMode: basicViewMode,
          },
        });
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

        store.currentPageData$.pipe(take(1)).subscribe((data) => {
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

        store.currentPageData$.pipe(take(1)).subscribe(() => {
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

    it('should send update message with minimal changes', (done) => {
      store.patchState({
        ...initialState,
        fieldValues: {
          key: 'v1',
        },
      });

      store.updateFieldValues({
        key: 'v2',
      });

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.stateToUpdate).toStrictEqual({
          fieldValues: {
            key: 'v2',
          },
          effectiveSearchData: {
            ...initialState.effectiveSearchData,
            fieldValues: {
              key: 'v2',
            },
          },
        });
        done();
      });
    });

    it('should send update message with all changes', (done) => {
      store.patchState({
        ...initialState,
        currentSearchConfig: testConfigBase,
        selectedGroupKey: testConfigBase.name,
        searchConfigs: [testConfigBase],
        fieldValues: {
          ...testConfigBase.values,
        },
        customGroupKey: 'custom-key',
      });

      store.updateFieldValues({
        ...testConfigBase.values,
        notInConfig: 'v2',
      });

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.stateToUpdate).toStrictEqual({
          fieldValues: {
            ...testConfigBase.values,
            notInConfig: 'v2',
          },
          currentSearchConfig: undefined,
          selectedGroupKey: 'custom-key',
          effectiveSearchData: {
            ...initialState.effectiveSearchData,
            fieldValues: {
              ...testConfigBase.values,
              notInConfig: 'v2',
            },
          },
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

        store.currentPageData$.pipe(take(1)).subscribe((data) => {
          expect(data.displayedColumnsIds).toStrictEqual(['col_2']);
          done();
        });
      });

      it('should not update if columns did not change', () => {
        store.patchState({
          displayedColumnsIds: ['col_1'],
        });

        store.updateDisplayedColumnsIds(['col_1']);

        store.currentPageData$.pipe(take(1)).subscribe(() => {
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

    it('should send update message with minimal changes', (done) => {
      store.patchState({
        ...initialState,
        displayedColumnsIds: ['col_1', 'col_2'],
      });

      store.updateDisplayedColumnsIds(['col_2']);

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.stateToUpdate).toStrictEqual({
          displayedColumnsIds: ['col_2'],
          effectiveSearchData: {
            ...initialState.effectiveSearchData,
            displayedColumnsIds: ['col_2'],
          },
        });
        done();
      });
    });

    it('should send update message with all changes', (done) => {
      store.patchState({
        ...initialState,
        currentSearchConfig: testConfigBase,
        selectedGroupKey: testConfigBase.name,
        searchConfigs: [testConfigBase],
        displayedColumnsIds: testConfigBase.columns,
        customGroupKey: 'custom-key',
      });

      store.updateDisplayedColumnsIds([
        ...testConfigBase.columns,
        'new-col-not-in-config',
      ]);

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.stateToUpdate).toStrictEqual({
          displayedColumnsIds: [
            ...testConfigBase.columns,
            'new-col-not-in-config',
          ],
          currentSearchConfig: undefined,
          selectedGroupKey: 'custom-key',
          effectiveSearchData: {
            ...initialState.effectiveSearchData,
            displayedColumnsIds: [
              ...testConfigBase.columns,
              'new-col-not-in-config',
            ],
          },
        });
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

        store.currentPageData$.pipe(take(1)).subscribe((data) => {
          expect(data.viewMode).toStrictEqual(basicViewMode);
          done();
        });
      });

      it('should not update if columns did not change', () => {
        store.patchState({
          viewMode: advancedViewMode,
        });

        store.updateViewMode(advancedViewMode);

        store.currentPageData$.pipe(take(1)).subscribe(() => {
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

    it('should send update message with all changes', (done) => {
      store.patchState({
        ...initialState,
        currentSearchConfig: testConfigBase,
        selectedGroupKey: testConfigBase.name,
        searchConfigs: [testConfigBase],
        viewMode: testConfigBase.isAdvanced ? advancedViewMode : basicViewMode,
        customGroupKey: 'custom-key',
      });

      store.updateViewMode(
        testConfigBase.isAdvanced ? basicViewMode : advancedViewMode,
      );

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.stateToUpdate).toStrictEqual({
          currentSearchConfig: undefined,
          selectedGroupKey: 'custom-key',
          viewMode: testConfigBase.isAdvanced
            ? basicViewMode
            : advancedViewMode,
          effectiveSearchData: {
            ...initialState.effectiveSearchData,
            viewMode: testConfigBase.isAdvanced
              ? basicViewMode
              : advancedViewMode,
          },
        });
        done();
      });
    });

    it('should send update message with minimal changes', (done) => {
      store.patchState({
        ...initialState,
        viewMode: advancedViewMode,
      });

      store.updateViewMode(basicViewMode);

      mockSearchConfigStoreTopic.subscribe((msg) => {
        expect(msg.payload.storeName).toBe('store-1');
        expect(msg.payload.stateToUpdate).toStrictEqual({
          viewMode: basicViewMode,
          effectiveSearchData: {
            ...initialState.effectiveSearchData,
            viewMode: basicViewMode,
          },
        });
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
    it('should take state snapshot', (done) => {
      const stateBeforeEditMode = {
        ...initialState,
        currentSearchConfig: testConfigBase,
        selectedGroupKey: testConfigBase.name,
      };
      store.patchState(stateBeforeEditMode);

      store.enterEditMode(testConfigValuesAndColumns);

      store.preEditStateSnapshot$.pipe(take(1)).subscribe((snapshot) => {
        expect(snapshot).toStrictEqual(stateBeforeEditMode);
        done();
      });
    });

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
        expect(vm.selectedGroupKey).toStrictEqual(
          testConfigValuesAndColumns.name,
        );
        expect(vm.editMode).toBe(true);
        done();
      });
    });
  });

  describe('cancelEdit effect', () => {
    const initState = {
      ...initialState,
      editMode: true,
      inChargeOfEdit: 'store-1',
    };
    it('should cancel editMode', (done) => {
      store.patchState(initState);

      store.cancelEdit();

      store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.editMode).toBeFalsy();
        expect(vm.isInChargeOfEdit).toBe(false);
        done();
      });
    });
  });

  describe('saveEdit effect', () => {
    it('should edit config in config list and cancel edit mode', (done) => {
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
        expect(vm.selectedGroupKey).toBe('new-name-for-config');
        done();
      });
    });

    it('should update currentConfig$ selector on any edit', (done) => {
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

      store.currentConfig$.pipe(take(1)).subscribe((config) => {
        expect(config).toStrictEqual({
          ...testConfigValuesAndColumns,
          name: 'new-name-for-config',
        });
        done();
      });
    });

    describe('edit only values config', () => {
      it('should not update selectedGroupKey$ selector if columns still empty', () => {
        store.patchState({
          currentSearchConfig: testConfigOnlyValues,
          searchConfigs: [
            testConfigValuesAndColumns,
            testConfigOnlyValues,
            testConfigOnlyColumns,
          ],
          selectedGroupKey: 'default',
          nonSearchConfigGroupKeys: ['default'],
          editMode: true,
        });

        store.saveEdit({
          ...testConfigOnlyValues,
          columns: [],
        });

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update selectedGroupKey$ selector if columns added to config', (done) => {
        store.patchState({
          currentSearchConfig: testConfigOnlyValues,
          searchConfigs: [
            testConfigValuesAndColumns,
            testConfigOnlyValues,
            testConfigOnlyColumns,
          ],
          selectedGroupKey: 'default',
          nonSearchConfigGroupKeys: ['default'],
          editMode: true,
        });

        store.saveEdit({
          ...testConfigOnlyValues,
          columns: testConfigValuesAndColumns.columns,
        });

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe(testConfigOnlyValues.name);
          done();
        });
      });
    });

    describe('edit only columns config', () => {
      it('should not update selectedGroupKey$ selector if columns still defined', () => {
        store.patchState({
          currentSearchConfig: testConfigOnlyColumns,
          searchConfigs: [
            testConfigValuesAndColumns,
            testConfigOnlyValues,
            testConfigOnlyColumns,
          ],
          selectedGroupKey: testConfigOnlyColumns.name,
          nonSearchConfigGroupKeys: ['default'],
          editMode: true,
          customGroupKey: 'custom',
        });

        store.saveEdit({
          ...testConfigOnlyColumns,
          columns: ['any-col'],
        });

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update selectedGroupKey$ selector if columns removed', (done) => {
        store.patchState({
          currentSearchConfig: testConfigOnlyColumns,
          searchConfigs: [
            testConfigValuesAndColumns,
            testConfigOnlyValues,
            testConfigOnlyColumns,
          ],
          selectedGroupKey: testConfigOnlyColumns.name,
          nonSearchConfigGroupKeys: ['default'],
          editMode: true,
          customGroupKey: 'custom',
        });

        store.saveEdit({
          ...testConfigOnlyColumns,
          values: testConfigOnlyValues.values,
          columns: [],
        });

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe('custom');
          done();
        });
      });
    });

    describe('edit values and columns config', () => {
      it('should not update selectedGroupKey$ selector if columns still defined', () => {
        store.patchState({
          currentSearchConfig: testConfigValuesAndColumns,
          searchConfigs: [
            testConfigValuesAndColumns,
            testConfigOnlyValues,
            testConfigOnlyColumns,
          ],
          selectedGroupKey: testConfigValuesAndColumns.name,
          nonSearchConfigGroupKeys: ['default'],
          editMode: true,
          customGroupKey: 'custom',
        });

        store.saveEdit({
          ...testConfigValuesAndColumns,
          columns: ['any-col'],
        });

        store.selectedGroupKey$.pipe(take(1)).subscribe(() => {
          fail();
        });
      });

      it('should update selectedGroupKey$ selector if columns removed', (done) => {
        store.patchState({
          currentSearchConfig: testConfigValuesAndColumns,
          searchConfigs: [
            testConfigValuesAndColumns,
            testConfigOnlyValues,
            testConfigOnlyColumns,
          ],
          selectedGroupKey: testConfigValuesAndColumns.name,
          nonSearchConfigGroupKeys: ['default'],
          editMode: true,
          customGroupKey: 'custom',
        });

        store.saveEdit({
          ...testConfigValuesAndColumns,
          values: testConfigOnlyValues.values,
          columns: [],
        });

        store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
          expect(key).toBe('custom');
          done();
        });
      });
    });
  });

  describe('storeUpdate effect', () => {
    it('should update state accordingly to the payload', (done) => {
      const spy = jest.spyOn(secondStore, 'patchState');

      store.setSearchConfigs([testConfigBase, testConfigOnlyValues]);

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initialState,
          searchConfigs: [testConfigBase, testConfigOnlyValues],
        });
        done();
      });
    });

    it('should not update selectedGroupKey if its empty', (done) => {
      secondStore.patchState({
        ...initialState,
        selectedGroupKey: 'my-key',
      });
      const spy = jest.spyOn(secondStore, 'patchState');

      store.setSelectedGroupKey('');

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initialState,
          selectedGroupKey: 'my-key',
        });
        done();
      });
    });
  });
});
