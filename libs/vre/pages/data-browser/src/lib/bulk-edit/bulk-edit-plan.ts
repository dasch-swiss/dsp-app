import {
  Constants,
  CreateListValue,
  CreateValue,
  CreateTextValueAsString,
  ListNodeV2,
  ReadListValue,
  ReadResource,
  ReadTextValueAsString,
  ResourcePropertyDefinition,
  UpdateListValue,
  UpdateResource,
  UpdateResourceMetadata,
  UpdateTextValueAsString,
  UpdateValue,
} from '@dasch-swiss/dsp-js';
import { listRootIriFromGuiAttributes } from '@dasch-swiss/vre/shared/app-common';

/** What a bulk edit changes: the resource label, a plain-text property or a list property. */
export type BulkEditTarget =
  | { kind: 'label'; id: string }
  | { kind: 'text'; id: string; propertyDefinition: ResourcePropertyDefinition }
  | { kind: 'list'; id: string; propertyDefinition: ResourcePropertyDefinition; listRootIri: string };

/** A node of the property's list, flattened; `path` names its ancestors too. */
export interface BulkEditListOption {
  id: string;
  label: string;
  path: string;
  depth: number;
}

export type BulkEditOperation =
  | { kind: 'replace'; find: string; replaceWith: string; wholeValue: boolean; matchCase: boolean }
  | { kind: 'setValue'; text: string }
  | { kind: 'defaultValue'; text: string }
  | { kind: 'replaceListValue'; from: string; to: BulkEditListOption }
  | { kind: 'setListValue'; to: BulkEditListOption }
  | { kind: 'defaultListValue'; to: BulkEditListOption };

export type BulkEditOperationKind = BulkEditOperation['kind'];

/** A label can't be empty, so its “Set value” overwrites; a text's “Set value” only fills empty properties. */
export const BULK_EDIT_OPERATIONS: Record<BulkEditTarget['kind'], BulkEditOperationKind[]> = {
  label: ['setValue', 'replace'],
  text: ['defaultValue', 'replace'],
  list: ['replaceListValue', 'setListValue', 'defaultListValue'],
};

/** One write: the label, a value update when `value` is set, otherwise a value to create. */
export interface BulkEditChange {
  resource: ReadResource;
  value?: ReadTextValueAsString | ReadListValue;
  before: string | null;
  after: string;
  /** The text, the label or the list node IRI to write. */
  newValue: string;
}

export interface BulkEditPlan {
  changes: BulkEditChange[];
  /** Resources that keep every value as it is. */
  unchangedCount: number;
}

