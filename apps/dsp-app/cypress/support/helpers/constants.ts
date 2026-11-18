export const CLASS_TYPES = {
  objectWithoutRepresentation: {
    type: 'Resource',
    label: 'Object without representation',
  },
  stillImageRepresentation: {
    type: 'StillImageRepresentation',
    label: 'Still Image',
  },
  textRepresentation: {
    type: 'TextRepresentation',
    label: 'Text',
  },
} as const;

export enum PropertyType {
  Text = 'Text',
  List = 'List',
  LinkRelation = 'Link-Relation',
  Short = 'Short',
  Dropdown = 'Dropdown',
  LinkToClass = 'Linktoclass',
  PartOfClass = 'Partofclass',
}
