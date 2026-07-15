import { ReadFileValue } from '@dasch-swiss/dsp-js';

/**
 * Sentinel asset reference used by dsp-api / dsp-tools to mark a `FileValue`
 * as a placeholder, i.e. no real asset has been delivered to Sipi yet.
 * See the "Placeholder Values" project (DEV-6568).
 */
export const PLACEHOLDER_FILE_SENTINEL = 'urn:dasch:placeholder';

// TEMP DEBUG (DEV-6568): confirms this rebuilt module actually loaded in the browser.
// eslint-disable-next-line no-console
console.warn('%c[DEV-6568] placeholder debug build loaded', 'background:#c0392b;color:#fff;padding:2px 6px');

/**
 * Returns `true` when the given file value is a placeholder (its `filename` is
 * the placeholder sentinel), meaning there is no real asset to load from Sipi.
 */
export function isPlaceholderFileValue(fileValue: ReadFileValue | null | undefined): boolean {
  const result = fileValue?.filename === PLACEHOLDER_FILE_SENTINEL;
  // TEMP DEBUG (DEV-6568): remove after confirming the real placeholder payload.
  /* eslint-disable no-console */
  console.warn(
    `[DEV-6568] isPlaceholderFileValue result=${result} filename=${JSON.stringify(
      fileValue?.filename
    )} fileUrl=${JSON.stringify(fileValue?.fileUrl)} type=${JSON.stringify(
      fileValue?.type
    )} expected=${JSON.stringify(PLACEHOLDER_FILE_SENTINEL)}`
  );
  console.warn('[DEV-6568] full fileValue:', fileValue);
  /* eslint-enable no-console */
  return result;
}
