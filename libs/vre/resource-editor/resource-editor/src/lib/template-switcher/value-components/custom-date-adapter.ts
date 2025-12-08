import { NativeDateAdapter } from '@angular/material/core';

/**
 * Custom date adapter that formats dates as DD.MM.YYYY (European format).
 *
 * This adapter extends NativeDateAdapter to provide a consistent date format
 * across the application for time values that use native JavaScript Date objects.
 *
 * @example
 * ```typescript
 * // In component providers:
 * { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE] }
 * ```
 */
export class CustomDateAdapter extends NativeDateAdapter {
  /**
   * Formats a date as DD.MM.YYYY.
   *
   * @param date - The date to format
   * @param displayFormat - The display format (unused, kept for compatibility)
   * @returns Formatted date string in DD.MM.YYYY format
   */
  override format(date: Date, displayFormat: unknown): string {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return `${this._to2digit(day)}.${this._to2digit(month)}.${year}`;
  }

  /**
   * Parses a date string in DD.MM.YYYY format.
   *
   * @param value - The date string to parse
   * @returns Parsed Date object or null if invalid
   */
  override parse(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      const parts = value.split('.');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);

        if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
          return new Date(year, month, day);
        }
      }
    }

    return super.parse(value);
  }

  /**
   * Converts a number to a 2-digit string with leading zero if needed.
   *
   * @param n - The number to format
   * @returns 2-digit string representation
   */
  private _to2digit(n: number): string {
    return `00${n}`.slice(-2);
  }
}
