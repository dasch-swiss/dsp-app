import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import {
    ApiResponseData,
    MockProjects,
    ProjectResponse,
    ProjectsEndpointAdmin,
} from '@dasch-swiss/dsp-js';
import { SplitAreaDirective, SplitComponent } from 'angular-split';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { OntologyService } from '@dsp-app/src/app/project/ontology/ontology.service';
import { SearchParams } from '@dsp-app/src/app/workspace/results/list-view/list-view.component';
import { OntologyClassInstanceComponent } from './ontology-class-instance.component';

/**
 * test component that mocks ListViewComponent
 */
@Component({ selector: 'app-list-view', template: '' })
class MockListViewComponent {
    @Input() search: SearchParams;
    @Input() withMultipleSelection?: boolean = false;
    constructor() {}
}

describe('OntologyClassInstanceComponent', () => {
    let component: OntologyClassInstanceComponent;
    let fixture: ComponentFixture<OntologyClassInstanceComponent>;

    const appInitSpy = {
        dspAppConfig: {
            iriBase: 'http://rdfh.ch',
        },
    };

    const dspConnSpyObj = {
        admin: {
            projectsEndpoint: jasmine.createSpyObj('projectsEndpoint', [
                'getProjectByIri',
            ]),
        },
    };

    const ontologyServiceSpyObj = jasmine.createSpyObj('OntologyService', [
        'getIriBaseUrl',
    ]);

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                OntologyClassInstanceComponent,
                SplitComponent,
                SplitAreaDirective,
                MockListViewComponent,
            ],
            imports: [MatSnackBarModule, MatDialogModule, RouterTestingModule],
            providers: [
                {
                    provide: AppConfigService,
                    useValue: appInitSpy,
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: dspConnSpyObj,
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
                                params: { uuid: '0001' },
                            },
                        },
                    },
                },
                {
                    provide: OntologyService,
                    useValue: ontologyServiceSpyObj,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        const ontoServiceSpy = TestBed.inject(OntologyService);

        (
            ontoServiceSpy as jasmine.SpyObj<OntologyService>
        ).getIriBaseUrl.and.callFake(() => '0.0.0.0:3333');

        // mock API
        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        // mock projects endpoint
        (
            dspConnSpy.admin
                .projectsEndpoint as jasmine.SpyObj<ProjectsEndpointAdmin>
        ).getProjectByIri.and.callFake(() => {
            const response = new ProjectResponse();

            const mockProjects = MockProjects.mockProjects();

            response.project = mockProjects.body.projects[0];

            return of(
                ApiResponseData.fromAjaxResponse({ response } as AjaxResponse)
            );
        });

        fixture = TestBed.createComponent(OntologyClassInstanceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
