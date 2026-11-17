import {
  CreateTextValueAsString,
  ReadResource,
  ReadTextValueAsString,
  UpdateTextValueAsString,
} from '@dasch-swiss/dsp-js';
import { bulkEditRequest, planBulkEdit } from './bulk-edit-plan';

const PROP = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasText';

function textValue(id: string, text: string, comment?: string): ReadTextValueAsString {
  const value = new ReadTextValueAsString();
  value.id = id;
  value.text = text;
  value.valueHasComment = comment;
  return value;
}

function resource(id: string, ...values: ReadTextValueAsString[]): ReadResource {
  const res = new ReadResource();
  res.id = id;
  res.type = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
  res.properties = values.length ? { [PROP]: values } : {};
  return res;
}

describe('planBulkEdit', () => {
  it('AddsTextBeforeOrAfterEveryExistingValue', () => {
    const res = resource('r1', textValue('v1', 'Wien'), textValue('v2', 'Mödling'));

    const after = planBulkEdit([res], PROP, { kind: 'addText', text: ' (AT)', position: 'after' });
    const before = planBulkEdit([res], PROP, { kind: 'addText', text: 'Ort: ', position: 'before' });

    expect(after.changes.map(change => change.after)).toEqual(['Wien (AT)', 'Mödling (AT)']);
    expect(before.changes.map(change => change.after)).toEqual(['Ort: Wien', 'Ort: Mödling']);
  });

  it('LeavesAResourceWithoutValuesUnchangedWhenAddingText', () => {
    const plan = planBulkEdit([resource('r1')], PROP, { kind: 'addText', text: 'x', position: 'after' });

    expect(plan.changes).toEqual([]);
    expect(plan.unchangedCount).toBe(1);
  });

  it('ReplacesEveryOccurrenceIgnoringCaseByDefault', () => {
    const plan = planBulkEdit([resource('r1', textValue('v1', 'wien, Wien'))], PROP, {
      kind: 'replace',
      find: 'Wien',
      replaceWith: 'Vienna',
      wholeValue: false,
      matchCase: false,
    });

    expect(plan.changes[0]).toMatchObject({ before: 'wien, Wien', after: 'Vienna, Vienna' });
  });

  it('TreatsTheSearchTextLiterallyAndKeepsDollarSignsInTheReplacement', () => {
    const plan = planBulkEdit([resource('r1', textValue('v1', 'a.b a?b'))], PROP, {
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
      PROP,
      { kind: 'replace', find: '???', replaceWith: 'Postkarte', wholeValue: true, matchCase: true }
    );

    expect(plan.changes).toHaveLength(1);
    expect(plan.changes[0]).toMatchObject({ before: '???', after: 'Postkarte' });
    expect(plan.unchangedCount).toBe(1);
  });

  it('SetsTheDefaultValueOnlyWhereThePropertyIsEmpty', () => {
    const plan = planBulkEdit([resource('r1'), resource('r2', textValue('v1', 'Karte'))], PROP, {
      kind: 'defaultValue',
      text: 'Brief',
    });

    expect(plan.changes).toHaveLength(1);
    expect(plan.changes[0]).toMatchObject({ before: null, after: 'Brief' });
    expect(plan.changes[0].value).toBeUndefined();
    expect(plan.unchangedCount).toBe(1);
  });
});

describe('bulkEditRequest', () => {
  it('UpdatesAnExistingValueAndKeepsItsComment', () => {
    const value = textValue('v1', 'Wien', 'checked in archive');
    const request = bulkEditRequest({ resource: resource('r1', value), value, before: 'Wien', after: 'Vienna' }, PROP);

    expect(request.kind).toBe('update');
    expect(request.payload.value).toBeInstanceOf(UpdateTextValueAsString);
    expect(request.payload.value).toMatchObject({ id: 'v1', text: 'Vienna', valueHasComment: 'checked in archive' });
    expect(request.payload).toMatchObject({ id: 'r1', property: PROP });
  });

  it('CreatesAValueWhenThereIsNone', () => {
    const request = bulkEditRequest({ resource: resource('r1'), before: null, after: 'Brief' }, PROP);

    expect(request.kind).toBe('create');
    expect(request.payload.value).toBeInstanceOf(CreateTextValueAsString);
    expect(request.payload.value).toMatchObject({ text: 'Brief' });
  });
});
