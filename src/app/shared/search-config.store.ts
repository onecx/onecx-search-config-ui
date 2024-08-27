import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { filter, tap, withLatestFrom } from 'rxjs';
import { SearchConfigInfo } from 'src/app/shared/generated';
import { SearchConfigTopic } from './topics/search-config/v1/search-config.topic';

export type FieldValues = { [key: string]: unknown };
export type ConfigData = {
  pageName: string;
  values: FieldValues;
  columns: Array<string>;
  columnGroupKey: string;
};

export interface SearchConfigState {
  storeName: string;
  pageName: string;
  searchConfigs: SearchConfigInfo[];
  currentSearchConfig: SearchConfigInfo | undefined;
  editMode: boolean;
  preEditConfig: SearchConfigInfo | ConfigData | undefined;
  revertConfig: ConfigData | undefined;
  fieldValues: FieldValues;
  searchConfigsWithInputs: SearchConfigInfo[];
  searchConfigsWithOnlyColumns: SearchConfigInfo[];
  displayedColumns: Array<string>;

  groupKeys: Array<string>;
  selectedGroupKey: string;
  editStoreName: string;
}

export interface SearchConfigViewModel {
  searchConfigs: SearchConfigInfo[];
  editMode: boolean;
  editStoreName: string;
}

export interface ColumnSelectionViewModel {
  searchConfigs: SearchConfigInfo[];
  groupKeys: Array<string>;
  allGroupKeys: Array<string>;
  selectedGroupKey: string;
  editMode: boolean;
  currentConfig: SearchConfigInfo | undefined;
  editStoreName: string;
}

@Injectable()
export class SearchConfigStore extends ComponentStore<SearchConfigState> {
  private searchConfigTopic$ = new SearchConfigTopic();

