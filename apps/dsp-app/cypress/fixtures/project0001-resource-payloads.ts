import {
  AudioThingClassResource,
  Comment,
  DocumentClassResource,
  ThingPictureClassResource,
  VideoThingClassResource,
} from '../models/existing-data-models';
import { ProjectAssertionPageBase } from './project-assertion-payloads';

export class Project0001ResourcePayloads extends ProjectAssertionPageBase {
  static readonly project = '0001';
  static readonly defaultOntology = 'anything';

  constructor() {
    super(Project0001ResourcePayloads.project, Project0001ResourcePayloads.defaultOntology);
  }

  propertySegment(propertyName: string, textValues: Comment[], ontology = Project0001ResourcePayloads.defaultOntology) {
    return {
      [`http://0.0.0.0:3333/ontology/${Project0001ResourcePayloads.project}/${ontology}/v2#${propertyName}`]: [
        ...textValues.map(textValue => {
          return { ...this.textValueSegment(textValue.text, textValue.comment) };
        }),
      ],
    };
  }

  picture(data: ThingPictureClassResource) {
    const className = 'ThingPicture';
    const request = {
      ...this.label(className, data.label),
      ...this.textValue('hasPictureTitle', data.titles[0].text, data.titles[0].comment),
      ...this.stillImage(data.file),
    };
    return request;
  }

  videoThing(data: VideoThingClassResource) {
    const className = 'VideoThing';
    const request = {
      ...this.label(className, data.label),
      ...this.propertySegment('hasTitle', [{ text: data.title, comment: data.titleComment }]),
      ...this.movingImage(data.file),
    };
    return request;
  }

  audioThing(data: AudioThingClassResource) {
    const className = 'AudioThing';
    const request = {
      ...this.label(className, data.label),
      ...this.propertySegment('hasTitle', [{ text: data.title, comment: data.titleComment }]),
      ...this.audioSegment(data.file),
    };
    return request;
  }

  document(data: DocumentClassResource) {
    const className = 'ThingDocument';
    const request = {
      ...this.label(className, data.label),
      ...this.propertySegment('hasDocumentTitle', [
        {
          text: data.titleComments[0].text,
          comment: data.titleComments[0].comment,
        },
        {
          text: data.titleComments[1].text,
          comment: data.titleComments[1].comment,
        },
      ]),
      ...this.documentSegment(data.file),
    };
    return request;
  }
}
