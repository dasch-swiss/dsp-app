import {
  Constants,
  ResourceClassDefinitionWithAllLanguages,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { ApiConstants } from '@dasch-swiss/vre/core/config';
import {
  DEFAULT_WIDTH,
  defaultWidthForValueType,
  IMAGE_COLUMN_KEY,
  LABEL_COLUMN_KEY,
  LABEL_COLUMN_WIDTH,
  LABEL_MIN_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  RIGHTS_COLUMN_KEYS,
  RightsField,
  TableColumn,
} from './table-column.model';

const HAS_FILE_VALUE = `${ApiConstants.apiKnoraOntologyUrl}#hasFileValue`;

/** Mirrors `GenerateProperty.commonProperty`: a property it drops has no editor to mount, so the two predicates must stay in step. */
function isEditableInResourceEditor(propDef: ResourcePropertyDefinitionWithAllLanguages): boolean {
  return (
    propDef.isEditable &&
    !propDef.isLinkProperty &&
    !propDef.subPropertyOf.includes(HAS_FILE_VALUE) &&
    propDef.objectType !== Constants.GeomValue
  );
}

/** Same rule as `DataClassSortHeaderComponent`; both write the same `orderBy`, so they must agree. */
function isSortableProperty(propDef: ResourcePropertyDefinitionWithAllLanguages): boolean {
  // `isLinkValueProperty` too: the sort header relies on `OntologyDataService` having already dropped reified `…Value` properties, which the table's direct ontology read does not.
  return !propDef.isLinkProperty && !propDef.isLinkValueProperty && propDef.objectType !== Constants.ListValue;
}

/** The label column: sticky, so immovable and un-hideable, and editable through the viewer's label dialog. */
function labelColumn(label: string): TableColumn {
  return {
    key: LABEL_COLUMN_KEY,
    label,
    valueType: '',
    isEditable: true,
    isSortable: true,
    isFilterable: true,
    isSticky: true,
    defaultWidth: LABEL_COLUMN_WIDTH,
    minWidth: LABEL_MIN_COLUMN_WIDTH,
  };
}

/**
 * Turn a resource class into the table's columns. A property the class lists but the ontology has
 * no definition for is skipped.
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

      // Drop the link property and keep its reified `…Value` sibling (same label), as `commonProperty` does.
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
        // The shared chip bar applies the same editable-and-not-a-link-value rule.
        isFilterable: propDef.isEditable && !propDef.isLinkValueProperty,
        isSticky: false,
        defaultWidth: defaultWidthForValueType(valueType),
        minWidth: MIN_COLUMN_WIDTH,
      };
    })
    .filter((column): column is TableColumn => column !== undefined);

  // Unordered properties go last, matching `GenerateProperty._initProps`.
  const ordered = [...propertyColumns].sort((a, b) => {
    if (a.guiOrder === undefined && b.guiOrder === undefined) return 0;
    if (a.guiOrder === undefined) return 1;
    if (b.guiOrder === undefined) return -1;
    return a.guiOrder - b.guiOrder;
  });

  return [labelColumn(labelColumnTitle), ...ordered];
}

/**
 * The Resource Rights Statement as three trailing columns. License and copyright holder are
 * read-only; authorship edits in place. None is sortable or filterable (Gravsearch cannot).
 *
 * @param titles the header of each column, already localised
 */
export function rightsColumns(titles: Readonly<Record<RightsField, string>>): TableColumn[] {
  return (['license', 'copyrightHolder', 'authorship'] as const).map(field => ({
    key: RIGHTS_COLUMN_KEYS[field],
    label: titles[field],
    valueType: '',
    rightsField: field,
    isEditable: field === 'authorship',
    isSortable: false,
    isFilterable: false,
    isSticky: false,
    defaultWidth: DEFAULT_WIDTH,
    minWidth: MIN_COLUMN_WIDTH,
  }));
}

const IMAGE_COLUMN_WIDTH = 120;

/**
 * An image column for a class whose resources are still images; none for any other class.
 * `hasStillImageFileValue` is in the knora-api ontology, so {@link buildColumnModel} never sees its definition.
 *
 * @param title the header, already localised
 */
export function imageColumn(resClass: ResourceClassDefinitionWithAllLanguages, title: string): TableColumn[] {
  const hasImage = resClass.propertiesList.some(
    hasProperty => hasProperty.propertyIndex === Constants.HasStillImageFileValue
  );
  if (!hasImage) {
    return [];
  }

  return [
    {
      key: IMAGE_COLUMN_KEY,
      label: title,
      valueType: Constants.StillImageFileValue,
      isImage: true,
      isEditable: false,
      isSortable: false,
      isFilterable: false,
      isSticky: false,
      defaultWidth: IMAGE_COLUMN_WIDTH,
      minWidth: MIN_COLUMN_WIDTH,
    },
  ];
}
