import { Injectable } from '@angular/core';
import { Constants, ReadUser } from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';

@Injectable({
  providedIn: 'root',
})
/**
 * Project Service is helper service to provide project related methods
 * @export
 * @class ProjectService
 */
export class ProjectService {
  constructor(private _acs: AppConfigService) {}

  static IriToUuid(iri: string): string {
    if (iri) {
      const array = iri.split('/');
      return array[array.length - 1];
    }

    return '';
  }

  uuidToIri(uuid: string): string {
    if (uuid && !uuid.startsWith(this._acs.dspAppConfig.iriBase)) {
      return `${this._acs.dspAppConfig.iriBase}/projects/${uuid}`;
    }

    return uuid;
  }

  static IsInProjectGroup = (userProjectGroups: string[], projectIri: string): boolean =>
    userProjectGroups.some(e => ProjectService.IriToUuid(e) === ProjectService.IriToUuid(projectIri));

  static IsMemberOfProjectAdminGroup(groupsPerProject: { [key: string]: string[] }, projectIri: string): boolean {
    if (!groupsPerProject || Object.keys(groupsPerProject).length === 0) {
      return false;
    }

    const groups: { [key: string]: string[] } = {};
    Object.keys(groupsPerProject).forEach(group => {
      groups[ProjectService.IriToUuid(group)] = groupsPerProject[group];
    });

    const groupValue = groups[ProjectService.IriToUuid(projectIri)];
    return groupValue !== undefined && groupValue.indexOf(Constants.ProjectAdminGroupIRI) > -1;
  }

  static IsMemberOfSystemAdminGroup = (groupsPerProject: { [key: string]: string[] }): boolean =>
    (groupsPerProject && groupsPerProject[Constants.SystemProjectIRI]) !== undefined &&
    groupsPerProject[Constants.SystemProjectIRI].indexOf(Constants.SystemAdminGroupIRI) > -1;

  static IsProjectAdmin(
    groupsPerProject: { [key: string]: string[] },
    userProjectGroups: string[],
    projectIri: string
  ): boolean {
    const isMemberOfProjectAdminGroup = ProjectService.IsMemberOfProjectAdminGroup(groupsPerProject, projectIri);
    return ProjectService.IsInProjectGroup(userProjectGroups, projectIri) || isMemberOfProjectAdminGroup;
  }

  static IsProjectAdminOrSysAdmin(user: ReadUser, userProjectGroups: string[], projectIri: string): boolean {
    if (!user || !projectIri) {
      return false;
    }

    const groupsPerProject = user.permissions.groupsPerProject ? user.permissions.groupsPerProject : {};
    return ProjectService.IsProjectOrSysAdmin(groupsPerProject, userProjectGroups, projectIri);
  }

  static IsProjectMemberOrAdminOrSysAdmin(user: ReadUser, userProjectGroups: string[], projectIri: string): boolean {
    return (
      ProjectService.IsProjectMember(user, userProjectGroups, projectIri) ||
      ProjectService.IsProjectAdminOrSysAdmin(user, userProjectGroups, projectIri)
    );
  }

  static IsProjectOrSysAdmin(
    groupsPerProject: { [key: string]: string[] },
    userProjectGroups: string[],
    projectIri: string
  ): boolean {
    const isMemberOfSystemAdminGroup = ProjectService.IsMemberOfSystemAdminGroup(groupsPerProject);
    return ProjectService.IsProjectAdmin(groupsPerProject, userProjectGroups, projectIri) || isMemberOfSystemAdminGroup;
  }

  static IsProjectMember(user: ReadUser, userProjectGroups: string[], projectUuid: string): boolean {
    projectUuid = ProjectService.IriToUuid(projectUuid);
    const isProjectAdmin = ProjectService.IsInProjectGroup(userProjectGroups, projectUuid);
    return isProjectAdmin
      ? // check if the user is member of the current project(id contains the iri)
        true
      : user && ProjectService.HasProjectMemberRights(user, projectUuid);
  }

  static HasProjectMemberRights(user: ReadUser, projectUuid: string): boolean {
    const project = user.projects.find(p => ProjectService.IriToUuid(p.id) === projectUuid);
    if (!project) {
      return false;
    }

    const groupsPerProject = user.permissions.groupsPerProject;
    const hasProjectMemberRights =
      groupsPerProject &&
      groupsPerProject[project.id] &&
      groupsPerProject[project.id].includes(Constants.ProjectMemberGroupIRI);
    return hasProjectMemberRights === true;
  }
}
