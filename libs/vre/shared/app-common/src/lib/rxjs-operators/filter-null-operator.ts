import { filter, OperatorFunction } from 'rxjs';

export function filterNull<T>(): OperatorFunction<T | null, T> {
  return filter((value: T | null): value is T => value !== null);
}
