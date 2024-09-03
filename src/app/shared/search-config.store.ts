import { Inject, Injectable, InjectionToken } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, filter, tap, withLatestFrom } from 'rxjs';
import { SearchConfigInfo } from 'src/app/shared/generated';
import {
  advancedViewMode,
  advancedViewModeType,
  basicViewMode,
  basicViewModeType,
} from './constants';
import {
  areColumnsEqual,
  areValuesEqual,
  hasColumns,
  hasOnlyColumns,
  hasOnlyValues,
  hasValues,
} from './search-config.utils';
import {
  SEARCH_CONFIG_STORE_TOPIC,
  SearchConfigTopic,
} from '@onecx/integration-interface';

export type FieldValues = { [key: string]: unknown };
export type PageData = {
  pageName: string;
  fieldValues: FieldValues;
  viewMode: basicViewModeType | advancedViewModeType;
  displayedColumIds: Array<string>;
  columnGroupKey: string;
};

export interface SearchConfigState {
  pageName: string;
  nonSearchConfigGroupKeys: Array<string>;
  customGroupKey: string;

  fieldValues: FieldValues;
  displayedColumns: Array<string>;
  viewMode: basicViewModeType | advancedViewModeType;

  searchConfigs: SearchConfigInfo[];
  currentSearchConfig: SearchConfigInfo | undefined;
  selectedGroupKey: string;

  isInChargeOfEdit: boolean;
  editMode: boolean;
  preEditStateSnapshot: SearchConfigState | undefined;
  pageDataToRevert: PageData | undefined;
}

export interface SearchConfigViewModel {
  pageName: string;
  searchConfigs: SearchConfigInfo[];
  currentConfig: SearchConfigInfo | undefined;

  editMode: boolean;
  isInChargeOfEdit: boolean;
}

export interface ColumnSelectionViewModel {
  nonSearchConfigGroupKeys: Array<string>;
  customGroupKey: string;

  allGroupKeys: Array<string>;
  searchConfigsOnlyColumns: SearchConfigInfo[];
  searchConfigsWithColumns: SearchConfigInfo[];
  selectedGroupKey: string;
  currentConfig: SearchConfigInfo | undefined;

  editMode: boolean;
  isInChargeOfEdit: boolean;
}

export const SEARCH_CONFIG_STORE_NAME = new InjectionToken<string>(
  'searchConfigStoreName',
);

@Injectable()
export class SearchConfigStore extends ComponentStore<SearchConfigState> {
  constructor(
    @Inject(SEARCH_CONFIG_STORE_TOPIC)
    public searchConfigTopic$: SearchConfigTopic,
    @Inject(SEARCH_CONFIG_STORE_NAME)
    private storeName: string,
  ) {
    super({
      pageName: '',
      nonSearchConfigGroupKeys: [],
      customGroupKey: '',

      fieldValues: {},
      displayedColumns: [],
      viewMode: basicViewMode,

      searchConfigs: [],
      currentSearchConfig: undefined,
      selectedGroupKey: '',

      isInChargeOfEdit: false,
      editMode: false,
      preEditStateSnapshot: undefined,
      pageDataToRevert: undefined,
    });
    this.sendUpdateMessage('newStore', {});
  }

  // *********** Updaters *********** //

  readonly setPageName = this.updater((state, newPageName: string) => ({
    ...state,
    pageName: newPageName,
  }));

  readonly setCustomGroupKey = this.updater(
    (
      state,
      {
        customGroupKey,
        updateStores = true,
      }: { customGroupKey: string; updateStores?: boolean },
    ) => {
      updateStores &&
        this.sendUpdateMessage('setCustomGroupKey', {
          customGroupKey: customGroupKey,
        });
      return { ...state, customGroupKey: customGroupKey };
    },
  );

