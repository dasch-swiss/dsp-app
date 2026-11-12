import { DataModelEdge, DataModelGraph, DataModelNode } from './data-model-graph';
import { linkCounts, linkTints, mainClass } from './data-model-importance';

const node = (id: string, kind: DataModelNode['kind'] = 'class'): DataModelNode => ({
  id,
  label: id,
  kind,
  navigable: kind === 'class',
});
const link = (source: string, target: string, property = 'p', kind: DataModelEdge['kind'] = 'link'): DataModelEdge => ({
  source,
  target,
  property,
  label: property,
  kind,
});

/** scenario-tanner's shape: Film is linked with almost every class, Person with a few. */
const star: DataModelGraph = {
  nodes: ['Film', 'Person', 'Page', 'Script', 'Promotion', 'Production', 'Document', 'Lonely'].map(id => node(id)),
  edges: [
    ...['Page', 'Script', 'Promotion', 'Production', 'Document'].map(id => link(id, 'Film')),
    link('Film', 'Person', 'director'),
    link('Film', 'Person', 'writer'),
    link('Page', 'Person'),
    link('Page', 'Document'),
  ],
};

describe('linkCounts', () => {
  it('counts every other class once, whichever way and through however many properties they are linked', () => {
    const counts = linkCounts(star);

    expect(counts.get('Film')).toBe(6);
    expect(counts.get('Person')).toBe(2);
    expect(counts.get('Page')).toBe(3);
    expect(counts.get('Lonely')).toBe(0);
  });

  it('leaves out subclass relations, links to itself and cards outside the data model', () => {
    const counts = linkCounts({
      nodes: [node('A'), node('B'), node('Other', 'external'), node('Resource', 'generic')],
      edges: [link('A', 'B', 'sub', 'subclass'), link('A', 'A'), link('A', 'Other'), link('A', 'Resource')],
    });

    expect(counts.get('A')).toBe(0);
    expect(counts.has('Other')).toBe(false);
  });
});

describe('linkTints', () => {
  it('tints the most linked class darkest and classes with one link not at all', () => {
    const tints = linkTints(linkCounts(star));

    expect(tints.get('Film')).toBe(3);
    expect(tints.get('Page')).toBe(2);
    expect(tints.get('Person')).toBe(1);
    expect(tints.get('Script')).toBe(0);
  });

  it('tints nothing when no class is linked with more than one other', () => {
    const tints = linkTints(linkCounts({ nodes: [node('A'), node('B')], edges: [link('A', 'B')] }));

    expect([...tints.values()]).toEqual([0, 0]);
  });
});

describe('mainClass', () => {
  it('names the class linked with at least twice as many classes as any other', () => {
    expect(mainClass(linkCounts(star))).toEqual({ id: 'Film', links: 6, others: 7 });
  });

  it('names none when two classes are about as central', () => {
    const counts = new Map([
      ['Article', 8],
      ['Book', 5],
      ['Person', 2],
    ]);

    expect(mainClass(counts)).toBeUndefined();
  });

  it('names none in a model too small for one to stand out', () => {
    expect(
      mainClass(
        new Map([
          ['Page', 2],
          ['Book', 1],
          ['Sidebar', 1],
        ])
      )
    ).toBeUndefined();
  });
});
