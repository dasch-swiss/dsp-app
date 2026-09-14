// The generated OpenAPI client's Project model types shortcode/shortname/longname as
// { value: string } wrapper objects (per dsp-api_spec.yaml), but the live admin API
// returns plain strings for these fields, confirmed by a failing e2e run against it.
// dsp-js's admin Project model (also used by the real app for this exact endpoint)
// types them correctly, so use its response shape here instead.
import { ProjectResponse, ReadProject } from '@dasch-swiss/dsp-js';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN')}`,
});

class ProjectPage {
  projectIri: string;
  projectUuid: string;
  project: ReadProject;

  visit() {
    cy.visit(`/project/${this.projectIri.match(/\/([^\/]+)$/)[1]}`);
  }

  visitDataModels() {
    cy.visit(`/project/${this.projectIri.match(/\/([^\/]+)$/)[1]}/data-models`);
  }

  requestProject() {
    const payload = {
      shortname: 'shortname',
      shortcode: 'A0A0',
      longname: 'Longname',
      description: [{ language: 'de', value: 'description' }],
      keywords: ['keyword'],
      status: true,
      selfjoin: true,
    };

    cy.request<ProjectResponse>({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/admin/projects/shortcode/A0A0`,
      headers: getAuthHeaders(),
      failOnStatusCode: false,
    }).then(getResponse => {
      if (getResponse.status === 200) {
        this.projectIri = getResponse.body.project.id;
        this.projectUuid = this.projectIri.match(/\/([^\/]+)$/)[1];
        this.project = getResponse.body.project;
        this.visit();
      } else {
        cy.request<ProjectResponse>({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/admin/projects`,
          headers: getAuthHeaders(),
          body: payload,
        }).then(response => {
          this.projectIri = response.body.project.id;
          this.projectUuid = this.projectIri.match(/\/([^\/]+)$/)[1];
          this.project = response.body.project;
          this.visit();
        });
      }
    });
  }
}

export default ProjectPage;
