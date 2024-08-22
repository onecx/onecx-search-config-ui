import { isDevMode } from '@angular/core';
import { routerReducer } from '@ngrx/router-store';
import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { State } from './app.state';

export const reducers: ActionReducerMap<State> = { router: routerReducer };

export const metaReducers: MetaReducer<State>[] = isDevMode() ? [] : [];
