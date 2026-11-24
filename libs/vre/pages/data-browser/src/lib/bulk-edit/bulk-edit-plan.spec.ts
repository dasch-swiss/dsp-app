import {
  Cardinality,
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
const TEXT: BulkEditTarget = {
  kind: 'text',
  id: PROP,
  propertyDefinition: new ResourcePropertyDefinition(),
  multiple: false,
};
const MULTI_TEXT: BulkEditTarget = { ...TEXT, multiple: true };
const LABEL: BulkEditTarget = { kind: 'label', id: Constants.Label };
const LIST: BulkEditTarget = {
  kind: 'list',
  id: LIST_PROP,
  propertyDefinition: new ResourcePropertyDefinition(),
  listRootIri: 'http://rdfh.ch/lists/0001/root',
  multiple: false,
};
const MULTI_LIST: BulkEditTarget = { ...LIST, multiple: true };
const BRIEF: BulkEditListOption = { id: 'node:brief', label: 'Brief', path: 'Brief', depth: 0 };
const HANDWRITTEN: BulkEditListOption = {
  id: 'node:handwritten',
  label: 'handschriftlich',
  path: 'Brief › handschriftlich',
  depth: 1,
};
const POSTCARD: BulkEditListOption = { id: 'node:postcard', label: 'Karte', path: 'Karte', depth: 0 };

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
      { def: propertyDefinition(PROP, Constants.TextValue, Constants.GuiSimpleText), cardinality: Cardinality._0_1 },
      {
        def: propertyDefinition(LIST_PROP, Constants.ListValue, Constants.GuiList, [
          'hlist=<http://rdfh.ch/lists/0001/root>',
        ]),
        cardinality: Cardinality._1_n,
      },
      { def: propertyDefinition('rich', Constants.TextValue, Constants.GuiRichText), cardinality: Cardinality._0_1 },
      { def: propertyDefinition('date', Constants.DateValue, Constants.GuiDatePicker), cardinality: Cardinality._1 },
    ];
    res.entityInfo = {
      classes: {
        [res.type]: {
          getResourcePropertiesList: () =>
            definitions.map(({ def, cardinality }) => ({ propertyDefinition: def, cardinality })),
        } as unknown as ResourceClassDefinitionWithPropertyDefinition,
      },
      properties: {},
    } as unknown as ReadResource['entityInfo'];

    expect(
      bulkEditTargets(res).map(target => [target.kind, target.id, target.kind !== 'label' && target.multiple])
    ).toEqual([
      ['label', Constants.Label, false],
      ['text', PROP, false],
      ['list', LIST_PROP, true],
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
    it('SetsTheValueOnlyWhereThePropertyIsEmptyByDefault', () => {
      const plan = planBulkEdit([resource('r1'), resource('r2', textValue('v1', 'Karte'))], TEXT, {
        kind: 'setValue',
        values: ['Brief'],
        onlyEmpty: true,
      });

      expect(plan.changes).toHaveLength(1);
      expect(plan.changes[0]).toMatchObject({ before: null, after: 'Brief' });
      expect(plan.changes[0].value).toBeUndefined();
      expect(plan.unchangedCount).toBe(1);
    });

    it('OverwritesTheValueOfASingleValuePropertyWhenAsked', () => {
      const plan = planBulkEdit(
        [resource('r1'), resource('r2', textValue('v1', 'Karte')), resource('r3', textValue('v3', 'Brief'))],
        TEXT,
        { kind: 'setValue', values: ['Brief'], onlyEmpty: false }
      );

      expect(plan.changes.map(change => [change.resource.id, change.value?.id, change.before])).toEqual([
        ['r1', undefined, null],
        ['r2', 'v1', 'Karte'],
      ]);
      expect(plan.unchangedCount).toBe(1);
    });

    it('FillsAnEmptyMultiValuePropertyWithEveryValue', () => {
      const plan = planBulkEdit([resource('r1')], MULTI_TEXT, {
        kind: 'setValue',
        values: ['Wien', 'Mödling'],
        onlyEmpty: true,
      });

      expect(plan.changes.map(change => [change.resource.id, change.after])).toEqual([
        ['r1', 'Wien'],
        ['r1', 'Mödling'],
      ]);
    });

    it('NeverOverwritesAMultiValueProperty', () => {
      const plan = planBulkEdit([resource('r1', textValue('v1', 'Karte'))], MULTI_TEXT, {
        kind: 'setValue',
        values: ['Brief'],
        onlyEmpty: false,
      });

      expect(plan.changes).toEqual([]);
      expect(plan.unchangedCount).toBe(1);
    });
  });

  describe('label', () => {
    it('SetsTheSameLabelOnEveryResourceThatHasAnother', () => {
      const plan = planBulkEdit([resource('r1'), resource('r2')], LABEL, {
        kind: 'setValue',
        values: ['Label r2'],
        onlyEmpty: false,
      });

      expect(plan.changes.map(change => change.resource.id)).toEqual(['r1']);
    });

    it('NeverEmptiesALabel', () => {
      const plan = planBulkEdit([resource('r1')], LABEL, { kind: 'setValue', values: [' '], onlyEmpty: false });

      expect(plan.changes).toEqual([]);
    });
  });

  describe('list', () => {
    it('OverwritesASingleListValueExceptWhereItIsAlreadySet', () => {
      const plan = planBulkEdit(
        [resource('r1', listValue('v1', BRIEF)), resource('r2'), resource('r3', listValue('v3', HANDWRITTEN))],
        LIST,
        { kind: 'setListValue', values: [HANDWRITTEN], onlyEmpty: false }
      );

      expect(plan.changes.map(change => [change.resource.id, change.value?.id])).toEqual([
        ['r1', 'v1'],
        ['r2', undefined],
      ]);
      expect(plan.unchangedCount).toBe(1);
    });

    it('SetsListValuesOnlyWhereThePropertyIsEmptyByDefault', () => {
      const plan = planBulkEdit([resource('r1', listValue('v1', BRIEF)), resource('r2')], LIST, {
        kind: 'setListValue',
        values: [HANDWRITTEN],
        onlyEmpty: true,
      });

      expect(plan.changes).toHaveLength(1);
      expect(plan.changes[0]).toMatchObject({ before: null, after: 'Brief › handschriftlich' });
    });

    it('FillsAnEmptyMultiValueListWithEveryValueButNeverOverwritesIt', () => {
      const plan = planBulkEdit([resource('r1'), resource('r2', listValue('v2', BRIEF))], MULTI_LIST, {
        kind: 'setListValue',
        values: [HANDWRITTEN, POSTCARD],
        onlyEmpty: false,
      });

      expect(plan.changes.map(change => [change.resource.id, change.newValue])).toEqual([
        ['r1', HANDWRITTEN.id],
        ['r1', POSTCARD.id],
      ]);
      expect(plan.unchangedCount).toBe(1);
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
