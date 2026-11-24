import { Project0001ResourcePayloads } from '../../fixtures/project0001-resource-payloads';
import { OntologyClass } from '../../models/existing-data-models';

class ProjectAssertionPageBase {
  projectShortCode: string;
  ontologyName: string;

  constructor(projectShortCode: string, ontologyName: string) {
    this.projectShortCode = projectShortCode;
    this.ontologyName = ontologyName;
  }

  visitClass = (ontoClassName: string) => {
    cy.visit(`/project/${this.projectShortCode}/data/${this.ontologyName}/${ontoClassName}`);
  };
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