/** The label, then the plain-text and list properties the user may edit on this resource. */
export function bulkEditTargets(resource: ReadResource): BulkEditTarget[] {
  const targets: BulkEditTarget[] = [{ kind: 'label', id: Constants.Label }];

  for (const { propertyDefinition } of resource.entityInfo.classes[resource.type].getResourcePropertiesList()) {
    if (!(propertyDefinition instanceof ResourcePropertyDefinition) || !propertyDefinition.isEditable) {
      continue;
    }
    if (
      propertyDefinition.objectType === Constants.TextValue &&
      (propertyDefinition.guiElement === Constants.GuiSimpleText ||
        propertyDefinition.guiElement === Constants.GuiTextarea)
    ) {
      targets.push({ kind: 'text', id: propertyDefinition.id, propertyDefinition });
    }
    const listRootIri = listRootIriFromGuiAttributes(propertyDefinition.guiAttributes);
    if (propertyDefinition.objectType === Constants.ListValue && listRootIri) {
      targets.push({ kind: 'list', id: propertyDefinition.id, propertyDefinition, listRootIri });
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

export function planBulkEdit(
  resources: ReadResource[],
  target: BulkEditTarget,
  operation: BulkEditOperation
): BulkEditPlan {
  const changes: BulkEditChange[] = [];
  let unchangedCount = 0;

  for (const resource of resources) {
    const resourceChanges = _changesFor(resource, target, operation);
    if (resourceChanges.length === 0) {
      unchangedCount++;
    }
    changes.push(...resourceChanges);
  }

  return { changes, unchangedCount };
}

export type BulkEditRequest =
  | { kind: 'label'; payload: UpdateResourceMetadata }
  | { kind: 'update'; payload: UpdateResource<UpdateTextValueAsString | UpdateListValue> }
  | { kind: 'create'; payload: UpdateResource<CreateTextValueAsString | CreateListValue> };

/** The request for one change; a value's comment is carried over, since an update replaces the value. */
export function bulkEditRequest(change: BulkEditChange, target: BulkEditTarget): BulkEditRequest {
  if (target.kind === 'label') {
    const payload = new UpdateResourceMetadata();
    payload.id = change.resource.id;
    payload.type = change.resource.type;
    payload.label = change.newValue;
    payload.lastModificationDate = change.resource.lastModificationDate;
    return { kind: 'label', payload };
  }

  if (change.value) {
    const value = target.kind === 'list' ? new UpdateListValue() : new UpdateTextValueAsString();
    _setContent(value, change.newValue);
    value.id = change.value.id;
    if (change.value.valueHasComment) {
      value.valueHasComment = change.value.valueHasComment;
    }
    return { kind: 'update', payload: _updateResource(change.resource, target.id, value) };
  }

  const value = target.kind === 'list' ? new CreateListValue() : new CreateTextValueAsString();
  _setContent(value, change.newValue);
  return { kind: 'create', payload: _updateResource(change.resource, target.id, value) };
}

function _changesFor(resource: ReadResource, target: BulkEditTarget, operation: BulkEditOperation): BulkEditChange[] {
  if (target.kind === 'label') {
    const after = _textAfter(resource.label, operation);
    return after !== null && after.trim() !== '' && after !== resource.label
      ? [{ resource, before: resource.label, after, newValue: after }]
      : [];
  }

  if (target.kind === 'list') {
    const values = resource
      .getValues(target.id)
      .filter((value): value is ReadListValue => value instanceof ReadListValue);
    return _listChanges(resource, values, operation);
  }

  const values = resource
    .getValues(target.id)
    .filter((value): value is ReadTextValueAsString => value instanceof ReadTextValueAsString);
  if (operation.kind === 'defaultValue') {
    return values.length === 0 && operation.text
      ? [{ resource, before: null, after: operation.text, newValue: operation.text }]
      : [];
  }
  return values.flatMap(value => {
    const after = _textAfter(value.text, operation);
    return after !== null && after !== value.text
      ? [{ resource, value, before: value.text, after, newValue: after }]
      : [];
  });
}

function _listChanges(resource: ReadResource, values: ReadListValue[], operation: BulkEditOperation): BulkEditChange[] {
  if (
    operation.kind !== 'replaceListValue' &&
    operation.kind !== 'setListValue' &&
    operation.kind !== 'defaultListValue'
  ) {
    return [];
  }
  const { to } = operation;
  // A resource can't hold the same list value twice.
  if (values.some(value => value.listNode === to.id)) {
    return [];
  }
  const change = (value?: ReadListValue): BulkEditChange => ({
    resource,
    value,
    before: value ? value.listNodeLabel : null,
    after: to.path,
    newValue: to.id,
  });

  switch (operation.kind) {
    case 'replaceListValue': {
      const match = values.find(value => value.listNode === operation.from);
      return match ? [change(match)] : [];
    }
    case 'setListValue':
      return [change(values[0])];
    case 'defaultListValue':
      return values.length === 0 ? [change()] : [];
  }
}

/** The text after a text operation; null when the operation is not a text operation. */
function _textAfter(text: string, operation: BulkEditOperation): string | null {
  switch (operation.kind) {
    case 'setValue':
      return operation.text;
    case 'replace': {
      if (!operation.find) {
        return text;
      }
      if (operation.wholeValue) {
        const matches = operation.matchCase
          ? text === operation.find
          : text.toLocaleLowerCase() === operation.find.toLocaleLowerCase();
        return matches ? operation.replaceWith : text;
      }
      const pattern = new RegExp(
        operation.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        operation.matchCase ? 'g' : 'gi'
      );
      return text.replace(pattern, () => operation.replaceWith);
    }
    default:
      return null;
  }
}

function _setContent(
  value: UpdateTextValueAsString | UpdateListValue | CreateTextValueAsString | CreateListValue,
  content: string
) {
  if (value instanceof UpdateListValue || value instanceof CreateListValue) {
    value.listNode = content;
  } else {
    value.text = content;
  }
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
