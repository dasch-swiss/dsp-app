import { Injectable } from '@angular/core';
import {
    Constants,
    ReadUser,
} from '@dasch-swiss/dsp-js';
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
    constructor(
        private _acs: AppConfigService,
    ) {}

    iriToUuid(iri: string): string {
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

    isInProjectGroup = (userProjectGroups: string[], projectUuid: string): boolean =>
        userProjectGroups.some((e) => e === this.uuidToIri(projectUuid));

    isMemberOfProjectAdminGroup = (groupsPerProject: {[key: string]: string[]}, projectIri: string): boolean =>
        groupsPerProject
        && groupsPerProject[projectIri]
        && (groupsPerProject[projectIri].indexOf(Constants.ProjectAdminGroupIRI) > -1);

    isMemberOfSystemAdminGroup = (groupsPerProject: {[key: string]: string[]}): boolean =>
        groupsPerProject
        && groupsPerProject[Constants.SystemProjectIRI]
        && (groupsPerProject[Constants.SystemProjectIRI].indexOf(Constants.SystemAdminGroupIRI) > -1);


    isProjectAdmin(groupsPerProject: {[key: string]: string[]}, userProjectGroups: string[], projectIri: string): boolean
    {
        const isMemberOfProjectAdminGroup = this.isMemberOfProjectAdminGroup(groupsPerProject, projectIri);
        return this.isInProjectGroup(userProjectGroups, projectIri) || isMemberOfProjectAdminGroup;
    }

    isProjectAdminOrSysAdmin(user: ReadUser, userProjectGroups: string[], projectIri: string): boolean
    {
        return (
            user !== null &&
            user.permissions.groupsPerProject !== undefined &&
            this.isProjectOrSysAdmin(
                user.permissions.groupsPerProject,
                userProjectGroups,
                projectIri
            )
        );
    }

    isProjectOrSysAdmin(groupsPerProject: {[key: string]: string[]}, userProjectGroups: string[], projectIri: string): boolean
    {
        const isMemberOfSystemAdminGroup = this.isMemberOfSystemAdminGroup(groupsPerProject);
        return this.isProjectAdmin(groupsPerProject, userProjectGroups, projectIri) || isMemberOfSystemAdminGroup;
    }

    isProjectMember(user: ReadUser, userProjectGroups: string[], projectUuid: string): boolean
    {
        const isProjectAdmin = this.isInProjectGroup(userProjectGroups, projectUuid);
        const iri = this.uuidToIri(projectUuid);
        return isProjectAdmin
            // check if the user is member of the current project(id contains the iri)
            ? true
            : user.projects.length === 0 ? false : user.projects.some((p) => p.id === iri);
    }
}
