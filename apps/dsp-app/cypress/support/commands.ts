/// <reference types="cypress" />

import { CreateOntology } from '@dasch-swiss/dsp-js';
import { CreateResourceClassPayload } from '@dasch-swiss/dsp-js/src/models/v2/ontologies/create/create-resource-class';
import ProjectPage from './pages/project-page';

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      createOntology(project: ProjectPage, ontology?: CreateOntology): Chainable<any>;
      createDataModelClass(
        project: ProjectPage,
        resourceClass?: CreateResourceClassPayload
      ): Chainable<CreateResourceClassPayload>;
    }
  }
}