  readonly setSearchConfigs = this.updater(
    (
      state,
      {
        searchConfigs,
        updateStores = true,
      }: { searchConfigs: SearchConfigInfo[]; updateStores?: boolean },
    ) => {
      updateStores &&
        this.sendUpdateMessage('setSearchConfigs', {
          searchConfigs: searchConfigs,
        });

      const searchConfigActive =
        (state.editMode
          ? state.currentSearchConfig
          : searchConfigs.find(
              (config) => config.name === state.currentSearchConfig?.name,
            )) !== undefined;
      const selectedKeyActive =
        (state.editMode
          ? state.selectedGroupKey
          : state.nonSearchConfigGroupKeys
                .concat([state.customGroupKey])
                .includes(state.selectedGroupKey)
            ? state.selectedGroupKey
            : searchConfigs.find(
                (config) => config.name === state.selectedGroupKey,
              )) !== undefined;
      return {
        ...state,
        selectedGroupKey: selectedKeyActive
          ? state.selectedGroupKey
          : state.customGroupKey,
        currentSearchConfig: searchConfigActive
          ? state.currentSearchConfig
          : undefined,
        searchConfigs: searchConfigs,
      };
    },
  );

  readonly setNonSearchConfigGroupKeys = this.updater(
    (
      state,
      {
        nonSearchConfigGroupKeys,
        updateStores = true,
      }: { nonSearchConfigGroupKeys: Array<string>; updateStores?: boolean },
    ) => {
      updateStores &&
        this.sendUpdateMessage('setNonSearchConfigGroupKeys', {
          nonSearchConfigGroupKeys: nonSearchConfigGroupKeys,
        });
      return {
        ...state,
        nonSearchConfigGroupKeys: nonSearchConfigGroupKeys,
      };
    },
  );

  readonly addSearchConfig = this.updater(
    (
      state,
      {
        searchConfig,
        updateStores = true,
      }: { searchConfig: SearchConfigInfo; updateStores?: boolean },
    ) => {
      updateStores &&
        this.sendUpdateMessage('addSearchConfig', {
          searchConfig: searchConfig,
        });
      return {
        ...state,
        searchConfigs: state.searchConfigs.concat(searchConfig),
      };
    },
  );

  readonly deleteSearchConfig = this.updater(
    (
      state,
      {
        searchConfig,
        updateStores = true,
      }: { searchConfig: SearchConfigInfo; updateStores?: boolean },
    ) => {
      updateStores &&
        this.sendUpdateMessage('deleteSearchConfig', {
          searchConfig: searchConfig,
        });

      const currentSearchConfig =
        state.currentSearchConfig?.id === searchConfig.id
          ? undefined
          : state.currentSearchConfig;
      const selectedGroupKey = this.updateSelectedGroupKeyByConfig(
        state,
        currentSearchConfig,
      );
      return {
        ...state,
        currentSearchConfig: currentSearchConfig,
        selectedGroupKey: selectedGroupKey,
        searchConfigs: state.searchConfigs.filter(
          (config) => config.id !== searchConfig.id,
        ),
      };
    },
  );

  readonly setCurrentConfig = this.updater(
    (
      state,
      {
        config,
        updateStores = true,
      }: { config: SearchConfigInfo | undefined; updateStores?: boolean },
    ) => {
      if (state.editMode) return state;
      updateStores &&
        this.sendUpdateMessage('setCurrentConfig', {
          config: config,
        });
      const selectedGroupKey = this.updateSelectedGroupKeyByConfig(
        state,
        config,
      );
      return {
        ...state,
        currentSearchConfig: config,
        selectedGroupKey: selectedGroupKey,
      };
    },
  );

  readonly editSearchConfig = this.updater(
    (
      state,
      {
        searchConfig,
        updateStores = true,
      }: { searchConfig: SearchConfigInfo; updateStores?: boolean },
    ) => {
      updateStores &&
        this.sendUpdateMessage('editSearchConfig', {
          searchConfig: searchConfig,
        });
      return {
        ...state,
        searchConfigs: state.searchConfigs.map((config) =>
          config.id === searchConfig.id ? searchConfig : config,
        ),
      };
    },
  );

