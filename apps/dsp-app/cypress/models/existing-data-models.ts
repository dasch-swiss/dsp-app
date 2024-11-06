export interface MiscClass {
  label: string;
  color: string;
  colorComment: string;
  book: string;
  bookComment: string;
}

export interface SidebandClass {
  label: string;
  file: string;
  title: string;
  titleComment: string;
  description: string;
  descriptionComment: string;
  comments: [Comment];
}

export interface Comment {
  text: string;
  comment: string;
}

export interface ThingPictureClass {
  label: string;
  file: string;
  titles: [Comment];
}

export interface VideoThingClass {
  label: string;
  file: string;
  title: string;
  titleComment: string;
}

export interface AudioThingClass {
  label: string;
  file: string;
  title: string;
  titleComment: string;
}

export interface DocumentClass {
  label: string;
  file: string;
  titleComments: Comment[];
}

export interface ArchiveClass {
  className: string;
  label: string;
  file: string;
}
