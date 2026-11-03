import {
  Cardinality,
  Constants,
  IHasProperty,
  ResourceClassDefinitionWithAllLanguages,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { ApiConstants } from '@dasch-swiss/vre/core/config';
import { buildColumnModel, imageColumn, rightsColumns } from './build-column-model';
import {
  IMAGE_COLUMN_KEY,
  LABEL_COLUMN_KEY,
  LABEL_MIN_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  RIGHTS_COLUMN_KEYS,
} from './table-column.model';

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
  it('PrependsTheLabelColumnAsStickyAndSortableAndEditable', () => {
    const columns = build([propDef({})]);

    expect(columns[0]).toEqual(
      expect.objectContaining({
        key: LABEL_COLUMN_KEY,
        isSticky: true,
        isSortable: true,
        isEditable: true,
      })
    );
    expect(columns[0].propertyIri).toBeUndefined();
  });

  it('GivesTheLabelColumnAHigherMinimumThanTheOthers', () => {
    const [label, property] = build([propDef({})]);

    expect(label.minWidth).toBeGreaterThan(property.minWidth);
    expect(label.minWidth).toBe(LABEL_MIN_COLUMN_WIDTH);
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

  it('DropsTheLinkPropertyAndKeepsItsReifiedValueSibling', () => {
    const link = propDef({ id: `${ONTO}linkToAuthor`, isLinkProperty: true, objectType: `${ONTO}Author` });
    const linkValue = propDef({
      id: `${ONTO}linkToAuthorValue`,
      isLinkValueProperty: true,
      objectType: Constants.LinkValue,
    });

    const columns = build([link, linkValue]);

    expect(columns.map(column => column.key)).toEqual([LABEL_COLUMN_KEY, linkValue.id]);
  });

  it('MarksTheReifiedLinkValueColumnNotSortable', () => {
    const [, linkValue] = build([
      propDef({ id: `${ONTO}linkToAuthorValue`, isLinkValueProperty: true, objectType: Constants.LinkValue }),
    ]);

    expect(linkValue.isSortable).toBe(false);
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

  it('CarriesThePropertyDefinitionOntoTheColumnForTheViewerTemplates', () => {
    const def = propDef({ id: `${ONTO}hasText` });

    const [labelColumn, textColumn] = build([def]);

    expect(textColumn.propertyDefinition).toBe(def);
    expect(labelColumn.propertyDefinition).toBeUndefined();
  });

  it('GivesADateColumnANarrowerDefaultWidthThanAText', () => {
    const text = propDef({ id: `${ONTO}hasText`, objectType: Constants.TextValue });
    const date = propDef({ id: `${ONTO}hasDate`, objectType: Constants.DateValue });

    const [, textColumn, dateColumn] = build([text, date]);

    expect(dateColumn.defaultWidth).toBeLessThan(textColumn.defaultWidth);
  });
});

describe('rightsColumns', () => {
  const columns = rightsColumns({ license: 'License', copyrightHolder: 'Copyright holder', authorship: 'Authorship' });

  it('GivesTheRightsStatementItsThreeFieldsInTheViewersOrder', () => {
    expect(columns.map(column => [column.key, column.label, column.rightsField])).toEqual([
      [RIGHTS_COLUMN_KEYS.license, 'License', 'license'],
      [RIGHTS_COLUMN_KEYS.copyrightHolder, 'Copyright holder', 'copyrightHolder'],
      [RIGHTS_COLUMN_KEYS.authorship, 'Authorship', 'authorship'],
    ]);
  });

  it('MarksThemNeitherSortableNorFilterable', () => {
    for (const column of columns) {
      expect(column).toMatchObject({ isSortable: false, isFilterable: false, isSticky: false });
    }
  });

  it('MarksOnlyAuthorshipEditable', () => {
    expect(columns.map(column => column.isEditable)).toEqual([false, false, true]);
  });
});

describe('imageColumn', () => {
  it('GivesAStillImageClassAReadOnlyImageColumn', () => {
    const columns = imageColumn(resClass([hasProperty(Constants.HasStillImageFileValue)]), 'Image');

    expect(columns).toHaveLength(1);
    expect(columns[0]).toMatchObject({
      key: IMAGE_COLUMN_KEY,
      label: 'Image',
      isImage: true,
      isEditable: false,
      isSortable: false,
      isFilterable: false,
    });
  });

  it('GivesAnyOtherClassNone', () => {
    expect(imageColumn(resClass([hasProperty(`${ONTO}hasText`)]), 'Image')).toEqual([]);
  });
});
