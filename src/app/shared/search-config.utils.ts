import { SearchConfigInfo } from './generated';
import { FieldValues } from './search-config.store';

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
  const v1_parsed = parseFieldValues(v1);
  const v2_parsed = parseFieldValues(v2);
  return Object.entries(v1_parsed).every(([key, value]) => {
    return value === v2_parsed[key];
  });
}

export function parseFieldValues(values: FieldValues): {
  [key: string]: string;
} {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([_, value]) => values !== null)
      .map(([name, value]) => [name, value ? String(value) : '']),
  );
}

export function areColumnsEqual(c1: Array<string>, c2: Array<string>): boolean {
  return c1.length === c2.length && c1.every((column) => c2.includes(column));
}
