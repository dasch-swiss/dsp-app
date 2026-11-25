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
    expect(classes).toEqual([
      { kind: 'class', iri: `${onto}Place`, label: 'Place', name: 'Place', nameMatch: false, subclasses: 1, depth: 0 },
    ]);
  });

  it('finds each property once, with the classes using it counted', () => {
    const { properties } = graphSearchResults(model, model, 'place');
    expect(properties).toEqual([
      {
        kind: 'property',
        iri: `${onto}takesPlaceIn`,
        label: 'takes place in',
        name: 'takesPlaceIn',
        nameMatch: false,
        classes: 2,
      },
    ]);
  });

  it('finds a property by its name too, and says so', () => {
    const { properties } = graphSearchResults(model, model, 'takesPlace');
    expect(properties.map(property => property.nameMatch)).toEqual([true]);
  });

  it('lists everything without a text when asked, each subclass under its parent', () => {
    const { classes, properties } = graphSearchResults(model, model, '', true);
    expect(classes.map(result => [result.label, result.depth])).toEqual([
      ['Concert', 0],
      ['Event', 0],
      ['Place', 0],
      ['City', 1],
    ]);
    expect(properties).toHaveLength(1);
  });
});
