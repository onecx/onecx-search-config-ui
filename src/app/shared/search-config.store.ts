import { Inject, Injectable, InjectionToken } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Topic } from '@onecx/accelerator';
import { Observable, filter, tap, withLatestFrom } from 'rxjs';
import { SearchConfigInfo } from 'src/app/shared/generated';
import {
  advancedViewMode,
  advancedViewModeType,
  basicViewMode,
  basicViewModeType,
  columngGroupSelectionStoreName,
  searchConfigStoreName,
} from './constants';
import {
  areColumnsEqual,
  areValuesEqual,
  hasColumns,
  hasOnlyColumns,
  hasOnlyValues,
  hasValues,
  parseFieldValues,
} from './search-config.utils';

export const SEARCH_CONFIG_TOPIC = new InjectionToken<SearchConfigTopic>(
  'searchConfigTopic',
);

export interface SearchConfigMessage {
  payload: {
    storeName: string;
    stateToUpdate: Partial<SearchConfigState>;
  };
}

export class SearchConfigTopic extends Topic<SearchConfigMessage> {
  constructor() {
    super('searchConfig', 1);
  }
}

export type UnparsedFieldValues = { [key: string]: unknown };
export type FieldValues = { [key: string]: string };
export type SearchData = {
  fieldValues: FieldValues;
  viewMode: basicViewModeType | advancedViewModeType;
  displayedColumnsIds: Array<string>;
  layout?: 'table' | 'grid' | 'list';
};

export type PageData = SearchData & {
  pageName: string;
  columnGroupKey: string;
};

export type RevertData = SearchData & {
  columnGroupKey: string;
};

interface SearchConfigComponentState {
  currentSearchConfig: SearchConfigInfo | undefined;
  selectedGroupKey: string;
  inChargeOfEdit: string;
  editMode: boolean;
  preEditStateSnapshot: SearchConfigState | undefined;
  dataToRevert: RevertData | undefined;
  searchConfigs: SearchConfigInfo[];

  pageName: string;
  fieldValues: FieldValues;
  displayedColumnsIds: Array<string>;
  viewMode: basicViewModeType | advancedViewModeType;
  layout: 'table' | 'grid' | 'list' | undefined;
}

interface ColumnGroupSelectionComponentState {
  currentSearchConfig: SearchConfigInfo | undefined;
  selectedGroupKey: string;
  inChargeOfEdit: string;
  editMode: boolean;
  preEditStateSnapshot: SearchConfigState | undefined;
  dataToRevert: RevertData | undefined;
  searchConfigs: SearchConfigInfo[];

  nonSearchConfigGroupKeys: Array<string>;
  customGroupKey: string;
}

export interface SearchConfigState
  extends SearchConfigComponentState,
    ColumnGroupSelectionComponentState {
  displayedSearchData: SearchData;
  searchConfigComponentActive: boolean;
  columnGroupComponentActive: boolean;
}

export interface SearchConfigViewModel {
  searchConfigs: SearchConfigInfo[];
  currentConfig: SearchConfigInfo | undefined;

  editMode: boolean;
  isInChargeOfEdit: boolean;
  isColumnGroupComponentActive: boolean;
  layout: 'table' | 'grid' | 'list' | undefined;
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

export const initialState: SearchConfigState = {
  pageName: '',
  nonSearchConfigGroupKeys: [],
  customGroupKey: '',

  fieldValues: {},
  displayedColumnsIds: [],
  viewMode: basicViewMode,
  layout: undefined,

  searchConfigs: [],
  currentSearchConfig: undefined,
  selectedGroupKey: '',

  inChargeOfEdit: '',
  editMode: false,
  preEditStateSnapshot: undefined,
  dataToRevert: undefined,

  displayedSearchData: {
    fieldValues: {},
    displayedColumnsIds: [],
    viewMode: basicViewMode,
    layout: undefined,
  },

  searchConfigComponentActive: false,
  columnGroupComponentActive: false,
};

@Injectable()
export class SearchConfigStore extends ComponentStore<SearchConfigState> {
  columnGroupComponentReloading = false;

