import {
  Constants,
  ReadResource,
  ReadStillImageExternalFileValue,
  ReadStillImageFileValue,
  ReadValue,
} from '@dasch-swiss/dsp-js';
import {
  DspResource,
  generateDspResource,
  joinPlaceholderLegalValues,
  PropertyInfoValues,
} from '@dasch-swiss/vre/shared/app-common';
import { ProjectDataRights } from '@dasch-swiss/vre/shared/app-helper-services';
import { LABEL_COLUMN_KEY, RightsField, TableColumn } from './table-column.model';

/**
 * How many values a read-only cell shows before it collapses the rest behind a "show more"
 * control.
 *
 * Read-only cells only. A cell the resource editor can open renders every value, because it
 * renders them through `app-property-values` — the viewer's own unit, which knows nothing of a
 * table and shows a property's values in full. Collapsing three of them would mean either
 * reimplementing the viewer's list (the thing this feature exists not to do) or hiding values
 * that carry their own edit and delete controls, which is worse than a tall row.
 */
export const COLLAPSED_VALUE_COUNT = 3;

/**
 * One cell, resolved to what it will render.
 *
 * Two shapes, discriminated by which field is set. `propertyInfo` means the cell mounts the
 * resource viewer's own property unit and renders — and edits — its values exactly as the panel
 * beside the table does. `values` means the plain-text path, which is what a read-only column
 * gets: `GenerateProperty.commonProperty` drops link, file-value and geometry properties, so
 * there is no `PropertyInfoValues` for them and nothing of the viewer to mount.
 */
export interface TableCell {
  readonly columnKey: string;
  /**
   * The text of a column that is not a property: the label, or a rights-statement field.
   *
   * Undefined on every property column. Neither the resource label nor the rights statement is a
   * value: there is no `ReadValue` behind them and no property definition, so they stay plain text.
   */
  readonly text?: string;
  /** The image column's image. See {@link TableImage}. */
  readonly image?: TableImage;
  /** Where the text links to. Only the license, to its Creative Commons deed. */
  readonly href?: string;
  /**
   * True when the text is not the resource's own but the project's default standing in for it —
   * authorship, when the resource records none. Shown as such, never asserted as the resource's.
   */
  readonly isFallback?: boolean;
  /**
   * What `app-property-values` needs on its `myProperty` input, or undefined when this column has
   * no editor to mount.
   */
  readonly propertyInfo?: PropertyInfoValues;
  /** The plain-text path's values, in the order dsp-api returned them. Empty on a viewer cell. */
  readonly values: readonly ReadValue[];
  /** The first `COLLAPSED_VALUE_COUNT` of them, so the collapsed branch needs no slicing. */
  readonly collapsedValues: readonly ReadValue[];
  /** How many values the collapsed branch hides. Zero when the cell is not collapsible. */
  readonly hiddenCount: number;
  readonly isCollapsible: boolean;
  /** True when there is nothing to render: no value for this property, or an empty label. */
  readonly isEmpty: boolean;
}

/** A resource's still image, as the image column shows it. */
export interface TableImage {
  /** IIIF request for the small rendition drawn in the cell. */
  readonly url: string;
  /** IIIF request for the larger rendition the hover preview shows, fetched only when it opens. */
  readonly previewUrl: string;
  /** Served by DSP's own Sipi, which needs the user's token to serve a non-public image. */
  readonly isSipi: boolean;
}

/**
 * One row, with every cell pre-resolved.
 *
 * Built once per data emission rather than read per cell in the template. At 25 rows by 40 columns
 * a `getValues()` call in a binding is a thousand calls per change-detection pass, and under
 * `OnPush` with sticky columns that pass runs more often than the data changes.
 *
 * `cells` is a plain record rather than a `Map` for the same reason: the template reaches a cell by
 * property access instead of a method call.
 */