  readonly setSelectedGroupKey = this.updater(
    (
      state,
      {
        selectedGroupKey,
        updateStores = true,
      }: { selectedGroupKey: string; updateStores?: boolean },
    ) => {
      if (state.editMode) return state;
      updateStores &&
        this.sendUpdateMessage('setSelectedGroupKey', {
          selectedGroupKey: selectedGroupKey,
        });
      const currentConfig = this.updateConfigBySelectedGroupKey(
        state,
        selectedGroupKey,
      );

      return {
        ...state,
        currentSearchConfig: currentConfig,
        selectedGroupKey: selectedGroupKey,
      };
    },
  );

  readonly setEditMode = this.updater(
    (state, { updateStores = true }: { updateStores?: boolean }) => {
      updateStores && this.sendUpdateMessage('setEditMode', {});
      return {
        ...state,
        editMode: true,
        isInChargeOfEdit: updateStores ? true : false,
      };
    },
  );

  readonly cancelEditMode = this.updater(
    (state, { updateStores = true }: { updateStores?: boolean }) => {
      updateStores && this.sendUpdateMessage('cancelEditMode', {});
      return {
        ...state,
        editMode: false,
        isInChargeOfEdit: false,
      };
    },
  );

  readonly takeSnapshot = this.updater(
    (state, { updateStores = true }: { updateStores?: boolean }) => {
      updateStores && this.sendUpdateMessage('takeSnapshot', {});
      return {
        ...state,
        preEditStateSnapshot: state,
      };
    },
  );

  readonly revertPageData = this.updater(
    (state, { updateStores = true }: { updateStores?: boolean }) => {
      updateStores && this.sendUpdateMessage('revertPageData', {});
      return {
        ...state,
        pageDataToRevert: state.preEditStateSnapshot
          ? {
              pageName: state.preEditStateSnapshot?.pageName,
              fieldValues: state.preEditStateSnapshot?.fieldValues,
              displayedColumIds: state.preEditStateSnapshot?.displayedColumns,
              viewMode: state.preEditStateSnapshot?.viewMode,
              columnGroupKey: state.preEditStateSnapshot?.selectedGroupKey,
            }
          : undefined,
      };
    },
  );

  readonly updateFieldValues = this.updater(
    (
      state,
      {
        values,
        updateStores = true,
      }: { values: FieldValues; updateStores?: boolean },
    ) => {
      if (areValuesEqual(values, state.fieldValues)) {
        return { ...state };
      }

      updateStores &&
        this.sendUpdateMessage('updateFieldValues', {
          values: values,
        });

      const searchConfig = this.isCurrentConfigOutdated(state, {
        fieldValues: values,
      })
        ? undefined
        : state.currentSearchConfig;
      const selectedGroupKey = this.updateSelectedGroupKeyByConfig(
        state,
        searchConfig,
      );
      return {
        ...state,
        fieldValues: values,
        currentSearchConfig: searchConfig,
        selectedGroupKey: selectedGroupKey,
      };
    },
  );

  readonly updateDisplayedColumns = this.updater(
    (
      state,
      {
        displayedColumns,
        updateStores = true,
      }: { displayedColumns: string[]; updateStores?: boolean },
    ) => {
      if (areColumnsEqual(displayedColumns, state.displayedColumns)) {
        return { ...state };
      }
      updateStores &&
        this.sendUpdateMessage('updateDisplayedColumns', {
          displayedColumns: displayedColumns,
        });

      const searchConfig = this.isCurrentConfigOutdated(state, {
        displayedColumIds: displayedColumns,
      })
        ? undefined
        : state.currentSearchConfig;
      const selectedGroupKey = this.updateSelectedGroupKeyByConfig(
        state,
        searchConfig,
      );

      return {
        ...state,
        displayedColumns: displayedColumns,
        currentSearchConfig: searchConfig,
        selectedGroupKey: selectedGroupKey,
      };
    },
  );