  constructor() {
    super({
      storeName: '',
      currentSearchConfig: undefined,
      pageName: '',
      fieldValues: {},
      displayedColumns: [],
      searchConfigs: [],
      searchConfigsWithInputs: [],
      editMode: false,
      preEditConfig: undefined,
      revertConfig: undefined,
      searchConfigsWithOnlyColumns: [],
      groupKeys: [],
      selectedGroupKey: '',
      editStoreName: '',
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

  readonly updateFieldValues = this.updater(
    (
      state,
      {
        values,
        updateStores = true,
      }: { values: FieldValues; updateStores?: boolean },
    ) => {
      updateStores &&
        this.sendUpdateMessage(
          'fieldValues',
          {
            values: values,
          },
          state,
        );
      let searchConfig: SearchConfigInfo | undefined = undefined;
      const areValuesEqual =
        state.currentSearchConfig &&
        this.areValuesEqual(state.currentSearchConfig.values, values);
      searchConfig =
        areValuesEqual || state.editMode
          ? state.currentSearchConfig
          : undefined;
      const preEditConfig =
        state.editMode || areValuesEqual
          ? state.preEditConfig
          : {
              pageName: state.pageName,
              values: values,
              columns: state.displayedColumns,
              columnGroupKey: state.selectedGroupKey,
            };
      return {
        ...state,
        fieldValues: values,
        currentSearchConfig: searchConfig,
        preEditConfig: preEditConfig,
      };
    },
  );

  readonly updateDisplayedColumns = this.updater(
    (
      state,
      {
        newDisplayedColumns,
        updateStores = true,
      }: { newDisplayedColumns: string[]; updateStores?: boolean },
    ) => {
      updateStores &&
        this.sendUpdateMessage(
          'displayedColumns',
          {
            displayedColumns: newDisplayedColumns,
          },
          state,
        );
      let searchConfig: SearchConfigInfo | undefined = undefined;
      const areColumnsEqual =
        state.currentSearchConfig &&
        this.areColumnsEqual(
          state.currentSearchConfig.columns,
          newDisplayedColumns,
        );
      searchConfig =
        areColumnsEqual || state.editMode
          ? state.currentSearchConfig
          : undefined;
      const preEditConfig =
        state.editMode || areColumnsEqual
          ? state.preEditConfig
          : {
              pageName: state.pageName,
              values: state.fieldValues,
              columns: newDisplayedColumns,
              columnGroupKey: state.selectedGroupKey,
            };
      return {
        ...state,
        displayedColumns: newDisplayedColumns,
        currentSearchConfig: searchConfig,
        preEditConfig: preEditConfig,
      };
    },
  );

  readonly addSearchConfig = this.updater(
    (
      state,
      {
        newSearchConfig,
        updateStores = true,
      }: { newSearchConfig: SearchConfigInfo; updateStores?: boolean },
    ) => {
      updateStores &&
        this.sendUpdateMessage(
          'add',
          {
            searchConfig: newSearchConfig,
          },
          state,
        );
      return {
        ...state,
        searchConfigs: state.searchConfigs.concat([newSearchConfig]),
        searchConfigsWithInputs:
          Object.keys(newSearchConfig.values).length > 0
            ? state.searchConfigsWithInputs.concat(newSearchConfig)
            : state.searchConfigsWithInputs,
        searchConfigsWithOnlyColumns:
          newSearchConfig.columns.length > 0 &&
          Object.keys(newSearchConfig.values).length <= 0
            ? state.searchConfigsWithOnlyColumns.concat(newSearchConfig)
            : state.searchConfigsWithOnlyColumns,
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
        this.sendUpdateMessage(
          'edit',
          {
            searchConfig: searchConfig,
          },
          state,
        );
      return {
        ...state,
        currentSearchConfig: searchConfig,
        searchConfigs: state.searchConfigs.map((config) =>
          config.id === searchConfig.id ? searchConfig : config,
        ),
        searchConfigsWithInputs: state.searchConfigsWithInputs.map((config) =>
          config.id === searchConfig.id ? searchConfig : config,
        ),
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
          'delete',
          {
            searchConfig: searchConfig,
          },
          state,
        );
      return {
        ...state,
        currentSearchConfig:
          state.currentSearchConfig?.id === searchConfig.id
            ? undefined
            : state.currentSearchConfig,
        searchConfigs: state.searchConfigs.filter(
          (config) => config.id !== searchConfig.id,
        ),
        searchConfigsWithInputs: state.searchConfigsWithInputs.filter(
          (config) => config.id !== searchConfig.id,
        ),
        searchConfigsWithOnlyColumns: state.searchConfigsWithOnlyColumns.filter(
          (config) => config.id !== searchConfig.id,
        ),
      };
    },
  );

  readonly setSearchConfigs = this.updater(
    (
      state,
      {
        newSearchConfigs,
        updateStores = true,
      }: { newSearchConfigs: SearchConfigInfo[]; updateStores?: boolean },
    ) => {
      updateStores &&
        this.sendUpdateMessage(
          'searchConfigs',
          {
            searchConfigs: newSearchConfigs,
          },
          state,
        );
      return {
        ...state,
        searchConfigs: newSearchConfigs,
        searchConfigsWithInputs: newSearchConfigs.filter(
          (config) => Object.keys(config.values).length > 0,
        ),
        searchConfigsWithOnlyColumns: newSearchConfigs.filter(
          (config) =>
            config.columns.length > 0 && Object.keys(config.values).length <= 0,
        ),
      };
    },
  );

  readonly setCurrentConfig = this.updater(
    (
      state,
      {
        newCurrentConfig,
        updateStores = true,
      }: { newCurrentConfig: SearchConfigInfo; updateStores?: boolean },
    ) => {
      const preEditConfig = state.editMode
        ? state.preEditConfig
        : newCurrentConfig;
      updateStores &&
        this.sendUpdateMessage(
          'change',
          {
            currentSearchConfig: newCurrentConfig,
          },
          state,
        );
      return {
        ...state,
        currentSearchConfig: newCurrentConfig,
        preEditConfig: preEditConfig,
      };
    },
  );

  readonly setEditMode = this.updater(
    (state, { updateStores = true }: { updateStores?: boolean }) => {
      updateStores && this.sendUpdateMessage('setEditMode', {}, state);
      return {
        ...state,
        editMode: true,
        editStoreName: updateStores ? state.storeName : state.editStoreName,
      };
    },
  );

  readonly cancelEditMode = this.updater(
    (state, { updateStores = true }: { updateStores?: boolean }) => {
      updateStores && this.sendUpdateMessage('cancelEditMode', {}, state);
      return {
        ...state,
        editMode: false,
        editStoreName: updateStores ? '' : state.editStoreName,
      };
    },
  );

  readonly setRevertConfig = this.updater(
    (state, { updateStores = true }: { updateStores?: boolean }) => {
      updateStores && this.sendUpdateMessage('setRevertConfig', {}, state);
      return {
        ...state,
        fieldValues: state.preEditConfig?.values || {},
        displayedColumns: state.preEditConfig?.columns || [],
        revertConfig: {
          values: state.preEditConfig?.values || {},
          columns: state.preEditConfig?.columns || [],
          pageName: state.pageName,
          columnGroupKey:
            state.preEditConfig && 'columnGroupKey' in state.preEditConfig
              ? state.preEditConfig.columnGroupKey
              : '',
        },
      };
    },
  );

  readonly setGroupKeys = this.updater(
    (
      state,
      {
        groupKeys,
        updateStores = true,
      }: { groupKeys: Array<string>; updateStores?: boolean },
    ) => {
      updateStores &&
        this.sendUpdateMessage(
          'setGroupKeys',
          {
            groupKeys: groupKeys,
          },
          state,
        );
      return {
        ...state,
        groupKeys: groupKeys,
      };
    },
  );

  readonly setSelectedGroupKey = this.updater(
    (
      state,
      {
        groupKey,
        updateStores = true,
      }: { groupKey: string; updateStores?: boolean },
    ) => {
      updateStores &&
        this.sendUpdateMessage(
          'setSelectedGroupKey',
          {
            groupKey: groupKey,
          },
          state,
        );
      return {
        ...state,
        selectedGroupKey: groupKey,
      };
    },
  );

  // *********** Selectors *********** //

  readonly isSearchConfigSaved$ = this.select(
    ({ preEditConfig }): boolean | undefined =>
      preEditConfig && 'id' in preEditConfig,
  );

  readonly searchConfigs$ = this.select(
    ({ searchConfigs }): SearchConfigInfo[] => searchConfigs,
  );

  readonly currentConfig$ = this.select(
    ({ currentSearchConfig }): SearchConfigInfo | undefined =>
      currentSearchConfig,
  );

  readonly searchConfigsWithOnlyColumns$ = this.select(
    ({ searchConfigsWithOnlyColumns }): SearchConfigInfo[] =>
      searchConfigsWithOnlyColumns,
  );

  readonly groupKeys$ = this.select(({ groupKeys }): string[] => groupKeys);

  readonly selectedGroupKey$ = this.select(
    ({ selectedGroupKey }): string => selectedGroupKey,
  );

  readonly currentRevertConfig$ = this.select(
    ({ revertConfig }): ConfigData | undefined => revertConfig,
  );

  readonly pageName$ = this.select(
    this.state$,
    (state): string => state.pageName,
  );

  readonly searchConfigVm$ = this.select(
    this.state$,
    (state): SearchConfigViewModel => ({
      searchConfigs: state.searchConfigsWithInputs,
      editMode: state.editMode,
      editStoreName: state.editStoreName,
    }),
  );

  readonly columnSelectionVm$ = this.select(
    this.state$,
    (state): ColumnSelectionViewModel => ({
      searchConfigs: state.searchConfigsWithOnlyColumns,
      groupKeys: state.groupKeys,
      allGroupKeys: state.groupKeys
        .concat(
          state.searchConfigsWithOnlyColumns.map((config) => config.name),
          [state.selectedGroupKey],
        )
        .filter(
          (value, index, self) =>
            self.indexOf(value) === index && value != null,
        ),
      selectedGroupKey: state.selectedGroupKey,
      editMode: state.editMode,
      currentConfig: state.currentSearchConfig,
      editStoreName: state.editStoreName,
    }),
  );

  // *********** Effects *********** //

  readonly cancelEdit = this.effect((trigger$) => {
    return trigger$.pipe(
      withLatestFrom(this.state$, this.isSearchConfigSaved$),
      tap(([, state, isSearchConfigSaved]) => {
        this.cancelEditMode({});
        if (isSearchConfigSaved) {
          this.setCurrentConfig({
            newCurrentConfig: state.preEditConfig as SearchConfigInfo,
          });
        } else {
          this.setRevertConfig({});
        }
      }),
    );
  });

  readonly saveEdit = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => {
        this.cancelEditMode({});
      }),
    );
  });

