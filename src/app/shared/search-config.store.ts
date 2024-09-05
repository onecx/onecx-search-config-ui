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
  parseFieldValues,
} from './search-config.utils';

import { Topic } from '@onecx/accelerator';

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
export type PageData = {
  pageName: string;
  fieldValues: FieldValues;
  viewMode: basicViewModeType | advancedViewModeType;
  displayedColumnsIds: Array<string>;
  columnGroupKey: string;
};

interface SearchConfigComponentState {
  currentSearchConfig: SearchConfigInfo | undefined;
  selectedGroupKey: string;
  inChargeOfEdit: string;
  editMode: boolean;
  preEditStateSnapshot: SearchConfigState | undefined;
  pageDataToRevert: PageData | undefined;
  searchConfigs: SearchConfigInfo[];

  pageName: string;
  fieldValues: FieldValues;
  displayedColumnsIds: Array<string>;
  viewMode: basicViewModeType | advancedViewModeType;
}

interface ColumnGroupSelectionComponentState {
  currentSearchConfig: SearchConfigInfo | undefined;
  selectedGroupKey: string;
  inChargeOfEdit: string;
  editMode: boolean;
  preEditStateSnapshot: SearchConfigState | undefined;
  pageDataToRevert: PageData | undefined;
  searchConfigs: SearchConfigInfo[];

  nonSearchConfigGroupKeys: Array<string>;
  customGroupKey: string;
}

export interface SearchConfigState
  extends SearchConfigComponentState,
    ColumnGroupSelectionComponentState {}

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

const initialState: SearchConfigState = {
  pageName: '',
  nonSearchConfigGroupKeys: [],
  customGroupKey: '',

  fieldValues: {},
  displayedColumnsIds: [],
  viewMode: basicViewMode,

  searchConfigs: [],
  currentSearchConfig: undefined,
  selectedGroupKey: '',

  inChargeOfEdit: '',
  editMode: false,
  preEditStateSnapshot: undefined,
  pageDataToRevert: undefined,
};

@Injectable()
export class SearchConfigStore extends ComponentStore<SearchConfigState> {
  searchConfigTopic$ = new SearchConfigTopic();
  constructor(
    @Inject(SEARCH_CONFIG_STORE_NAME)
    private storeName: string,
  ) {
    super(initialState);
  }

  // *********** Updaters *********** //

  readonly setPageName = this.updater((state, newPageName: string) => ({
    ...state,
    pageName: newPageName,
  }));

  readonly setCustomGroupKey = this.updater((state, customGroupKey: string) => {
    const stateToUpdate: Partial<SearchConfigState> = {
      customGroupKey: customGroupKey,
    };
    this.sendUpdateMessage(stateToUpdate);
    return { ...state, ...stateToUpdate };
  });

