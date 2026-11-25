import {
  Cardinality,
  Constants,
  CreateListValue,
  CreateTextValueAsString,
  CreateTextValueAsXml,
  ListNodeV2,
  ReadListValue,
  ReadResource,
  ReadTextValueAsXml,
  ReadTextValueAsString,
  ResourceClassDefinitionWithPropertyDefinition,
  ResourcePropertyDefinition,
  UpdateListValue,
  UpdateResourceMetadata,
  UpdateTextValueAsString,
  UpdateTextValueAsXml,
  DeleteValue,
} from '@dasch-swiss/dsp-js';
import {
  BulkEditListOption,
  BulkEditNewValue,
  bulkEditRequest,
  BulkEditTarget,
  bulkEditTargets,
  canRemove,
  canSet,
  flattenList,
  planBulkEdit,
} from './bulk-edit-plan';

const PROP = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasText';
const LIST_PROP = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem';
const RICH_PROP = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasRichtext';
const TEXT: BulkEditTarget = {
  kind: 'text',
  id: PROP,
  propertyDefinition: Object.assign(new ResourcePropertyDefinition(), {
    objectType: Constants.TextValue,
    guiElement: Constants.GuiSimpleText,
  }),
  cardinality: Cardinality._0_1,
  multiple: false,
};
const RICH: BulkEditTarget = {
  kind: 'richText',
  id: RICH_PROP,
  propertyDefinition: Object.assign(new ResourcePropertyDefinition(), {
    objectType: Constants.TextValue,
    guiElement: Constants.GuiRichText,
  }),
  cardinality: Cardinality._0_1,
  multiple: false,
};
const MULTI_TEXT: BulkEditTarget = { ...TEXT, cardinality: Cardinality._0_n, multiple: true };
const LABEL: BulkEditTarget = { kind: 'label', id: Constants.Label };
const LIST: BulkEditTarget = {
  kind: 'list',
  id: LIST_PROP,
  propertyDefinition: Object.assign(new ResourcePropertyDefinition(), { objectType: Constants.ListValue }),
  cardinality: Cardinality._0_1,
  listRootIri: 'http://rdfh.ch/lists/0001/root',
  multiple: false,
};
const MULTI_LIST: BulkEditTarget = { ...LIST, cardinality: Cardinality._0_n, multiple: true };
const BRIEF: BulkEditListOption = { id: 'node:brief', label: 'Brief', path: 'Brief', depth: 0 };
const HANDWRITTEN: BulkEditListOption = {
  id: 'node:handwritten',
  label: 'handschriftlich',
  path: 'Brief › handschriftlich',
  depth: 1,
};
const POSTCARD: BulkEditListOption = { id: 'node:postcard', label: 'Karte', path: 'Karte', depth: 0 };

const texts = (...values: string[]): BulkEditNewValue[] => values.map(value => ({ content: value, display: value }));
const nodes = (...options: BulkEditListOption[]): BulkEditNewValue[] =>
  options.map(option => ({ content: option.id, display: option.path }));

function textValue(id: string, text: string, comment?: string): ReadTextValueAsString {
  const value = new ReadTextValueAsString();
  value.id = id;
  value.text = text;
  value.valueHasComment = comment;
  value.userHasPermission = 'M';
  return value;
}

function listValue(id: string, node: BulkEditListOption, comment?: string): ReadListValue {
  const value = new ReadListValue();
  value.id = id;
  value.listNode = node.id;
  value.listNodeLabel = node.label;
  value.valueHasComment = comment;
  value.userHasPermission = 'M';
  return value;
}

