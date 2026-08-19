import { isValidDate } from '@onecx/accelerator';
import { SearchConfigInfo } from './generated';
import { FieldValues, UnparsedFieldValues } from './search-config.store';
import equal from 'fast-deep-equal';

export function hasValues(config: SearchConfigInfo): boolean {
  return Object.keys(config.values).length > 0;
}

export function hasColumns(config: SearchConfigInfo): boolean {
  return config.columns.length > 0;
}

export function hasOnlyValues(config: SearchConfigInfo): boolean {
  return !hasColumns(config) && hasValues(config);
}

export function hasOnlyColumns(config: SearchConfigInfo): boolean {
  return !hasValues(config) && hasColumns(config);
}

export function areValuesEqual(v1: FieldValues, v2: FieldValues): boolean {
  return equal(v1, v2);
}

export function parseFieldValues(values: UnparsedFieldValues): FieldValues {
  return Object.entries(values)
    .filter(([key, value]) => value)
    .reduce(
      (acc: { [key: string]: string }, [key, value]) => ({
        ...acc,
        [key]: isValidDate(value) ? value.toISOString() : String(value),
      }),
      {},
    );
}

export function areColumnsEqual(c1: Array<string>, c2: Array<string>): boolean {
  return c1.length === c2.length && c1.every((col) => c2.includes(col));
}
