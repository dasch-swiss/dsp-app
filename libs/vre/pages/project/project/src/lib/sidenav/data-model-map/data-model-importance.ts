import { DataModelGraph } from './data-model-graph';

export interface MainClass {
  id: string;
  /** How many other classes of the data model it is linked with. */
  links: number;
  /** How many other classes the data model has. */
  others: number;
}

/** For each class of the data model, how many other classes of the data model it links to or is linked from. */
export function linkCounts(graph: DataModelGraph): Map<string, number> {
  const classes = new Set(graph.nodes.filter(node => node.kind === 'class').map(node => node.id));
  const neighbours = new Map<string, Set<string>>([...classes].map(id => [id, new Set()]));
  for (const { source, target, kind } of graph.edges) {
    if (kind !== 'link' || source === target || !classes.has(source) || !classes.has(target)) continue;
    neighbours.get(source)!.add(target);
    neighbours.get(target)!.add(source);
  }
  return new Map([...neighbours].map(([id, set]) => [id, set.size]));
}

/**
 * The class the data model is built around, if there is one: linked with at least three classes and at least twice
 * as many as any other class. Models where two or more classes are about as central have none.
 */
export function mainClass(counts: Map<string, number>): MainClass | undefined {
  const ranked = [...counts].sort((a, b) => b[1] - a[1]);
  const [top, second] = ranked;
  if (!top || top[1] < 3 || top[1] < 2 * (second?.[1] ?? 0)) return undefined;
  return { id: top[0], links: top[1], others: ranked.length - 1 };
}
