import { catchError, map } from 'rxjs';

import { ApiResponseData } from '../../../models/api-response-data';
import { Endpoint } from '../../endpoint';

import { KeywordsResponse } from '../../../models/admin/keywords-response';
import { MembersResponse } from '../../../models/admin/members-response';
import { Project } from '../../../models/admin/project';
import { ProjectResponse } from '../../../models/admin/project-response';
import { ProjectRestrictedViewSettingsResponse } from '../../../models/admin/project-restricted-view-settings-response';
import { ProjectsResponse } from '../../../models/admin/projects-response';
import { UpdateProjectRequest } from '../../../models/admin/update-project-request';

/**
 * An endpoint for working with Knora projects.
 * @deprecated Use open API docs instead
 * @category Endpoint Admin
 */
export class ProjectsEndpointAdmin extends Endpoint {
  /**
   * Returns a list of all projects.
   */
  getProjects() {
    return this.httpGet('', undefined).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ProjectsResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Creates a project.
   *
   * @param project The project to be created.
   */
  createProject(project: Project) {
    return this.httpPost('', this.jsonConvert.serializeObject(project), undefined, undefined).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ProjectResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Gets all the unique keywords for all projects.
   */
  getKeywords() {
    return this.httpGet('/Keywords').pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, KeywordsResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Gets all the keywords for a project.
   *
   * @param iri The IRI of the project.
   */
  getProjectKeywords(iri: string) {
    return this.httpGet('/iri/' + encodeURIComponent(iri) + '/Keywords').pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, KeywordsResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Updates a project.
   *
   * @param iri The IRI of the project to be updated.
   * @param projectInfo The project info to be updated.
   */
  updateProject(iri: string, projectInfo: UpdateProjectRequest) {
    return this.httpPut('/iri/' + encodeURIComponent(iri), this.jsonConvert.serializeObject(projectInfo)).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ProjectResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Deletes a project. This method does not actually delete a project, but sets the status to false.
   *
   * @param iri The project IRI.
   */
  deleteProject(iri: string) {
    return this.httpDelete('/iri/' + encodeURIComponent(iri)).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ProjectResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Gets a project by a property.
   *
   * @param property The name of the property by which the project is identified.
   * @param value The value of the property by which the project is identified.
   */
  getProject(property: 'iri' | 'shortname' | 'shortcode', value: string) {
    return this.httpGet('/' + encodeURIComponent(property) + '/' + encodeURIComponent(value), undefined).pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, ProjectResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Gets a project by IRI.
   *
   * @param iri The IRI of the project.
   */
  getProjectByIri(iri: string) {
    return this.getProject('iri', iri);
  }

  /**
   * Gets a project by shortname.
   *
   * @param shortname The shortname of the project.
   */
  getProjectByShortname(shortname: string) {
    return this.getProject('shortname', shortname);
  }

  /**
   * Gets a project by shortcode.
   *
   * @param shortcode The shortcode of the project.
   */
  getProjectByShortcode(shortcode: string) {
    return this.getProject('shortcode', shortcode);
  }

  /**
   * Gets a project's members by a property.
   *
   * @param property The name of the property by which the project is identified.
   * @param value The value of the property by which the project is identified.
   */
  getProjectMembers(property: 'iri' | 'shortname' | 'shortcode', value: string) {
    return this.httpGet('/' + encodeURIComponent(property) + '/' + encodeURIComponent(value) + '/members').pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, MembersResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Gets the members of a project by IRI.
   *
   * @param iri The IRI of the project.
   */
  getProjectMembersByIri(iri: string) {
    return this.getProjectMembers('iri', iri);
  }

  /**
   * Gets a project's members by shortname.
   *
   * @param shortname The shortname of the project.
   */
  getProjectMembersByShortname(shortname: string) {
    return this.getProjectMembers('shortname', shortname);
  }

  /**
   * Gets a project's members by shortcode.
   *
   * @param shortcode The shortcode of the project.
   */
  getProjectMembersByShortcode(shortcode: string) {
    return this.getProjectMembers('shortcode', shortcode);
  }

  /**
   * Gets a project's admin members by a property.
   *
   * @param property The name of the property by which the project is identified.
   * @param value The value of the property by which the project is identified.
   */
  getProjectAdminMembers(property: 'iri' | 'shortname' | 'shortcode', value: string) {
    return this.httpGet('/' + encodeURIComponent(property) + '/' + encodeURIComponent(value) + '/admin-members').pipe(
      map(ajaxResponse => ApiResponseData.fromAjaxResponse(ajaxResponse, MembersResponse, this.jsonConvert)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Gets the admin members of a project by IRI.
   *
   * @param iri The IRI of the project.
   */
  getProjectAdminMembersByIri(iri: string) {
    return this.getProjectAdminMembers('iri', iri);
  }

  /**
   * Gets a project's admin members by shortname.
   *
   * @param shortname The shortname of the project.
   */
  getProjectAdminMembersByShortname(shortname: string) {
    return this.getProjectAdminMembers('shortname', shortname);
  }

  /**
   * Gets a project's admin members by shortcode.
   *
   * @param shortcode The shortcode of the project.
   */
  getProjectAdminMembersByShortcode(shortcode: string) {
    return this.getProjectAdminMembers('shortcode', shortcode);
  }

  /**
   * Gets a project's restricted view settings by a property.
   *
   * @param property The name of the property by which the project is identified.
   * @param value The value of the property by which the project is identified.
   */
  getProjectRestrictedViewSettings(property: 'iri' | 'shortname' | 'shortcode', value: string) {
    return this.httpGet(
      '/' + encodeURIComponent(property) + '/' + encodeURIComponent(value) + '/RestrictedViewSettings'
    ).pipe(
      map(ajaxResponse =>
        ApiResponseData.fromAjaxResponse(ajaxResponse, ProjectRestrictedViewSettingsResponse, this.jsonConvert)
      ),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Gets a project's restricted view settings by IRI.
   *
   * @param iri The IRI of the project.
   */
  getProjectRestrictedViewSettingByIri(iri: string) {
    return this.getProjectRestrictedViewSettings('iri', iri);
  }

  /**
   * Gets a project's restricted view settings by shortname.
   *
   * @param shortname The shortname of the project.
   */
  getProjectRestrictedViewSettingByShortname(shortname: string) {
    return this.getProjectRestrictedViewSettings('shortname', shortname);
  }

  /**
   * Gets a project's restricted view settings by shortcode.
   *
   * @param shortcode The shortcode of the project.
   */
  getProjectRestrictedViewSettingByShortcode(shortcode: string) {
    return this.getProjectRestrictedViewSettings('shortcode', shortcode);
  }
}
