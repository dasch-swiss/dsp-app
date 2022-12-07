import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ApiResponseData, MockOntology, MockProjects, OntologiesEndpointV2, ProjectResponse, ProjectsEndpointAdmin, ReadProject } from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { AppInitService } from '../app-init.service';
import { CacheService } from '../main/cache/cache.service';
import { DspApiConnectionToken } from '../main/declarations/dsp-api-tokens';
import { DialogComponent } from '../main/dialog/dialog.component';
import { StatusComponent } from '../main/status/status.component';
import { OntologyService } from './ontology/ontology.service';
import { ProjectComponent } from './project.component';

describe('ProjectComponent', () => {
    let component: ProjectComponent;
    let fixture: ComponentFixture<ProjectComponent>;

    const appInitSpy = {
        dspAppConfig: {
            iriBase: 'http://rdfh.ch'
        }
    };

    beforeEach(waitForAsync(() => {

        const cacheServiceSpy = jasmine.createSpyObj('CacheService', ['get', 'set', 'has']);
        const dspConnSpyObj = {
            admin: {
                projectsEndpoint: jasmine.createSpyObj('projectsEndpoint', ['getProjectByIri'])
            },
            v2: {
                onto: jasmine.createSpyObj('onto', ['getOntologiesByProjectIri']),
            }
        };
        const ontoServiceSpy = jasmine.createSpyObj('OntologyService', ['getOntologyName']);

        TestBed.configureTestingModule({
            declarations: [
                ProjectComponent,
                DialogComponent,
                StatusComponent
            ],
            imports: [
                BrowserAnimationsModule,
                MatDialogModule,
                MatIconModule,
                MatSnackBarModule,
                MatTabsModule,
                RouterTestingModule
            ],
            providers: [
                {
                    provide: AppInitService,
                    useValue: appInitSpy
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: dspConnSpyObj
                },
                {
                    provide: CacheService,
                    useValue: cacheServiceSpy
                },
                {
                    provide: OntologyService,
                    useValue: ontoServiceSpy
                },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            url: [
                                { path: 'project' }
                            ],
                            params: [
                                { uuid: '09aQ4EuRKReCXnO0pTJ92ug001' }
                            ]
                        }
                    }
                }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {

        // mock cache service
        const cacheSpy = TestBed.inject(CacheService);

        (cacheSpy as jasmine.SpyObj<CacheService>).get.and.callFake(
            () => {
                const response: ProjectResponse = new ProjectResponse();

                const mockProjects = MockProjects.mockProjects();

                response.project = mockProjects.body.projects[0];

                return of(response.project as ReadProject);
            }
        );

        // mock API
        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        // mock projects endpoint
        (dspConnSpy.admin.projectsEndpoint as jasmine.SpyObj<ProjectsEndpointAdmin>).getProjectByIri.and.callFake(
            () => {
                const response = new ProjectResponse();

                const mockProjects = MockProjects.mockProjects();

                response.project = mockProjects.body.projects[0];

                return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
            }
        );

        (dspConnSpy.v2.onto as jasmine.SpyObj<OntologiesEndpointV2>).getOntologiesByProjectIri.and.callFake(
            () => {
                const anythingOnto = MockOntology.mockOntologiesMetadata();
                return of(anythingOnto);
            }
        );

        fixture = TestBed.createComponent(ProjectComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit('should create', () => {
        expect(component).toBeTruthy();
    });

    // todo: check title, check if we get the shortcode of the current project and valide it, check if get session, get project by shortcode, check if the user is logged in as
    // system admin or project admin
});
