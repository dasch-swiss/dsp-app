import { setupAjaxMock, AjaxMock } from '../../../../test/ajax-mock-helper';
import { KnoraApiConfig } from '../../../knora-api-config';
import { KnoraApiConnection } from '../../../knora-api-connection';
import { KeywordsResponse } from '../../../models/admin/keywords-response';
import { MembersResponse } from '../../../models/admin/members-response';
import { Project } from '../../../models/admin/project';
import { ProjectResponse } from '../../../models/admin/project-response';
import { ProjectRestrictedViewSettingsResponse } from '../../../models/admin/project-restricted-view-settings-response';
import { ProjectsResponse } from '../../../models/admin/projects-response';
import { StringLiteral } from '../../../models/admin/string-literal';
import { UpdateProjectRequest } from '../../../models/admin/update-project-request';
import { ApiResponseData } from '../../../models/api-response-data';

describe('ProjectsEndpoint', () => {
  const config = new KnoraApiConfig('http', 'localhost', 3333, undefined, undefined, true);
  const knoraApiConnection = new KnoraApiConnection(config);

  let ajaxMock: AjaxMock;

  beforeEach(() => {
    ajaxMock = setupAjaxMock();
  });

  afterEach(() => {
    ajaxMock.cleanup();
  });

  describe('Method getProjects', () => {
    it('should return all projects', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-projects-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjects()
        .subscribe((response: ApiResponseData<ProjectsResponse>) => {
          expect(response.body.projects.length).toEqual(6);
          expect(response.body.projects[0].id).toEqual('http://rdfh.ch/projects/0803');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method createProject', () => {
    it('should create a project', done => {
      const project = new Project();
      project.shortname = 'newproject';
      project.shortcode = '1111';
      project.longname = 'project longname';

      const description = new StringLiteral();
      description.language = 'en';
      description.value = 'project description';

      project.description = [description];

      project.keywords = ['keywords'];
      project.logo = '/fu/bar/baz.jpg';
      project.status = true;
      project.selfjoin = false;

      const user = require('../../../../test/data/api/admin/projects/get-project-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.projectsEndpoint
        .createProject(project)
        .subscribe((response: ApiResponseData<ProjectResponse>) => {
          expect(response.body.project.id).toEqual('http://rdfh.ch/projects/00FF');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects');

          expect(request?.method).toEqual('POST');

          expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');

          const payload = require('../../../../test/data/api/admin/projects/create-project-request.json');

          expect(request?.body).toEqual(payload);

          done();
        });
    });
  });

  describe('Method getKeywords', () => {
    it('should return the keywords', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-keywords-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getKeywords()
        .subscribe((response: ApiResponseData<KeywordsResponse>) => {
          expect(response.body.keywords.length).toEqual(21);
          expect(response.body.keywords[0]).toEqual('Basel');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/Keywords');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getProjectKeywords', () => {
    it("should return a project's keywords", done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-keywords-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectKeywords('http://rdfh.ch/projects/00FF')
        .subscribe((response: ApiResponseData<KeywordsResponse>) => {
          expect(response.body.keywords.length).toEqual(14);
          expect(response.body.keywords[0]).toEqual('Basel');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://localhost:3333/admin/projects/iri/http%3A%2F%2Frdfh.ch%2Fprojects%2F00FF/Keywords'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method updateProject', () => {
    it('should update a project', done => {
      const projectIri = 'http://rdfh.ch/projects/00FF';
      const projectInfo = new UpdateProjectRequest();

      projectInfo.shortname = 'updatedproject';
      projectInfo.longname = 'updated project longname';

      const description = new StringLiteral();
      description.language = 'en';
      description.value = 'updated project description';

      projectInfo.description = [description];

      projectInfo.keywords = ['updated', 'keywords'];
      projectInfo.logo = '/fu/bar/baz-updated.jpg';
      projectInfo.status = true;
      projectInfo.selfjoin = true;

      const user = require('../../../../test/data/api/admin/projects/get-project-response.json');

      ajaxMock.setMockResponse(user);

      knoraApiConnection.admin.projectsEndpoint
        .updateProject(projectIri, projectInfo)
        .subscribe((response: ApiResponseData<ProjectResponse>) => {
          expect(response.body.project.id).toEqual('http://rdfh.ch/projects/00FF');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/iri/http%3A%2F%2Frdfh.ch%2Fprojects%2F00FF');

          expect(request?.method).toEqual('PUT');

          expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');

          const payload = require('../../../../test/data/api/admin/projects/update-project-request.json');

          expect(request?.body).toEqual(payload);

          done();
        });
    });
  });

  describe('Method deleteProject', () => {
    it('should delete a project', done => {
      const project = require('../../../../test/data/api/admin/projects/get-project-response.json');

      ajaxMock.setMockResponse(project);

      knoraApiConnection.admin.projectsEndpoint
        .deleteProject('http://rdfh.ch/projects/00FF')
        .subscribe((response: ApiResponseData<ProjectResponse>) => {
          expect(response.body.project.id).toEqual('http://rdfh.ch/projects/00FF');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/iri/http%3A%2F%2Frdfh.ch%2Fprojects%2F00FF');

          expect(request?.method).toEqual('DELETE');

          done();
        });
    });
  });

  describe('Method getProject', () => {
    it('should return a project by its IRI', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProject('iri', 'http://rdfh.ch/projects/00FF')
        .subscribe((response: ApiResponseData<ProjectResponse>) => {
          expect(response.body.project.id).toEqual('http://rdfh.ch/projects/00FF');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/iri/http%3A%2F%2Frdfh.ch%2Fprojects%2F00FF');

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should return a project by its shortname', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProject('shortname', 'images')
        .subscribe((response: ApiResponseData<ProjectResponse>) => {
          expect(response.body.project.id).toEqual('http://rdfh.ch/projects/00FF');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/shortname/images');

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should return a project by its shortcode', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProject('shortcode', '00FF')
        .subscribe((response: ApiResponseData<ProjectResponse>) => {
          expect(response.body.project.id).toEqual('http://rdfh.ch/projects/00FF');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/shortcode/00FF');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getProjectByIri', () => {
    it('should return a project by its IRI', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectByIri('http://rdfh.ch/projects/00FF')
        .subscribe((response: ApiResponseData<ProjectResponse>) => {
          expect(response.body.project.id).toEqual('http://rdfh.ch/projects/00FF');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/iri/http%3A%2F%2Frdfh.ch%2Fprojects%2F00FF');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getProjectByShortname', () => {
    it('should return a project by its shortname', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectByShortname('images')
        .subscribe((response: ApiResponseData<ProjectResponse>) => {
          expect(response.body.project.id).toEqual('http://rdfh.ch/projects/00FF');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/shortname/images');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getProjectByShortcode', () => {
    it('should return a project by its shortcode', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectByShortcode('00FF')
        .subscribe((response: ApiResponseData<ProjectResponse>) => {
          expect(response.body.project.id).toEqual('http://rdfh.ch/projects/00FF');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/shortcode/00FF');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getProjectMembers', () => {
    it('should return members of a project identified by its iri', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-members-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectMembers('iri', 'http://rdfh.ch/projects/00FF')
        .subscribe((response: ApiResponseData<MembersResponse>) => {
          expect(response.body.members.length).toEqual(4);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://localhost:3333/admin/projects/iri/http%3A%2F%2Frdfh.ch%2Fprojects%2F00FF/members'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should return members of a project identified by its shortname', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-members-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectMembers('shortname', 'images')
        .subscribe((response: ApiResponseData<MembersResponse>) => {
          expect(response.body.members.length).toEqual(4);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/shortname/images/members');

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should return members of a project identified by its shortcode', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-members-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectMembers('shortcode', '00FF')
        .subscribe((response: ApiResponseData<MembersResponse>) => {
          expect(response.body.members.length).toEqual(4);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/shortcode/00FF/members');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getProjectMembersByIri', () => {
    it('should return members of a project identified by its iri', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-members-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectMembersByIri('http://rdfh.ch/projects/00FF')
        .subscribe((response: ApiResponseData<MembersResponse>) => {
          expect(response.body.members.length).toEqual(4);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://localhost:3333/admin/projects/iri/http%3A%2F%2Frdfh.ch%2Fprojects%2F00FF/members'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getProjectMembersByShortname', () => {
    it('should return members of a project identified by its iri', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-members-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectMembersByShortname('images')
        .subscribe((response: ApiResponseData<MembersResponse>) => {
          expect(response.body.members.length).toEqual(4);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/shortname/images/members');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getProjectMembersByShortcode', () => {
    it('should return members of a project identified by its iri', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-members-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectMembersByShortcode('00FF')
        .subscribe((response: ApiResponseData<MembersResponse>) => {
          expect(response.body.members.length).toEqual(4);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/shortcode/00FF/members');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getProjectAdminMembers', () => {
    it('should return admin members of a project identified by its iri', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-admin-members-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectAdminMembers('iri', 'http://rdfh.ch/projects/00FF')
        .subscribe((response: ApiResponseData<MembersResponse>) => {
          expect(response.body.members.length).toEqual(2);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://localhost:3333/admin/projects/iri/http%3A%2F%2Frdfh.ch%2Fprojects%2F00FF/admin-members'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should return admin members of a project identified by its shortname', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-admin-members-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectAdminMembers('shortname', 'images')
        .subscribe((response: ApiResponseData<MembersResponse>) => {
          expect(response.body.members.length).toEqual(2);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/shortname/images/admin-members');

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should return admin members of a project identified by its shortcode', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-admin-members-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectAdminMembers('shortcode', '00FF')
        .subscribe((response: ApiResponseData<MembersResponse>) => {
          expect(response.body.members.length).toEqual(2);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/shortcode/00FF/admin-members');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getProjectMembersByIri', () => {
    it('should return members of a project identified by its iri', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-admin-members-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectAdminMembersByIri('http://rdfh.ch/projects/00FF')
        .subscribe((response: ApiResponseData<MembersResponse>) => {
          expect(response.body.members.length).toEqual(2);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://localhost:3333/admin/projects/iri/http%3A%2F%2Frdfh.ch%2Fprojects%2F00FF/admin-members'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getProjectAdminMembersByShortname', () => {
    it('should return members of a project identified by its iri', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-admin-members-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectAdminMembersByShortname('images')
        .subscribe((response: ApiResponseData<MembersResponse>) => {
          expect(response.body.members.length).toEqual(2);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/shortname/images/admin-members');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getProjectAdminMembersByShortcode', () => {
    it('should return members of a project identified by its iri', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-admin-members-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectAdminMembersByShortcode('00FF')
        .subscribe((response: ApiResponseData<MembersResponse>) => {
          expect(response.body.members.length).toEqual(2);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/shortcode/00FF/admin-members');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getProjectRestrictedViewSettings', () => {
    it('should return restricted view settings of a project identified by its iri', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-restricted-view-settings-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectRestrictedViewSettings('iri', 'http://rdfh.ch/projects/00FF')
        .subscribe((response: ApiResponseData<ProjectRestrictedViewSettingsResponse>) => {
          expect(response.body.settings.size).toEqual('!512,512');
          expect(response.body.settings.watermark).toEqual(false);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://localhost:3333/admin/projects/iri/http%3A%2F%2Frdfh.ch%2Fprojects%2F00FF/RestrictedViewSettings'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should return restricted view settings of a project identified by its shortname', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-restricted-view-settings-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectRestrictedViewSettings('shortname', 'images')
        .subscribe((response: ApiResponseData<ProjectRestrictedViewSettingsResponse>) => {
          expect(response.body.settings.size).toEqual('!512,512');
          expect(response.body.settings.watermark).toEqual(false);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/shortname/images/RestrictedViewSettings');

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should return restricted view settings of a project identified by its shortcode', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-restricted-view-settings-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectRestrictedViewSettings('shortcode', '00FF')
        .subscribe((response: ApiResponseData<ProjectRestrictedViewSettingsResponse>) => {
          expect(response.body.settings.size).toEqual('!512,512');
          expect(response.body.settings.watermark).toEqual(false);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/shortcode/00FF/RestrictedViewSettings');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getProjectRestrictedViewSettingByIri', () => {
    it('should return restricted view settings of a project identified by its iri', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-restricted-view-settings-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectRestrictedViewSettingByIri('http://rdfh.ch/projects/00FF')
        .subscribe((response: ApiResponseData<ProjectRestrictedViewSettingsResponse>) => {
          expect(response.body.settings.size).toEqual('!512,512');
          expect(response.body.settings.watermark).toEqual(false);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://localhost:3333/admin/projects/iri/http%3A%2F%2Frdfh.ch%2Fprojects%2F00FF/RestrictedViewSettings'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getProjectRestrictedViewSettingByShortname', () => {
    it('should return restricted view settings of a project identified by its shortname', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-restricted-view-settings-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectRestrictedViewSettingByShortname('images')
        .subscribe((response: ApiResponseData<ProjectRestrictedViewSettingsResponse>) => {
          expect(response.body.settings.size).toEqual('!512,512');
          expect(response.body.settings.watermark).toEqual(false);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/shortname/images/RestrictedViewSettings');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method getProjectRestrictedViewSettingByShortcode', () => {
    it('should return restricted view settings of a project identified by its shortcode', done => {
      const projects = require('../../../../test/data/api/admin/projects/get-project-restricted-view-settings-response.json');

      ajaxMock.setMockResponse(projects);

      knoraApiConnection.admin.projectsEndpoint
        .getProjectRestrictedViewSettingByShortcode('00FF')
        .subscribe((response: ApiResponseData<ProjectRestrictedViewSettingsResponse>) => {
          expect(response.body.settings.size).toEqual('!512,512');
          expect(response.body.settings.watermark).toEqual(false);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/admin/projects/shortcode/00FF/RestrictedViewSettings');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });
});
