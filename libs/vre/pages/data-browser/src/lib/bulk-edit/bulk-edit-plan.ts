import {
  Cardinality,
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

/**
 * What a bulk edit changes: the resource label, a plain-text property or a list property. `multiple`: the
 * property takes several values per resource.
 */
export type BulkEditTarget =
  | { kind: 'label'; id: string }
  | { kind: 'text'; id: string; propertyDefinition: ResourcePropertyDefinition; multiple: boolean }
  | {
      kind: 'list';
      id: string;
      propertyDefinition: ResourcePropertyDefinition;
      listRootIri: string;
      multiple: boolean;
    };

/** A node of the property's list, flattened; `path` names its ancestors too. */
export interface BulkEditListOption {
  id: string;
  label: string;
  path: string;
  depth: number;
}

/**
 * “Set value” writes `values` (a label takes the first). With `onlyEmpty`, resources that have a value keep
 * it; otherwise the value is overwritten, which only a property with one value per resource allows.
 */
export type BulkEditOperation =
  | { kind: 'setValue'; values: string[]; onlyEmpty: boolean }
  | { kind: 'setListValue'; values: BulkEditListOption[]; onlyEmpty: boolean };

/** A label always has one value; a property with several values per resource can only be filled where empty. */
export function canOverwrite(target: BulkEditTarget): boolean {
  return target.kind === 'label' || !target.multiple;
}

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

  for (const { propertyDefinition, cardinality } of resource.entityInfo.classes[
    resource.type
  ].getResourcePropertiesList()) {
    if (!(propertyDefinition instanceof ResourcePropertyDefinition) || !propertyDefinition.isEditable) {
      continue;
    }
    const multiple = cardinality === Cardinality._0_n || cardinality === Cardinality._1_n;
    if (
      propertyDefinition.objectType === Constants.TextValue &&
      (propertyDefinition.guiElement === Constants.GuiSimpleText ||
        propertyDefinition.guiElement === Constants.GuiTextarea)
    ) {
      targets.push({ kind: 'text', id: propertyDefinition.id, propertyDefinition, multiple });
    }
    const listRootIri = listRootIriFromGuiAttributes(propertyDefinition.guiAttributes);
    if (propertyDefinition.objectType === Constants.ListValue && listRootIri) {
      targets.push({ kind: 'list', id: propertyDefinition.id, propertyDefinition, listRootIri, multiple });
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
    const after = operation.kind === 'setValue' ? operation.values[0] : undefined;
    return after !== undefined && after.trim() !== '' && after !== resource.label
      ? [{ resource, before: resource.label, after, newValue: after }]
      : [];
  }

  if (target.kind === 'list' && operation.kind === 'setListValue') {
    const values = resource
      .getValues(target.id)
      .filter((value): value is ReadListValue => value instanceof ReadListValue);
    return _setChanges(
      resource,
      target,
      operation,
      values,
      operation.values.map(option => ({ newValue: option.id, after: option.path })),
      value => value.listNode
    );
  }

  if (target.kind === 'text' && operation.kind === 'setValue') {
    const values = resource
      .getValues(target.id)
      .filter((value): value is ReadTextValueAsString => value instanceof ReadTextValueAsString);
    return _setChanges(
      resource,
      target,
      operation,
      values,
      operation.values.map(text => ({ newValue: text, after: text })),
      value => value.text
    );
  }
  return [];
}

/**
 * “Set value”: an empty property gets every new value; a filled one keeps its values, unless the operation
 * overwrites and the property takes one value, whose value then becomes the first new one.
 */
function _setChanges<V extends ReadTextValueAsString | ReadListValue>(
  resource: ReadResource,
  target: BulkEditTarget,
  operation: { onlyEmpty: boolean },
  values: V[],
  next: { newValue: string; after: string }[],
  contentOf: (value: V) => string
): BulkEditChange[] {
  if (values.length === 0) {
    return next.map(({ newValue, after }) => ({ resource, before: null, after, newValue }));
  }
  const [current] = values;
  if (operation.onlyEmpty || !canOverwrite(target) || !next.length || contentOf(current) === next[0].newValue) {
    return [];
  }
  const before = current instanceof ReadListValue ? current.listNodeLabel : (current as ReadTextValueAsString).text;
  return [{ resource, value: current, before, after: next[0].after, newValue: next[0].newValue }];
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
