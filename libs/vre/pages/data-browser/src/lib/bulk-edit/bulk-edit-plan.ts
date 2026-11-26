import {
  Cardinality,
  Constants,
  CreateValue,
  DeleteValue,
  ListNodeV2,
  ReadLinkValue,
  ReadListValue,
  ReadResource,
  ReadTextValue,
  ReadTextValueAsString,
  ReadValue,
  ResourcePropertyDefinition,
  UpdateResource,
  UpdateResourceMetadata,
  UpdateValue,
} from '@dasch-swiss/dsp-js';
import { BulkEditBatchChange } from '@dasch-swiss/vre/3rd-party-services/api';
import { ApiConstants } from '@dasch-swiss/vre/core/config';
import { propertiesTypeMapping } from '@dasch-swiss/vre/resource-editor/resource-editor';
import { listRootIriFromGuiAttributes } from '@dasch-swiss/vre/shared/app-common';

/**
 * What a bulk edit changes: the resource label, a plain-text, rich-text or list property, or another property
 * whose values can only be removed for now (`other`: dates, numbers, links…). `multiple`: the property takes
 * several values per resource.
 */
export type BulkEditTarget =
  | { kind: 'label'; id: string }
  | {
      kind: 'text' | 'richText' | 'other';
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

type BulkEditPropertyTarget = Exclude<BulkEditTarget, { kind: 'label' }>;

/** Values of these targets can be set; the others can only be removed. */
export function canSet(target: BulkEditTarget): boolean {
  return target.kind !== 'other';
}

/** A required property must keep a value, and every resource has a label: neither can be emptied. */
export function canRemove(target: BulkEditTarget): boolean {
  return target.kind !== 'label' && target.cardinality !== Cardinality._1 && target.cardinality !== Cardinality._1_n;
}

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
 * it; otherwise a single new value replaces a resource's single value. “Remove values” deletes every value.
 */
export type BulkEditOperation = BulkEditSetOperation | { kind: 'remove' };

export interface BulkEditSetOperation {
  kind?: 'set';
  values: BulkEditNewValue[];
  onlyEmpty: boolean;
}

/**
 * Overwriting is unambiguous only for one new value: several new values can only fill empty properties.
 */
export function canOverwrite(valueCount: number): boolean {
  return valueCount <= 1;
}

/**
 * One write: the label, a value update when `value` is set, otherwise a value to create; with `remove`, the
 * deletion of `value`.
 */
export interface BulkEditChange {
  resource: ReadResource;
  value?: ReadValue;
  remove?: boolean;
  before: string | null;
  after: string;
  /** The label, the text, the rich text's HTML or the list node IRI to write. */
  newValue: string;
  /** What an updated value holds now (the text or the list node IRI): the batch route checks it is unchanged. */
  expected?: string;
  /**
   * A retried create on a resource whose other new values were written by the earlier run: the property holds
   * those now, so the batch route must not expect it empty.
   */
  afterOwnValues?: boolean;
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

/**
 * The label, then the properties the user may edit on this resource: those the resource creation form writes.
 * Plain text, rich text and lists can be set; the others can be removed.
 */
export function bulkEditTargets(resource: ReadResource): BulkEditTarget[] {
  const targets: BulkEditTarget[] = [{ kind: 'label', id: Constants.Label }];
  for (const { propertyDefinition, cardinality } of resource.entityInfo.classes[
    resource.type
  ].getResourcePropertiesList()) {
    // The properties the resource creation form offers: none of the built-in knora-api ones, such as
    // knora-api:hasDescription, which every class inherits.
    if (propertyDefinition.id.startsWith(ApiConstants.apiKnoraOntologyUrl)) {
      continue;
    }
    if (!(propertyDefinition instanceof ResourcePropertyDefinition) || !propertyDefinition.isEditable) {
      continue;
    }
    if (!propertiesTypeMapping.has(propertyDefinition.objectType!)) {
      continue;
    }
    const multiple = cardinality === Cardinality._0_n || cardinality === Cardinality._1_n;
    const base = { id: propertyDefinition.id, propertyDefinition, cardinality, multiple };
    const listRootIri = listRootIriFromGuiAttributes(propertyDefinition.guiAttributes);
    if (
      propertyDefinition.objectType === Constants.TextValue &&
      (propertyDefinition.guiElement === Constants.GuiSimpleText ||
        propertyDefinition.guiElement === Constants.GuiTextarea)
    ) {
      targets.push({ kind: 'text', ...base });
    } else if (
      propertyDefinition.objectType === Constants.TextValue &&
      propertyDefinition.guiElement === Constants.GuiRichText
    ) {
      targets.push({ kind: 'richText', ...base });
    } else if (propertyDefinition.objectType === Constants.ListValue && listRootIri) {
      targets.push({ kind: 'list', ...base, listRootIri });
    } else {
      targets.push({ kind: 'other', ...base });
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
  return (
    html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      // Last, so an escaped entity such as `&amp;lt;` stays the text `&lt;`.
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()
  );
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
 * dsp-api lets a user write a label or create a value with modify rights on the resource, update a value with
 * modify rights on that value, and delete it with delete rights on it.
 */
function _canWrite(change: BulkEditChange): boolean {
  if (change.remove) {
    return ['D', 'CR'].includes(change.value!.userHasPermission);
  }
  return _canModify(change.value ?? change.resource);
}

function _canModify(entity: { userHasPermission: string }): boolean {
  return ['M', 'D', 'CR'].includes(entity.userHasPermission);
}

export type BulkEditRequest =
  | { kind: 'label'; payload: UpdateResourceMetadata }
  | { kind: 'update'; payload: UpdateResource<UpdateValue> }
  | { kind: 'create'; payload: UpdateResource<CreateValue> }
  | { kind: 'delete'; payload: UpdateResource<DeleteValue> };

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

  if (change.remove) {
    const value = new DeleteValue();
    value.id = change.value!.id;
    value.type = change.value!.type;
    return { kind: 'delete', payload: _updateResource(change.resource, target.id, value) };
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
  if (operation.kind === 'remove') {
    if (!canRemove(target)) {
      return { changes: [], severalKept: false };
    }
    return {
      changes: _existingValues(resource, target as BulkEditPropertyTarget).map(({ value, display }) => ({
        resource,
        value,
        remove: true,
        before: display,
        after: '',
        newValue: '',
      })),
      severalKept: false,
    };
  }

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
  if (target.kind === 'other') {
    return { changes: [], severalKept: false };
  }
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
        expected: current.content,
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
  value: ReadValue;
  content: string;
  display: string;
}

/** A resource's values of this property, with what the preview shows of each. */
export function existingValues(resource: ReadResource, target: BulkEditTarget): ExistingValue[] {
  return target.kind === 'label' ? [] : _existingValues(resource, target);
}

function _existingValues(resource: ReadResource, target: BulkEditPropertyTarget): ExistingValue[] {
  const values = resource.getValues(target.id);
  switch (target.kind) {
    case 'other':
      return values.map(value => {
        const display =
          value instanceof ReadLinkValue ? (value.linkedResource?.label ?? value.strval ?? '') : (value.strval ?? '');
        return { value, content: display, display };
      });
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

/** dsp-api's `POST /v3/resources/values/batch` takes at most this many changes per request. */
const BATCH_SIZE = 100;

/**
 * The change as the batch route takes it, or null when the route cannot apply it: it creates and updates plain
 * text and list values and labels, but refuses formatted text, removes nothing, and writes no comment.
 * A value created where the property was empty says so (`expectEmpty`), so a value added since is not doubled.
 */
export function batchChangeOf(change: BulkEditChange, target: BulkEditTarget): BulkEditBatchChange | null {
  if (change.remove || change.comment) {
    return null;
  }
  if (target.kind === 'label') {
    return { resource: change.resource.id, label: { expected: change.before ?? '', new: change.newValue } };
  }
  if (target.kind !== 'text' && target.kind !== 'list') {
    return null;
  }
  if (change.value) {
    return {
      resource: change.resource.id,
      property: target.id,
      value: change.value.id,
      expected: change.expected,
      new: change.newValue,
    };
  }
  if (change.afterOwnValues) {
    return { resource: change.resource.id, property: target.id, new: change.newValue };
  }
  return { resource: change.resource.id, property: target.id, new: change.newValue, expectEmpty: true };
}

/**
 * Splits changes into batches of at most `size`, never splitting one resource's changes: its new values must
 * reach the route together, or `expectEmpty` would refuse the ones of the second batch.
 */
export function batchesOf<T extends { resource: { id: string } }>(changes: T[], size = BATCH_SIZE): T[][] {
  const batches: T[][] = [];
  let current: T[] = [];
  for (let i = 0; i < changes.length;) {
    let end = i + 1;
    while (end < changes.length && changes[end].resource.id === changes[i].resource.id) {
      end++;
    }
    const group = changes.slice(i, end);
    if (current.length && current.length + group.length > size) {
      batches.push(current);
      current = [];
    }
    current.push(...group);
    i = end;
  }
  if (current.length) {
    batches.push(current);
  }
  return batches;
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
