import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';

/** What keeps a class or a property from being deleted, as far as the data model tells, and what clears it. */
export type DeleteBlocker =
  /** A link property no class has points at the class: deleting the property clears it. */
  | { kind: 'unusedLink'; id: string; property: string; propertyLabel: string }
  /** A class's link property points at the class: taking it off that class clears it. */
  | { kind: 'link'; id: string; property: string; propertyLabel: string; source: string; sourceLabel: string }
  /** A subclass of the class: deleting the subclass clears it. */
  | { kind: 'subclass'; id: string; subclass: string; subclassLabel: string }
  /** The class has resources: deleting them clears it. */
  | { kind: 'resources'; id: string; count: number }
  /** A class has the property: taking it off the class clears it. */
  | { kind: 'usedBy'; id: string; classIri: string; classLabel: string };

const labelIn = (graph: DataModelGraph) => (iri: string) =>
  graph.nodes.find(node => node.id === iri)?.label ?? iri.substring(iri.lastIndexOf('#') + 1);

/**
 * What keeps the class from being deleted, as the data model shows it: links pointing at it, from its classes or from
 * properties no class has, its subclasses, and its resources. The API may know of more, such as values in other
 * projects; it is asked too.
 */
export function classDeleteBlockers(graph: DataModelGraph, classIri: string): DeleteBlocker[] {
  const labelOf = labelIn(graph);
  const blockers: DeleteBlocker[] = [];
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

/**
 * What keeps the property from being deleted, as the data model shows it: the classes that have it, each where it is
 * declared rather than inherited, so taking it off there clears it for their subclasses too. Values using it are
 * known to the API only; it is asked too.
 */
export function propertyDeleteBlockers(graph: DataModelGraph, propertyIri: string): DeleteBlocker[] {
  const has = (iri: string) =>
    !!graph.nodes.find(node => node.id === iri)?.propertyDetails?.some(property => property.id === propertyIri);
  const parentOf = (iri: string) => graph.edges.find(edge => edge.kind === 'subclass' && edge.source === iri)?.target;
  return graph.nodes
    .filter(node => node.kind === 'class' && has(node.id))
    .filter(node => {
      const parent = parentOf(node.id);
      return !parent || !has(parent);
    })
    .map(node => ({ kind: 'usedBy' as const, id: `usedBy ${node.id}`, classIri: node.id, classLabel: node.label }));
}
