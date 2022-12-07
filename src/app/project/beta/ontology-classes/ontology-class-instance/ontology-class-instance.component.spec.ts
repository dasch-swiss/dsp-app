import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ApiResponseData, MockProjects, ProjectResponse, ProjectsEndpointAdmin } from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { AppInitService } from 'src/app/app-init.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { OntologyService } from 'src/app/project/ontology/ontology.service';
import { OntologyClassInstanceComponent } from './ontology-class-instance.component';


describe('OntologyClassInstanceComponent', () => {
    let component: OntologyClassInstanceComponent;
    let fixture: ComponentFixture<OntologyClassInstanceComponent>;

    const appInitSpy = {
        dspAppConfig: {
            iriBase: 'http://rdfh.ch'
        }
    };

    const dspConnSpyObj = {
        admin: {
            projectsEndpoint: jasmine.createSpyObj('projectsEndpoint', ['getProjectByIri'])
        }
    };

    const ontologyServiceSpyObj = jasmine.createSpyObj('OntologyService', ['getIriBaseUrl']);

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [OntologyClassInstanceComponent],
            imports: [
                MatSnackBarModule,
                MatDialogModule,
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
                    provide: ActivatedRoute,
                    useValue: {
                        params: of({
                            onto: 'anything',
                            class: 'BlueThing',
                        }),
                        parent: {
                            snapshot: {
                                params: { uuid: 'Lw3FC39BSzCwvmdOaTyLqQ' }
                            }
                        }
                    }
                },
                {
                    provide: OntologyService,
                    useValue: ontologyServiceSpyObj
                }

            ]
        })
            .compileComponents();
    });

    beforeEach(() => {

        const ontoServiceSpy = TestBed.inject(OntologyService);

        (ontoServiceSpy as jasmine.SpyObj<OntologyService>).getIriBaseUrl.and.callFake(
            () => '0.0.0.0:3333'
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

        fixture = TestBed.createComponent(OntologyClassInstanceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