  constructor(
    @Inject(SEARCH_CONFIG_STORE_NAME)
    private storeName: string,
    @Inject(SEARCH_CONFIG_TOPIC)
    private searchConfigTopic$: SearchConfigTopic,
  ) {
    super(initialState);
    this.activateStore(storeName);
  }

  // *********** Updaters *********** //

  readonly activateStore = this.updater((state, storeName: string) => {
    let stateToUpdate: Partial<SearchConfigState> = {};
    if (storeName === searchConfigStoreName) {
      stateToUpdate = {
        searchConfigComponentActive: true,
      };
    } else if (storeName === columngGroupSelectionStoreName) {
      stateToUpdate = {
        columnGroupComponentActive: true,
      };
    }
    this.sendUpdateMessage(stateToUpdate);
    return { ...state, ...stateToUpdate };
  });

  readonly deactivateColumnGroupStore = this.updater((state) => {
    return {
      ...state,
      columnGroupComponentActive: false,
    };
  });

  readonly setPageName = this.updater((state, newPageName: string) => {
    const stateToUpdate: Partial<SearchConfigState> = {
      pageName: newPageName,
    };
    this.sendUpdateMessage(stateToUpdate);
    return { ...state, ...stateToUpdate };
  });

  readonly setCustomGroupKey = this.updater((state, customGroupKey: string) => {
    const stateToUpdate: Partial<SearchConfigState> = {
      customGroupKey: customGroupKey,
    };
    this.sendUpdateMessage(stateToUpdate);
    return { ...state, ...stateToUpdate };
  });

  readonly setSearchConfigs = this.updater(
    (state, searchConfigs: SearchConfigInfo[]) => {
      const stateToUpdate: Partial<SearchConfigState> = {
        searchConfigs: searchConfigs,
      };

      this.sendUpdateMessage(stateToUpdate);
      return { ...state, ...stateToUpdate };
    },
  );

  readonly setNonSearchConfigGroupKeys = this.updater(
    (state, nonSearchConfigGroupKeys: Array<string>) => {
      const stateToUpdate: Partial<SearchConfigState> = {
        nonSearchConfigGroupKeys: nonSearchConfigGroupKeys,
      };

      this.sendUpdateMessage(stateToUpdate);
      return { ...state, ...stateToUpdate };
    },
  );

  readonly addSearchConfig = this.updater(
    (state, searchConfig: SearchConfigInfo) => {
      const stateToUpdate: Partial<SearchConfigState> = {
        searchConfigs: state.searchConfigs.concat(searchConfig),
      };
      this.sendUpdateMessage(stateToUpdate);
      return { ...state, ...stateToUpdate };
    },
  );

  readonly deleteSearchConfig = this.updater(
    (state, searchConfig: SearchConfigInfo) => {
      const isCurrentSearchConfigDeleted =
        state.currentSearchConfig?.id === searchConfig.id;

      const currentSearchConfig = isCurrentSearchConfigDeleted
        ? undefined
        : state.currentSearchConfig;

      const selectedGroupKey = this.updateSelectedGroupKeyByConfig(
        state,
        currentSearchConfig,
      );

      const stateToUpdate: Partial<SearchConfigState> = {
        ...(isCurrentSearchConfigDeleted && {
          currentSearchConfig: currentSearchConfig,
        }),
        ...(isCurrentSearchConfigDeleted && {
          selectedGroupKey: selectedGroupKey,
        }),
        searchConfigs: state.searchConfigs.filter(
          (config) => config.id !== searchConfig.id,
        ),
      };
      this.sendUpdateMessage(stateToUpdate);
      return { ...state, ...stateToUpdate };
    },
  );

