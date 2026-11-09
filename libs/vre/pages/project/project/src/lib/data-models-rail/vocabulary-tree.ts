import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';

/** A controlled vocabulary or one of its values, as dsp-api's admin lists give them. */
export interface VocabularyNode {
  id: string;
  name?: string;
  labels: { value: string; language?: string }[];
  comments?: { value: string; language?: string }[];
  children?: VocabularyNode[];
}

/** A line of the vocabularies' tree table: a vocabulary (depth 0) or a value under it. */
export interface VocabularyRow {
  node: VocabularyNode;
  depth: number;
  /** The vocabulary the line is in, for a value. */
  vocabulary: string;
  /** The vocabulary or value it is under; none for a vocabulary. */
  parent?: string;
  /** Where it is among the values of its parent, from 0, and how many there are. */
  position: number;
  siblings: number;
  label: string;
  description: string;
  /** How many values are under it, at every depth. */
  count: number;
  expandable: boolean;
  expanded: boolean;
}

/** Where a vocabulary is used: a list property and the classes that have it. */
export interface VocabularyUse {
  property: string;
  propertyLabel: string;
  classes: string[];
}

const countOf = (node: VocabularyNode): number =>
  (node.children ?? []).reduce((sum, child) => sum + 1 + countOf(child), 0);

/**
 * The lines the tree table shows: every vocabulary, and under each the values of the opened lines. A search shows the
 * vocabularies and values whose label has the text, with what leads to them opened; the rest of the tree hides.
 */
export function vocabularyRows(
  vocabularies: readonly VocabularyNode[],
  expanded: ReadonlySet<string>,
  query: string,
  labelOf: (node: VocabularyNode) => string,
  descriptionOf: (node: VocabularyNode) => string
): VocabularyRow[] {
  const text = query.trim().toLowerCase();
  const matches = (node: VocabularyNode) => !!text && labelOf(node).toLowerCase().includes(text);
  // Whether the node, or a value under it, matches the search.
  const holds = (node: VocabularyNode): boolean => matches(node) || (node.children ?? []).some(holds);

  const rows: VocabularyRow[] = [];
  const add = (node: VocabularyNode, depth: number, vocabulary: string, parent?: VocabularyNode) => {
    const children = node.children ?? [];
    const searchOpen = !!text && children.some(holds);
    const open = searchOpen || expanded.has(node.id);
    rows.push({
      node,
      depth,
      vocabulary,
      parent: parent?.id,
      position: parent?.children?.indexOf(node) ?? 0,
      siblings: parent?.children?.length ?? 1,
      label: labelOf(node),
      description: descriptionOf(node),
      count: countOf(node),
      expandable: children.length > 0,
      expanded: open && children.length > 0,
    });
    if (!open) return;
    for (const child of children) if (!text || holds(child)) add(child, depth + 1, vocabulary, node);
  };
  for (const vocabulary of vocabularies) if (!text || holds(vocabulary)) add(vocabulary, 0, vocabulary.id);
  return rows;
}

/** Every vocabulary's and value's IRI that has values under it, to open them all. */
export function expandableIds(vocabularies: readonly VocabularyNode[]): string[] {
  const ids: string[] = [];
  const walk = (node: VocabularyNode) => {
    if (node.children?.length) {
      ids.push(node.id);
      node.children.forEach(walk);
    }
  };
  vocabularies.forEach(walk);
  return ids;
}

/** For each vocabulary, the list properties of the data model that take their values from it, with their classes. */
export function vocabularyUses(graph: DataModelGraph): Map<string, VocabularyUse[]> {
  const byList = new Map<string, Map<string, VocabularyUse>>();
  for (const node of graph.nodes) {
    for (const property of node.propertyDetails ?? []) {
      if (!property.list) continue;
      const uses = byList.get(property.list) ?? new Map<string, VocabularyUse>();
      const use = uses.get(property.id) ?? { property: property.id, propertyLabel: property.label, classes: [] };
      if (!use.classes.includes(node.id)) use.classes.push(node.id);
      uses.set(property.id, use);
      byList.set(property.list, uses);
    }
  }
  return new Map([...byList].map(([list, uses]) => [list, [...uses.values()]]));
}
