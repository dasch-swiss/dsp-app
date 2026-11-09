import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { graphSearchResults } from './graph-search-results.component';

const onto = 'http://example.org/ontology/0001/beol/v2#';

const model: DataModelGraph = {
  nodes: [
    { id: `${onto}Place`, label: 'Place', kind: 'class' },
    { id: `${onto}City`, label: 'City', kind: 'class' },
    { id: `${onto}Event`, label: 'Event', kind: 'class' },
    { id: `${onto}Concert`, label: 'Concert', kind: 'class' },
  ],
  edges: [
    { source: `${onto}City`, target: `${onto}Place`, property: 'rdfs:subClassOf', label: '', kind: 'subclass' },
    {
      source: `${onto}Event`,
      target: `${onto}Place`,
      property: `${onto}takesPlaceIn`,
      label: 'takes place in',
      kind: 'link',
    },
    {
      source: `${onto}Concert`,
      target: `${onto}City`,
      property: `${onto}takesPlaceIn`,
      label: 'takes place in',
      kind: 'link',
    },
  ],
};

describe('graphSearchResults', () => {
  it('finds nothing without a text', () => {
    expect(graphSearchResults(model, model, '  ')).toEqual({ classes: [], properties: [] });
  });

  it('finds classes by label, with their subclasses counted', () => {
    const { classes } = graphSearchResults(model, model, 'PLACE');
    expect(classes).toEqual([{ kind: 'class', iri: `${onto}Place`, label: 'Place', subclasses: 1 }]);
  });

  it('finds each property once, with the other pairs it links counted', () => {
    const { properties } = graphSearchResults(model, model, 'place');
    expect(properties).toEqual([
      {
        kind: 'property',
        iri: `${onto}takesPlaceIn`,
        label: 'takes place in',
        source: `${onto}Event`,
        target: `${onto}Place`,
        others: 1,
      },
    ]);
  });

  it('finds a property by its name too', () => {
    expect(graphSearchResults(model, model, 'takesPlace').properties).toHaveLength(1);
  });
});
