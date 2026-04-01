export class ClassPropertyPayloads {
  private static baseData(lastModificationDate: string) {
    return {
      '@id': 'http://0.0.0.0:3333/ontology/00FF/images/v2',
      '@type': 'http://www.w3.org/2002/07/owl#Ontology',
      'http://api.knora.org/ontology/knora-api/v2#lastModificationDate': {
        '@type': 'http://www.w3.org/2001/XMLSchema#dateTimeStamp',
        '@value': lastModificationDate,
      },
    };
  }

  private static baseGraph(propertyName: string) {
    return {
      'http://www.w3.org/2000/01/rdf-schema#label': {
        '@language': 'de',
        '@value': propertyName,
      },
      '@id': `http://0.0.0.0:3333/ontology/00FF/images/v2#${propertyName}`,
      '@type': 'http://www.w3.org/2002/07/owl#ObjectProperty',
    };
  }

  private static hasValue = {
    'http://www.w3.org/2000/01/rdf-schema#subPropertyOf': {
      '@id': 'http://api.knora.org/ontology/knora-api/v2#hasValue',
    },
  };

  static cardinality(lastModificationDate: string, required: boolean, className = 'datamodelclass', propertyName = 'property') {
    return {
      ...this.baseData(lastModificationDate),
      '@graph': [
        {
          '@id': `http://0.0.0.0:3333/ontology/00FF/images/v2#${className}`,
          '@type': 'http://www.w3.org/2002/07/owl#Class',
          'http://www.w3.org/2000/01/rdf-schema#subClassOf': {
            '@type': 'http://www.w3.org/2002/07/owl#Restriction',
            'http://www.w3.org/2002/07/owl#onProperty': {
              '@id': `http://0.0.0.0:3333/ontology/00FF/images/v2#${propertyName}`,
            },
            'http://api.knora.org/ontology/salsah-gui/v2#guiOrder': 1,
            ...(required
              ? { 'http://www.w3.org/2002/07/owl#cardinality': 1 }
              : { 'http://www.w3.org/2002/07/owl#maxCardinality': 1 }),
          },
        },
      ],
    };
  }

  static textShort(lastModificationDate: string, propertyName = 'property') {
    return {
      ...this.baseData(lastModificationDate),
      '@graph': [
        {
          ...this.baseGraph(propertyName),
          ...this.hasValue,
          'http://api.knora.org/ontology/knora-api/v2#objectType': {
            '@id': 'http://api.knora.org/ontology/knora-api/v2#TextValue',
          },

          'http://api.knora.org/ontology/salsah-gui/v2#guiElement': {
            '@id': 'http://api.knora.org/ontology/salsah-gui/v2#SimpleText',
          },
        },
      ],
    };
  }

  static richText(lastModificationDate: string, propertyName = 'property') {
    return {
      ...this.baseData(lastModificationDate),
      '@graph': [
        {
          ...this.baseGraph(propertyName),
          ...this.hasValue,
          'http://api.knora.org/ontology/knora-api/v2#objectType': {
            '@id': 'http://api.knora.org/ontology/knora-api/v2#TextValue',
          },
          'http://api.knora.org/ontology/salsah-gui/v2#guiElement': {
            '@id': 'http://api.knora.org/ontology/salsah-gui/v2#Richtext',
          },
        },
      ],
    };
  }

  static number(lastModificationDate: string, propertyName = 'property') {
    return {
      ...this.baseData(lastModificationDate),
      '@graph': [
        {
          ...this.baseGraph(propertyName),
          ...this.hasValue,
          'http://api.knora.org/ontology/knora-api/v2#objectType': {
            '@id': 'http://api.knora.org/ontology/knora-api/v2#IntValue',
          },
          'http://api.knora.org/ontology/salsah-gui/v2#guiElement': {
            '@id': 'http://api.knora.org/ontology/salsah-gui/v2#Spinbox',
          },
        },
      ],
    };
  }

  static boolean(lastModificationDate: string, propertyName = 'property') {
    return {
      ...this.baseData(lastModificationDate),
      '@graph': [
        {
          ...this.baseGraph(propertyName),
          ...this.hasValue,
          'http://api.knora.org/ontology/knora-api/v2#objectType': {
            '@id': 'http://api.knora.org/ontology/knora-api/v2#BooleanValue',
          },
          'http://api.knora.org/ontology/salsah-gui/v2#guiElement': {
            '@id': 'http://api.knora.org/ontology/salsah-gui/v2#Checkbox',
          },
        },
      ],
    };
  }

  static color(lastModificationDate: string, propertyName = 'property') {
    return {
      ...this.baseData(lastModificationDate),
      '@graph': [
        {
          ...this.baseGraph(propertyName),
          ...this.hasValue,
          'http://api.knora.org/ontology/knora-api/v2#objectType': {
            '@id': 'http://api.knora.org/ontology/knora-api/v2#ColorValue',
          },
          'http://api.knora.org/ontology/salsah-gui/v2#guiElement': {
            '@id': 'http://api.knora.org/ontology/salsah-gui/v2#Colorpicker',
          },
        },
      ],
    };
  }

  static place(lastModificationDate: string, propertyName = 'property') {
    return {
      ...this.baseData(lastModificationDate),
      '@graph': [
        {
          'http://api.knora.org/ontology/knora-api/v2#objectType': {
            '@id': 'http://api.knora.org/ontology/knora-api/v2#GeonameValue',
          },
          'http://www.w3.org/2000/01/rdf-schema#label': {
            '@language': 'de',
            '@value': propertyName,
          },
          'http://www.w3.org/2000/01/rdf-schema#subPropertyOf': {
            '@id': 'http://api.knora.org/ontology/knora-api/v2#hasValue',
          },
          'http://api.knora.org/ontology/salsah-gui/v2#guiElement': {
            '@id': 'http://api.knora.org/ontology/salsah-gui/v2#Geonames',
          },
          '@id': `http://0.0.0.0:3333/ontology/00FF/images/v2#${propertyName}`,
          '@type': 'http://www.w3.org/2002/07/owl#ObjectProperty',
        },
      ],
    };
  }

  static link(lastModificationDate: string, className = 'datamodelclass', propertyName = 'property') {
    return {
      ...this.baseData(lastModificationDate),
      '@graph': [
        {
          'http://api.knora.org/ontology/knora-api/v2#subjectType': {
            '@id': `http://0.0.0.0:3333/ontology/00FF/images/v2#${className}`,
          },
          'http://api.knora.org/ontology/knora-api/v2#objectType': {
            '@id': 'http://0.0.0.0:3333/ontology/00FF/images/v2#person',
          },
          'http://www.w3.org/2000/01/rdf-schema#label': {
            '@language': 'de',
            '@value': propertyName,
          },
          'http://www.w3.org/2000/01/rdf-schema#subPropertyOf': {
            '@id': 'http://api.knora.org/ontology/knora-api/v2#hasLinkTo',
          },
          'http://api.knora.org/ontology/salsah-gui/v2#guiElement': {
            '@id': 'http://api.knora.org/ontology/salsah-gui/v2#Searchbox',
          },
          '@id': `http://0.0.0.0:3333/ontology/00FF/images/v2#${propertyName}`,
          '@type': 'http://www.w3.org/2002/07/owl#ObjectProperty',
        },
      ],
    };
  }

  static date(lastModificationDate: string, propertyName = 'property') {
    return {
      ...this.baseData(lastModificationDate),
      '@graph': [
        {
          ...this.baseGraph(propertyName),
          ...this.hasValue,
          'http://api.knora.org/ontology/knora-api/v2#objectType': {
            '@id': 'http://api.knora.org/ontology/knora-api/v2#DateValue',
          },
          'http://api.knora.org/ontology/salsah-gui/v2#guiElement': {
            '@id': 'http://api.knora.org/ontology/salsah-gui/v2#Date',
          },
        },
      ],
    };
  }

  static timestamp(lastModificationDate: string, propertyName = 'property') {
    return {
      ...this.baseData(lastModificationDate),
      '@graph': [
        {
          ...this.baseGraph(propertyName),
          ...this.hasValue,
          'http://api.knora.org/ontology/knora-api/v2#objectType': {
            '@id': 'http://api.knora.org/ontology/knora-api/v2#TimeValue',
          },
          'http://api.knora.org/ontology/salsah-gui/v2#guiElement': {
            '@id': 'http://api.knora.org/ontology/salsah-gui/v2#TimeStamp',
          },
        },
      ],
    };
  }

  static timesequence(lastModificationDate: string, propertyName = 'property') {
    return {
      ...this.baseData(lastModificationDate),
      '@graph': [
        {
          ...this.baseGraph(propertyName),
          ...this.hasValue,
          'http://api.knora.org/ontology/knora-api/v2#objectType': {
            '@id': 'http://api.knora.org/ontology/knora-api/v2#IntervalValue',
          },
          'http://api.knora.org/ontology/salsah-gui/v2#guiElement': {
            '@id': 'http://api.knora.org/ontology/salsah-gui/v2#Interval',
          },
        },
      ],
    };
  }
}
