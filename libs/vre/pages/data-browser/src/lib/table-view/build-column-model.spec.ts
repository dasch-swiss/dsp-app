import {
  Cardinality,
  Constants,
  IHasProperty,
  ResourceClassDefinitionWithAllLanguages,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { ApiConstants } from '@dasch-swiss/vre/core/config';
import { buildColumnModel } from './build-column-model';
import { LABEL_COLUMN_KEY, MIN_COLUMN_WIDTH } from './table-column.model';

const ONTO = 'http://0.0.0.0:3333/ontology/0001/anything/v2#';

function propDef(
  overrides: Partial<ResourcePropertyDefinitionWithAllLanguages>
): ResourcePropertyDefinitionWithAllLanguages {
  return {
    id: `${ONTO}hasText`,
    objectType: Constants.TextValue,
    isEditable: true,
    isLinkProperty: false,
    isLinkValueProperty: false,
    subPropertyOf: [],
    labels: [],
    comments: [],
    ...overrides,
  } as ResourcePropertyDefinitionWithAllLanguages;
}

function hasProperty(propertyIndex: string, guiOrder?: number): IHasProperty {
  return { propertyIndex, cardinality: Cardinality._0_n, guiOrder };
}

function resClass(propertiesList: IHasProperty[]): ResourceClassDefinitionWithAllLanguages {
  return { id: `${ONTO}Thing`, propertiesList } as ResourceClassDefinitionWithAllLanguages;
}

function build(defs: ResourcePropertyDefinitionWithAllLanguages[], list?: IHasProperty[]) {
  const byIri = new Map(defs.map(d => [d.id, d]));
  return buildColumnModel(
    resClass(list ?? defs.map((d, i) => hasProperty(d.id, i))),
    byIri,
    def => `label:${def.id}`,
    'Label'
  );
}

describe('buildColumnModel', () => {
  it('PrependsTheLabelColumnAsStickyAndSortableButNotEditable', () => {
    const columns = build([propDef({})]);

    expect(columns[0]).toEqual(
      expect.objectContaining({
        key: LABEL_COLUMN_KEY,
        isSticky: true,
        isSortable: true,
        isEditable: false,
      })
    );
    expect(columns[0].propertyIri).toBeUndefined();
  });

  it('MarksAnOrdinaryTextPropertyEditableSortableAndFilterable', () => {
    const [, text] = build([propDef({ id: `${ONTO}hasText` })]);

    expect(text).toEqual(
      expect.objectContaining({
        key: `${ONTO}hasText`,
        propertyIri: `${ONTO}hasText`,
        label: `label:${ONTO}hasText`,
        isEditable: true,
        isSortable: true,
        isFilterable: true,
        isSticky: false,
        minWidth: MIN_COLUMN_WIDTH,
      })
    );
  });

  // The three kinds `GenerateProperty.commonProperty` drops. A cell of any of them has no
  // `PropertyInfoValues`, so there is no editor component to mount (PRD §9.11).
  it('MarksALinkPropertyNeitherEditableNorSortable', () => {
    const [, link] = build([propDef({ id: `${ONTO}hasOther`, isLinkProperty: true, objectType: Constants.LinkValue })]);

    expect(link.isEditable).toBe(false);
    expect(link.isSortable).toBe(false);
  });

  it('MarksAFileValuePropertyReadOnly', () => {
    const [, file] = build([
      propDef({
        id: `${ONTO}hasStillImageFileValue`,
        subPropertyOf: [`${ApiConstants.apiKnoraOntologyUrl}#hasFileValue`],
      }),
    ]);

    expect(file.isEditable).toBe(false);
  });

  it('MarksAGeometryPropertyReadOnly', () => {
    const [, geom] = build([propDef({ id: `${ONTO}hasGeometry`, objectType: Constants.GeomValue })]);

    expect(geom.isEditable).toBe(false);
  });

  it('MarksANonEditablePropertyReadOnly', () => {
    const [, readOnly] = build([propDef({ id: `${ONTO}hasComputed`, isEditable: false })]);

    expect(readOnly.isEditable).toBe(false);
  });

  // Matches `DataClassSortHeaderComponent`: both surfaces write the same `orderBy`, so a property
  // sortable in one and not the other would let the table reach a sort the list cannot undo.
  it('MarksAListValuePropertyEditableButNotSortable', () => {
    const [, list] = build([propDef({ id: `${ONTO}hasListItem`, objectType: Constants.ListValue })]);

    expect(list.isEditable).toBe(true);
    expect(list.isSortable).toBe(false);
  });

  it('MarksALinkValuePropertyNotFilterable', () => {
    const [, linkValue] = build([propDef({ id: `${ONTO}hasOtherValue`, isLinkValueProperty: true })]);

    expect(linkValue.isFilterable).toBe(false);
  });

  it('OrdersPropertyColumnsByGuiOrder', () => {
    const a = propDef({ id: `${ONTO}a` });
    const b = propDef({ id: `${ONTO}b` });
    const c = propDef({ id: `${ONTO}c` });

    const columns = build([a, b, c], [hasProperty(a.id, 3), hasProperty(b.id, 1), hasProperty(c.id, 2)]);

    expect(columns.map(column => column.key)).toEqual([LABEL_COLUMN_KEY, b.id, c.id, a.id]);
  });

  // `undefined` compares low, so a naive subtraction would float unordered properties to the front
  // and silently reorder the table away from what the resource editor shows.
  it('PutsPropertiesWithoutGuiOrderLastKeepingTheirRelativeOrder', () => {
    const a = propDef({ id: `${ONTO}a` });
    const b = propDef({ id: `${ONTO}b` });
    const c = propDef({ id: `${ONTO}c` });

    const columns = build([a, b, c], [hasProperty(a.id), hasProperty(b.id, 5), hasProperty(c.id)]);

    expect(columns.map(column => column.key)).toEqual([LABEL_COLUMN_KEY, b.id, a.id, c.id]);
  });

  it('SkipsAPropertyTheClassListsButTheOntologyDoesNotDefine', () => {
    const known = propDef({ id: `${ONTO}known` });

    const columns = buildColumnModel(
      resClass([hasProperty(known.id, 1), hasProperty(`${ONTO}dangling`, 2)]),
      new Map([[known.id, known]]),
      def => def.id,
      'Label'
    );

    expect(columns.map(column => column.key)).toEqual([LABEL_COLUMN_KEY, known.id]);
  });

  it('CarriesTheClassCardinalityOntoTheColumn', () => {
    const def = propDef({ id: `${ONTO}hasText` });
    const columns = buildColumnModel(
      resClass([{ propertyIndex: def.id, cardinality: Cardinality._1 }]),
      new Map([[def.id, def]]),
      d => d.id,
      'Label'
    );

    expect(columns[1].cardinality).toBe(Cardinality._1);
  });

  // The cell renders its values through the resource viewer's template switcher, which takes the
  // definition itself — it reads `guiElement` to choose between the three text renderings and
  // `guiAttributes` to find a list's root. A column that lost it would fall back to `strval`.
  it('CarriesThePropertyDefinitionOntoTheColumnForTheViewerTemplates', () => {
    const def = propDef({ id: `${ONTO}hasText` });

    const [labelColumn, textColumn] = build([def]);

    expect(textColumn.propertyDefinition).toBe(def);
    // The label is not a property value, so there is nothing for a viewer template to render.
    expect(labelColumn.propertyDefinition).toBeUndefined();
  });

  it('GivesADateColumnANarrowerDefaultWidthThanAText', () => {
    const text = propDef({ id: `${ONTO}hasText`, objectType: Constants.TextValue });
    const date = propDef({ id: `${ONTO}hasDate`, objectType: Constants.DateValue });

    const [, textColumn, dateColumn] = build([text, date]);

    expect(dateColumn.defaultWidth).toBeLessThan(textColumn.defaultWidth);
  });
});