  private readonly storeUpdate = this.effect(() => {
    return this.searchConfigTopic$.pipe(
      withLatestFrom(this.state$),
      filter(([msg, state]) => msg.payload.storeName !== state.storeName),
      tap(([msg, _]) => {
        if (msg.payload.name === 'searchConfigs') {
          this.setSearchConfigs({
            newSearchConfigs: msg.payload.searchConfigs,
            updateStores: false,
          });
        } else if (msg.payload.name === 'change') {
          this.setCurrentConfig({
            newCurrentConfig: msg.payload.currentSearchConfig,
            updateStores: false,
          });
        } else if (msg.payload.name === 'delete') {
          this.deleteSearchConfig({
            searchConfig: msg.payload.searchConfig,
            updateStores: false,
          });
        } else if (msg.payload.name === 'add') {
          this.addSearchConfig({
            newSearchConfig: msg.payload.searchConfig,
            updateStores: false,
          });
        } else if (msg.payload.name === 'fieldValues') {
          this.updateFieldValues({
            values: msg.payload.values,
            updateStores: false,
          });
        } else if (msg.payload.name === 'displayedColumns') {
          this.updateDisplayedColumns({
            newDisplayedColumns: msg.payload.displayedColumns,
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
        } else if (msg.payload.name === 'edit') {
          this.editSearchConfig({
            searchConfig: msg.payload.searchConfig,
            updateStores: false,
          });
        } else if (msg.payload.name === 'setGroupKeys') {
          this.setGroupKeys({
            groupKeys: msg.payload.groupKeys,
            updateStores: false,
          });
        } else if (msg.payload.name === 'setSelectedGroupKey') {
          this.setSelectedGroupKey({
            groupKey: msg.payload.groupKey,
            updateStores: false,
          });
        } else if (msg.payload.name === 'setRevertConfig') {
          this.setRevertConfig({
            updateStores: false,
          });
        }
      }),
    );
  });

  // *********** Utils *********** //

  private areValuesEqual(v1: FieldValues, v2: FieldValues): boolean {
    return Object.entries(v1).every(([key, value]) => {
      return value === v2[key];
    });
  }

  private areColumnsEqual(c1: Array<string>, c2: Array<string>): boolean {
    return c1.length === c2.length && c1.every((column) => c2.includes(column));
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