export interface TableRow {
  readonly resource: ReadResource;
  /**
   * The same resource as the resource editor models it, built once per row.
   *
   * Every cell of the row needs it — to seed its `ResourceFetcherService` and to find its own
   * `PropertyInfoValues` — and `generateDspResource` walks the whole class each time it is
   * called. Once per row is 25 walks per page; once per cell would be a thousand.
   *
   * Undefined when the resource cannot be modelled at all, which sends every cell of the row down
   * the plain-text path. See {@link _generate}.
   */
  readonly dspResource?: DspResource;
  /** The resource IRI. Used as the `trackBy` key. */
  readonly id: string;
  readonly label: string;
  readonly cells: Readonly<Record<string, TableCell>>;
}

/** The permission strings dsp-api issues. Anything else is not a permission we can reason about. */
const KNOWN_PERMISSIONS: ReadonlySet<string> = new Set(['RV', 'V', 'M', 'D', 'CR']);

/**
 * Model the resource the way the resource editor does, or give up on it.
 *
 * Two things in that subtree throw rather than answering "no", and both are reachable from
 * ordinary data:
 *
 * - `GenerateProperty.commonProperty` indexes `entityInfo.classes[resource.type]`, which is absent
 *   if the batch fetch returned a resource of a class the page's ontology does not describe.
 * - `app-property-values` asks `ResourceUtil.userCanEdit` on every change-detection pass, and that
 *   delegates to `PermissionUtil.allUserPermissions`, which *throws* on a permission string it
 *   does not recognise. One such resource would take down the render of the whole page, every
 *   pass, not just its own row — so the string is checked before anything is mounted over it.
 *
 * Giving up costs the row its editors and leaves it readable. That is the right trade: the
 * alternative is twenty-five blank rows.
 */
function _generate(resource: ReadResource): DspResource | undefined {
  if (!KNOWN_PERMISSIONS.has(resource.userHasPermission)) {
    return undefined;
  }

  try {
    return generateDspResource(resource);
  } catch {
    return undefined;
  }
}

const EMPTY_VALUES: readonly ReadValue[] = [];

function _textCell(column: TableColumn, text: string, extra: Partial<TableCell> = {}): TableCell {
  return {
    columnKey: column.key,
    text,
    values: EMPTY_VALUES,
    collapsedValues: EMPTY_VALUES,
    hiddenCount: 0,
    isCollapsible: false,
    isEmpty: text === '',
    ...extra,
  };
}

/**
 * One field of the Resource Rights Statement, read the way the viewer's statement reads it.
 *
 * `rights` is undefined until the project's legal info has loaded. The project-level fields are
 * then blank rather than "not set", which they may well not be — and authorship already shows the
 * resource's own, which needs nothing from the project.
 */
function _rightsCell(
  resource: ReadResource,
  column: TableColumn,
  field: RightsField,
  rights: ProjectDataRights | undefined,
  placeholderLabel: string
): TableCell {
  if (field === 'authorship' && resource.resourceAuthorship.length > 0) {
    return _textCell(column, joinPlaceholderLegalValues(resource.resourceAuthorship, placeholderLabel));
  }
  if (!rights) {
    return { ..._textCell(column, ''), isEmpty: false };
  }

  switch (field) {
    case 'license':
      return rights.isPlaceholderLicense
        ? _textCell(column, placeholderLabel)
        : _textCell(column, rights.licenseLabel ?? '', { href: rights.licenseUrl });
    case 'copyrightHolder':
      return _textCell(column, rights.isPlaceholderCopyrightHolder ? placeholderLabel : (rights.copyrightHolder ?? ''));
    case 'authorship':
      return _textCell(column, joinPlaceholderLegalValues(rights.defaultDataAuthorship, placeholderLabel), {
        isFallback: true,
      });
  }
}

/**
 * The IIIF size a thumbnail is requested at: the image scaled to fit inside this box. Twice the
 * largest it is drawn at in an Auto-height row, so it stays sharp on a high-density screen; a taller
 * row from View options draws it larger, and it softens rather than costing every row a bigger file.
 */
const THUMBNAIL_BOX = '!256,256';

/** The hover preview's rendition: twice the box it is drawn in, for the same reason. */
const PREVIEW_BOX = '!640,640';

/**
 * An external image is a full IIIF image request, often for the whole image at full size. Its
 * size segment is swapped for the thumbnail box when the URL has the IIIF shape; anything else is
 * used as given, since there is no telling what a server makes of a rewritten path.
 */