  readonly setCurrentConfig = this.updater(
    (state, config: SearchConfigInfo | undefined) => {
      if (state.editMode) return state;

      const selectedGroupKey = this.updateSelectedGroupKeyByConfig(
        state,
        config,
      );

      const stateToUpdate: Partial<SearchConfigState> = {
        ...(selectedGroupKey !== state.selectedGroupKey && {
          selectedGroupKey: selectedGroupKey,
        }),
        currentSearchConfig: config,
      };
      this.sendUpdateMessage(stateToUpdate);
      return { ...state, ...stateToUpdate };
    },
  );

  readonly editSearchConfig = this.updater(
    (state, searchConfig: SearchConfigInfo) => {
      const stateToUpdate: Partial<SearchConfigState> = {
        searchConfigs: state.searchConfigs.map((config) =>
          config.id === searchConfig.id ? searchConfig : config,
        ),
      };
      this.sendUpdateMessage(stateToUpdate);
      return { ...state, ...stateToUpdate };
    },
  );

  readonly setSelectedGroupKey = this.updater(
    (state, selectedGroupKey: string) => {
      if (state.editMode) return state;

      const currentConfig = this.updateConfigBySelectedGroupKey(
        state,
        selectedGroupKey,
      );

      const stateToUpdate: Partial<SearchConfigState> = {
        ...(currentConfig !== state.currentSearchConfig && {
          currentSearchConfig: currentConfig,
        }),
        selectedGroupKey: selectedGroupKey,
      };
      this.sendUpdateMessage(stateToUpdate);
      return { ...state, ...stateToUpdate };
    },
  );

  readonly setEditMode = this.updater((state) => {
    const stateToUpdate: Partial<SearchConfigState> = {
      editMode: true,
      inChargeOfEdit: this.storeName,
      dataToRevert: undefined,
    };
    this.sendUpdateMessage(stateToUpdate);
    return { ...state, ...stateToUpdate };
  });

  readonly cancelEditMode = this.updater((state) => {
    const stateToUpdate: Partial<SearchConfigState> = {
      editMode: false,
      inChargeOfEdit: '',
    };
    this.sendUpdateMessage(stateToUpdate);
    return { ...state, ...stateToUpdate };
  });

  readonly takeSnapshot = this.updater((state) => {
    const stateToUpdate: Partial<SearchConfigState> = {
      preEditStateSnapshot: state,
    };
    this.sendUpdateMessage(stateToUpdate);
    return { ...state, ...stateToUpdate };
  });

  readonly revertData = this.updater((state) => {
    if (!state.preEditStateSnapshot) return state;

    let stateToUpdate: Partial<SearchConfigState> = {};

    const savedConfig = state.preEditStateSnapshot.currentSearchConfig;

    if (!savedConfig) {
      stateToUpdate = {
        dataToRevert: {
          fieldValues: state.preEditStateSnapshot.fieldValues,
          displayedColumnsIds: state.preEditStateSnapshot.displayedColumnsIds,
          viewMode: state.preEditStateSnapshot.viewMode,
          columnGroupKey: state.preEditStateSnapshot.selectedGroupKey,
        },
        currentSearchConfig: undefined,
        selectedGroupKey: state.preEditStateSnapshot.selectedGroupKey,
      };
    } else if (hasOnlyColumns(savedConfig)) {
      stateToUpdate = {
        dataToRevert: {
          fieldValues: state.preEditStateSnapshot.fieldValues,
          displayedColumnsIds: savedConfig.columns,
          viewMode: state.preEditStateSnapshot.viewMode,
          columnGroupKey: savedConfig.name,
        },
        currentSearchConfig: savedConfig,
        selectedGroupKey: savedConfig.name,
      };
    } else if (hasOnlyValues(savedConfig)) {
      stateToUpdate = {
        dataToRevert: {
          fieldValues: savedConfig.values,
          displayedColumnsIds: state.preEditStateSnapshot.displayedColumnsIds,
          viewMode: savedConfig.isAdvanced ? advancedViewMode : basicViewMode,
          columnGroupKey: state.preEditStateSnapshot.selectedGroupKey,
        },
        currentSearchConfig: savedConfig,
        selectedGroupKey: state.preEditStateSnapshot.selectedGroupKey,
      };
    } else {
      stateToUpdate = {
        dataToRevert: {
          fieldValues: savedConfig.values,
          displayedColumnsIds: state.columnGroupComponentActive
            ? savedConfig.columns
            : state.preEditStateSnapshot.displayedColumnsIds,
          viewMode: savedConfig.isAdvanced ? advancedViewMode : basicViewMode,
          columnGroupKey: savedConfig.name,
        },
        currentSearchConfig: savedConfig,
        selectedGroupKey: savedConfig.name,
      };
    }

    stateToUpdate = {
      ...stateToUpdate,
      displayedSearchData: {
        fieldValues:
          stateToUpdate.dataToRevert?.fieldValues ??
          state.displayedSearchData.fieldValues,
        displayedColumnsIds:
          stateToUpdate.dataToRevert?.displayedColumnsIds ??
          state.displayedSearchData.displayedColumnsIds,
        viewMode:
          stateToUpdate.dataToRevert?.viewMode ??
          state.displayedSearchData.viewMode,
      },
    };

    this.sendUpdateMessage(stateToUpdate);
    return { ...state, ...stateToUpdate };
  });

