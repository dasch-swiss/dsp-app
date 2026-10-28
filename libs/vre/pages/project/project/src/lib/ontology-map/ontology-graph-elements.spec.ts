import { Constants } from '@dasch-swiss/dsp-js';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { CLASS_COLORS, classColors, layoutOptions, linkedWith, toGraphElements } from './ontology-graph-elements';

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
    colors: classColors(graph),
    mainIri: 'Film',
    selectedIri: 'Person',
    anyResourceLabel: 'Any resource',
  });
  const node = (id: string) => elements.find(e => e.group === 'nodes' && e.data.id === id)!;

  it('draws a node per class in its own colour, styled by its main and selected state', () => {
    expect(['Film', 'Lonely', 'Person'].map(id => node(id).data['color'])).toEqual(CLASS_COLORS.slice(0, 3));
    expect(node('Film').classes).toBe('main');
    expect(node('Person').classes).toBe('selected');
    expect(node('Lonely').classes).toBe('unlinked');
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

describe('linkedWith', () => {
  it('keeps the class with the classes linking to it and those it links to, with only those links', () => {
    const focused = linkedWith(graph, 'Person');

    expect(focused.nodes.map(n => n.id)).toEqual(['Film', 'Person', Constants.Resource]);
    expect(focused.edges.map(e => e.property)).toEqual(['director', 'writer', 'mentions']);
  });

  it('keeps the classes a class links to even when nothing links to it, without its links to itself', () => {
    const focused = linkedWith(graph, 'Film');

    expect(focused.nodes.map(n => n.id)).toEqual(['Film', 'Person']);
    expect(focused.edges.map(e => e.property)).toEqual(['director', 'writer']);
  });

  it('keeps the whole model when no class, or an unknown one, is given', () => {
    expect(linkedWith(graph, undefined)).toBe(graph);
    expect(linkedWith(graph, 'Unknown')).toBe(graph);
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