  readonly setSearchConfigs = this.updater(
    (state, searchConfigs: SearchConfigInfo[]) => {
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

      const stateToUpdate: Partial<SearchConfigState> = {
        selectedGroupKey: selectedKeyActive
          ? state.selectedGroupKey
          : state.customGroupKey,
        currentSearchConfig: searchConfigActive
          ? state.currentSearchConfig
          : undefined,
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
      const currentSearchConfig =
        state.currentSearchConfig?.id === searchConfig.id
          ? undefined
          : state.currentSearchConfig;
      const selectedGroupKey = this.updateSelectedGroupKeyByConfig(
        state,
        currentSearchConfig,
      );

      const stateToUpdate: Partial<SearchConfigState> = {
        currentSearchConfig: currentSearchConfig,
        selectedGroupKey: selectedGroupKey,
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
      // TODO: Do not set if not in search config list?
      const selectedGroupKey = this.updateSelectedGroupKeyByConfig(
        state,
        config,
      );

      const stateToUpdate: Partial<SearchConfigState> = {
        currentSearchConfig: config,
        selectedGroupKey: selectedGroupKey,
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
        currentSearchConfig: currentConfig,
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

  readonly revertPageData = this.updater((state) => {
    const stateToUpdate: Partial<SearchConfigState> = {
      pageDataToRevert: state.preEditStateSnapshot
        ? {
            pageName: state.preEditStateSnapshot?.pageName,
            fieldValues: state.preEditStateSnapshot?.fieldValues,
            displayedColumnsIds:
              state.preEditStateSnapshot?.displayedColumnsIds,
            viewMode: state.preEditStateSnapshot?.viewMode,
            columnGroupKey: state.preEditStateSnapshot?.selectedGroupKey,
          }
        : undefined,
    };
    this.sendUpdateMessage(stateToUpdate);
    return { ...state, ...stateToUpdate };
  });

  readonly updateFieldValues = this.updater(
    (state, values: UnparsedFieldValues) => {
      const parsedValues = parseFieldValues(values);
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
        fieldValues: parsedValues,
        currentSearchConfig: searchConfig,
        selectedGroupKey: selectedGroupKey,
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
        displayedColumnsIds: displayedColumnsIds,
        currentSearchConfig: searchConfig,
        selectedGroupKey: selectedGroupKey,
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
        viewMode: viewMode,
        currentSearchConfig: searchConfig,
        selectedGroupKey: selectedGroupKey,
      };
      this.sendUpdateMessage(stateToUpdate);
      return { ...state, ...stateToUpdate };
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
      displayedColumnsIds: state.displayedColumnsIds,
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
      isInChargeOfEdit: state.inChargeOfEdit === this.storeName,
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
        isInChargeOfEdit: state.inChargeOfEdit === this.storeName,
      };
    },
  );

  // *********** Effects *********** //

  readonly enterEditMode = this.effect(
    (config$: Observable<SearchConfigInfo>) => {
      return config$.pipe(
        withLatestFrom(this.state$),
        tap(([config, state]) => {
          this.takeSnapshot();
          this.setCurrentConfig(config);
          this.setEditMode();
        }),
      );
    },
  );

  readonly cancelEdit = this.effect((trigger$) => {
    return trigger$.pipe(
      withLatestFrom(this.preEditStateSnapshot$),
      tap(([, preEditStateSnapshot]) => {
        this.cancelEditMode();
        const savedConfig = preEditStateSnapshot?.currentSearchConfig;
        if (savedConfig) {
          if (hasValues(savedConfig) && hasColumns(savedConfig)) {
            this.setCurrentConfig(savedConfig);
          } else {
            this.revertPageData();
            this.setCurrentConfig(savedConfig);
          }
          return;
        }

        this.revertPageData();
      }),
    );
  });

  readonly saveEdit = this.effect((config$: Observable<SearchConfigInfo>) => {
    return config$.pipe(
      tap((config) => {
        this.editSearchConfig(config);
        this.cancelEditMode();
        this.setCurrentConfig(config);
      }),
    );
  });

  private readonly storeUpdate = this.effect(() => {
    return this.searchConfigTopic$.pipe(
      filter((msg) => msg !== undefined),
      filter((msg) => msg.payload.storeName !== this.storeName),
      tap((msg) => console.log('UPDATE ' + this.storeName, msg)),
      withLatestFrom(this.state$),
      tap(([msg, state]) => {
        this.patchState({
          ...state,
          ...msg.payload.stateToUpdate,
          selectedGroupKey:
            msg.payload.stateToUpdate.selectedGroupKey !== ''
              ? msg.payload.stateToUpdate.selectedGroupKey
              : state.selectedGroupKey,
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

  private sendUpdateMessage(stateToUpdate: Partial<SearchConfigState>) {
    console.log('PUBLISH ' + this.storeName, {
      payload: {
        storeName: this.storeName,
        stateToUpdate: stateToUpdate,
      },
    });
    this.searchConfigTopic$.publish({
      payload: {
        storeName: this.storeName,
        stateToUpdate: stateToUpdate,
      },
    });
  }
}