  readonly activateEditedConfig = this.updater(
    (state, config: SearchConfigInfo) => {
      const stateToUpdate: Partial<SearchConfigState> = {
        currentSearchConfig: config,
        selectedGroupKey: hasColumns(config)
          ? config.name
          : state.customGroupKey,
      };

      this.sendUpdateMessage(stateToUpdate);
      return { ...state, ...stateToUpdate };
    },
  );

  readonly updateFieldValues = this.updater(
    (state, values: UnparsedFieldValues) => {
      const parsedValues = parseFieldValues(values ?? {});
      if (areValuesEqual(parsedValues, state.fieldValues)) {
        return { ...state };
      }

      const searchConfig = this.isCurrentConfigOutdated(state, {
        fieldValues: parsedValues,
      })
        ? undefined
        : state.currentSearchConfig;

      const selectedGroupKey = this.updateSelectedGroupKeyByConfig(
        state,
        searchConfig,
      );

      const stateToUpdate: Partial<SearchConfigState> = {
        ...(searchConfig !== state.currentSearchConfig && {
          currentSearchConfig: searchConfig,
        }),
        ...(selectedGroupKey !== state.selectedGroupKey && {
          selectedGroupKey: selectedGroupKey,
        }),
        fieldValues: parsedValues,
        displayedSearchData: {
          ...state.displayedSearchData,
          fieldValues: parsedValues,
        },
      };
      this.sendUpdateMessage(stateToUpdate);
      return { ...state, ...stateToUpdate };
    },
  );

  readonly updateDisplayedColumnsIds = this.updater(
    (state, displayedColumnsIds: string[]) => {
      if (areColumnsEqual(displayedColumnsIds, state.displayedColumnsIds)) {
        return { ...state };
      }

      const searchConfig = this.isCurrentConfigOutdated(state, {
        displayedColumIds: displayedColumnsIds,
      })
        ? undefined
        : state.currentSearchConfig;

      const selectedGroupKey = this.updateSelectedGroupKeyByConfig(
        state,
        searchConfig,
      );

      const stateToUpdate: Partial<SearchConfigState> = {
        ...(searchConfig !== state.currentSearchConfig && {
          currentSearchConfig: searchConfig,
        }),
        ...(selectedGroupKey !== state.selectedGroupKey && {
          selectedGroupKey: selectedGroupKey,
        }),
        displayedColumnsIds: displayedColumnsIds,
        displayedSearchData: {
          ...state.displayedSearchData,
          displayedColumnsIds: displayedColumnsIds,
        },
      };
      this.sendUpdateMessage(stateToUpdate);
      return { ...state, ...stateToUpdate };
    },
  );

