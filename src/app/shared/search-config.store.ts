import { Inject, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { filter, tap, withLatestFrom } from 'rxjs';
import { SearchConfigInfo } from 'src/app/shared/generated';
import {
  SEARCH_CONFIG_STORE_TOPIC,
  SearchConfigTopic,
} from './topics/search-config/v1/search-config.topic';
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

export type FieldValues = { [key: string]: unknown };
export type PageData = {
  pageName: string;
  fieldValues: FieldValues;
  viewMode: basicViewModeType | advancedViewModeType;
  displayedColumIds: Array<string>;
  columnGroupKey: string;
};

export interface SearchConfigState {
  storeName: string;
  pageName: string;
  nonSearchConfigGroupKeys: Array<string>;

  searchConfigs: SearchConfigInfo[];
  currentSearchConfig: SearchConfigInfo | undefined;
  fieldValues: FieldValues;
  displayedColumns: Array<string>;
  viewMode: basicViewModeType | advancedViewModeType;
  selectedGroupKey: string;
  customGroupKey: string;

  editStoreName: string;
  editMode: boolean;
  preEditConfigOrData: SearchConfigInfo | PageData | undefined;
  revertConfigData: SearchConfigInfo | PageData | undefined;
}

export interface SearchConfigViewModel {
  pageName: string;
  searchConfigs: SearchConfigInfo[];

  // editMode: boolean;
  // editStoreName: string;
}

export interface ColumnSelectionViewModel {
  searchConfigsOnlyColumns: SearchConfigInfo[];
  searchConfigsWithColumns: SearchConfigInfo[];
  allGroupKeys: Array<string>;
  nonSearchConfigGroupKeys: Array<string>;
  selectedGroupKey: string;
  currentConfig: SearchConfigInfo | undefined;
  customGroupKey: string;
  // editMode: boolean;
  // editStoreName: string;
}

@Injectable()
export class SearchConfigStore extends ComponentStore<SearchConfigState> {
  constructor(
    @Inject(SEARCH_CONFIG_STORE_TOPIC)
    public searchConfigTopic$: SearchConfigTopic,
  ) {
    super({
      storeName: '',
      pageName: '',
      nonSearchConfigGroupKeys: [],

      searchConfigs: [],
      currentSearchConfig: undefined,
      fieldValues: {},
      displayedColumns: [],
      viewMode: basicViewMode,
      selectedGroupKey: '',
      customGroupKey: '',

      editStoreName: '',
      editMode: false,
      preEditConfigOrData: undefined,
      revertConfigData: undefined,
    });
  }

  // *********** Updaters *********** //

  /**
   *  Set name for each store independently
   */
  readonly setStoreName = this.updater((state, storeName: string) => ({
    ...state,
    storeName: storeName,
  }));

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
        this.sendUpdateMessage(
          'setCustomGroupKey',
          {
            customGroupKey: customGroupKey,
          },
          state,
        );
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
        this.sendUpdateMessage(
          'setSearchConfigs',
          {
            searchConfigs: searchConfigs,
          },
          state,
        );
      return {
        ...state,
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
        this.sendUpdateMessage(
          'setNonSearchConfigGroupKeys',
          {
            nonSearchConfigGroupKeys: nonSearchConfigGroupKeys,
          },
          state,
        );
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
        this.sendUpdateMessage(
          'addSearchConfig',
          {
            searchConfig: searchConfig,
          },
          state,
        );
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
        this.sendUpdateMessage(
          'deleteSearchConfig',
          {
            searchConfig: searchConfig,
          },
          state,
        );

      const currentSearchConfig =
        state.currentSearchConfig?.id === searchConfig.id
          ? undefined
          : state.currentSearchConfig;
      const selectedGroupKey = this.updateCurrentSelectedGroupKey(
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
      }: { config: SearchConfigInfo; updateStores?: boolean },
    ) => {
      // const preEditConfig = state.editMode
      //   ? state.preEditConfigOrData
      //   : newCurrentConfig;
      updateStores &&
        this.sendUpdateMessage(
          'setCurrentConfig',
          {
            config: config,
          },
          state,
        );
      const selectedGroupKey = this.updateCurrentSelectedGroupKey(
        state,
        config,
      );
      return {
        ...state,
        currentSearchConfig: config,
        selectedGroupKey: selectedGroupKey,
        // preEditConfigOrData: preEditConfig,
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
        this.sendUpdateMessage(
          'updateFieldValues',
          {
            values: values,
          },
          state,
        );

      const searchConfig = this.isCurrentConfigOutdated(state, {
        fieldValues: values,
      })
        ? undefined
        : state.currentSearchConfig;
      // const preEditConfig =
      //   state.editMode || areValuesEqual
      //     ? state.preEditConfigOrData
      //     : {
      //         pageName: state.pageName,
      //         values: values,
      //         columns: state.displayedColumns,
      //         columnGroupKey: state.selectedGroupKey,
      //         viewMode: state.viewMode,
      //       };
      const selectedGroupKey = this.updateCurrentSelectedGroupKey(
        state,
        searchConfig,
      );
      return {
        ...state,
        fieldValues: values,
        currentSearchConfig: searchConfig,
        selectedGroupKey: selectedGroupKey,
        // preEditConfigOrData: preEditConfig,
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
        this.sendUpdateMessage(
          'updateDisplayedColumns',
          {
            displayedColumns: displayedColumns,
          },
          state,
        );

      const searchConfig = this.isCurrentConfigOutdated(state, {
        displayedColumIds: displayedColumns,
      })
        ? undefined
        : state.currentSearchConfig;
      // const preEditConfig =
      //   state.editMode || areColumnsEqual
      //     ? state.preEditConfigOrData
      //     : {
      //         pageName: state.pageName,
      //         values: state.fieldValues,
      //         columns: displayedColumns,
      //         columnGroupKey: state.selectedGroupKey,
      //         viewMode: state.viewMode,
      //       };
      const selectedGroupKey = this.updateCurrentSelectedGroupKey(
        state,
        searchConfig,
      );

      return {
        ...state,
        displayedColumns: displayedColumns,
        currentSearchConfig: searchConfig,
        selectedGroupKey: selectedGroupKey,
        // preEditConfigOrData: preEditConfig,
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
        this.sendUpdateMessage(
          'updateViewMode',
          {
            viewMode: viewMode,
          },
          state,
        );
      const searchConfig = this.isCurrentConfigOutdated(state, {
        viewMode: viewMode,
      })
        ? undefined
        : state.currentSearchConfig;
      const selectedGroupKey = this.updateCurrentSelectedGroupKey(
        state,
        searchConfig,
      );
      // const preEditConfig =
      //   state.editMode || isViewModeEqual
      //     ? state.preEditConfigOrData
      //     : {
      //         pageName: state.pageName,
      //         values: state.fieldValues,
      //         columns: state.displayedColumns,
      //         columnGroupKey: state.selectedGroupKey,
      //         viewMode: viewMode,
      //       };
      return {
        ...state,
        viewMode: viewMode,
        currentSearchConfig: searchConfig,
        selectedGroupKey: selectedGroupKey,
        // preEditConfigOrData: preEditConfig,
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
      updateStores &&
        this.sendUpdateMessage(
          'setSelectedGroupKey',
          {
            selectedGroupKey: selectedGroupKey,
          },
          state,
        );
      const currentConfig = this.updateCurrentConfig(state, selectedGroupKey);

      return {
        ...state,
        currentSearchConfig: currentConfig,
        selectedGroupKey: selectedGroupKey,
      };
    },
  );

  // readonly editSearchConfig = this.updater(
  //   (
  //     state,
  //     {
  //       searchConfig,
  //       updateStores = true,
  //     }: { searchConfig: SearchConfigInfo; updateStores?: boolean },
  //   ) => {
  //     updateStores &&
  //       this.sendUpdateMessage(
  //         'edit',
  //         {
  //           searchConfig: searchConfig,
  //         },
  //         state,
  //       );
  //     return {
  //       ...state,
  //       currentSearchConfig: searchConfig,
  //       searchConfigs: state.searchConfigs.map((config) =>
  //         config.id === searchConfig.id ? searchConfig : config,
  //       ),
  //       searchConfigsWithInputs: state.searchConfigsWithInputs.map((config) =>
  //         config.id === searchConfig.id ? searchConfig : config,
  //       ),
  //     };
  //   },
  // );

  // readonly setEditMode = this.updater(
  //   (state, { updateStores = true }: { updateStores?: boolean }) => {
  //     updateStores && this.sendUpdateMessage('setEditMode', {}, state);
  //     return {
  //       ...state,
  //       editMode: true,
  //       editStoreName: updateStores ? state.storeName : state.editStoreName,
  //     };
  //   },
  // );

  // readonly cancelEditMode = this.updater(
  //   (state, { updateStores = true }: { updateStores?: boolean }) => {
  //     updateStores && this.sendUpdateMessage('cancelEditMode', {}, state);
  //     return {
  //       ...state,
  //       editMode: false,
  //       editStoreName: updateStores ? '' : state.editStoreName,
  //     };
  //   },
  // );

  // readonly setRevertConfig = this.updater(
  //   (state, { updateStores = true }: { updateStores?: boolean }) => {
  //     updateStores && this.sendUpdateMessage('setRevertConfig', {}, state);
  //     return {
  //       ...state,
  //       fieldValues: state.preEditConfigOrData?.fieldValues || {},
  //       displayedColumns: state.preEditConfigOrData?.columIds || [],
  //       revertConfigData: {
  //         fieldValues: state.preEditConfigOrData?.fieldValues || {},
  //         displayedColumIds: state.preEditConfigOrData?.columIds || [],
  //         pageName: state.pageName,
  //         columnGroupKey:
  //           state.preEditConfigOrData &&
  //           'columnGroupKey' in state.preEditConfigOrData
  //             ? state.preEditConfigOrData.columnGroupKey
  //             : '',
  //         viewMode:
  //           state.preEditConfigOrData && 'viewMode' in state.preEditConfigOrData
  //             ? state.preEditConfigOrData?.viewMode
  //             : 'basic',
  //       },
  //     };
  //   },
  // );

  // *********** Selectors *********** //

  // readonly isSearchConfigSaved$ = this.select(
  //   ({ preEditConfigOrData: preEditConfig }): boolean | undefined =>
  //     preEditConfig && 'id' in preEditConfig,
  // );

  readonly selectedGroupKey$ = this.select(
    ({ selectedGroupKey }): string => selectedGroupKey,
  );

  // readonly currentRevertConfig$ = this.select(
  //   ({ revertConfigData: revertConfig }): PageData | undefined => revertConfig,
  // );

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

  readonly currentConfig$ = this.select(
    ({ currentSearchConfig }): SearchConfigInfo | undefined =>
      currentSearchConfig,
  );

  readonly searchConfigVm$ = this.select(
    this.state$,
    (state): SearchConfigViewModel => ({
      pageName: state.pageName,
      searchConfigs: state.searchConfigs.filter((config) => hasValues(config)),
      // editMode: state.editMode,
      // editStoreName: state.editStoreName,
    }),
  );

  readonly columnSelectionVm$ = this.select(
    this.state$,
    (state): ColumnSelectionViewModel => {
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
        // editMode: state.editMode,
        currentConfig: state.currentSearchConfig,
        customGroupKey: state.customGroupKey,
        // editStoreName: state.editStoreName,
      };
    },
  );

  // *********** Effects *********** //

  // readonly cancelEdit = this.effect((trigger$) => {
  //   return trigger$.pipe(
  //     withLatestFrom(this.state$, this.isSearchConfigSaved$),
  //     tap(([, state, isSearchConfigSaved]) => {
  //       this.cancelEditMode({});
  //       if (isSearchConfigSaved) {
  //         this.setCurrentConfig({
  //           newCurrentConfig: state.preEditConfigOrData as SearchConfigInfo,
  //         });
  //         if (
  //           state.preEditConfigOrData &&
  //           state.preEditConfigOrData?.columIds.length <= 0 &&
  //           Object.keys(state.preEditConfigOrData.fieldValues).length > 0
  //         ) {
  //           this.updateDisplayedColumns({
  //             newDisplayedColumns: state.preEditConfigOrData.columIds,
  //           });
  //           'columnGroupKey' in state.preEditConfigOrData &&
  //             this.setSelectedGroupKey({
  //               groupKey: state.preEditConfigOrData.columnGroupKey,
  //             });
  //         }
  //       } else {
  //         this.setRevertConfig({});
  //       }
  //     }),
  //   );
  // });

  // readonly saveEdit = this.effect((trigger$) => {
  //   return trigger$.pipe(
  //     tap(() => {
  //       this.cancelEditMode({});
  //     }),
  //   );
  // });

  private readonly storeUpdate = this.effect(() => {
    return this.searchConfigTopic$.pipe(
      withLatestFrom(this.state$),
      filter(([msg, state]) => msg.payload.storeName !== state.storeName),
      tap(([msg, _]) => {
        if (msg.payload.name === 'setSearchConfigs') {
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
          // this.setEditMode({
          //   updateStores: false,
          // });
        } else if (msg.payload.name === 'cancelEditMode') {
          // this.cancelEditMode({
          //   updateStores: false,
          // });
        } else if (msg.payload.name === 'edit') {
          // this.editSearchConfig({
          //   searchConfig: msg.payload.searchConfig,
          //   updateStores: false,
          // });
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
        } else if (msg.payload.name === 'setRevertConfig') {
          // this.setRevertConfig({
          //   updateStores: false,
          // });
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
        }
      }),
    );
  });

  private isCurrentConfigOutdated(
    state: SearchConfigState,
    change: {
      fieldValues?: FieldValues;
      viewMode?: basicViewModeType | advancedViewModeType;
      displayedColumIds?: Array<string>;
    },
  ) {
    // NOTE: we are editing that config
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

  private updateCurrentSelectedGroupKey(
    state: SearchConfigState,
    config: SearchConfigInfo | undefined,
  ) {
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

  private updateCurrentConfig(
    state: SearchConfigState,
    selectedGroupKey: string,
  ): SearchConfigInfo | undefined {
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

  private sendUpdateMessage(
    name: string,
    content: any,
    state: SearchConfigState,
  ) {
    this.searchConfigTopic$.publish({
      payload: {
        name: name,
        storeName: state.storeName,
        ...content,
      },
    });
  }
}
