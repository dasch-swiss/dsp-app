import { DataModelEdge, DataModelGraph, DataModelNode } from './data-model-graph';
import { layoutDataModel } from './data-model-layout';

const node = (id: string): DataModelNode => ({ id, label: id, kind: 'class', count: 1, navigable: true });
const link = (source: string, target: string, property = 'p'): DataModelEdge => ({
  source,
  target,
  property,
  label: property,
  kind: 'link',
});
const graph = (ids: string[], edges: DataModelEdge[]): DataModelGraph => ({ nodes: ids.map(node), edges });

const placedOf = (layout: ReturnType<typeof layoutDataModel>, id: string) => layout.nodes.find(p => p.node.id === id)!;
const overlaps = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe('layoutDataModel', () => {
  it('puts the class that links out left of the classes it links to', () => {
    const layout = layoutDataModel(
      graph(['Event', 'Slide', 'Author'], [link('Event', 'Slide'), link('Slide', 'Author')]),
      {
        width: 336,
        condensed: false,
      }
    );

    expect(['Event', 'Slide', 'Author'].map(id => placedOf(layout, id).column)).toEqual([0, 1, 2]);
  });

  it('folds longer chains into the last column the width allows', () => {
    const layout = layoutDataModel(graph(['A', 'B', 'C', 'D'], [link('A', 'B'), link('B', 'C'), link('C', 'D')]), {
      width: 250,
      condensed: false,
    });

    expect(['A', 'B', 'C', 'D'].map(id => placedOf(layout, id).column)).toEqual([0, 1, 1, 1]);
  });

  it('spreads many linked-to classes over the free columns, keeping links left to right', () => {
    const targets = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
    const layout = layoutDataModel(
      graph(
        ['Hub', ...targets],
        targets.map(id => link('Hub', id))
      ),
      { width: 336, condensed: false }
    );
    const columns = targets.map(id => placedOf(layout, id).column);

    expect(placedOf(layout, 'Hub').column).toBe(0);
    expect(columns.filter(c => c === 1).length).toBeGreaterThan(0);
    expect(columns.filter(c => c === 2).length).toBeGreaterThan(0);
  });

  it('places classes without links in a grid below the linked ones', () => {
    const layout = layoutDataModel(graph(['A', 'B', 'Lonely'], [link('A', 'B')]), { width: 336, condensed: false });
    const lonely = placedOf(layout, 'Lonely');

    expect(lonely.y).toBeGreaterThan(placedOf(layout, 'A').y + placedOf(layout, 'A').height);
    expect(lonely.x).toBe(placedOf(layout, 'A').x);
  });

  it('terminates on cycles and self-links and still places every class', () => {
    const layout = layoutDataModel(graph(['A', 'B'], [link('A', 'B'), link('B', 'A'), link('A', 'A')]), {
      width: 336,
      condensed: false,
    });

    expect(layout.nodes).toHaveLength(2);
    expect(layout.edges).toHaveLength(2);
  });

  it('never overlaps two cards, and keeps them inside the width', () => {
    const ids = Array.from({ length: 40 }, (_, i) => `C${i}`);
    const edges = ids.slice(1).map((id, i) => link(ids[Math.floor(i / 3)], id, `p${i % 4}`));
    const layout = layoutDataModel(graph([...ids, 'X', 'Y'], edges), { width: 336, condensed: true });

    for (const a of layout.nodes) {
      expect(a.x + a.width).toBeLessThanOrEqual(336);
      for (const b of layout.nodes) {
        if (a !== b) expect(overlaps(a, b)).toBe(false);
      }
    }
  });

  it('bundles links into the same class through the same property into one trunk', () => {
    const layout = layoutDataModel(
      graph(['A', 'B', 'Author'], [link('A', 'Author', 'author'), link('B', 'Author', 'author')]),
      { width: 336, condensed: false }
    );
    const lane = (path: string) => [...path.matchAll(/H (\S+) V/g)].pop()![1];

    expect(lane(layout.edges[0].path)).toBe(lane(layout.edges[1].path));
  });

  it('gives a different property into the same class its own lane', () => {
    const layout = layoutDataModel(
      graph(['A', 'B', 'Author'], [link('A', 'Author', 'author'), link('B', 'Author', 'editor')]),
      { width: 336, condensed: false }
    );
    const lane = (path: string) => [...path.matchAll(/H (\S+) V/g)].pop()![1];

    expect(lane(layout.edges[0].path)).not.toBe(lane(layout.edges[1].path));
  });

  it('runs a link that skips a column between the rows, not behind the cards it skips', () => {
    const layout = layoutDataModel(
      graph(
        ['Interview', 'Interview guide', 'File'],
        [link('Interview', 'Interview guide'), link('Interview', 'File'), link('Interview guide', 'File')]
      ),
      { width: 336, condensed: false }
    );
    const card = (label: string) => layout.nodes.find(p => p.node.label === label)!;
    const skipping = layout.edges.find(e => card(e.edge.source).column === 0 && card(e.edge.target).column === 2)!;
    const skipped = layout.nodes.filter(p => p.column === 1);

    expect(skipped.length).toBeGreaterThan(0);
    const [, channel] = skipping.path.match(/V (\S+) H/)!;
    for (const p of skipped) {
      expect(Number(channel) < p.y || Number(channel) > p.y + p.height).toBe(true);
    }
  });

  it('is deterministic', () => {
    const input = graph(['A', 'B', 'C', 'D'], [link('A', 'C'), link('B', 'C'), link('B', 'D')]);

    expect(layoutDataModel(input, { width: 336, condensed: false })).toEqual(
      layoutDataModel(input, { width: 336, condensed: false })
    );
  });
});
