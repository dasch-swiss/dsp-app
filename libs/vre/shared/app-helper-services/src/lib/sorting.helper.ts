export class SortingHelper {
  /**
   * compares value by value and sorts in alphabetical order using the provided first key, in case the comparison
   * of the values results in zero the second key is used if provided.
   */
  static keySortByAlphabetical<T extends object>(
    value: Array<T>,
    firstSortKey: keyof T,
    secondSortKey?: keyof T
  ): Array<T> {
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

  static sortByLabelsAlphabetically<T extends object>(value: Array<T>, sortKey: keyof T, language?: string): Array<T> {
    const sortedArray = value.slice();
    sortedArray.sort((a: T, b: T) => {
      let rawLabelA = String(a[sortKey] ?? '');
      let rawLabelB = String(b[sortKey] ?? '');
      if (language !== undefined) {
        rawLabelA = SortingHelper.getLabelValue(a, sortKey, language);
        rawLabelB = SortingHelper.getLabelValue(b, sortKey, language);
      }

      const comparison = rawLabelA.localeCompare(rawLabelB, language, {
        numeric: true,
        sensitivity: 'variant',
        ignorePunctuation: false,
      });

      if (comparison !== 0) return comparison;

      return 0;
    });

    return sortedArray;
  }

  private static getLabelValue<T>(item: T, sortKey: keyof T, language: string): string {
    type Label = { language: string; value: string };
    type TWithLabels = T & { labels: Label[] };

    const labels = (item as TWithLabels).labels;
    if (Array.isArray(labels)) {
      const primary = labels.find(l => l.language === language)?.value;
      if (primary) return primary;

      const fallback = labels.find(l => l.value.trim() !== '')?.value;
      if (fallback) return fallback;
    }

    return String(item[sortKey]) || '';
  }
}
