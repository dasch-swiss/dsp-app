import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import {
  classFamilies,
  FAMILY_HUES,
  familyColor,
  familyTexture,
  fileIconImage,
  islandsOf,
  textureImage,
  unlinkedOf,
} from './islands';
import { toGraphElements } from './ontology-graph-elements';

const graph: DataModelGraph = {
  nodes: [
    { id: 'Image', label: 'Image', kind: 'class', navigable: true, representationClass: 'StillImageRepresentation' },
    { id: 'Photo', label: 'Photo', kind: 'class', navigable: true, representationClass: 'StillImageRepresentation' },
    { id: 'Drawing', label: 'Drawing', kind: 'class', navigable: true },
    { id: 'Church', label: 'Church', kind: 'class', navigable: true },
    { id: 'Tour', label: 'Tour', kind: 'class', navigable: true },
    { id: 'Stop', label: 'Stop', kind: 'class', navigable: true, representationClass: 'AudioRepresentation' },
    { id: 'Note', label: 'Note', kind: 'class', navigable: true },
  ],
  edges: [
    { source: 'Photo', target: 'Image', property: 'subClassOf', label: '', kind: 'subclass' },
    { source: 'Drawing', target: 'Photo', property: 'subClassOf', label: '', kind: 'subclass' },
    { source: 'Image', target: 'Church', property: 'depicts', label: 'Depicts', kind: 'link' },
    { source: 'Photo', target: 'Church', property: 'depicts', label: 'Depicts', kind: 'link' },
    { source: 'Stop', target: 'Tour', property: 'stopOf', label: 'Stop of', kind: 'link' },
    { source: 'Note', target: 'Note', property: 'seeAlso', label: 'See also', kind: 'link' },
  ],
};
/** The graph as the view draws it: links only, the subclass relations kept apart. */
const links: DataModelGraph = { nodes: graph.nodes, edges: graph.edges.filter(edge => edge.kind === 'link') };

describe('classFamilies', () => {
  const families = classFamilies(graph);

  it('puts a class in the family of its topmost superclass, at any depth', () => {
    expect(['Image', 'Photo', 'Drawing'].map(iri => families.get(iri)?.root)).toEqual(['Image', 'Image', 'Image']);
    expect(families.get('Image')?.sub).toBe(false);
    expect(families.get('Drawing')?.sub).toBe(true);
    expect(families.get('Drawing')?.rootLabel).toBe('Image');
  });

  it('orders families biggest first, then by label', () => {
    expect(['Image', 'Church', 'Note', 'Stop', 'Tour'].map(iri => families.get(iri)?.index)).toEqual([0, 1, 2, 3, 4]);
  });

  it('draws a top class in its hue and its subclasses lighter', () => {
    expect(familyColor(families.get('Image')!)).toBe(FAMILY_HUES[0].base);
    expect(familyColor(families.get('Photo')!)).toBe(FAMILY_HUES[0].light);
  });
});

describe('familyTexture', () => {
  it('keeps 10 hues plain, then white stripes, dark stripes, and again with a double border', () => {
    expect([0, 9, 10, 20, 30, 40, 50].map(familyTexture)).toEqual([
      { double: false },
      { double: false },
      { stripes: 'white', double: false },
      { stripes: 'dark', double: false },
      { double: true },
      { stripes: 'dark', double: true },
      { stripes: 'white', double: true },
    ]);
  });

  it('draws white stripes on a top class only, and dark ones on its subclasses', () => {
    const white = { stripes: 'white', double: false } as const;

    expect(textureImage({ double: true }, '#000000')).toBeUndefined();
    expect(decodeURIComponent(textureImage(white, '#000000')!)).toContain('stroke="#FFFFFF"');
    expect(decodeURIComponent(textureImage(white, '#000000', true)!)).toContain('stroke="#000000"');
  });
});

describe('fileIconImage', () => {
  it('draws an icon for a class with a file, none without', () => {
    expect(fileIconImage('AudioRepresentation', '#000000')).toMatch(/^data:image\/svg\+xml/);
    expect(fileIconImage(undefined, '#000000')).toBeUndefined();
    expect(fileIconImage('WithoutRepresentation', '#000000')).toBeUndefined();
  });
});

describe('islandsOf', () => {
  it('splits classes into groups linked together, biggest first, leaving out the unlinked', () => {
    expect(islandsOf(links)).toEqual([
      ['Image', 'Church', 'Photo'],
      ['Tour', 'Stop'],
    ]);
    expect(unlinkedOf(links)).toEqual(['Drawing', 'Note']);
  });
});

describe('toGraphElements in the Islands view', () => {
  const elements = toGraphElements(links, {
    colors: new Map(),
    anyResourceLabel: 'Any resource',
    islands: {
      families: classFamilies(graph),
    },
  });
  const node = (id: string) => elements.find(e => e.group === 'nodes' && e.data.id === id)!;

  it('draws an unnamed island per group of linked classes, and one for the rest', () => {
    const islands = elements.filter(e => e.classes?.includes('island'));

    expect(islands.map(e => e.data.id)).toEqual(['island:0', 'island:1', 'island:unlinked']);
    expect(islands.map(e => e.data['label'])).toEqual(['', '', '']);
    expect(islands.some(e => e.classes?.includes('alone'))).toBe(false);
  });

  it('draws no frame around a lone island', () => {
    const lone = toGraphElements(
      { nodes: links.nodes.filter(n => ['Stop', 'Tour'].includes(n.id)), edges: links.edges },
      { colors: new Map(), anyResourceLabel: 'Any resource', islands: { families: classFamilies(graph) } }
    );

    expect(lone.find(e => e.data.id === 'island:0')?.classes).toBe('island alone');
  });

  it('groups the classes of a family sharing an island in a family node, others straight in the island', () => {
    expect(node('Image').data.parent).toBe(node('Photo').data.parent);
    expect(node(node('Image').data.parent!).data['label']).toBe('Image');
    expect(node('Church').data.parent).toBe('island:0');
    expect(node('Note').data.parent).toBe('island:unlinked');
  });

  it('keeps a subclass without links in the island of its family', () => {
    expect(node('Drawing').data.parent).toBe(node('Image').data.parent);
  });

  it('gives a class with a file its icon, and one without none', () => {
    expect(node('Photo').data['icon']).toBeDefined();
    expect(node('Church').data['icon']).toBeUndefined();
  });
});
