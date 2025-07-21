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
  Boolean = 'Boolean',
  DateTime = 'Date-Time',
  Number = 'Number',
  LinkRelation = 'Link-Relation',
  Location = 'Location',
  Shape = 'Shape',
  Short = 'Short',
  Paragraph = 'Paragraph',
  Richtext = 'Richtext',
  Dropdown = 'Dropdown',
  YesNo = 'Yes-No',
  Date = 'Date',
  Timestamp = 'Timestamp',
  TimeSequence = 'Timesequence',
  Integer = 'Integer',
  Decimal = 'Decimal',
  PageNumber = 'Pagenumber',
  LinkToClass = 'Linktoclass',
  PartOfClass = 'Partofclass',
  ExternalUrl = 'ExternalURL',
  Place = 'Place',
  Color = 'Color',
}
