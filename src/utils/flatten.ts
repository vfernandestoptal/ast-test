export function flatten<T>(values: T[][]): T[] {
  return ([] as T[]).concat(...values);
}