export interface MiscClassResource {
  label: string;
  color: string;
  colorComment: string;
  book: string;
  bookComment: string;
}

export interface SidebandClassResource {
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

export interface ThingPictureClassResource {
  label: string;
  file: string;
  titles: [Comment];
}

export interface VideoThingClassResource {
  label: string;
  file: string;
  title: string;
  titleComment: string;
}

export interface AudioThingClassResource {
  label: string;
  file: string;
  title: string;
  titleComment: string;
}

export interface DocumentClassResource {
  label: string;
  file: string;
  titleComments: Comment[];
}

export interface ArchiveClassResource {
  className: string;
  label: string;
  file: string;
}
export interface OntologyClass {
  id: string;
  label: string;
}