  readonly updateViewMode = this.updater(
    (state, viewMode: basicViewModeType | advancedViewModeType) => {
      if (viewMode === state.viewMode) {
        return { ...state };
      }

      const searchConfig = this.isCurrentConfigOutdated(state, {
        viewMode: viewMode,
      })
        ? undefined
        : state.currentSearchConfig;

      const selectedGroupKey = this.updateSelectedGroupKeyByConfig(
        state,
        searchConfig,
      );

      const stateToUpdate: Partial<SearchConfigState> = {
        ...(searchConfig !== state.currentSearchConfig && {
          currentSearchConfig: searchConfig,
        }),
        ...(selectedGroupKey !== state.selectedGroupKey && {
          selectedGroupKey: selectedGroupKey,
        }),
        viewMode: viewMode,
        displayedSearchData: {
          ...state.displayedSearchData,
          viewMode: viewMode,
        },
      };
      this.sendUpdateMessage(stateToUpdate);
      return { ...state, ...stateToUpdate };
    },
  );

  readonly updateLayout = this.updater(
    (state, layout: 'table' | 'grid' | 'list') => {
      if (layout === state.layout) {
        return { ...state };
      }

      const stateToUpdate: Partial<SearchConfigState> = {
        layout: layout,
        displayedSearchData: {
          ...state.displayedSearchData,
          layout: layout,
        },
      };
      this.sendUpdateMessage(stateToUpdate);
      return { ...state, ...stateToUpdate };
    },
  );

  // *********** Selectors *********** //

  readonly isSearchConfigComponentActive$ = this.select(
    ({ searchConfigComponentActive }): boolean => searchConfigComponentActive,
  );

  readonly isColumnGroupComponentActive$ = this.select(
    ({ columnGroupComponentActive }): boolean => columnGroupComponentActive,
  );

  readonly preEditStateSnapshot$ = this.select(
    ({ preEditStateSnapshot }): SearchConfigState | undefined =>
      preEditStateSnapshot,
  );

  readonly dataToRevert$ = this.select(
    ({ dataToRevert }): RevertData | undefined => dataToRevert,
  );

  readonly pageName$ = this.select(
    this.state$,
    (state): string => state.pageName,
  );

  readonly selectedGroupKey$ = this.select(
    ({ selectedGroupKey }): string => selectedGroupKey,
  );

  readonly currentConfig$ = this.select(
    ({ currentSearchConfig }): SearchConfigInfo | undefined =>
      currentSearchConfig,
  );

  readonly currentPageData$ = this.select(
    this.state$,
    (state): PageData => ({
      pageName: state.pageName,
      fieldValues: state.fieldValues,
      viewMode: state.viewMode,
      displayedColumnsIds: state.displayedColumnsIds,
      columnGroupKey: state.selectedGroupKey,
      layout: state.layout,
    }),
  );

  readonly currentDisplayedData$ = this.select(
    ({ displayedSearchData }): SearchData => displayedSearchData,
  );

  readonly searchConfigVm$ = this.select(
    this.state$,
    this.currentConfig$,
    this.isColumnGroupComponentActive$,
    (
      state,
      currentConfig,
      isColumnGroupComponentActive,
    ): SearchConfigViewModel => ({
      searchConfigs: state.searchConfigs.filter((config) => hasValues(config)),
      editMode: state.editMode,
      isInChargeOfEdit: state.inChargeOfEdit === this.storeName,
      currentConfig: currentConfig,
      isColumnGroupComponentActive: isColumnGroupComponentActive,
      layout: state.layout,
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
        isInChargeOfEdit: state.inChargeOfEdit === this.storeName,
      };
    },
  );

  // *********** Effects *********** //

  readonly enterEditMode = this.effect(
    (config$: Observable<SearchConfigInfo>) => {
      return config$.pipe(
        tap((config) => {
          this.takeSnapshot();
          this.setCurrentConfig(config);
          this.setEditMode();
        }),
      );
    },
  );

