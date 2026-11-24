import {
  Constants,
  CreateListValue,
  CreateTextValueAsString,
  ListNodeV2,
  ReadListValue,
  ReadResource,
  ReadTextValueAsString,
  ResourceClassDefinitionWithPropertyDefinition,
  ResourcePropertyDefinition,
  UpdateListValue,
  UpdateResourceMetadata,
  UpdateTextValueAsString,
} from '@dasch-swiss/dsp-js';
import {
  BulkEditListOption,
  bulkEditRequest,
  BulkEditTarget,
  bulkEditTargets,
  flattenList,
  planBulkEdit,
} from './bulk-edit-plan';

const PROP = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasText';
const LIST_PROP = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem';
const TEXT: BulkEditTarget = { kind: 'text', id: PROP, propertyDefinition: new ResourcePropertyDefinition() };
const LABEL: BulkEditTarget = { kind: 'label', id: Constants.Label };
const LIST: BulkEditTarget = {
  kind: 'list',
  id: LIST_PROP,
  propertyDefinition: new ResourcePropertyDefinition(),
  listRootIri: 'http://rdfh.ch/lists/0001/root',
};
const BRIEF: BulkEditListOption = { id: 'node:brief', label: 'Brief', path: 'Brief', depth: 0 };
const HANDWRITTEN: BulkEditListOption = {
  id: 'node:handwritten',
  label: 'handschriftlich',
  path: 'Brief › handschriftlich',
  depth: 1,
};

function textValue(id: string, text: string, comment?: string): ReadTextValueAsString {
  const value = new ReadTextValueAsString();
  value.id = id;
  value.text = text;
  value.valueHasComment = comment;
  return value;
}

function listValue(id: string, node: BulkEditListOption, comment?: string): ReadListValue {
  const value = new ReadListValue();
  value.id = id;
  value.listNode = node.id;
  value.listNodeLabel = node.label;
  value.valueHasComment = comment;
  return value;
}

function resource(id: string, ...values: (ReadTextValueAsString | ReadListValue)[]): ReadResource {
  const res = new ReadResource();
  res.id = id;
  res.label = `Label ${id}`;
  res.type = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
  const text = values.filter(value => value instanceof ReadTextValueAsString);
  const list = values.filter(value => value instanceof ReadListValue);
  res.properties = {
    ...(text.length ? { [PROP]: text } : {}),
    ...(list.length ? { [LIST_PROP]: list } : {}),
  };
  return res;
}

function propertyDefinition(id: string, objectType: string, guiElement: string, guiAttributes: string[] = []) {
  return Object.assign(new ResourcePropertyDefinition(), {
    id,
    objectType,
    guiElement,
    guiAttributes,
    isEditable: true,
  });
}

describe('bulkEditTargets', () => {
  it('OffersTheLabelThenPlainTextAndListProperties', () => {
    const res = resource('r1');
    const definitions = [
      propertyDefinition(PROP, Constants.TextValue, Constants.GuiSimpleText),
      propertyDefinition(LIST_PROP, Constants.ListValue, Constants.GuiList, ['hlist=<http://rdfh.ch/lists/0001/root>']),
      propertyDefinition('rich', Constants.TextValue, Constants.GuiRichText),
      propertyDefinition('date', Constants.DateValue, Constants.GuiDatePicker),
    ];
    res.entityInfo = {
      classes: {
        [res.type]: {
          getResourcePropertiesList: () => definitions.map(def => ({ propertyDefinition: def })),
        } as unknown as ResourceClassDefinitionWithPropertyDefinition,
      },
      properties: {},
    } as unknown as ReadResource['entityInfo'];

    expect(bulkEditTargets(res).map(target => [target.kind, target.id])).toEqual([
      ['label', Constants.Label],
      ['text', PROP],
      ['list', LIST_PROP],
    ]);
  });
});

describe('flattenList', () => {
  it('ListsTheNodesInTreeOrderWithTheirPath', () => {
    const node = (id: string, label: string, children: ListNodeV2[] = []) =>
      Object.assign(new ListNodeV2(), { id, label, children });
    const root = node('root', 'Types', [
      node('brief', 'Brief', [node('hand', 'handschriftlich')]),
      node('karte', 'Karte'),
    ]);

    expect(flattenList(root)).toEqual([
      { id: 'brief', label: 'Brief', path: 'Brief', depth: 0 },
      { id: 'hand', label: 'handschriftlich', path: 'Brief › handschriftlich', depth: 1 },
      { id: 'karte', label: 'Karte', path: 'Karte', depth: 0 },
    ]);
  });
});

