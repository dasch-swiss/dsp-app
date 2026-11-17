import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';

/** What keeps a class from being deleted, as far as the data model tells, and what clears it. */
export type ClassDeleteBlocker =
  /** A link property no class has points at the class: deleting the property clears it. */
  | { kind: 'unusedLink'; id: string; property: string; propertyLabel: string }
  /** A class's link property points at the class: taking it off that class clears it. */
  | { kind: 'link'; id: string; property: string; propertyLabel: string; source: string; sourceLabel: string }
  /** A subclass of the class: deleting the subclass clears it. */
  | { kind: 'subclass'; id: string; subclass: string; subclassLabel: string }
  /** The class has resources: deleting them clears it. */
  | { kind: 'resources'; id: string; count: number };

/**
 * What keeps the class from being deleted, as the data model shows it: links pointing at it, from its classes or from
 * properties no class has, its subclasses, and its resources. The API may know of more, such as values in other
 * projects; it is asked too.
 */
export function classDeleteBlockers(graph: DataModelGraph, classIri: string): ClassDeleteBlocker[] {
  const labelOf = (iri: string) =>
    graph.nodes.find(node => node.id === iri)?.label ?? iri.substring(iri.lastIndexOf('#') + 1);
  const blockers: ClassDeleteBlocker[] = [];
  for (const property of graph.unusedProperties ?? []) {
    if (property.linkTarget === classIri) {
      blockers.push({
        kind: 'unusedLink',
        id: `unused ${property.id}`,
        property: property.id,
        propertyLabel: property.label,
      });
    }
  }
  for (const edge of graph.edges) {
    if (edge.target !== classIri) continue;
    if (edge.kind === 'link') {
      blockers.push({
        kind: 'link',
        id: `link ${edge.source} ${edge.property}`,
        property: edge.property,
        propertyLabel: edge.label,
        source: edge.source,
        sourceLabel: labelOf(edge.source),
      });
    } else if (edge.source !== classIri) {
      blockers.push({
        kind: 'subclass',
        id: `subclass ${edge.source}`,
        subclass: edge.source,
        subclassLabel: labelOf(edge.source),
      });
    }
  }
  const count = graph.nodes.find(node => node.id === classIri)?.count ?? 0;
  if (count > 0) blockers.push({ kind: 'resources', id: 'resources', count });
  return blockers;
}
