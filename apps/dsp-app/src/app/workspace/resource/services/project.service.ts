import { Inject, Injectable } from '@angular/core';
import {
    ApiResponseData,
    ApiResponseError,
    Constants,
    KnoraApiConnection,
    ProjectsResponse,
    StoredProject,
    UserResponse,
} from '@dasch-swiss/dsp-js';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { CacheService } from '@dsp-app/src/app/main/cache/cache.service';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { ErrorHandlerService } from '@dsp-app/src/app/main/services/error-handler.service';
import { SessionService } from '@dasch-swiss/vre/shared/app-session';

@Injectable({
    providedIn: 'root',
})
export class ProjectService {
    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _session: SessionService,
        private _acs: AppConfigService
    ) {}

    /**
     * initializes projects
     * @returns projects
     */
    initializeProjects(): Observable<StoredProject[]> {
        const usersProjects: StoredProject[] = [];

        // get info about logged-in user from the session object
        const session = this._session.getSession();

        if (session.user.sysAdmin === false) {
            return this._cache
                .get(
                    session.user.name,
                    this._dspApiConnection.admin.usersEndpoint.getUserByUsername(
                        session.user.name
                    )
                )
                .pipe(
                    map(
                        (response: ApiResponseData<UserResponse>) => {
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
                        }
                    )
                );
        } else {
            return this._dspApiConnection.admin.projectsEndpoint
                .getProjects()
                .pipe(
                    map(
                        (response: ApiResponseData<ProjectsResponse>) => {
                            for (const project of response.body.projects) {
                                if (
                                    project.status &&
                                    project.id !== Constants.SystemProjectIRI &&
                                    project.id !==
                                        Constants.DefaultSharedOntologyIRI
                                ) {
                                    usersProjects.push(project);
                                }
                            }
                            return <StoredProject[]>usersProjects;
                        },
                        (error: ApiResponseError) => {
                            this._errorHandler.showMessage(error);
                            return <StoredProject[]>[];
                        }
                    )
                );
        }
    }

    iriToUuid(iri: string): string {
        if (iri) {
            const array = iri.split('/');
            return array[array.length - 1];
        }

        return '';
    }

    uuidToIri(uuid: string): string {
        if (uuid) {
            return `${this._acs.dspAppConfig.iriBase}/projects/${uuid}`;
        }

        return '';
    }
}