  readonly updateViewMode = this.updater(
    (
      state,
      {
        viewMode,
        updateStores = true,
      }: {
        viewMode: basicViewModeType | advancedViewModeType;
        updateStores?: boolean;
      },
    ) => {
      if (viewMode === state.viewMode) {
        return { ...state };
      }
      updateStores &&
        this.sendUpdateMessage('updateViewMode', {
          viewMode: viewMode,
        });
      const searchConfig = this.isCurrentConfigOutdated(state, {
        viewMode: viewMode,
      })
        ? undefined
        : state.currentSearchConfig;
      const selectedGroupKey = this.updateSelectedGroupKeyByConfig(
        state,
        searchConfig,
      );
      return {
        ...state,
        viewMode: viewMode,
        currentSearchConfig: searchConfig,
        selectedGroupKey: selectedGroupKey,
      };
    },
  );

  // *********** Selectors *********** //

  readonly preEditStateSnapshot$ = this.select(
    ({ preEditStateSnapshot }): SearchConfigState | undefined =>
      preEditStateSnapshot,
  );

  readonly pageDataToRevert$ = this.select(
    ({ pageDataToRevert }): PageData | undefined => pageDataToRevert,
  );

  readonly pageName$ = this.select(
    this.state$,
    (state): string => state.pageName,
  );

  readonly pageData$ = this.select(
    this.state$,
    (state): PageData => ({
      pageName: state.pageName,
      fieldValues: state.fieldValues,
      viewMode: state.viewMode,
      displayedColumIds: state.displayedColumns,
      columnGroupKey: state.selectedGroupKey,
    }),
  );

  readonly selectedGroupKey$ = this.select(
    ({ selectedGroupKey }): string => selectedGroupKey,
  );

  readonly currentConfig$ = this.select(
    ({ currentSearchConfig }): SearchConfigInfo | undefined =>
      currentSearchConfig,
  );

  readonly searchConfigVm$ = this.select(
    this.state$,
    this.currentConfig$,
    (state, currentConfig): SearchConfigViewModel => ({
      pageName: state.pageName,
      searchConfigs: state.searchConfigs.filter((config) => hasValues(config)),
      editMode: state.editMode,
      isInChargeOfEdit: state.isInChargeOfEdit,
      currentConfig: currentConfig,
    }),
  );

  readonly columnSelectionVm$ = this.select(
    this.state$,
    this.currentConfig$,
    (state, currentConfig): ColumnSelectionViewModel => {
      const searchConfigsOnlyColumns = state.searchConfigs.filter((config) =>
        hasOnlyColumns(config),
      );
      return {
        searchConfigsOnlyColumns: searchConfigsOnlyColumns,
        searchConfigsWithColumns: state.searchConfigs.filter((config) =>
          hasColumns(config),
        ),
        nonSearchConfigGroupKeys: state.nonSearchConfigGroupKeys,
        allGroupKeys: state.nonSearchConfigGroupKeys
          .concat(
            searchConfigsOnlyColumns.map((config) => config.name),
            state.selectedGroupKey === '' ? [] : [state.selectedGroupKey],
          )
          .filter(
            (value, index, self) =>
              self.indexOf(value) === index && value != null,
          ),
        selectedGroupKey: state.selectedGroupKey,
        currentConfig: currentConfig,
        customGroupKey: state.customGroupKey,
        editMode: state.editMode,
        isInChargeOfEdit: state.isInChargeOfEdit,
      };
    },
  );

  // *********** Effects *********** //

  readonly enterEditMode = this.effect(
    (config$: Observable<SearchConfigInfo>) => {
      return config$.pipe(
        withLatestFrom(this.state$),
        tap(([config, state]) => {
          this.takeSnapshot({});
          this.setCurrentConfig({ config: config });
          this.setEditMode({});
        }),
      );
    },
  );

