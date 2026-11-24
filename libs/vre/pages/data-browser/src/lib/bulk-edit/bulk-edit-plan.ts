import {
  Cardinality,
  Constants,
  CreateValue,
  ListNodeV2,
  ReadListValue,
  ReadResource,
  ReadTextValue,
  ReadTextValueAsString,
  ResourcePropertyDefinition,
  UpdateResource,
  UpdateResourceMetadata,
  UpdateValue,
} from '@dasch-swiss/dsp-js';
import { propertiesTypeMapping } from '@dasch-swiss/vre/resource-editor/resource-editor';
import { listRootIriFromGuiAttributes } from '@dasch-swiss/vre/shared/app-common';

/**
 * What a bulk edit changes: the resource label, a plain-text, rich-text or list property. `multiple`: the
 * property takes several values per resource.
 */
export type BulkEditTarget =
  | { kind: 'label'; id: string }
  | {
      kind: 'text' | 'richText';
      id: string;
      propertyDefinition: ResourcePropertyDefinition;
      cardinality: Cardinality;
      multiple: boolean;
    }
  | {
      kind: 'list';
      id: string;
      propertyDefinition: ResourcePropertyDefinition;
      cardinality: Cardinality;
      listRootIri: string;
      multiple: boolean;
    };

export type BulkEditPropertyTarget = Exclude<BulkEditTarget, { kind: 'label' }>;

/** A node of the property's list, flattened; `path` names its ancestors too. */
export interface BulkEditListOption {
  id: string;
  label: string;
  path: string;
  depth: number;
}

/**
 * A value to write, as the resource creation form's editor gives it: the text, the rich text's HTML or the
 * list node IRI. `display` is how the preview shows it.
 */
export interface BulkEditNewValue {
  content: string;
  display: string;
  /** The value's comment, as the creation form adds one. */
  comment?: string;
}

/**
 * “Set value” writes `values` (a label takes the first). With `onlyEmpty`, resources that have a value keep
 * it; otherwise a single new value replaces a resource's single value.
 */
export interface BulkEditOperation {
  values: BulkEditNewValue[];
  onlyEmpty: boolean;
}

/**
 * Overwriting is unambiguous only for one new value: several new values can only fill empty properties.
 */
export function canOverwrite(valueCount: number): boolean {
  return valueCount <= 1;
}

/** One write: the label, a value update when `value` is set, otherwise a value to create. */
export interface BulkEditChange {
  resource: ReadResource;
  value?: ReadTextValue | ReadListValue;
  before: string | null;
  after: string;
  /** The label, the text, the rich text's HTML or the list node IRI to write. */
  newValue: string;
  /** A comment to write with the value; without one, an updated value keeps its own. */
  comment?: string;
}

export interface BulkEditPlan {
  changes: BulkEditChange[];
  /** Resources that keep every value as it is. */
  unchangedCount: number;
  /** Resources left out, wholly or in part, because the user may not modify them or their values. */
  noRightsCount: number;
  /** Resources an overwrite leaves alone because they hold several values: which one to replace is unclear. */
  severalKeptCount: number;
}

/** The label, then the plain-text, rich-text and list properties the user may edit on this resource. */
export function bulkEditTargets(resource: ReadResource): BulkEditTarget[] {
  const targets: BulkEditTarget[] = [{ kind: 'label', id: Constants.Label }];

  for (const { propertyDefinition, cardinality } of resource.entityInfo.classes[
    resource.type
  ].getResourcePropertiesList()) {
    if (!(propertyDefinition instanceof ResourcePropertyDefinition) || !propertyDefinition.isEditable) {
      continue;
    }
    const multiple = cardinality === Cardinality._0_n || cardinality === Cardinality._1_n;
    if (propertyDefinition.objectType === Constants.TextValue) {
      if (
        propertyDefinition.guiElement === Constants.GuiSimpleText ||
        propertyDefinition.guiElement === Constants.GuiTextarea
      ) {
        targets.push({ kind: 'text', id: propertyDefinition.id, propertyDefinition, cardinality, multiple });
      } else if (propertyDefinition.guiElement === Constants.GuiRichText) {
        targets.push({ kind: 'richText', id: propertyDefinition.id, propertyDefinition, cardinality, multiple });
      }
    }
    const listRootIri = listRootIriFromGuiAttributes(propertyDefinition.guiAttributes);
    if (propertyDefinition.objectType === Constants.ListValue && listRootIri) {
      targets.push({
        kind: 'list',
        id: propertyDefinition.id,
        propertyDefinition,
        cardinality,
        listRootIri,
        multiple,
      });
    }
  }
  return targets;
}

/** The list's nodes in tree order, without the root. */
export function flattenList(root: ListNodeV2): BulkEditListOption[] {
  const options: BulkEditListOption[] = [];
  const visit = (node: ListNodeV2, ancestors: string[]) => {
    for (const child of node.children) {
      const path = [...ancestors, child.label];
      options.push({ id: child.id, label: child.label, path: path.join(' › '), depth: ancestors.length });
      visit(child, path);
    }
  };
  visit(root, []);
  return options;
}

