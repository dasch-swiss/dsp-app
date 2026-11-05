import { Cardinality, Constants } from '@dasch-swiss/dsp-js';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import {
  classRows,
  graphScale,
  linkedWith,
  propertyRows,
  propertyUsage,
  searchGraph,
  throughProperties,
  toGraphElements,
  withInheritedLinks,
  withoutClasses,
  withoutProperties,
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
  const colors = new Map([
    ['Film', '#111111'],
    ['Lonely', '#222222'],
    ['Person', '#333333'],
  ]);
  const elements = toGraphElements(graph, {
    colors,
    mainIri: 'Film',
    selectedIri: 'Person',
    anyResourceLabel: 'Any resource',
  });
  const node = (id: string) => elements.find(e => e.group === 'nodes' && e.data.id === id)!;

  it('draws a node per class in its own colour, styled by its main and selected state', () => {
    expect(['Film', 'Lonely', 'Person'].map(id => node(id).data['color'])).toEqual(['#111111', '#222222', '#333333']);
    expect(node('Film').classes).toBe('main');
    expect(node('Person').classes).toBe('selected');
    expect(node('Lonely').classes).toBe('');
  });

  it('gives every class and link its label, its name and both, to write either', () => {
    const edge = elements.find(e => e.group === 'edges' && e.data['property'] === 'director')!;

    expect(edge.data).toEqual(
      expect.objectContaining({ label: 'Director', name: 'director', both: 'Director\ndirector' })
    );
    expect(node(Constants.Resource).data['name']).toBe('Resource');
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

describe('toGraphElements with many links between two classes', () => {
  const links = (count: number, source: string, target: string) =>
    Array.from({ length: count }, (_, i) => ({
      source,
      target,
      property: `${source}${i}`,
      label: `Link ${i}`,
      kind: 'link' as const,
    }));
  const edgesOf = (edges: DataModelGraph['edges']) =>
    toGraphElements(
      { nodes: graph.nodes, edges },
      { colors: new Map(), anyResourceLabel: 'Any resource', linksLabel: 'links' }
    ).filter(e => e.group === 'edges');

  it('draws up to 4 links from one class to another one by one', () => {
    expect(edgesOf(links(4, 'Film', 'Person'))).toHaveLength(4);
  });

  it('draws more than 4 as one link saying how many, one per direction', () => {
    const edges = edgesOf([...links(5, 'Film', 'Person'), ...links(2, 'Person', 'Film')]);

    expect(edges.map(e => e.data['label'])).toEqual(['5 links', 'Link 0', 'Link 1']);
    expect(edges[0].classes).toBe('links');
  });
});

describe('searchGraph', () => {
  it('finds nothing for a blank text', () => {
    expect(searchGraph(graph, '  ')).toBeUndefined();
  });

  it('keeps a class found with its links and the classes at their other end, ignoring case', () => {
    const search = searchGraph(graph, 'lONEL')!;
    expect([...search.hitClasses]).toEqual(['Lonely']);
    expect([...search.classes]).toEqual(['Lonely']);
    expect(search.links.size).toBe(0);

    const person = searchGraph(graph, 'person')!;
    expect([...person.classes].sort()).toEqual([Constants.Resource, 'Film', 'Person'].sort());
    expect(person.links).toEqual(
      new Set(['Film director Person', 'Film writer Person', `Person mentions ${Constants.Resource}`])
    );
    expect(person.hitLinks.size).toBe(0);
  });

  it('finds links by label or property name, keeping the classes at both ends', () => {
    const search = searchGraph(graph, 'direct')!;
    expect(search.hitClasses.size).toBe(0);
    expect([...search.hitLinks]).toEqual(['Film director Person']);
    expect([...search.classes]).toEqual(['Film', 'Person']);
  });

  it('names a link found among many by the one link drawn for them', () => {
    const many = Array.from({ length: 5 }, (_, i) => ({
      source: 'Film',
      target: 'Person',
      property: `p${i}`,
      label: i === 3 ? 'Producer' : `Link ${i}`,
      kind: 'link' as const,
    }));
    expect([...searchGraph({ nodes: graph.nodes, edges: many }, 'producer')!.hitLinks]).toEqual(['Film links Person']);
  });

  it('finds nothing for a text nowhere in the graph', () => {
    const search = searchGraph(graph, 'sculpture')!;
    expect(search.hitClasses.size + search.hitLinks.size).toBe(0);
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

  it('gives subclasses no links of their own when inherited links are left out', () => {
    const hidden = withInheritedLinks(family, false);

    expect(hidden.edges.some(e => e.kind === 'subclass' || e.source === 'Short' || e.source === 'Clip')).toBe(false);
    expect(hidden.nodes.map(n => n.id)).toContain('Short');
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
      type: 'Link',
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

describe('withoutClasses', () => {
  it('leaves out the classes and every link to or from them', () => {
    const rest = withoutClasses(graph, ['Person']);

    expect(rest.nodes.map(n => n.id)).toEqual(['Film', 'Lonely', Constants.Resource]);
    expect(rest.edges.map(e => e.property)).toEqual(['sequel']);
  });
});

describe('withoutProperties', () => {
  it('leaves out the links through the properties, keeping every class', () => {
    const rest = withoutProperties(graph, ['director', 'writer']);

    expect(rest.nodes).toBe(graph.nodes);
    expect(rest.edges.map(e => e.property)).toEqual(['sequel', 'mentions']);
  });
});

describe('classRows and propertyRows', () => {
  const model: DataModelGraph = {
    nodes: [
      {
        id: 'x#Film',
        label: 'Film',
        kind: 'class',
        navigable: true,
        propertyDetails: [
          { id: 'x#title', label: 'Title', description: '', type: 'Text', cardinality: Cardinality._1 },
          {
            id: 'x#director',
            label: 'Director',
            description: '',
            type: 'Link',
            linkTarget: 'x#Person',
            cardinality: Cardinality._0_n,
          },
        ],
      },
      {
        id: 'x#Person',
        label: 'Person',
        kind: 'class',
        navigable: true,
        propertyDetails: [
          { id: 'x#title', label: 'Title', description: '', type: 'Text', cardinality: Cardinality._0_1 },
        ],
      },
    ],
    edges: [{ source: 'x#Film', target: 'x#Person', property: 'x#director', label: 'Director', kind: 'link' }],
  };

  it('lists each class with its name, file, description, properties and the classes it links to', () => {
    const withFile: DataModelGraph = {
      ...model,
      nodes: [
        { ...model.nodes[0], description: 'A film', representationClass: 'MovingImageRepresentation' },
        { ...model.nodes[1], representationClass: 'WithoutRepresentation' },
      ],
    };
    expect(classRows(withFile)).toEqual([
      {
        id: 'x#Film',
        label: 'Film',
        name: 'Film',
        description: 'A film',
        representation: 'MovingImageRepresentation',
        properties: 2,
        propertyList: [
          { id: 'x#title', label: 'Title', type: 'Text' },
          { id: 'x#director', label: 'Director', type: 'Link', linkTarget: 'x#Person' },
        ],
        linksTo: ['x#Person'],
        depth: 0,
      },
      {
        id: 'x#Person',
        label: 'Person',
        name: 'Person',
        description: '',
        representation: undefined,
        properties: 1,
        propertyList: [{ id: 'x#title', label: 'Title', type: 'Text' }],
        linksTo: [],
        depth: 0,
      },
    ]);
  });

  it('lists subclasses under their superclass, by label, without the superclass among their links', () => {
    const family: DataModelGraph = {
      nodes: [
        { id: 'x#Work', label: 'Work', kind: 'class', navigable: true },
        { id: 'x#Book', label: 'Book', kind: 'class', navigable: true },
        { id: 'x#Film', label: 'Film', kind: 'class', navigable: true },
      ],
      edges: [
        { source: 'x#Film', target: 'x#Work', property: 'rdfs:subClassOf', label: '', kind: 'subclass' },
        { source: 'x#Book', target: 'x#Work', property: 'rdfs:subClassOf', label: '', kind: 'subclass' },
      ],
    };
    expect(classRows(family).map(row => [row.label, row.depth, row.superclass, row.linksTo])).toEqual([
      ['Work', 0, undefined, []],
      ['Book', 1, 'x#Work', []],
      ['Film', 1, 'x#Work', []],
    ]);
  });

  it('lists each property once, with the classes that have it', () => {
    expect(propertyRows(model)).toEqual([
      {
        id: 'x#director',
        label: 'Director',
        name: 'director',
        type: 'Link',
        linkTarget: 'x#Person',
        usedBy: ['x#Film'],
      },
      {
        id: 'x#title',
        label: 'Title',
        name: 'title',
        type: 'Text',
        linkTarget: undefined,
        usedBy: ['x#Film', 'x#Person'],
      },
    ]);
  });
});