  readonly cancelEdit = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => {
        this.revertData();
        this.cancelEditMode();
      }),
    );
  });

  readonly saveEdit = this.effect((config$: Observable<SearchConfigInfo>) => {
    return config$.pipe(
      withLatestFrom(this.state$),
      tap(([config, state]) => {
        this.editSearchConfig(config);
        this.cancelEditMode();
        this.activateEditedConfig(config);
      }),
    );
  });

  private readonly storeUpdate = this.effect(() => {
    return this.searchConfigTopic$.pipe(
      filter((msg) => msg !== undefined),
      filter((msg) => msg.payload.storeName !== this.storeName),
      withLatestFrom(this.state$),
      tap(([msg, state]) => {
        // ignore state updates from CG when still reloading
        if (
          msg.payload.storeName === columngGroupSelectionStoreName &&
          this.columnGroupComponentReloading &&
          msg.payload.stateToUpdate.columnGroupComponentActive === undefined
        ) {
          return;
        }
        // CG announces it has reloaded so start listening to messages again
        if (
          msg.payload.storeName === columngGroupSelectionStoreName &&
          this.columnGroupComponentReloading &&
          msg.payload.stateToUpdate.columnGroupComponentActive
        ) {
          this.columnGroupComponentReloading = false;
          this.patchState({
            ...state,
            columnGroupComponentActive: true,
          });
          return;
        }
        // SC receives info to reinit CG
        if (
          msg.payload.stateToUpdate.columnGroupComponentActive &&
          state.columnGroupComponentActive &&
          msg.payload.storeName === columngGroupSelectionStoreName
        ) {
          this.deactivateColumnGroupStore();
          this.columnGroupComponentReloading = true;
          this.sendUpdateMessage({
            ...state,
            columnGroupComponentActive: false,
          });
          return;
        }
        // CG receives reload trigger
        if (
          msg.payload.stateToUpdate.columnGroupComponentActive === false &&
          msg.payload.storeName === searchConfigStoreName
        ) {
          this.patchState({
            ...msg.payload.stateToUpdate,
            columnGroupComponentActive: true,
          });
          this.sendUpdateMessage({
            columnGroupComponentActive: true,
          });
          return;
        }
        // normal state update
        this.patchState({
          ...state,
          ...msg.payload.stateToUpdate,
          selectedGroupKey:
            (msg.payload.stateToUpdate.selectedGroupKey ?? '') !== ''
              ? msg.payload.stateToUpdate.selectedGroupKey
              : state.selectedGroupKey,
          columnGroupComponentActive:
            msg.payload.storeName === columngGroupSelectionStoreName
              ? true
              : state.columnGroupComponentActive,
          searchConfigComponentActive:
            msg.payload.storeName === searchConfigStoreName
              ? true
              : state.searchConfigComponentActive,
        });
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
      layout?: 'table' | 'grid' | 'list';
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
      ) &&
      // treat values and columns config as solumns only when column group component is not active
      state.columnGroupComponentActive
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
    if (!state.columnGroupComponentActive) return state.selectedGroupKey;
    if (state.editMode) return state.selectedGroupKey;

    if (config && config.name === state.selectedGroupKey)
      return state.selectedGroupKey;

    if (config && hasColumns(config)) return config.name;

    const searchConfigForSelectedKey = state.searchConfigs.find(
      (c) => c.name === state.selectedGroupKey,
    );

    if (config && hasValues(config) && searchConfigForSelectedKey) {
      return state.customGroupKey;
    }

    if (
      config === undefined &&
      searchConfigForSelectedKey &&
      !hasOnlyValues(searchConfigForSelectedKey)
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
    if (!state.searchConfigComponentActive) return state.currentSearchConfig;
    if (state.editMode) return state.currentSearchConfig;

    const searchConfigForSelectedKey = state.searchConfigs.find(
      (c) => c.name === state.selectedGroupKey,
    );

    if (
      searchConfigForSelectedKey &&
      (state.nonSearchConfigGroupKeys.includes(selectedGroupKey) ||
        selectedGroupKey === state.customGroupKey)
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

  sendUpdateMessage(stateToUpdate: Partial<SearchConfigState>) {
    this.searchConfigTopic$.publish({
      payload: {
        storeName: this.storeName,
        stateToUpdate: stateToUpdate,
      },
    });
  }
}
