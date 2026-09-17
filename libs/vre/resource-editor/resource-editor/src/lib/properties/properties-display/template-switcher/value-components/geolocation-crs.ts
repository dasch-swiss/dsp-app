import { ReadGeolocationValue } from '@dasch-swiss/dsp-js';

/**
 * The coordinate reference systems a geolocation may be expressed in.
 *
 * **This table mirrors dsp-api's `Geolocation.scala`, which stays authoritative.** It is duplicated
 * here only so that an out-of-range coordinate can be reported inline before submitting; the server
 * validates independently and rejects with a 400.
 *
 * `EPSG:4326` is deliberately absent — it declares latitude before longitude, and the server rejects
 * it. Do not add it to the selector.
 */
export interface Crs {
  iri: string;
  /** i18n key for the CRS name shown in the selector. */
  labelKey: string;
  /** i18n keys for the ordinate labels: a field labelled "longitude" holding an easting is exactly
   * the confusion this value type exists to remove. */
  xLabelKey: string;
  yLabelKey: string;
  /** Inclusive bounds. */
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

const I18N = 'resourceEditor.templateSwitcher.geolocationValue';

export const CRS_84: Crs = {
  iri: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
  labelKey: `${I18N}.crs.crs84`,
  xLabelKey: `${I18N}.longitude`,
  yLabelKey: `${I18N}.latitude`,
  xMin: -180,
  xMax: 180,
  yMin: -90,
  yMax: 90,
};

export const CRS_LV95: Crs = {
  iri: 'http://www.opengis.net/def/crs/EPSG/0/2056',
  labelKey: `${I18N}.crs.lv95`,
  xLabelKey: `${I18N}.easting`,
  yLabelKey: `${I18N}.northing`,
  xMin: 2484273.3,
  xMax: 2837939.88,
  yMin: 1073150.16,
  yMax: 1299970.97,
};

export const CRS_LV03: Crs = {
  iri: 'http://www.opengis.net/def/crs/EPSG/0/21781',
  labelKey: `${I18N}.crs.lv03`,
  xLabelKey: `${I18N}.easting`,
  yLabelKey: `${I18N}.northing`,
  xMin: 484273.3,
  xMax: 837939.88,
  yMin: 73150.16,
  yMax: 299970.97,
};

export const CRS_LIST: Crs[] = [CRS_84, CRS_LV95, CRS_LV03];

export const crsByIri = (iri: string): Crs | undefined => CRS_LIST.find(crs => crs.iri === iri);

/**
 * The editor's form value. The ordinates are **strings**, never numbers: binding them to `number`
 * would round-trip `8.550` as `8.55` and silently defeat the server's precision guarantee.
 */
export interface GeolocationFormValue {
  crs: string;
  x: string;
  y: string;
}

const LITERAL = /^\s*(?:<([^<>\s]*)>\s+)?[A-Za-z]+\s*\(([^()]*)\)\s*$/;

/**
 * Splits a stored value into the editor's form value. Prefers the fields dsp-api derives, and falls
 * back to parsing the literal when the server omitted them (they are optional).
 *
 * Returns `null` for anything this editor cannot represent — a line, an area, an elevation — so that
 * the caller can leave such a value untouched rather than destroy it.
 */
export function parseGeolocation(value?: ReadGeolocationValue): GeolocationFormValue | null {
  if (!value?.geolocation) {
    return null;
  }
  const match = LITERAL.exec(value.geolocation);
  const crs = value.crs || match?.[1] || CRS_84.iri;
  const coordinates = value.coordinates || match?.[2] || '';
  const ordinates = coordinates.trim().split(/\s+/);
  if (ordinates.length !== 2) {
    return null;
  }
  return { crs, x: ordinates[0], y: ordinates[1] };
}

/** Composes the literal to submit. The ordinates are passed through exactly as typed. */
export function composeGeolocation(value: GeolocationFormValue): string {
  return `<${value.crs}> POINT(${value.x} ${value.y})`;
}

export type OrdinateAxis = 'x' | 'y';

/**
 * Checks one ordinate against the selected CRS. Returns the violated bounds, or `null` when the
 * value is acceptable — including when it is empty, which is a "required" concern, not a range one.
 */
export function ordinateOutOfRange(
  crs: Crs,
  axis: OrdinateAxis,
  raw: string | null
): { min: number; max: number } | null {
  if (raw === null || raw.trim() === '') {
    return null;
  }
  const parsed = Number(raw);
  const [min, max] = axis === 'x' ? [crs.xMin, crs.xMax] : [crs.yMin, crs.yMax];
  if (Number.isNaN(parsed) || parsed < min || parsed > max) {
    return { min, max };
  }
  return null;
}