describe('planBulkEdit', () => {
  describe('text', () => {
    it('LeavesAResourceWithoutValuesUnchangedWhenReplacing', () => {
      const plan = planBulkEdit([resource('r1')], TEXT, {
        kind: 'replace',
        find: 'x',
        replaceWith: 'y',
        wholeValue: false,
        matchCase: false,
      });

      expect(plan.changes).toEqual([]);
      expect(plan.unchangedCount).toBe(1);
    });

    it('ReplacesEveryOccurrenceIgnoringCaseByDefault', () => {
      const plan = planBulkEdit([resource('r1', textValue('v1', 'wien, Wien'))], TEXT, {
        kind: 'replace',
        find: 'Wien',
        replaceWith: 'Vienna',
        wholeValue: false,
        matchCase: false,
      });

      expect(plan.changes[0]).toMatchObject({
        before: 'wien, Wien',
        after: 'Vienna, Vienna',
        newValue: 'Vienna, Vienna',
      });
    });

    it('TreatsTheSearchTextLiterallyAndKeepsDollarSignsInTheReplacement', () => {
      const plan = planBulkEdit([resource('r1', textValue('v1', 'a.b a?b'))], TEXT, {
        kind: 'replace',
        find: 'a?b',
        replaceWith: '$1',
        wholeValue: false,
        matchCase: true,
      });

      expect(plan.changes[0].after).toBe('a.b $1');
    });

    it('ReplacesOnlyAWholeMatchingValueWhenAsked', () => {
      const plan = planBulkEdit(
        [resource('r1', textValue('v1', '???')), resource('r2', textValue('v2', 'Brief ???'))],
        TEXT,
        { kind: 'replace', find: '???', replaceWith: 'Postkarte', wholeValue: true, matchCase: true }
      );

      expect(plan.changes).toHaveLength(1);
      expect(plan.changes[0]).toMatchObject({ before: '???', after: 'Postkarte' });
      expect(plan.unchangedCount).toBe(1);
    });

    it('SetsTheDefaultValueOnlyWhereThePropertyIsEmpty', () => {
      const plan = planBulkEdit([resource('r1'), resource('r2', textValue('v1', 'Karte'))], TEXT, {
        kind: 'defaultValue',
        text: 'Brief',
      });

      expect(plan.changes).toHaveLength(1);
      expect(plan.changes[0]).toMatchObject({ before: null, after: 'Brief' });
      expect(plan.changes[0].value).toBeUndefined();
      expect(plan.unchangedCount).toBe(1);
    });
  });

  describe('label', () => {
    it('ReplacesTextInTheLabels', () => {
      const plan = planBulkEdit([resource('r1'), resource('x2')], LABEL, {
        kind: 'replace',
        find: 'Label r',
        replaceWith: 'Letter r',
        wholeValue: false,
        matchCase: true,
      });

      expect(plan.changes).toHaveLength(1);
      expect(plan.changes[0]).toMatchObject({ before: 'Label r1', after: 'Letter r1', newValue: 'Letter r1' });
      expect(plan.unchangedCount).toBe(1);
    });

    it('SetsTheSameLabelOnEveryResourceThatHasAnother', () => {
      const plan = planBulkEdit([resource('r1'), resource('r2')], LABEL, { kind: 'setValue', text: 'Label r2' });

      expect(plan.changes.map(change => change.resource.id)).toEqual(['r1']);
    });

    it('NeverEmptiesALabel', () => {
      const plan = planBulkEdit([resource('r1')], LABEL, {
        kind: 'replace',
        find: 'Label r1',
        replaceWith: ' ',
        wholeValue: true,
        matchCase: true,
      });

      expect(plan.changes).toEqual([]);
    });
  });

  describe('list', () => {
    it('ReplacesOneListValueAndLeavesTheOthers', () => {
      const plan = planBulkEdit(
        [resource('r1', listValue('v1', BRIEF)), resource('r2', listValue('v2', HANDWRITTEN))],
        LIST,
        { kind: 'replaceListValue', from: BRIEF.id, to: HANDWRITTEN }
      );

      expect(plan.changes).toHaveLength(1);
      expect(plan.changes[0]).toMatchObject({
        before: 'Brief',
        after: 'Brief › handschriftlich',
        newValue: HANDWRITTEN.id,
      });
      expect(plan.changes[0].value?.id).toBe('v1');
    });

    it('SetsTheValueEverywhereExceptWhereItIsAlreadySet', () => {
      const plan = planBulkEdit(
        [resource('r1', listValue('v1', BRIEF)), resource('r2'), resource('r3', listValue('v3', HANDWRITTEN))],
        LIST,
        { kind: 'setListValue', to: HANDWRITTEN }
      );

      expect(plan.changes.map(change => [change.resource.id, change.value?.id])).toEqual([
        ['r1', 'v1'],
        ['r2', undefined],
      ]);
      expect(plan.unchangedCount).toBe(1);
    });

    it('SetsTheDefaultListValueOnlyWhereThePropertyIsEmpty', () => {
      const plan = planBulkEdit([resource('r1', listValue('v1', BRIEF)), resource('r2')], LIST, {
        kind: 'defaultListValue',
        to: HANDWRITTEN,
      });

      expect(plan.changes).toHaveLength(1);
      expect(plan.changes[0]).toMatchObject({ before: null, after: 'Brief › handschriftlich' });
    });
  });
});

