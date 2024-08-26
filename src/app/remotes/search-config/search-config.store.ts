import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { PageSearchConfigTopic } from '@onecx/integration-interface';
import { tap, withLatestFrom } from 'rxjs';
import { SearchConfigInfo } from 'src/app/shared/generated';

export type FieldValues = { [key: string]: unknown };
export type ConfigData = {
  pageName: string;
  values: FieldValues;
  columns: Array<string>;
};

export interface SearchConfigState {
  currentSearchConfig: SearchConfigInfo | undefined;
  pageName: string;
  fieldValues: FieldValues;
  displayedColumns: Array<string>;
  searchConfigs: SearchConfigInfo[];
  searchConfigsWithInputs: SearchConfigInfo[];
  editMode: boolean;
  preEditConfig: SearchConfigInfo | ConfigData | undefined;
  revertConfig: ConfigData | undefined;
}

export interface SearchConfigViewModel {
  searchConfigs: SearchConfigInfo[];
  editMode: boolean;
  currentSearchConfig: SearchConfigInfo | undefined;
}

@Injectable()
export class SearchConfigStore extends ComponentStore<SearchConfigState> {
  private searchConfigTopic$ = new PageSearchConfigTopic();

  constructor() {
    super({
      currentSearchConfig: undefined,
      pageName: '',
      fieldValues: {},
      displayedColumns: [],
      searchConfigs: [],
      searchConfigsWithInputs: [],
      editMode: false,
      preEditConfig: undefined,
      revertConfig: undefined,
    });
  }

  // *********** Updaters *********** //

  readonly setPageName = this.updater((state, newPageName: string) => ({
    ...state,
    pageName: newPageName,
  }));

  readonly setFieldValues = this.updater((state, values: FieldValues) => {
    const areValuesEqual =
      state.currentSearchConfig &&
      this.areValuesEqual(state.currentSearchConfig.values, values);
    const searchConfig =
      areValuesEqual || state.editMode ? state.currentSearchConfig : undefined;
    const preEditConfig =
      state.editMode || areValuesEqual
        ? state.preEditConfig
        : {
            pageName: state.pageName,
            values: values,
            columns: state.displayedColumns,
          };
    return {
      ...state,
      fieldValues: values,
      currentSearchConfig: searchConfig,
      preEditConfig: preEditConfig,
    };
  });

  readonly setDisplayedColumns = this.updater(
    (state, newDisplayedColumns: string[]) => {
      const areColumnsEqual =
        state.currentSearchConfig &&
        this.areColumnsEqual(
          state.currentSearchConfig.columns,
          newDisplayedColumns,
        );
      const searchConfig =
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
    (state, newSearchConfig: SearchConfigInfo) => {
      this.searchConfigTopic$.publish({
        eventType: 'create',
        config: newSearchConfig,
      });
      return {
        ...state,
        searchConfigs: state.searchConfigs.concat([newSearchConfig]),
        searchConfigsWithInputs:
          Object.keys(newSearchConfig.values).length > 0
            ? state.searchConfigsWithInputs.concat(newSearchConfig)
            : state.searchConfigsWithInputs,
      };
    },
  );

  readonly editSearchConfig = this.updater(
    (state, searchConfig: SearchConfigInfo) => {
      this.searchConfigTopic$.publish({
        eventType: 'edit',
        config: searchConfig,
      });
      return {
        ...state,
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
    (state, searchConfig: SearchConfigInfo) => {
      this.searchConfigTopic$.publish({
        eventType: 'delete',
        config: searchConfig,
      });
      return {
        ...state,
        searchConfigs: state.searchConfigs.filter(
          (config) => config.id !== searchConfig.id,
        ),
        searchConfigsWithInputs: state.searchConfigsWithInputs.filter(
          (config) => config.id !== searchConfig.id,
        ),
      };
    },
  );

  readonly setSearchConfigs = this.updater(
    (state, newSearchConfigs: SearchConfigInfo[]) => ({
      ...state,
      searchConfigs: newSearchConfigs || [],
      searchConfigsWithInputs: newSearchConfigs.filter(
        (config) => Object.keys(config.values).length > 0,
      ),
    }),
  );

  readonly setCurrentConfig = this.updater(
    (state, newCurrentConfig: SearchConfigInfo) => {
      const preEditConfig = state.editMode
        ? state.preEditConfig
        : newCurrentConfig;
      this.searchConfigTopic$.publish({
        eventType: 'change',
        config: newCurrentConfig,
      });
      return {
        ...state,
        currentSearchConfig: newCurrentConfig,
        preEditConfig: preEditConfig,
      };
    },
  );

  readonly setEditMode = this.updater((state) => {
    console.log('setEditMode', state);
    return {
      ...state,
      editMode: true,
    };
  });

  readonly cancelEditMode = this.updater((state) => {
    console.log('cancelEditMode', state);
    return {
      ...state,
      editMode: false,
    };
  });

  readonly setRevertConfig = this.updater((state) => {
    return {
      ...state,
      fieldValues: state.preEditConfig?.values || {},
      displayedColumns: state.preEditConfig?.columns || [],
      revertConfig: {
        values: state.preEditConfig?.values || {},
        columns: state.preEditConfig?.columns || [],
        pageName: state.pageName,
      },
    };
  });

  // *********** Selectors *********** //

  readonly isSearchConfigSaved$ = this.select(
    ({ preEditConfig }): boolean | undefined =>
      preEditConfig && 'id' in preEditConfig,
  );

  readonly currentConfig$ = this.select(
    ({ currentSearchConfig }): SearchConfigInfo | undefined =>
      currentSearchConfig,
  );

  readonly currentRevertConfig$ = this.select(
    ({ revertConfig }): ConfigData | undefined => revertConfig,
  );

  readonly editMode$ = this.select(({ editMode }): boolean => editMode);

  readonly pageName$ = this.select(
    this.state$,
    (state): string => state.pageName,
  );

  readonly currentData$ = this.select(
    this.state$,
    (state): ConfigData => ({
      pageName: state.pageName,
      values: state.fieldValues,
      columns: state.displayedColumns,
    }),
  );

  readonly searchConfigVm$ = this.select(
    this.state$,
    (state): SearchConfigViewModel => ({
      searchConfigs: state.searchConfigsWithInputs,
      editMode: state.editMode,
      currentSearchConfig: state.currentSearchConfig,
    }),
  );

  // *********** Effects *********** //

  readonly cancelEdit = this.effect((trigger$) => {
    return trigger$.pipe(
      withLatestFrom(this.state$, this.isSearchConfigSaved$),
      tap(([, state, isSearchConfigSaved]) => {
        this.cancelEditMode();
        if (isSearchConfigSaved) {
          this.setCurrentConfig(state.preEditConfig as SearchConfigInfo);
        } else {
          this.setRevertConfig();
        }
      }),
    );
  });

  readonly saveEdit = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => {
        this.cancelEditMode();
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
}
