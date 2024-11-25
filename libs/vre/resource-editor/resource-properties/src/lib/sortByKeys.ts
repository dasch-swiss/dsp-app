export function sortByKeys<T>(array: T[], keys: (keyof T)[]): T[] {
  return array.sort((a, b) => {
    for (const key of keys) {
      if (a[key] < b[key]) {
        return -1;
      }
      if (a[key] > b[key]) {
        return 1;
      }
    }
    return 0;
  });
}
