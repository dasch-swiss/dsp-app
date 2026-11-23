/**
 * The kinds of class the Data models tab's "Create class" menu offers: `label` is the menu item's text (its data-cy is
 * `data-model-classes-create-<label>`), `fileIcon` the icon a class card shows for the kind's file, the same in every
 * language.
 */
export const CLASS_TYPES = {
  objectWithoutRepresentation: {
    type: 'Resource',
    label: 'Object without representation',
  },
  stillImageRepresentation: {
    type: 'StillImageRepresentation',
    label: 'Still Image',
    fileIcon: 'image',
  },
  textRepresentation: {
    type: 'TextRepresentation',
    label: 'Text',
    fileIcon: 'subject',
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
