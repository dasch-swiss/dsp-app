import { Cardinality, Constants } from '@dasch-swiss/dsp-js';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import {
  CLASS_COLORS,
  classColors,
  graphScale,
  layoutOptions,
  linkedWith,
  propertyUsage,
  throughProperties,
  toGraphElements,
  withInheritedLinks,
} from './ontology-graph-elements';

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
    const focused = linkedWith(graph, ['Person']);

    expect(focused.nodes.map(n => n.id)).toEqual(['Film', 'Person', Constants.Resource]);
    expect(focused.edges.map(e => e.property)).toEqual(['director', 'writer', 'mentions']);
  });

  it('keeps the classes a class links to even when nothing links to it, without its links to itself', () => {
    const focused = linkedWith(graph, ['Film']);

    expect(focused.nodes.map(n => n.id)).toEqual(['Film', 'Person']);
    expect(focused.edges.map(e => e.property)).toEqual(['director', 'writer']);
  });

  it('keeps the whole model when no class, or an unknown one, is given', () => {
    expect(linkedWith(graph, [])).toBe(graph);
    expect(linkedWith(graph, ['Unknown'])).toBe(graph);
  });

  it('keeps every chosen class with the classes each is linked with', () => {
    const focused = linkedWith(graph, ['Film', 'Lonely']);

    expect(focused.nodes.map(n => n.id)).toEqual(['Film', 'Person', 'Lonely']);
    expect(focused.edges.map(e => e.property)).toEqual(['director', 'writer']);
  });
});

describe('throughProperties', () => {
  it('keeps only the links through the properties, with the classes at both ends', () => {
    const focused = throughProperties(graph, ['director', 'mentions']);

    expect(focused.nodes.map(n => n.id)).toEqual(['Film', 'Person', Constants.Resource]);
    expect(focused.edges.map(e => e.property)).toEqual(['director', 'mentions']);
  });

  it('keeps the whole model when no property is given', () => {
    expect(throughProperties(graph, [])).toBe(graph);
  });
});

describe('withInheritedLinks', () => {
  const family: DataModelGraph = {
    nodes: [
      ...graph.nodes,
      { id: 'Short', label: 'Short', kind: 'class', count: 1, navigable: true },
      { id: 'Clip', label: 'Clip', kind: 'class', count: 1, navigable: true },
      { id: 'Other', label: 'Other', kind: 'external', navigable: true },
    ],
    edges: [
      ...graph.edges,
      { source: 'Short', target: 'Film', property: 'subClassOf', label: '', kind: 'subclass' },
      { source: 'Clip', target: 'Short', property: 'subClassOf', label: '', kind: 'subclass' },
      { source: 'Lonely', target: 'Other', property: 'subClassOf', label: '', kind: 'subclass' },
    ],
  };
  const result = withInheritedLinks(family);

  it('gives subclasses, at any depth, the links of their superclasses instead of subclass arrows', () => {
    const from = (id: string) => result.edges.filter(e => e.source === id).map(e => `${e.property} ${e.target}`);

    expect(result.edges.some(e => e.kind === 'subclass')).toBe(false);
    expect(from('Short')).toEqual(['director Person', 'writer Person', 'sequel Film']);
    expect(from('Clip')).toEqual(from('Short'));
  });

  it('leaves out a class outside the data model that only a subclass arrow brought in', () => {
    expect(result.nodes.map(n => n.id)).not.toContain('Other');
    expect(result.nodes.map(n => n.id)).toContain('Lonely');
  });
});

describe('propertyUsage', () => {
  const family: DataModelGraph = {
    nodes: [
      {
        id: 'Film',
        label: 'Film',
        kind: 'class',
        navigable: true,
        propertyDetails: [
          {
            id: 'director',
            label: 'Director',
            description: 'Who directed it',
            type: 'Link',
            linkTarget: 'Person',
            cardinality: Cardinality._1_n,
          },
        ],
      },
      { id: 'Short', label: 'Short', kind: 'class', navigable: true },
      { id: 'Person', label: 'Person', kind: 'class', navigable: true },
    ],
    edges: [
      { source: 'Film', target: 'Person', property: 'director', label: 'Director', kind: 'link' },
      { source: 'Short', target: 'Film', property: 'subClassOf', label: '', kind: 'subclass' },
    ],
  };

  it('names the classes that have the property, inherited ones with the superclass declaring it', () => {
    expect(propertyUsage(family, 'director')).toEqual({
      label: 'Director',
      description: 'Who directed it',
      targets: ['Person'],
      links: 2,
      users: [
        { classIri: 'Film', cardinality: Cardinality._1_n, inheritedFrom: undefined },
        { classIri: 'Short', cardinality: undefined, inheritedFrom: 'Film' },
      ],
    });
  });

  it('knows no property that no class has', () => {
    expect(propertyUsage(family, 'nothing')).toBeUndefined();
  });
});

describe('graphScale', () => {
  it('grows a big data model, fitted at a low zoom, so its class names reach the chosen size', () => {
    expect(graphScale(15, 0.5)).toBe(2);
  });

  it('never shrinks a small data model, nor grows one past four times', () => {
    expect(graphScale(14, 3)).toBe(1);
    expect(graphScale(18, 0.1)).toBe(4);
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
