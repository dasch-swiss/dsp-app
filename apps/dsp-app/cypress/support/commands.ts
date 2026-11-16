/// <reference types="cypress" />

import { CreateOntology, CreateResourceClassPayload } from '@dasch-swiss/dsp-js';
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