  readonly cancelEdit = this.effect((trigger$) => {
    return trigger$.pipe(
      withLatestFrom(this.preEditStateSnapshot$),
      tap(([, preEditStateSnapshot]) => {
        this.cancelEditMode({});
        const savedConfig = preEditStateSnapshot?.currentSearchConfig;
        if (savedConfig) {
          if (hasValues(savedConfig) && hasColumns(savedConfig)) {
            this.setCurrentConfig({ config: savedConfig });
          } else {
            this.revertPageData({});
            this.setCurrentConfig({ config: savedConfig });
          }
          return;
        }

        this.revertPageData({});
      }),
    );
  });

  readonly saveEdit = this.effect((config$: Observable<SearchConfigInfo>) => {
    return config$.pipe(
      tap((config) => {
        this.editSearchConfig({ searchConfig: config });
        this.cancelEditMode({});
        this.setCurrentConfig({ config: config });
      }),
    );
  });

  private readonly storeUpdate = this.effect(() => {
    return this.searchConfigTopic$.pipe(
      filter((msg) => msg.payload.storeName !== this.storeName),
      withLatestFrom(this.state$),
      tap(([msg, state]) => {
        if (msg.payload.name === 'storeData') {
          const storeData: SearchConfigState = msg.payload.state;
          const newState = {
            ...state,
            nonSearchConfigGroupKeys:
              state.nonSearchConfigGroupKeys.length > 0
                ? state.nonSearchConfigGroupKeys
                : storeData.nonSearchConfigGroupKeys,
            customGroupKey:
              state.customGroupKey === ''
                ? storeData.customGroupKey
                : state.customGroupKey,
            fieldValues:
              Object.keys(state.fieldValues).length === 0
                ? storeData.fieldValues
                : state.fieldValues,
            displayedColumns:
              state.displayedColumns.length === 0
                ? storeData.displayedColumns
                : state.displayedColumns,
            viewMode:
              state.viewMode === basicViewMode
                ? storeData.viewMode
                : state.viewMode,
            searchConfigs:
              state.searchConfigs.length === 0
                ? storeData.searchConfigs
                : state.searchConfigs,
            currentSearchConfig:
              state.currentSearchConfig ?? storeData.currentSearchConfig,
            selectedGroupKey:
              state.selectedGroupKey === ''
                ? storeData.selectedGroupKey
                : state.selectedGroupKey,
            editMode:
              state.editMode === false ? storeData.editMode : state.editMode,
            preEditStateSnapshot:
              state.preEditStateSnapshot ?? storeData.preEditStateSnapshot,
          };
          this.patchState(newState);
        } else if (msg.payload.name === 'newStore') {
          this.sendUpdateMessage('storeData', {
            state: state,
          });
        } else if (msg.payload.name === 'setSearchConfigs') {
          this.setSearchConfigs({
            searchConfigs: msg.payload.searchConfigs,
            updateStores: false,
          });
        } else if (msg.payload.name === 'setCurrentConfig') {
          this.setCurrentConfig({
            config: msg.payload.config,
            updateStores: false,
          });
        } else if (msg.payload.name === 'deleteSearchConfig') {
          this.deleteSearchConfig({
            searchConfig: msg.payload.searchConfig,
            updateStores: false,
          });
        } else if (msg.payload.name === 'addSearchConfig') {
          this.addSearchConfig({
            searchConfig: msg.payload.searchConfig,
            updateStores: false,
          });
        } else if (msg.payload.name === 'updateFieldValues') {
          this.updateFieldValues({
            values: msg.payload.values,
            updateStores: false,
          });
        } else if (msg.payload.name === 'updateDisplayedColumns') {
          this.updateDisplayedColumns({
            displayedColumns: msg.payload.displayedColumns,
            updateStores: false,
          });
        } else if (msg.payload.name === 'setEditMode') {
          this.setEditMode({
            updateStores: false,
          });
        } else if (msg.payload.name === 'cancelEditMode') {
          this.cancelEditMode({
            updateStores: false,
          });
        } else if (msg.payload.name === 'editSearchConfig') {
          this.editSearchConfig({
            searchConfig: msg.payload.searchConfig,
            updateStores: false,
          });
        } else if (msg.payload.name === 'setNonSearchConfigGroupKeys') {
          this.setNonSearchConfigGroupKeys({
            nonSearchConfigGroupKeys: msg.payload.nonSearchConfigGroupKeys,
            updateStores: false,
          });
        } else if (msg.payload.name === 'setSelectedGroupKey') {
          this.setSelectedGroupKey({
            selectedGroupKey: msg.payload.selectedGroupKey,
            updateStores: false,
          });
        } else if (msg.payload.name === 'takeSnapshot') {
          this.takeSnapshot({ updateStores: false });
        } else if (msg.payload.name === 'updateViewMode') {
          this.updateViewMode({
            viewMode: msg.payload.viewMode,
            updateStores: false,
          });
        } else if (msg.payload.name === 'setCustomGroupKey') {
          this.setCustomGroupKey({
            customGroupKey: msg.payload.customGroupKey,
            updateStores: false,
          });
        } else if (msg.payload.name === 'revertPageData') {
          this.revertPageData({
            updateStores: false,
          });
        }
      }),
    );
  });

