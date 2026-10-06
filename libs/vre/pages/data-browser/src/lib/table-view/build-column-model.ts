import {
  Constants,
  ResourceClassDefinitionWithAllLanguages,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { ApiConstants } from '@dasch-swiss/vre/core/config';
import {
  defaultWidthForValueType,
  LABEL_COLUMN_KEY,
  LABEL_COLUMN_WIDTH,
  LABEL_MIN_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  TableColumn,
} from './table-column.model';

/** What `GenerateProperty.commonProperty` matches on to drop file-value properties. */
const HAS_FILE_VALUE = `${ApiConstants.apiKnoraOntologyUrl}#hasFileValue`;

/**
 * Whether the resource editor can edit this property.
 *
 * Deliberately mirrors `GenerateProperty.commonProperty` rather than restating a rule of its own.
 * That function is what builds the `PropertyInfoValues` the editor components consume, so a property
 * it drops has no editor to mount — and a table that offered an edit affordance there would open a
 * cell that could never render. Keeping the two predicates in step is the whole reason this is a
 * named function instead of an inline filter: when `commonProperty` grows an exclusion, this is the
 * one other place that must learn about it.
 */
function isEditableInResourceEditor(propDef: ResourcePropertyDefinitionWithAllLanguages): boolean {
  return (
    propDef.isEditable &&
    !propDef.isLinkProperty &&
    !propDef.subPropertyOf.includes(HAS_FILE_VALUE) &&
    propDef.objectType !== Constants.GeomValue
  );
}

/**
 * Whether the header offers a sort control.
 *
 * The same rule `DataClassSortHeaderComponent` applies to its own menu. Both surfaces write the same
 * `orderBy`, so offering a property in one and not the other would let the user reach a sort through
 * the table that the list view cannot display or undo.
 */
function isSortableProperty(propDef: ResourcePropertyDefinitionWithAllLanguages): boolean {
  // `isLinkValueProperty` as well as `isLinkProperty`. The sort header's rule names only the
  // latter because `OntologyDataService` has already dropped every reified `…Value` property
  // before it sees the list — the table builds its columns from the ontology directly, so it has
  // to exclude them itself or it would offer a sort the list view cannot show, on a `LinkValue`
  // whose ordering means nothing anyway.
  return !propDef.isLinkProperty && !propDef.isLinkValueProperty && propDef.objectType !== Constants.ListValue;
}

/**
 * The label column, prepended to every class.
 *
 * Sortable — label is the Data tab's default sort. Not editable: the resource label is not a
 * property value, so it has no `PropertyInfoValues` and no editor component; changing it goes
 * through the resource editor's own header. Sticky, and therefore also immovable and un-hideable
 * (PRD REQ-2.10) — with no cap on visible columns, horizontal scrolling is the normal case, and a
 * table whose rows lose their identity as you scroll right is not readable.
 */
function labelColumn(label: string): TableColumn {
  return {
    key: LABEL_COLUMN_KEY,
    label,
    valueType: '',
    isEditable: false,
    isSortable: true,
    isFilterable: true,
    isSticky: true,
    defaultWidth: LABEL_COLUMN_WIDTH,
    minWidth: LABEL_MIN_COLUMN_WIDTH,
  };
}

/**
 * Turn a resource class into the table's columns.
 *
 * Pure, and takes its property definitions as an argument rather than reaching for a service, so the
 * classification rules above can be unit-tested without an ontology cache or an HTTP layer.
 *
 * Two sources are needed because neither is sufficient alone. `resClass.propertiesList` carries the
 * cardinality and the `guiOrder` but only an IRI for the property itself; the definitions carry the
 * label, the value type and the flags the classification turns on, but say nothing about how this
 * particular class uses them. A property the class lists but the ontology has no definition for is
 * skipped rather than rendered as a column with no header.
 *
 * @param resClass the selected class
 * @param propertyDefinitions every property definition of the class's ontology, keyed by IRI
 * @param localise picks a display string out of the definition's multi-language labels
 */
export function buildColumnModel(
  resClass: ResourceClassDefinitionWithAllLanguages,
  propertyDefinitions: ReadonlyMap<string, ResourcePropertyDefinitionWithAllLanguages>,
  localise: (propDef: ResourcePropertyDefinitionWithAllLanguages) => string,
  labelColumnTitle: string
): TableColumn[] {
  const propertyColumns = resClass.propertiesList
    .map((hasProperty): TableColumn | undefined => {
      const propDef = propertyDefinitions.get(hasProperty.propertyIndex);
      if (!propDef) {
        return undefined;
      }

      // dsp-api reifies every link property into a `…Value` sibling — `linkToAuthor` and
      // `linkToAuthorValue` — and both carry the same `rdfs:label`. A class listing both would
      // otherwise produce two columns headed "Author(s)": one holding the values, and one that
      // can never hold anything, because `getValues(linkToAuthor)` has nothing to return.
      //
      // The `…Value` sibling is the one that survives, which is the same choice
      // `GenerateProperty.commonProperty` makes when it filters `isLinkProperty` out — so the
      // column that remains is the one the resource editor can actually render and edit.
      if (propDef.isLinkProperty) {
        return undefined;
      }

      const valueType = propDef.objectType ?? '';

      return {
        key: propDef.id,
        propertyIri: propDef.id,
        label: localise(propDef),
        valueType,
        propertyDefinition: propDef,
        cardinality: hasProperty.cardinality,
        guiOrder: hasProperty.guiOrder,
        isEditable: isEditableInResourceEditor(propDef),
        isSortable: isSortableProperty(propDef),
        // Every property the shared chip bar can build a statement for. It applies the same
        // editable-and-not-a-link-value rule, so a column outside it has no filter editor to open.
        isFilterable: propDef.isEditable && !propDef.isLinkValueProperty,
        isSticky: false,
        defaultWidth: defaultWidthForValueType(valueType),
        minWidth: MIN_COLUMN_WIDTH,
      };
    })
    .filter((column): column is TableColumn => column !== undefined);

  // `guiOrder` is optional, and a property without one must not sort ahead of the ontology's own
  // ordering just because `undefined` compares low. Unordered properties go last, keeping their
  // relative order — the same shape `GenerateProperty._initProps` produces, so the table's columns
  // run in the order the resource editor shows the properties in.
  const ordered = [...propertyColumns].sort((a, b) => {
    if (a.guiOrder === undefined && b.guiOrder === undefined) return 0;
    if (a.guiOrder === undefined) return 1;
    if (b.guiOrder === undefined) return -1;
    return a.guiOrder - b.guiOrder;
  });

  return [labelColumn(labelColumnTitle), ...ordered];
}