function _withSize(url: string, box: string): string {
  return url.replace(/\/([^/]+)\/([^/]+)\/(!?\d+(?:\.\d+)?)\/(\w+)\.(jpg|png|webp|gif|tif)$/, `/$1/${box}/$3/$4.$5`);
}

function _imageCell(resource: ReadResource, column: TableColumn): TableCell {
  const file = resource.properties[Constants.HasStillImageFileValue]?.[0];
  let image: TableImage | undefined;
  if (file instanceof ReadStillImageFileValue && file.iiifBaseUrl && file.filename) {
    const base = `${file.iiifBaseUrl}/${file.filename}/full`;
    image = {
      url: `${base}/${THUMBNAIL_BOX}/0/default.jpg`,
      previewUrl: `${base}/${PREVIEW_BOX}/0/default.jpg`,
      isSipi: true,
    };
  } else if (file instanceof ReadStillImageExternalFileValue && file.externalUrl) {
    image = {
      url: _withSize(file.externalUrl, THUMBNAIL_BOX),
      previewUrl: _withSize(file.externalUrl, PREVIEW_BOX),
      isSipi: false,
    };
  }

  return {
    columnKey: column.key,
    image,
    values: EMPTY_VALUES,
    collapsedValues: EMPTY_VALUES,
    hiddenCount: 0,
    isCollapsible: false,
    isEmpty: image === undefined,
  };
}

/** What a row needs beyond its resource to render the rights-statement columns. */
export interface RowRights {
  /** The project's legal info; undefined while it loads, or if it could not be loaded. */
  readonly rights?: ProjectDataRights;
  /** The readable marker shown in place of a placeholder legal value, already translated. */
  readonly placeholderLabel: string;
}

function cellFor(
  resource: ReadResource,
  dspResource: DspResource | undefined,
  column: TableColumn,
  rowRights: RowRights
): TableCell {
  if (column.key === LABEL_COLUMN_KEY) {
    return _textCell(column, resource.label);
  }
  if (column.isImage) {
    return _imageCell(resource, column);
  }
  if (column.rightsField) {
    return _rightsCell(resource, column, column.rightsField, rowRights.rights, rowRights.placeholderLabel);
  }

  // The resource editor's own answer to "is there an editor for this property", not a second
  // opinion: a property `commonProperty` dropped has no `PropertyInfoValues` here either, which is
  // exactly the read-only family of PRD §9.11. The column model's `isEditable` agrees, but this is
  // the authority — it is the object the editor would actually be handed.
  const propertyInfo = dspResource?.resProps.find(prop => prop.propDef.id === column.propertyIri);
  if (propertyInfo) {
    return {
      columnKey: column.key,
      propertyInfo,
      values: EMPTY_VALUES,
      collapsedValues: EMPTY_VALUES,
      hiddenCount: 0,
      isCollapsible: false,
      isEmpty: propertyInfo.values.length === 0,
    };
  }

  // Every value, including one whose `strval` dsp-api could not produce: an empty string in a cell
  // that holds a value still says "something is here", which is more honest than the "— not set"
  // an omitted value would read as.
  const values = resource.getValues(column.propertyIri ?? '');
  const isCollapsible = values.length > COLLAPSED_VALUE_COUNT;

  return {
    columnKey: column.key,
    values,
    collapsedValues: isCollapsible ? values.slice(0, COLLAPSED_VALUE_COUNT) : values,
    hiddenCount: isCollapsible ? values.length - COLLAPSED_VALUE_COUNT : 0,
    isCollapsible,
    isEmpty: values.length === 0,
  };
}

/** Resolve a page of resources against the column model. */
export function buildRows(
  resources: ReadResource[],
  columns: TableColumn[],
  rowRights: RowRights = { placeholderLabel: '' }
): TableRow[] {
  return resources.map(resource => {
    const dspResource = _generate(resource);

    return {
      resource,
      dspResource,
      id: resource.id,
      label: resource.label,
      cells: columns.reduce<Record<string, TableCell>>((cells, column) => {
        cells[column.key] = cellFor(resource, dspResource, column, rowRights);
        return cells;
      }, {}),
    };
  });
}
