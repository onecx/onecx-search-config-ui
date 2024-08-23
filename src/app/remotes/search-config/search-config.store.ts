import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { PageSearchConfigTopic } from '@onecx/integration-interface';
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
}

export interface SearchConfigViewModel {
  searchConfigs: SearchConfigInfo[];
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
    });
  }

  // *********** Updaters *********** //

  readonly setPageName = this.updater((state, newPageName: string) => ({
    ...state,
    pageName: newPageName,
  }));

  readonly setFieldValues = this.updater((state, values: FieldValues) => {
    console.log(state);
    const areValuesEqual =
      state.currentSearchConfig &&
      this.areValuesEqual(state.currentSearchConfig.values, values);
    const searchConfig = areValuesEqual ? state.currentSearchConfig : undefined;
    return {
      ...state,
      fieldValues: values,
      currentSearchConfig: searchConfig,
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
      const searchConfig = areColumnsEqual
        ? state.currentSearchConfig
        : undefined;
      return {
        ...state,
        displayedColumns: newDisplayedColumns,
        currentSearchConfig: searchConfig,
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
      this.searchConfigTopic$.publish({
        eventType: 'change',
        config: newCurrentConfig,
      });
      return {
        ...state,
        currentSearchConfig: newCurrentConfig,
      };
    },
  );

  // *********** Selectors *********** //

  readonly configUnselected$ = this.select(
    ({ currentSearchConfig }): boolean => currentSearchConfig === undefined,
  );

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
    }),
  );

  // *********** Effects *********** //

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
