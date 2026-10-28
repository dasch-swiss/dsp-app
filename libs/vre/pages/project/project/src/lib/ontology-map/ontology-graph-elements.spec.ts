import { Constants } from '@dasch-swiss/dsp-js';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { layoutOptions, toGraphElements } from './ontology-graph-elements';

const graph: DataModelGraph = {
  nodes: [
    { id: 'Film', label: 'Film', kind: 'class', count: 3, navigable: true },
    { id: 'Person', label: 'Person', kind: 'class', count: 2, navigable: true },
    { id: 'Lonely', label: 'Lonely', kind: 'class', count: 1, navigable: true },
    { id: Constants.Resource, label: 'Resource', kind: 'generic', navigable: false },
  ],
  edges: [
    { source: 'Film', target: 'Person', property: 'director', label: 'Director', kind: 'link' },
    { source: 'Film', target: 'Person', property: 'writer', label: 'Writer', kind: 'link' },
    { source: 'Film', target: 'Film', property: 'sequel', label: 'Sequel', kind: 'link' },
    { source: 'Person', target: Constants.Resource, property: 'mentions', label: 'Mentions', kind: 'link' },
  ],
};

describe('toGraphElements', () => {
  const elements = toGraphElements(graph, {
    tints: new Map([['Film', 3]]),
    mainIri: 'Film',
    selectedIri: 'Person',
    anyResourceLabel: 'Any resource',
  });
  const node = (id: string) => elements.find(e => e.group === 'nodes' && e.data.id === id)!;

  it('draws a node per class, styled by its tint, main and selected state', () => {
    expect(node('Film').classes).toBe('tint-3 main');
    expect(node('Person').classes).toBe('tint-0 selected');
    expect(node('Lonely').classes).toBe('tint-0 unlinked');
  });

  it("names knora-api's resource in the current language, drawn as outside the data model", () => {
    expect(node(Constants.Resource).data['label']).toBe('Any resource');
    expect(node(Constants.Resource).classes).toBe('external');
  });

  it('draws an edge per link, labelled with its property, without links to the class itself', () => {
    const edges = elements.filter(e => e.group === 'edges').map(e => [e.data.source, e.data.target, e.data['label']]);

    expect(edges).toEqual([
      ['Film', 'Person', 'Director'],
      ['Film', 'Person', 'Writer'],
      ['Person', Constants.Resource, 'Mentions'],
    ]);
  });
});

describe('layoutOptions', () => {
  it('maps every layout to a Cytoscape layout', () => {
    expect(['tree', 'circle', 'force', 'grid'].map(l => layoutOptions(l as never).name)).toEqual([
      'breadthfirst',
      'circle',
      'cose',
      'grid',
    ]);
  });
});
