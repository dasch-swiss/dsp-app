/**
 * The kinds of class the Data models tab's "Create class" menu offers: `label` is the menu item's text (its data-cy is
 * `data-model-classes-create-<label>`), `fileLabel` what a class card says of the kind.
 */
export const CLASS_TYPES = {
  objectWithoutRepresentation: {
    type: 'Resource',
    label: 'Object without representation',
    fileLabel: 'Object without representation',
  },
  stillImageRepresentation: {
    type: 'StillImageRepresentation',
    label: 'Still Image',
    fileLabel: 'Image',
  },
  textRepresentation: {
    type: 'TextRepresentation',
    label: 'Text',
    fileLabel: 'Text',
  },
} as const;

/** The groups and types of the "Add property › Create new from type" menus, as they read. */
export enum PropertyType {
  Text = 'Text',
  List = 'List',
  Boolean = 'Boolean',
  DateTime = 'Date / Time',
  Number = 'Number',
  LinkRelation = 'Link / Relation',
  Location = 'Location',
  Shape = 'Shape',
  Short = 'Short',
  Paragraph = 'Paragraph',
  Richtext = 'Rich Text',
  Dropdown = 'Dropdown',
  YesNo = 'Yes / No',
  Date = 'Date',
  Timestamp = 'Timestamp',
  TimeSequence = 'Time sequence',
  Integer = 'Integer',
  Decimal = 'Decimal',
  PageNumber = 'Page number',
  LinkToClass = 'Link to class',
  PartOfClass = 'Part of class',
  ExternalUrl = 'External URL',
  Place = 'Place',
  Color = 'Color',
}
