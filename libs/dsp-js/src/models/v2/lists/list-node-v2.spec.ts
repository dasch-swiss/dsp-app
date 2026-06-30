import { JsonConvert, OperationMode, PropertyMatchingRule, ValueCheckingMode } from 'json2typescript';
import { ListNodeV2WithAllLanguages } from './list-node-v2';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const jsonld = require('jsonld/dist/jsonld.js');

describe('ListNodeV2WithAllLanguages', () => {
  const jsonConvert = new JsonConvert(
    OperationMode.ENABLE,
    ValueCheckingMode.DISALLOW_NULL,
    false,
    PropertyMatchingRule.CASE_STRICT
  );

  it('parses an allLanguages-mode payload into labels[] and preserves label', async () => {
    const payload = require('../../../../test/data/api/v2/manually-generated/treelist-with-all-languages.json');

    // The endpoint pipeline runs jsonld.compact with an empty context, which
    // expands prefixed terms (e.g. rdfs:label) to full IRIs matching Constants.
    const expanded = (await jsonld.compact(payload, {})) as object;

    const node = jsonConvert.deserialize(expanded, ListNodeV2WithAllLanguages) as ListNodeV2WithAllLanguages;

    expect(node.labels.length).toEqual(2);
    expect(node.labels[0]).toEqual(expect.objectContaining({ language: 'de', value: 'Listenwurzel' }));
    expect(node.labels[1]).toEqual(expect.objectContaining({ language: 'en', value: 'Tree list root' }));

    expect(node.label).toEqual('Listenwurzel');

    expect(node.children.length).toEqual(2);
    expect(node.children[0].labels.length).toEqual(1);
    expect(node.children[0].labels[0]).toEqual(expect.objectContaining({ language: 'en', value: 'Tree list node 01' }));
    expect(node.children[1].labels.length).toEqual(2);
  });
});
