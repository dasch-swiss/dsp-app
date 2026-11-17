import {
  Constants,
  CreateTextValueAsString,
  ReadResource,
  ReadTextValueAsString,
  ResourcePropertyDefinition,
  UpdateResource,
  UpdateTextValueAsString,
} from '@dasch-swiss/dsp-js';

export type BulkEditOperation =
  | { kind: 'addText'; text: string; position: 'before' | 'after' }
  | { kind: 'replace'; find: string; replaceWith: string; wholeValue: boolean; matchCase: boolean }
  | { kind: 'defaultValue'; text: string };

/** One value to write: an update when `value` is set, otherwise a value to create. */
export interface BulkEditChange {
  resource: ReadResource;
  value?: ReadTextValueAsString;
  before: string | null;
  after: string;
}

export interface BulkEditPlan {
  changes: BulkEditChange[];
  /** Resources that keep every value as it is. */
  unchangedCount: number;
}

/** Plain-text properties (simple text or textarea, no markup) the user may edit on this resource. */
export function bulkEditableProperties(resource: ReadResource): ResourcePropertyDefinition[] {
  return resource.entityInfo.classes[resource.type]
    .getResourcePropertiesList()
    .map(prop => prop.propertyDefinition)
    .filter(
      (propDef): propDef is ResourcePropertyDefinition =>
        propDef instanceof ResourcePropertyDefinition &&
        propDef.isEditable &&
        propDef.objectType === Constants.TextValue &&
        (propDef.guiElement === Constants.GuiSimpleText || propDef.guiElement === Constants.GuiTextarea)
    );
}

export function planBulkEdit(
  resources: ReadResource[],
  propertyIri: string,
  operation: BulkEditOperation
): BulkEditPlan {
  const changes: BulkEditChange[] = [];
  let unchangedCount = 0;

  for (const resource of resources) {
    const values = resource
      .getValues(propertyIri)
      .filter((value): value is ReadTextValueAsString => value instanceof ReadTextValueAsString);
    const resourceChanges = _changesFor(resource, values, operation);
    if (resourceChanges.length === 0) {
      unchangedCount++;
    }
    changes.push(...resourceChanges);
  }

  return { changes, unchangedCount };
}

export type BulkEditRequest =
  | { kind: 'update'; payload: UpdateResource<UpdateTextValueAsString> }
  | { kind: 'create'; payload: UpdateResource<CreateTextValueAsString> };

/** The request for one change; a value's comment is carried over, since an update replaces the value. */
export function bulkEditRequest(change: BulkEditChange, propertyIri: string): BulkEditRequest {
  if (change.value) {
    const value = new UpdateTextValueAsString();
    value.id = change.value.id;
    value.text = change.after;
    if (change.value.valueHasComment) {
      value.valueHasComment = change.value.valueHasComment;
    }
    return { kind: 'update', payload: _updateResource(change.resource, propertyIri, value) };
  }

  const value = new CreateTextValueAsString();
  value.text = change.after;
  return { kind: 'create', payload: _updateResource(change.resource, propertyIri, value) };
}

function _changesFor(
  resource: ReadResource,
  values: ReadTextValueAsString[],
  operation: BulkEditOperation
): BulkEditChange[] {
  if (operation.kind === 'defaultValue') {
    return values.length === 0 && operation.text ? [{ resource, before: null, after: operation.text }] : [];
  }

  return values
    .map(value => ({ resource, value, before: value.text, after: _apply(value.text, operation) }))
    .filter(change => change.after !== change.before);
}

function _apply(text: string, operation: Exclude<BulkEditOperation, { kind: 'defaultValue' }>): string {
  if (operation.kind === 'addText') {
    return operation.position === 'before' ? operation.text + text : text + operation.text;
  }

  if (!operation.find) {
    return text;
  }
  if (operation.wholeValue) {
    const matches = operation.matchCase
      ? text === operation.find
      : text.toLocaleLowerCase() === operation.find.toLocaleLowerCase();
    return matches ? operation.replaceWith : text;
  }
  const pattern = new RegExp(operation.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), operation.matchCase ? 'g' : 'gi');
  return text.replace(pattern, () => operation.replaceWith);
}

function _updateResource<T extends UpdateTextValueAsString | CreateTextValueAsString>(
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
