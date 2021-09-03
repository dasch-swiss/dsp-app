import { Inject, Injectable } from '@angular/core';
import { ApiResponseData, ApiResponseError, Constants, KnoraApiConnection, ProjectsResponse, StoredProject, UserResponse } from '@dasch-swiss/dsp-js';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';
import { SessionService } from 'src/app/main/services/session.service';

@Injectable({
    providedIn: 'root'
})
export class ProjectService {

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _session: SessionService
    ) { }

    /**
     * initializes projects
     * @returns projects
     */
    initializeProjects(): Observable<StoredProject[]> {
        const usersProjects: StoredProject[] = [];

        // get info about logged-in user from the session object
        const session = this._session.getSession();

        if (session.user.sysAdmin === false) {
            return this._cache.get(session.user.name, this._dspApiConnection.admin.usersEndpoint.getUserByUsername(session.user.name)).pipe(
                map((response: ApiResponseData<UserResponse>) => {

                    for (const project of response.body.user.projects) {
                        if (project.status) {
                            usersProjects.push(project);
                        }
                    }
                    return <StoredProject[]>usersProjects;
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                    return <StoredProject[]>[];
                })
            );
        } else {
            return this._dspApiConnection.admin.projectsEndpoint.getProjects().pipe(
                map((response: ApiResponseData<ProjectsResponse>) => {
                    for (const project of response.body.projects) {
                        if (project.status && project.id !== Constants.SystemProjectIRI && project.id !== Constants.DefaultSharedOntologyIRI) {
                            usersProjects.push(project);
                        }
                    }
                    return <StoredProject[]>usersProjects;
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                    return <StoredProject[]>[];
                })
            );
        }

    }
}
