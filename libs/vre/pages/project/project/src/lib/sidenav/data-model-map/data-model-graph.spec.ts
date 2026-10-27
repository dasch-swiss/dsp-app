import { Constants, ReadOntology } from '@dasch-swiss/dsp-js';
import { LanguageStringDto, OntologyAndResourceClasses } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { buildDataModelGraph } from './data-model-graph';

const ONTO = 'http://0.0.0.0:3333/ontology/0001/a/v2';
const OTHER = 'http://0.0.0.0:3333/ontology/0001/b/v2';
const KNORA = `${Constants.KnoraApiV2}#`;

const v3 = (iri: string, classes: [string, number][]): OntologyAndResourceClasses =>
  ({
    ontology: { iri, label: iri },
    classesAndCount: classes.map(([name, itemCount]) => ({
      resourceClass: { iri: `${iri}#${name}`, label: [{ language: 'en', value: name }] },
      itemCount,
    })),
  }) as unknown as OntologyAndResourceClasses;

type Prop = { id: string; objectType?: string; isLinkProperty?: boolean; isLinkValueProperty?: boolean };
type Has = { propertyIndex: string; isInherited?: boolean };

const definition = (classes: Record<string, { props?: Has[]; subClassOf?: string[] }>, properties: Prop[]) =>
  ({
    classes: Object.fromEntries(
      Object.entries(classes).map(([id, c]) => [
        id,
        { id, propertiesList: c.props ?? [], subClassOf: c.subClassOf ?? [] },
      ])
    ),
    properties: Object.fromEntries(
      properties.map(p => [p.id, { isLinkProperty: false, isLinkValueProperty: false, ...p }])
    ),
  }) as unknown as ReadOntology;

const labelOf = (labels: LanguageStringDto[] | undefined) => labels?.[0]?.value ?? '';

describe('buildDataModelGraph', () => {
  const ontology = v3(ONTO, [
    ['Slide', 91],
    ['Author', 69],
    ['Visual', 3],
  ]);
  const other = v3(OTHER, [['Place', 5]]);

  const build = (definitions: ReadOntology[]) => buildDataModelGraph(ontology, [ontology, other], definitions, labelOf);

  it('makes a card of every class with its count, linked or not', () => {
    const graph = build([]);

    expect(graph.nodes.map(n => [n.label, n.count, n.kind])).toEqual([
      ['Slide', 91, 'class'],
      ['Author', 69, 'class'],
      ['Visual', 3, 'class'],
    ]);
    expect(graph.edges).toEqual([]);
  });

  it('draws a link property from its class to the class it points at, but not its link value', () => {
    const graph = build([
      definition(
        {
          [`${ONTO}#Slide`]: { props: [{ propertyIndex: `${ONTO}#author` }, { propertyIndex: `${ONTO}#authorValue` }] },
        },
        [
          { id: `${ONTO}#author`, objectType: `${ONTO}#Author`, isLinkProperty: true },
          { id: `${ONTO}#authorValue`, objectType: `${KNORA}LinkValue`, isLinkValueProperty: true },
        ]
      ),
    ]);

    expect(graph.edges).toEqual([
      { source: `${ONTO}#Slide`, target: `${ONTO}#Author`, property: `${ONTO}#author`, kind: 'link' },
    ]);
  });

  it('adds an external card for a class of another data model, which the browser can still open', () => {
    const graph = build([
      definition({ [`${ONTO}#Slide`]: { props: [{ propertyIndex: `${ONTO}#place` }] } }, [
        { id: `${ONTO}#place`, objectType: `${OTHER}#Place`, isLinkProperty: true },
      ]),
    ]);

    expect(graph.nodes.find(n => n.id === `${OTHER}#Place`)).toEqual({
      id: `${OTHER}#Place`,
      label: 'Place',
      kind: 'external',
      navigable: true,
    });
  });

  it('adds a generic card for a link to any resource, including built-in links', () => {
    const graph = build([
      definition({ [`${ONTO}#Visual`]: { props: [{ propertyIndex: `${KNORA}isPartOf`, isInherited: true }] } }, []),
      definition({}, [{ id: `${KNORA}isPartOf`, objectType: `${KNORA}Resource`, isLinkProperty: true }]),
    ]);

    expect(graph.nodes.find(n => n.id === `${KNORA}Resource`)).toMatchObject({ kind: 'generic', navigable: false });
    expect(graph.edges).toHaveLength(1);
  });

  it('leaves out standoff links and project links a class only inherits', () => {
    const graph = build([
      definition(
        {
          [`${ONTO}#Slide`]: {
            props: [
              { propertyIndex: `${KNORA}hasStandoffLinkTo`, isInherited: true },
              { propertyIndex: `${ONTO}#author`, isInherited: true },
            ],
          },
        },
        [
          { id: `${KNORA}hasStandoffLinkTo`, objectType: `${KNORA}Resource`, isLinkProperty: true },
          { id: `${ONTO}#author`, objectType: `${ONTO}#Author`, isLinkProperty: true },
        ]
      ),
    ]);

    expect(graph.edges).toEqual([]);
  });

  it('draws a subclass relation between project classes', () => {
    const graph = build([
      definition({ [`${ONTO}#Visual`]: { subClassOf: [`${ONTO}#Slide`, `${KNORA}Resource`] } }, []),
    ]);

    expect(graph.edges).toEqual([
      {
        source: `${ONTO}#Visual`,
        target: `${ONTO}#Slide`,
        property: expect.stringContaining('subClassOf'),
        kind: 'subclass',
      },
    ]);
  });

  it('ignores links that neither start nor end in the mapped data model', () => {
    const graph = build([
      definition({ [`${OTHER}#Place`]: { props: [{ propertyIndex: `${OTHER}#near` }] } }, [
        { id: `${OTHER}#near`, objectType: `${OTHER}#Place`, isLinkProperty: true },
      ]),
    ]);

    expect(graph.edges).toEqual([]);
    expect(graph.nodes).toHaveLength(3);
  });
});
