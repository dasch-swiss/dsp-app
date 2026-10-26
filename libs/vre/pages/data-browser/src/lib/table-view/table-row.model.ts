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

/** How many values a read-only cell shows before collapsing the rest. Editable cells render every value. */
export const COLLAPSED_VALUE_COUNT = 3;

/**
 * One cell, resolved to what it will render. `propertyInfo` set means the cell mounts the viewer's
 * property unit; otherwise `values` holds the plain-text path (read-only columns).
 */
export interface TableCell {
  readonly columnKey: string;
  /** The text of a non-property column (label or rights field); undefined on property columns. */
  readonly text?: string;
  readonly image?: TableImage;
  /** Where the text links to; only the license, to its Creative Commons deed. */
  readonly href?: string;
  /** True when the text is the project's default standing in for the resource's own (authorship). */
  readonly isFallback?: boolean;
  /** What `app-property-values` needs on its `myProperty` input; undefined when there is no editor to mount. */
  readonly propertyInfo?: PropertyInfoValues;
  readonly values: readonly ReadValue[];
  readonly collapsedValues: readonly ReadValue[];
  readonly hiddenCount: number;
  readonly isCollapsible: boolean;
  readonly isEmpty: boolean;
}

export interface TableImage {
  /** IIIF request for the small rendition drawn in the cell. */
  readonly url: string;
  /** IIIF request for the larger rendition of the hover preview. */
  readonly previewUrl: string;
  /** Served by DSP's Sipi, which needs the user's token for a non-public image. */
  readonly isSipi: boolean;
}

/**
 * One row, with every cell pre-resolved once per data emission so the template does no per-cell
 * method calls. `cells` is a plain record for the same reason.
 */
export interface TableRow {
  readonly resource: ReadResource;
  /** Built once per row because `generateDspResource` walks the whole class; undefined sends every cell down the plain-text path. */
  readonly dspResource?: DspResource;
  readonly id: string;
  readonly label: string;
  readonly cells: Readonly<Record<string, TableCell>>;
}

/** The permission strings dsp-api issues. */
const KNOWN_PERMISSIONS: ReadonlySet<string> = new Set(['RV', 'V', 'M', 'D', 'CR']);

/**
 * Model the resource the way the resource editor does, or give up on it.
 *
 * `commonProperty` throws for a class missing from the ontology, and `PermissionUtil.allUserPermissions`
 * (run by `app-property-values` on every change-detection pass) throws on an unknown permission string,
 * which would break the whole page; so the permission is checked up front.
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

/** One field of the Resource Rights Statement. `rights` is undefined until the project's legal info has loaded. */
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

/** IIIF size a thumbnail is requested at: twice the largest Auto-height draw size, for high-density screens. */
const THUMBNAIL_BOX = '!256,256';

/** The hover preview's rendition. */
const PREVIEW_BOX = '!640,640';

/** Swaps the IIIF size segment of an external URL; a URL without the IIIF shape is used as given. */
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

export interface RowRights {
  /** The project's legal info; undefined while it loads or if it could not be loaded. */
  readonly rights?: ProjectDataRights;
  /** Shown in place of a placeholder legal value, already translated. */
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

export function buildRow(resource: ReadResource, columns: TableColumn[], rowRights: RowRights): TableRow {
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
}

/** The row with only its rights-statement cells rebuilt; other cells and `dspResource` are kept by identity. */
export function withRights(row: TableRow, columns: TableColumn[], rowRights: RowRights): TableRow {
  const cells = { ...row.cells };
  for (const column of columns) {
    if (column.rightsField) {
      cells[column.key] = cellFor(row.resource, row.dspResource, column, rowRights);
    }
  }
  return { ...row, cells };
}

export function buildRows(
  resources: ReadResource[],
  columns: TableColumn[],
  rowRights: RowRights = { placeholderLabel: '' }
): TableRow[] {
  return resources.map(resource => buildRow(resource, columns, rowRights));
}