/** The text a rich-text value shows, for the preview. */
export function richTextDisplay(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function planBulkEdit(
  resources: ReadResource[],
  target: BulkEditTarget,
  operation: BulkEditOperation
): BulkEditPlan {
  const changes: BulkEditChange[] = [];
  let unchangedCount = 0;
  let noRightsCount = 0;
  let severalKeptCount = 0;

  for (const resource of resources) {
    const { changes: resourceChanges, severalKept } = _changesFor(resource, target, operation);
    const allowed = resourceChanges.filter(_canWrite);
    if (allowed.length < resourceChanges.length) {
      noRightsCount++;
    } else if (severalKept) {
      severalKeptCount++;
    } else if (resourceChanges.length === 0) {
      unchangedCount++;
    }
    changes.push(...allowed);
  }

  return { changes, unchangedCount, noRightsCount, severalKeptCount };
}

/**
 * dsp-api lets a user write a label or create a value with modify rights on the resource, and update a
 * value with modify rights on that value.
 */
function _canWrite(change: BulkEditChange): boolean {
  return _canModify(change.value ?? change.resource);
}

function _canModify(entity: { userHasPermission: string }): boolean {
  return ['M', 'D', 'CR'].includes(entity.userHasPermission);
}

export type BulkEditRequest =
  | { kind: 'label'; payload: UpdateResourceMetadata }
  | { kind: 'update'; payload: UpdateResource<UpdateValue> }
  | { kind: 'create'; payload: UpdateResource<CreateValue> };

/**
 * The request for one change, built like the resource editor builds it; a value's comment is carried over,
 * since an update replaces the value.
 */
export function bulkEditRequest(change: BulkEditChange, target: BulkEditTarget): BulkEditRequest {
  if (target.kind === 'label') {
    const payload = new UpdateResourceMetadata();
    payload.id = change.resource.id;
    payload.type = change.resource.type;
    payload.label = change.newValue;
    payload.lastModificationDate = change.resource.lastModificationDate;
    return { kind: 'label', payload };
  }

  const mapping = propertiesTypeMapping.get(target.propertyDefinition.objectType!)!;
  if (change.value) {
    const value = mapping.updateValue(change.value.id, change.newValue, target.propertyDefinition);
    const comment = change.comment ?? change.value.valueHasComment;
    if (comment) {
      value.valueHasComment = comment;
    }
    return { kind: 'update', payload: _updateResource(change.resource, target.id, value) };
  }

  const value = mapping.createValue(change.newValue, target.propertyDefinition);
  if (change.comment) {
    value.valueHasComment = change.comment;
  }
  return { kind: 'create', payload: _updateResource(change.resource, target.id, value) };
}

function _changesFor(
  resource: ReadResource,
  target: BulkEditTarget,
  operation: BulkEditOperation
): { changes: BulkEditChange[]; severalKept: boolean } {
  if (target.kind === 'label') {
    const after = operation.values[0]?.content;
    return {
      changes:
        after !== undefined && after.trim() !== '' && after !== resource.label
          ? [{ resource, before: resource.label, after, newValue: after }]
          : [],
      severalKept: false,
    };
  }

  const existing = _existingValues(resource, target);
  if (existing.length === 0) {
    return {
      changes: operation.values.map(({ content, display, comment }) => ({
        resource,
        before: null,
        after: display,
        newValue: content,
        ...(comment && { comment }),
      })),
      severalKept: false,
    };
  }

  const [next] = operation.values;
  if (operation.onlyEmpty || !next || !canOverwrite(operation.values.length)) {
    return { changes: [], severalKept: false };
  }
  if (existing.length > 1) {
    return { changes: [], severalKept: true };
  }
  const [current] = existing;
  if (current.content === next.content) {
    return { changes: [], severalKept: false };
  }
  return {
    changes: [
      {
        resource,
        value: current.value,
        before: current.display,
        after: next.display,
        newValue: next.content,
        ...(next.comment && { comment: next.comment }),
      },
    ],
    severalKept: false,
  };
}

interface ExistingValue {
  value: ReadTextValue | ReadListValue;
  content: string;
  display: string;
}

function _existingValues(resource: ReadResource, target: BulkEditPropertyTarget): ExistingValue[] {
  const values = resource.getValues(target.id);
  switch (target.kind) {
    case 'list':
      return values
        .filter((value): value is ReadListValue => value instanceof ReadListValue)
        .map(value => ({ value, content: value.listNode, display: value.listNodeLabel }));
    case 'richText':
      return values
        .filter((value): value is ReadTextValue => value instanceof ReadTextValue)
        .map(value => {
          const html = _richTextHtml(value);
          return { value, content: html, display: richTextDisplay(html) };
        });
    case 'text':
      return values
        .filter((value): value is ReadTextValueAsString => value instanceof ReadTextValueAsString)
        .map(value => ({ value, content: value.text, display: value.text }));
  }
}

/** A rich-text value's HTML, unwrapped from its XML document as the resource editor's control unwraps it. */
function _richTextHtml(value: ReadTextValue): string {
  const strval = value.strval ?? '';
  const match = strval.match(/<\?xml version="1\.0" encoding="UTF-8"\?>\n<text>([\s\S]*)<\/text>/);
  return match ? match[1] : strval;
}

function _updateResource<T extends UpdateValue | CreateValue>(
  resource: ReadResource,
  propertyIri: string,
  value: T
): UpdateResource<T> {
  const updateResource = new UpdateResource<T>();
  updateResource.id = resource.id;
  updateResource.type = resource.type;
  updateResource.property = propertyIri;
  updateResource.value = value;
  return updateResource;
}
