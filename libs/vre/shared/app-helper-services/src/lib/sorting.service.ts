import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SortingService {
  /**
   * reverses an array
   */
  reverseArray(value: Array<any>): Array<any> {
    return value.slice().reverse();
  }

  /**
   * compares value by value and sorts in alphabetical order using the provided first key, in case the comparison
   * of the values results in zero the second key is used if provided.
   */
  keySortByAlphabetical<T extends object>(value: Array<T>, firstSortKey: keyof T, secondSortKey?: keyof T): Array<T> {
    const sortedArray = value.slice();
    sortedArray.sort((a: T, b: T) => {
      if (String(a[firstSortKey]).toLowerCase() < String(b[firstSortKey]).toLowerCase()) {
        return -1;
      } else if (String(a[firstSortKey]).toLowerCase() > String(b[firstSortKey]).toLowerCase()) {
        return 1;
      } else if (secondSortKey) {
        if (String(a[secondSortKey]).toLowerCase() < String(b[secondSortKey]).toLowerCase()) {
          return -1;
        } else if (String(a[secondSortKey]).toLowerCase() > String(b[secondSortKey]).toLowerCase()) {
          return 1;
        } else {
          return 0;
        }
      } else {
        return 0;
      }
    });
    return sortedArray;
  }
}
