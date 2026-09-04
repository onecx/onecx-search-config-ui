import { TestBed } from '@angular/core/testing';
import { take } from 'rxjs';

import { FakeTopic } from '@onecx/angular-integration-interface/mocks';

import {
  SearchConfigMessage,
  SearchConfigState,
  SearchConfigStore,
  SearchConfigTopic,
  initialState,
} from './search-config.store';
import { SearchConfigInfo } from './generated';
import {
  advancedViewMode,
  basicViewMode,
  columngGroupSelectionStoreName,
  searchConfigStoreName,
} from './constants';

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

  describe('activate store', () => {
    it('should update isSearchConfigComponentActive$ selector on change for search config store', (done) => {
      store.patchState({});

      store.activateStore(searchConfigStoreName);

      store.isSearchConfigComponentActive$
        .pipe(take(1))
        .subscribe((isActive) => {
          expect(isActive).toBeTruthy();
          done();
        });
    });
  });

  describe('deactivate column group store', () => {
    it('should update isColumnGroupComponentActive$ selector', (done) => {
      store.patchState({
        columnGroupComponentActive: true,
      });

      store.deactivateColumnGroupStore();

      store.isColumnGroupComponentActive$
        .pipe(take(1))
        .subscribe((isActive) => {
          expect(isActive).toBeFalsy();
          done();
        });
    });
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
  });

  describe('add search config', () => {
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
        columnGroupComponentActive: true,
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
  });

  describe('set search config', () => {
    it('should not update currentConfig$ selector in edit mode', () => {
      store.patchState({
        currentSearchConfig: testConfigBase,
        editMode: true,
      });

      store.setCurrentConfig(testConfigOnlyColumns);

      store.currentConfig$.pipe(take(1)).subscribe((config) => {
        expect(config).toBe(testConfigBase);
      });
    });

    it('should update if config has only values and key is search config', (done) => {
      store.patchState({
        searchConfigs: [testConfigOnlyValues, testConfigOnlyColumns],
        currentSearchConfig: testConfigOnlyColumns,
        selectedGroupKey: testConfigOnlyColumns.name,
        customGroupKey: 'custom-key',
        columnGroupComponentActive: true,
      });

      store.setCurrentConfig(testConfigOnlyValues);

      store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
        expect(key).toBe('custom-key');
        done();
      });
    });
  });

  describe('set selected group key', () => {
    describe('columnSelectionVm$ selector', () => {
      it('should update if config and selected key for config was set and new key is predefined', (done) => {
        store.patchState({
          selectedGroupKey: testConfigValuesAndColumns.name,
          currentSearchConfig: testConfigValuesAndColumns,
          nonSearchConfigGroupKeys: ['default'],
          searchConfigs: [testConfigValuesAndColumns],
          searchConfigComponentActive: true,
        });

        store.setSelectedGroupKey('default');

        store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.currentConfig).toBeUndefined();
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
          searchConfigComponentActive: true,
        });

        store.setSelectedGroupKey('custom-key');

        store.columnSelectionVm$.pipe(take(1)).subscribe((vm) => {
          expect(vm.currentConfig).toBeUndefined();
          done();
        });
      });
    });

    describe('currentConfig$ selector', () => {
      it('should not update in edit mode', (done) => {
        store.patchState({
          editMode: true,
        });

        store.setSelectedGroupKey('any');

        store.currentConfig$.pipe(take(1)).subscribe((config) => {
          expect(config).toBeUndefined();
          done();
        });
      });

      it('should update if only values config was selected and new key is search config', (done) => {
        store.patchState({
          selectedGroupKey: 'default',
          currentSearchConfig: testConfigOnlyValues,
          nonSearchConfigGroupKeys: ['default'],
          searchConfigs: [testConfigOnlyValues, testConfigOnlyColumns],
          searchConfigComponentActive: true,
        });

        store.setSelectedGroupKey(testConfigOnlyColumns.name);

        store.currentConfig$.pipe(take(1)).subscribe((config) => {
          expect(config).toStrictEqual(testConfigOnlyColumns);
          done();
        });
      });
    });
  });

  describe('revert page data', () => {
    it('should not update dataToRevert$ selector if snapshot not defined', () => {
      store.setState({} as any);

      store.revertData();

      store.dataToRevert$.pipe(take(1)).subscribe((dataToRevert) => {
        expect(dataToRevert).toBeUndefined();
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
        expect(config).toBeUndefined();
        done();
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

    it('should update currentConfig$ when same config was chosen before edit', (done) => {
      const state = {
        preEditStateSnapshot: {
          currentSearchConfig: testConfigOnlyValues,
          selectedGroupKey: 'default',
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
          columnGroupComponentActive: true,
        },
        displayedSearchData: {},
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
          displayedSearchData: {
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
        ...testConfigBase.values,
        key: 'v2',
      });

      store.selectedGroupKey$.pipe(take(1)).subscribe((selectedGroupKey) => {
        expect(selectedGroupKey).toBe('deafult-key');
      });
    });

    it('should not update if config with only inputs is unset', (done) => {
      store.patchState({
        fieldValues: {
          ...testConfigOnlyValues.values,
        },
        currentSearchConfig: testConfigOnlyValues,
        selectedGroupKey: 'default-key',
      });

      store.updateFieldValues({
        ...testConfigOnlyValues.values,
        key_1: 'val_1-update',
      });

      store.selectedGroupKey$.pipe(take(1)).subscribe((key) => {
        expect(key).toBe('default-key');
        done();
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
        columnGroupComponentActive: true,
      });

      store.updateFieldValues({
        ...testConfigValuesAndColumns.values,
        key_1: 'val_1-update',
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
        ...testConfigOnlyValues.values,
      });

      store.currentConfig$.pipe(take(1)).subscribe((config) => {
        expect(config).toBe(testConfigOnlyValues);
      });
    });
  });

  describe('update displayed columns', () => {
    describe('currentConfig$ selector', () => {
      it('should unset config if current config has colums not equal to new ones', (done) => {
        store.patchState({
          displayedColumnsIds: testConfigValuesAndColumns.columns,
          currentSearchConfig: testConfigValuesAndColumns,
          columnGroupComponentActive: true,
        });

        store.updateDisplayedColumnsIds(['col_2']);

        store.currentConfig$.pipe(take(1)).subscribe((config) => {
          expect(config).toBeUndefined();
          done();
        });
      });
    });

    describe('selectedGroupKey$ selector', () => {
      it('should not update if config with only inputs is unset', () => {
        store.patchState({
          displayedColumnsIds: testConfigOnlyValues.columns,
          currentSearchConfig: testConfigOnlyValues,
          selectedGroupKey: 'default-key',
        });

        store.updateDisplayedColumnsIds([...testConfigBase.columns, 'newCol']);

        store.selectedGroupKey$.pipe(take(1)).subscribe((selectedGroupKey) => {
          expect(selectedGroupKey).toBe('default-key');
        });
      });

      it('should update if config with both inputs and columns is unset', (done) => {
        store.patchState({
          searchConfigs: [testConfigValuesAndColumns],
          displayedColumnsIds: testConfigValuesAndColumns.columns,
          currentSearchConfig: testConfigValuesAndColumns,
          selectedGroupKey: testConfigValuesAndColumns.name,
          customGroupKey: 'custom-key',
          columnGroupComponentActive: true,
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

        store.currentConfig$.pipe(take(1)).subscribe((config) => {
          expect(config).toBe(testConfigOnlyValues);
        });
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
    });

    describe('selectedGroupKey$ selector', () => {
      it('should not update in edit mode', (done) => {
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

        store.selectedGroupKey$.pipe(take(1)).subscribe((selectedGroupKey) => {
          expect(selectedGroupKey).toBe('deafult-key');
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

        store.currentConfig$.pipe(take(1)).subscribe((config) => {
          expect(config).toBe(testConfigOnlyValues);
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
        columnGroupComponentActive: true,
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
          displayedSearchData: {
            fieldValues: undefined,
            displayedColumnsIds: [],
            viewMode: testConfigBase.isAdvanced
              ? basicViewMode
              : advancedViewMode,
          },
        });
        done();
      });
    });
  });

  describe('update layout', () => {
    it('should not update if layout did not change', () => {
      store.patchState({
        ...initialState,
        layout: 'table',
      });

      store.updateLayout('table');

      store.searchConfigVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm).toBeDefined();
      });
    });

    it('should update if layout changed', (done) => {
      store.patchState({
        ...initialState,
        layout: 'table',
      });

      store.updateLayout('grid');

      store.searchConfigVm$.pipe(take(1)).subscribe((vm) => {
        expect(vm.layout).toBe('grid');
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
        expect(vm.allGroupKeys).toHaveLength(3);
        expect(vm.allGroupKeys.includes('1')).toBeTruthy();
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
        columnGroupComponentActive: true,
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

        store.selectedGroupKey$.pipe(take(1)).subscribe((selectedGroupKey) => {
          expect(selectedGroupKey).toBe('default');
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
  });

  describe('state sync', () => {
    beforeEach(() => {
      store.ngOnDestroy();
      secondStore.ngOnDestroy();

      store = new SearchConfigStore(
        searchConfigStoreName,
        mockSearchConfigStoreTopic as any as SearchConfigTopic,
      );

      secondStore = new SearchConfigStore(
        columngGroupSelectionStoreName,
        mockSearchConfigStoreTopic as any as SearchConfigTopic,
      );
    });

    it('should send whole state from column group store if search config is not active', () => {
      const spy = jest.spyOn(mockSearchConfigStoreTopic, 'publish');
      secondStore.sendUpdateMessage(
        {
          customGroupKey: 'new-custom',
        },
        {
          searchConfigComponentActive: false,
          customGroupKey: 'custom',
          layout: 'grid',
        } as SearchConfigState,
      );

      expect(spy).toHaveBeenCalledWith({
        payload: {
          storeName: columngGroupSelectionStoreName,
          stateToUpdate: {
            customGroupKey: 'new-custom',
            searchConfigComponentActive: false,
            layout: 'grid',
          },
          wholeState: true,
        },
      });
    });

    it('should send partial state from search config store if column group is active', () => {
      const spy = jest.spyOn(mockSearchConfigStoreTopic, 'publish');
      store.sendUpdateMessage(
        {
          pageName: 'newPageName',
        },
        {
          columnGroupComponentActive: true,
          pageName: 'pageName',
          viewMode: advancedViewMode,
        } as SearchConfigState,
      );

      expect(spy).toHaveBeenCalledWith({
        payload: {
          storeName: searchConfigStoreName,
          stateToUpdate: {
            pageName: 'newPageName',
          },
          wholeState: false,
        },
      });
    });

    it('should update whole state for search config store', (done) => {
      const spy = jest.spyOn(store, 'patchState');

      secondStore.sendUpdateMessage(
        {
          selectedGroupKey: 'skey',
        },
        {
          ...initialState,
          selectedGroupKey: 's',
          customGroupKey: 'c',
          displayedColumnsIds: ['c1'],
          layout: 'grid',
          nonSearchConfigGroupKeys: ['d'],
          displayedSearchData: {
            displayedColumnsIds: ['c1'],
            fieldValues: undefined,
            viewMode: undefined,
          },
        } as SearchConfigState,
      );

      store.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initialState,
          columnGroupComponentActive: true,
          searchConfigComponentActive: true,
          selectedGroupKey: 'skey',
          customGroupKey: 'c',
          displayedColumnsIds: ['c1'],
          layout: 'grid',
          nonSearchConfigGroupKeys: ['d'],
          displayedSearchData: {
            displayedColumnsIds: ['c1'],
            fieldValues: undefined,
            viewMode: undefined,
          },
        });
        done();
      });
    });

    it('should update whole state for column group store', (done) => {
      const spy = jest.spyOn(secondStore, 'patchState');

      store.sendUpdateMessage(
        {
          pageName: 'pName',
        },
        {
          ...initialState,
          pageName: 'p',
          fieldValues: {
            k: 'v',
          },
          viewMode: advancedViewMode,
          searchConfigs: [testConfigBase],
          currentSearchConfig: testConfigBase,
          displayedSearchData: {
            displayedColumnsIds: [],
            fieldValues: {
              k: 'v',
            },
            viewMode: advancedViewMode,
          },
        } as SearchConfigState,
      );

      secondStore.state$.pipe(take(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          ...initialState,
          columnGroupComponentActive: true,
          searchConfigComponentActive: true,
          pageName: 'pName',
          fieldValues: {
            k: 'v',
          },
          viewMode: advancedViewMode,
          searchConfigs: [testConfigBase],
          currentSearchConfig: testConfigBase,
          displayedSearchData: {
            displayedColumnsIds: [],
            fieldValues: {
              k: 'v',
            },
            viewMode: advancedViewMode,
          },
        });
        done();
      });
    });
  });
});
