import { Cardinality } from '@dasch-swiss/dsp-js';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { classDeleteBlockers } from './class-delete-blockers';

const graph: DataModelGraph = {
  nodes: [
    { id: 'B', label: 'B', kind: 'class', count: 3, navigable: true },
    { id: 'A', label: 'A', kind: 'class', count: 0, navigable: true },
    { id: 'C', label: 'C', kind: 'class', count: 0, navigable: true },
  ],
  edges: [
    { source: 'A', target: 'B', property: 'linkToB', label: 'Link to B', kind: 'link' },
    { source: 'C', target: 'B', property: 'rdfs:subClassOf', label: '', kind: 'subclass' },
    { source: 'B', target: 'A', property: 'linkToA', label: 'Link to A', kind: 'link' },
  ],
  unusedProperties: [
    {
      id: 'propertyLink',
      label: 'property LINK',
      description: '',
      type: 'Link',
      linkTarget: 'B',
      cardinality: Cardinality._0_n,
    },
  ],
};

describe('classDeleteBlockers', () => {
  it('names the links pointing at the class, its subclasses and its resources', () => {
    expect(classDeleteBlockers(graph, 'B').map(blocker => blocker.kind)).toEqual([
      'unusedLink',
      'link',
      'subclass',
      'resources',
    ]);
    expect(classDeleteBlockers(graph, 'B')[1]).toMatchObject({ sourceLabel: 'A', propertyLabel: 'Link to B' });
  });

  it('finds nothing in the way of a class nothing uses', () => {
    expect(classDeleteBlockers(graph, 'C')).toEqual([]);
  });
});