  // *********** Utilities *********** //

  private isCurrentConfigOutdated(
    state: SearchConfigState,
    change: {
      fieldValues?: FieldValues;
      viewMode?: basicViewModeType | advancedViewModeType;
      displayedColumIds?: Array<string>;
    },
  ) {
    if (state.editMode) return false;

    if (state.currentSearchConfig === undefined) return true;

    if (
      hasColumns(state.currentSearchConfig) &&
      change.displayedColumIds &&
      !areColumnsEqual(
        state.currentSearchConfig.columns,
        change.displayedColumIds,
      )
    )
      return true;

    if (
      hasValues(state.currentSearchConfig) &&
      change.fieldValues &&
      !areValuesEqual(state.currentSearchConfig.values, change.fieldValues)
    ) {
      return true;
    }

    if (
      hasValues(state.currentSearchConfig) &&
      change.viewMode &&
      !(
        (state.currentSearchConfig.isAdvanced
          ? advancedViewMode
          : basicViewMode) === change.viewMode
      )
    )
      return true;

    return false;
  }

  /**
   * update selectedGroupKey using new config
   */
  private updateSelectedGroupKeyByConfig(
    state: SearchConfigState,
    config: SearchConfigInfo | undefined,
  ) {
    if (state.editMode) return state.selectedGroupKey;

    if (config && config.name === state.selectedGroupKey)
      return state.selectedGroupKey;

    if (config && hasColumns(config)) return config.name;

    const configForSelectedKey = state.searchConfigs.find(
      (c) => c.name === state.selectedGroupKey,
    );

    if (config && hasValues(config) && configForSelectedKey) {
      return state.customGroupKey;
    }

    if (
      config === undefined &&
      configForSelectedKey &&
      !hasOnlyValues(configForSelectedKey)
    ) {
      return state.customGroupKey;
    }
    return state.selectedGroupKey;
  }

  /**
   * update currentSearchConfig using new selectedGroupKey
   */
  private updateConfigBySelectedGroupKey(
    state: SearchConfigState,
    selectedGroupKey: string,
  ): SearchConfigInfo | undefined {
    if (state.editMode) return state.currentSearchConfig;

    const searchConfigForSelectedKey = state.searchConfigs.find(
      (c) => c.name === state.selectedGroupKey,
    );

    if (
      (searchConfigForSelectedKey &&
        state.nonSearchConfigGroupKeys.includes(selectedGroupKey)) ||
      selectedGroupKey === state.customGroupKey
    ) {
      return undefined;
    }

    if (
      !state.nonSearchConfigGroupKeys
        .concat(state.customGroupKey)
        .includes(selectedGroupKey)
    ) {
      return state.searchConfigs.find((c) => c.name === selectedGroupKey);
    }

    return state.currentSearchConfig;
  }

  private sendUpdateMessage(name: string, content: any) {
    this.searchConfigTopic$.publish({
      payload: {
        name: name,
        storeName: this.storeName,
        ...content,
      },
    });
  }
}
