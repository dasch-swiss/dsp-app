export class ProjectAssertionPageBase {
  projectShortCode: string;
  ontologyName: string;

  constructor(projectShortCode: string, ontologyName: string) {
    this.projectShortCode = projectShortCode;
    this.ontologyName = ontologyName;
  }

  createClassPayload = (value, subClassOf: string = 'http://api.knora.org/ontology/knora-api/v2#Resource') => {
    return {
      '@id': `http://0.0.0.0:3333/ontology/${this.projectShortCode}/${this.ontologyName}/v2`,
      '@type': 'http://www.w3.org/2002/07/owl#Ontology',
      'http://api.knora.org/ontology/knora-api/v2#lastModificationDate': {
        '@type': 'http://www.w3.org/2001/XMLSchema#dateTimeStamp',
        '@value': '2012-12-12T12:12:12.120Z',
      },
      '@graph': [
        {
          '@type': 'http://www.w3.org/2002/07/owl#Class',
          'http://www.w3.org/2000/01/rdf-schema#label': { '@language': 'de', '@value': value },
          'http://www.w3.org/2000/01/rdf-schema#comment': { '@language': 'de', '@value': value },
          'http://www.w3.org/2000/01/rdf-schema#subClassOf': {
            '@id': subClassOf,
          },
          '@id': `http://0.0.0.0:3333/ontology/${this.projectShortCode}/${this.ontologyName}/v2#${value}`,
        },
      ],
    };
  };

  stillImageRepresentation = (className: string) => {
    return this.createClassPayload(className, 'http://api.knora.org/ontology/knora-api/v2#StillImageRepresentation');
  };

  label(className: string, value: string) {
    return {
      '@type': `http://0.0.0.0:3333/ontology/${this.projectShortCode}/${this.ontologyName}/v2#${className}`,
      'http://www.w3.org/2000/01/rdf-schema#label': value,
      'http://api.knora.org/ontology/knora-api/v2#attachedToProject': {
        '@id': `http://rdfh.ch/projects/${this.projectShortCode}`,
      },
    };
  }

  textValue(propertyName: string, value: string, comment: string) {
    return {
      [`http://0.0.0.0:3333/ontology/${this.projectShortCode}/${this.ontologyName}/v2#${propertyName}`]: {
        '@type': 'http://api.knora.org/ontology/knora-api/v2#TextValue',
        'http://api.knora.org/ontology/knora-api/v2#valueHasComment': comment,
        'http://api.knora.org/ontology/knora-api/v2#valueAsString': value,
      },
    };
  }

  archiveSegment(value: string) {
    return {
      [`http://api.knora.org/ontology/knora-api/v2#hasArchiveFileValue`]: {
        '@type': 'http://api.knora.org/ontology/knora-api/v2#ArchiveFileValue',
        'http://api.knora.org/ontology/knora-api/v2#fileValueHasFilename': value,
      },
    };
  }

  stillImage(value: string) {
    return {
      [`http://api.knora.org/ontology/knora-api/v2#hasStillImageFileValue`]: {
        '@type': 'http://api.knora.org/ontology/knora-api/v2#StillImageFileValue',
        'http://api.knora.org/ontology/knora-api/v2#fileValueHasFilename': value,
      },
    };
  }

  movingImage(value: string) {
    return {
      [`http://api.knora.org/ontology/knora-api/v2#hasMovingImageFileValue`]: {
        '@type': 'http://api.knora.org/ontology/knora-api/v2#MovingImageFileValue',
        'http://api.knora.org/ontology/knora-api/v2#fileValueHasFilename': value,
      },
    };
  }

  audioSegment(value: string) {
    return {
      [`http://api.knora.org/ontology/knora-api/v2#hasAudioFileValue`]: {
        '@type': 'http://api.knora.org/ontology/knora-api/v2#AudioFileValue',
        'http://api.knora.org/ontology/knora-api/v2#fileValueHasFilename': value,
      },
    };
  }

  documentSegment(value: string) {
    return {
      [`http://api.knora.org/ontology/knora-api/v2#hasDocumentFileValue`]: {
        '@type': 'http://api.knora.org/ontology/knora-api/v2#DocumentFileValue',
        'http://api.knora.org/ontology/knora-api/v2#fileValueHasFilename': value,
      },
    };
  }

  textValueSegment(value: string, comment: string) {
    return {
      '@type': 'http://api.knora.org/ontology/knora-api/v2#TextValue',
      'http://api.knora.org/ontology/knora-api/v2#valueHasComment': comment,
      'http://api.knora.org/ontology/knora-api/v2#valueAsString': value,
    };
  }
}