function resource(id: string, ...values: (ReadTextValueAsString | ReadListValue)[]): ReadResource {
  const res = new ReadResource();
  res.id = id;
  res.label = `Label ${id}`;
  res.type = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
  res.userHasPermission = 'M';
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
  it('OffersTheLabelThenEveryPropertyTheCreationFormWrites', () => {
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
      ['richText', 'rich', false],
      ['other', 'date', false],
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
        values: texts('Brief'),
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
        { values: texts('Brief'), onlyEmpty: false }
      );

      expect(plan.changes.map(change => [change.resource.id, change.value?.id, change.before])).toEqual([
        ['r1', undefined, null],
        ['r2', 'v1', 'Karte'],
      ]);
      expect(plan.unchangedCount).toBe(1);
    });

    it('FillsAnEmptyMultiValuePropertyWithEveryValue', () => {
      const plan = planBulkEdit([resource('r1')], MULTI_TEXT, {
        values: texts('Wien', 'Mödling'),
        onlyEmpty: true,
      });

      expect(plan.changes.map(change => [change.resource.id, change.after])).toEqual([
        ['r1', 'Wien'],
        ['r1', 'Mödling'],
      ]);
    });

    it('OverwritesTheOneValueOfAMultiValuePropertyWithOneNewValue', () => {
      const plan = planBulkEdit([resource('r1', textValue('v1', 'Karte'))], MULTI_TEXT, {
        values: texts('Brief'),
        onlyEmpty: false,
      });

      expect(plan.changes.map(change => [change.value?.id, change.before, change.after])).toEqual([
        ['v1', 'Karte', 'Brief'],
      ]);
    });

    it('KeepsAResourceWithSeveralValuesWhenOverwriting', () => {
      const plan = planBulkEdit(
        [resource('r1', textValue('v1', 'Karte'), textValue('v2', 'Brief')), resource('r2')],
        MULTI_TEXT,
        { values: texts('Brief'), onlyEmpty: false }
      );

      expect(plan.changes.map(change => change.resource.id)).toEqual(['r2']);
      expect(plan.severalKeptCount).toBe(1);
      expect(plan.unchangedCount).toBe(0);
    });

    it('NeverOverwritesWithSeveralNewValues', () => {
      const plan = planBulkEdit([resource('r1', textValue('v1', 'Karte'))], MULTI_TEXT, {
        values: texts('Brief', 'Karte'),
        onlyEmpty: false,
      });

      expect(plan.changes).toEqual([]);
      expect(plan.unchangedCount).toBe(1);
    });
  });

  describe('rich text', () => {
    it('ShowsTheRichTextAsTextInThePreviewAndWritesItsHtml', () => {
      const existing = Object.assign(new ReadTextValueAsXml(), {
        id: 'v1',
        strval: '<?xml version="1.0" encoding="UTF-8"?>\n<text><p>Old <b>note</b></p></text>',
        userHasPermission: 'M',
      });
      const res = resource('r1');
      res.properties[RICH_PROP] = [existing];

      const plan = planBulkEdit([res, resource('r2')], RICH, {
        values: [{ content: '<p>New <i>note</i></p>', display: 'New note' }],
        onlyEmpty: false,
      });

      expect(plan.changes.map(change => [change.resource.id, change.before, change.after, change.newValue])).toEqual([
        ['r1', 'Old note', 'New note', '<p>New <i>note</i></p>'],
        ['r2', null, 'New note', '<p>New <i>note</i></p>'],
      ]);
    });
  });

  describe('remove', () => {
    const deletable = <T extends { userHasPermission: string }>(entity: T): T =>
      Object.assign(entity, { userHasPermission: 'D' });

    it('RemovesEveryValueOfEveryResource', () => {
      const plan = planBulkEdit(
        [resource('r1', deletable(textValue('v1', 'Karte')), deletable(textValue('v2', 'Brief'))), resource('r2')],
        MULTI_TEXT,
        { kind: 'remove' }
      );

      expect(plan.changes.map(change => [change.value?.id, change.remove, change.before])).toEqual([
        ['v1', true, 'Karte'],
        ['v2', true, 'Brief'],
      ]);
      expect(plan.unchangedCount).toBe(1);
    });

    it('LeavesOutAValueTheUserMayEditButNotDelete', () => {
      const plan = planBulkEdit([resource('r1', textValue('v1', 'Karte'))], TEXT, { kind: 'remove' });

      expect(plan.changes).toEqual([]);
      expect(plan.noRightsCount).toBe(1);
    });

    it('NeverEmptiesARequiredPropertyOrTheLabel', () => {
      const required: BulkEditTarget = { ...TEXT, cardinality: Cardinality._1 };

      expect(canRemove(required)).toBe(false);
      expect(canRemove(LABEL)).toBe(false);
      expect(canRemove(TEXT)).toBe(true);
      expect(
        planBulkEdit([resource('r1', deletable(textValue('v1', 'Karte')))], required, { kind: 'remove' }).changes
      ).toEqual([]);
    });

    it('OffersOnlyRemovingForTypesItCannotSetYet', () => {
      const date: BulkEditTarget = { ...TEXT, kind: 'other' };

      expect(canSet(date)).toBe(false);
      expect(planBulkEdit([resource('r1')], date, { values: texts('1843'), onlyEmpty: true }).changes).toEqual([]);
    });
  });

  describe('label', () => {
    it('SetsTheSameLabelOnEveryResourceThatHasAnother', () => {
      const plan = planBulkEdit([resource('r1'), resource('r2')], LABEL, {
        values: texts('Label r2'),
        onlyEmpty: false,
      });

      expect(plan.changes.map(change => change.resource.id)).toEqual(['r1']);
    });

    it('NeverEmptiesALabel', () => {
      const plan = planBulkEdit([resource('r1')], LABEL, { values: texts(' '), onlyEmpty: false });

      expect(plan.changes).toEqual([]);
    });
  });

  describe('rights', () => {
    const viewOnly = <T extends { userHasPermission: string }>(entity: T): T =>
      Object.assign(entity, { userHasPermission: 'V' });

    it('LeavesOutAResourceTheUserMayNotModify', () => {
      const plan = planBulkEdit([resource('r1'), viewOnly(resource('r2'))], TEXT, {
        values: texts('Brief'),
        onlyEmpty: true,
      });

      expect(plan.changes.map(change => change.resource.id)).toEqual(['r1']);
      expect(plan.noRightsCount).toBe(1);
      expect(plan.unchangedCount).toBe(0);
    });

    it('LeavesOutAValueTheUserMayNotModifyOnAResourceTheyMay', () => {
      const plan = planBulkEdit([resource('r1', viewOnly(textValue('v1', 'Karte')))], TEXT, {
        values: texts('Brief'),
        onlyEmpty: false,
      });

      expect(plan.changes).toEqual([]);
      expect(plan.noRightsCount).toBe(1);
    });

    it('LeavesOutALabelOnAResourceTheUserMayNotModify', () => {
      const plan = planBulkEdit([viewOnly(resource('r1'))], LABEL, {
        values: texts('Brief'),
        onlyEmpty: false,
      });

      expect(plan.changes).toEqual([]);
      expect(plan.noRightsCount).toBe(1);
    });

    it('DoesNotCountAResourceWithNothingToChangeAsLackingRights', () => {
      const plan = planBulkEdit([viewOnly(resource('r1', textValue('v1', 'Karte')))], TEXT, {
        values: texts('Brief'),
        onlyEmpty: true,
      });

      expect(plan.noRightsCount).toBe(0);
      expect(plan.unchangedCount).toBe(1);
    });
  });

  describe('list', () => {
    it('OverwritesASingleListValueExceptWhereItIsAlreadySet', () => {
      const plan = planBulkEdit(
        [resource('r1', listValue('v1', BRIEF)), resource('r2'), resource('r3', listValue('v3', HANDWRITTEN))],
        LIST,
        { values: nodes(HANDWRITTEN), onlyEmpty: false }
      );

      expect(plan.changes.map(change => [change.resource.id, change.value?.id])).toEqual([
        ['r1', 'v1'],
        ['r2', undefined],
      ]);
      expect(plan.unchangedCount).toBe(1);
    });

    it('SetsListValuesOnlyWhereThePropertyIsEmptyByDefault', () => {
      const plan = planBulkEdit([resource('r1', listValue('v1', BRIEF)), resource('r2')], LIST, {
        values: nodes(HANDWRITTEN),
        onlyEmpty: true,
      });

      expect(plan.changes).toHaveLength(1);
      expect(plan.changes[0]).toMatchObject({ before: null, after: 'Brief › handschriftlich' });
    });

    it('FillsAnEmptyMultiValueListWithEveryValueButNeverOverwritesIt', () => {
      const plan = planBulkEdit([resource('r1'), resource('r2', listValue('v2', BRIEF))], MULTI_LIST, {
        values: nodes(HANDWRITTEN, POSTCARD),
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

  it('WritesTheCommentTypedWithTheValueOverTheOldOne', () => {
    const value = textValue('v1', 'Wien', 'old comment');
    const update = bulkEditRequest(
      { resource: resource('r1', value), value, before: 'Wien', after: 'Vienna', newValue: 'Vienna', comment: 'new' },
      TEXT
    );
    const create = bulkEditRequest(
      { resource: resource('r2'), before: null, after: 'Vienna', newValue: 'Vienna', comment: 'new' },
      TEXT
    );

    expect((update.payload as { value: unknown }).value).toMatchObject({ valueHasComment: 'new' });
    expect((create.payload as { value: unknown }).value).toMatchObject({ valueHasComment: 'new' });
  });

  it('DeletesARemovedValueByItsIriAndType', () => {
    const value = textValue('v1', 'Karte');
    const request = bulkEditRequest(
      { resource: resource('r1', value), value, remove: true, before: 'Karte', after: '', newValue: '' },
      TEXT
    );

    expect(request.kind).toBe('delete');
    expect(request.payload).toMatchObject({ id: 'r1', property: PROP });
    expect((request.payload as { value: unknown }).value).toBeInstanceOf(DeleteValue);
    expect((request.payload as { value: unknown }).value).toMatchObject({ id: 'v1', type: value.type });
  });

  it('WritesRichTextAsXmlLikeTheResourceEditor', () => {
    const create = bulkEditRequest(
      { resource: resource('r1'), before: null, after: 'New note', newValue: '<p>New note</p>' },
      RICH
    );
    const existing = Object.assign(new ReadTextValueAsXml(), { id: 'v1', valueHasComment: 'proofread' });
    const update = bulkEditRequest(
      { resource: resource('r2'), value: existing, before: 'Old', after: 'New note', newValue: '<p>New note</p>' },
      RICH
    );

    expect((create.payload as { value: unknown }).value).toBeInstanceOf(CreateTextValueAsXml);
    expect((create.payload as unknown as { value: { xml: string } }).value.xml).toContain('<p>New note</p>');
    expect((update.payload as { value: unknown }).value).toBeInstanceOf(UpdateTextValueAsXml);
    expect((update.payload as { value: unknown }).value).toMatchObject({ id: 'v1', valueHasComment: 'proofread' });
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
