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
  LinkRelation = 'Link / Relation',
  Short = 'Short',
  Dropdown = 'Dropdown',
  LinkToClass = 'Link to class',
  PartOfClass = 'Part of class',
}
