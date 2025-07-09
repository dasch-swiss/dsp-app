import { filter, OperatorFunction } from 'rxjs';

export function filterUndefined<T>(): OperatorFunction<T | undefined, T> {
  return filter((value: T | undefined): value is T => value !== undefined);
}
