import { Project0001ResourcePayloads } from '../../fixtures/project0001-resource-payloads';
import { Project0803ResourcePayloads } from '../../fixtures/project0803-resource-payloads';
import { OntologyClass } from '../../models/existing-data-models';

export class ProjectAssertionPageBase {
  projectShortCode: string;
  ontologyName: string;

  constructor(projectShortCode: string, ontologyName: string) {
    this.projectShortCode = projectShortCode;
    this.ontologyName = ontologyName;
  }

  visitClass = (ontoClassName: string) => {
    cy.visit(`/project/${this.projectShortCode}/ontology/${this.ontologyName}/${ontoClassName}`);
  };
}
export class Project0803Page extends ProjectAssertionPageBase {
  static readonly projectShortCode = '0803';
  static readonly ontologyName = 'incunabula';
  payloads = new Project0803ResourcePayloads();

  constructor() {
    super(Project0803Page.projectShortCode, Project0803Page.ontologyName);
  }
}

export class Project0001Page extends ProjectAssertionPageBase {
  static readonly projectShortCode = '0001';
  static readonly defaultOntology = 'anything';

  static readonly thingArchiveClass: OntologyClass = {
    id: 'ThingArchive',
    label: 'Archive',
  };

  static readonly thingPictureClass: OntologyClass = {
    id: 'ThingPicture',
    label: 'Dingbild',
  };

  payloads = new Project0001ResourcePayloads();

  constructor() {
    super(Project0001Page.projectShortCode, Project0001Page.defaultOntology);
  }
}

export class Project00FFPage extends ProjectAssertionPageBase {
  static readonly projectShortCode = '00FF';
  static readonly defaultOntology = 'images';

  constructor() {
    super(Project00FFPage.projectShortCode, Project00FFPage.defaultOntology);
  }
}
