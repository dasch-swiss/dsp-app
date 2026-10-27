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

const channelOf = (path: string) => Number(path.match(/V \S+ H (\S+) V/)![1]);
const laneOf = (path: string) => [...path.matchAll(/V (\S+) H/g)].pop()![1];

describe('layoutDataModel', () => {
  it('puts the class that links out above the classes it links to', () => {
    const layout = layoutDataModel(
      graph(['Page', 'Book', 'Sidebar'], [link('Page', 'Book'), link('Page', 'Sidebar')]),
      {
        width: 336,
        condensed: false,
      }
    );

    expect(['Page', 'Book', 'Sidebar'].map(id => placedOf(layout, id).row)).toEqual([0, 1, 1]);
  });

  it('puts two steps side by side when one pair of classes links them, joined by a straight line', () => {
    const layout = layoutDataModel(
      graph(
        ['Interview', 'Interview guide', 'File'],
        [link('Interview', 'Interview guide'), link('Interview', 'File'), link('Interview guide', 'File')]
      ),
      { width: 336, condensed: false }
    );
    const interview = placedOf(layout, 'Interview');
    const guide = placedOf(layout, 'Interview guide');

    expect([interview.row, guide.row, placedOf(layout, 'File').row]).toEqual([0, 0, 1]);
    expect(guide.x).toBeGreaterThan(interview.x);
    expect(layout.edges[0].path).toBe(`M ${interview.x + interview.width} ${interview.y + 24} H ${guide.x}`);
  });

  it('wraps a step with more classes than fit a row onto further rows', () => {
    const targets = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
    const layout = layoutDataModel(
      graph(
        ['Hub', ...targets],
        targets.map(id => link('Hub', id))
      ),
      { width: 336, condensed: false }
    );

    expect(targets.map(id => placedOf(layout, id).row)).toEqual([1, 1, 1, 2, 2, 2]);
  });

  it('places classes without links in a grid below the linked ones', () => {
    const layout = layoutDataModel(graph(['A', 'B', 'Lonely'], [link('A', 'B')]), { width: 336, condensed: false });
    const lonely = placedOf(layout, 'Lonely');

    expect(lonely.y).toBeGreaterThan(placedOf(layout, 'A').y + placedOf(layout, 'A').height);
    expect(lonely.x).toBe(10);
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

    expect(laneOf(layout.edges[0].path)).toBe(laneOf(layout.edges[1].path));
  });

  it('gives a different property into the same class its own lane', () => {
    const layout = layoutDataModel(
      graph(['A', 'B', 'Author'], [link('A', 'Author', 'author'), link('B', 'Author', 'editor')]),
      { width: 336, condensed: false }
    );

    expect(laneOf(layout.edges[0].path)).not.toBe(laneOf(layout.edges[1].path));
  });

  it('runs a link that skips rows between the cards it passes, not behind them', () => {
    const targets = ['T1', 'T2', 'T3', 'T4'];
    const layout = layoutDataModel(
      graph(['Hub', ...targets, 'Far'], [...targets.map(id => link('Hub', id)), link('T1', 'Far'), link('Hub', 'Far')]),
      { width: 250, condensed: false }
    );
    const far = placedOf(layout, 'Far');
    const skipping = layout.edges.find(e => e.edge.source === 'Hub' && e.edge.target === 'Far')!;
    const channel = channelOf(skipping.path);
    const passed = layout.nodes.filter(p => p.row > 0 && p.row < far.row);

    expect(passed.length).toBeGreaterThan(0);
    for (const p of passed) {
      expect(channel < p.x || channel > p.x + p.width).toBe(true);
    }
  });

  it('runs a link back up beside the cards, not through them', () => {
    const layout = layoutDataModel(graph(['A', 'B'], [link('A', 'B'), link('B', 'A')]), {
      width: 336,
      condensed: false,
    });
    const back = layout.edges.find(e => e.edge.source === 'B')!;
    const channel = channelOf(back.path);

    for (const p of layout.nodes) {
      expect(channel < p.x || channel > p.x + p.width).toBe(true);
    }
  });

  it('is deterministic', () => {
    const input = graph(['A', 'B', 'C', 'D'], [link('A', 'C'), link('B', 'C'), link('B', 'D')]);

    expect(layoutDataModel(input, { width: 336, condensed: false })).toEqual(
      layoutDataModel(input, { width: 336, condensed: false })
    );
  });
});