describe('bulkEditRequest', () => {
  it('UpdatesAnExistingTextValueAndKeepsItsComment', () => {
    const value = textValue('v1', 'Wien', 'checked in archive');
    const request = bulkEditRequest(
      { resource: resource('r1', value), value, before: 'Wien', after: 'Vienna', newValue: 'Vienna' },
      TEXT
    );

    expect(request.kind).toBe('update');
    expect(request.payload).toMatchObject({ id: 'r1', property: PROP });
    expect((request.payload as { value: unknown }).value).toBeInstanceOf(UpdateTextValueAsString);
    expect((request.payload as { value: unknown }).value).toMatchObject({
      id: 'v1',
      text: 'Vienna',
      valueHasComment: 'checked in archive',
    });
  });

  it('CreatesATextValueWhenThereIsNone', () => {
    const request = bulkEditRequest(
      { resource: resource('r1'), before: null, after: 'Brief', newValue: 'Brief' },
      TEXT
    );

    expect(request.kind).toBe('create');
    expect((request.payload as { value: unknown }).value).toBeInstanceOf(CreateTextValueAsString);
    expect((request.payload as { value: unknown }).value).toMatchObject({ text: 'Brief' });
  });

  it('PointsAListValueAtTheNewNodeAndKeepsItsComment', () => {
    const value = listValue('v1', BRIEF, 'from the catalogue');
    const update = bulkEditRequest(
      { resource: resource('r1', value), value, before: 'Brief', after: HANDWRITTEN.path, newValue: HANDWRITTEN.id },
      LIST
    );
    const create = bulkEditRequest(
      { resource: resource('r2'), before: null, after: HANDWRITTEN.path, newValue: HANDWRITTEN.id },
      LIST
    );

    expect((update.payload as { value: unknown }).value).toBeInstanceOf(UpdateListValue);
    expect((update.payload as { value: unknown }).value).toMatchObject({
      id: 'v1',
      listNode: HANDWRITTEN.id,
      valueHasComment: 'from the catalogue',
    });
    expect((create.payload as { value: unknown }).value).toBeInstanceOf(CreateListValue);
    expect((create.payload as { value: unknown }).value).toMatchObject({ listNode: HANDWRITTEN.id });
  });

  it('UpdatesTheLabelWithTheResourcesLastModificationDate', () => {
    const res = resource('r1');
    res.lastModificationDate = '2026-11-01T10:00:00Z';
    const request = bulkEditRequest({ resource: res, before: 'Label r1', after: 'Letter', newValue: 'Letter' }, LABEL);

    expect(request.kind).toBe('label');
    expect(request.payload).toBeInstanceOf(UpdateResourceMetadata);
    expect(request.payload).toMatchObject({ id: 'r1', label: 'Letter', lastModificationDate: '2026-11-01T10:00:00Z' });
  });
});
