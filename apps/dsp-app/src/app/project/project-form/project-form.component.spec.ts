import { Component, Input } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import {
    ApiResponseData,
    MockProjects,
    ProjectResponse,
    ProjectsEndpointAdmin,
    StringLiteral,
} from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { StatusComponent } from '@dsp-app/src/app/main/status/status.component';
import { ProjectService } from '@dsp-app/src/app/workspace/resource/services/project.service';
import { ProjectFormComponent } from './project-form.component';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { MockProvider } from 'ng-mocks';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';

@Component({ selector: 'app-string-literal-input', template: '' })
class MockStringLiteralInputComponent {
    @Input() placeholder = 'Label';
    @Input() language: string;
    @Input() textarea: boolean;
    @Input() value: StringLiteral[] = [];
    @Input() disabled: boolean;
    @Input() readonly: boolean;
    constructor() {}
}

describe('ProjectFormComponent', () => {
    let component: ProjectFormComponent;
    let fixture: ComponentFixture<ProjectFormComponent>;

    const appInitSpy = {
        dspAppConfig: {
            iriBase: 'http://rdfh.ch',
        },
    };

    beforeEach(waitForAsync(() => {
        const projectServiceSpy = jasmine.createSpyObj('ProjectService', [
            'iriToUuid',
        ]);

        const dspConnSpyObj = {
            admin: {
                projectsEndpoint: jasmine.createSpyObj('projectsEndpoint', [
                    'getProjectByIri',
                    'getProjects',
                ]),
            },
        };

        TestBed.configureTestingModule({
            declarations: [
                ProjectFormComponent,
                DialogComponent,
                StatusComponent,
                MockStringLiteralInputComponent,
            ],
            imports: [
                BrowserAnimationsModule,
                MatChipsModule,
                MatDialogModule,
                MatIconModule,
                MatInputModule,
                MatSnackBarModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot(),
            ],
            providers: [
                {
                    provide: AppConfigService,
                    useValue: appInitSpy,
                },
                MockProvider(AppLoggingService),
                {
                    provide: ProjectService,
                    useValue: projectServiceSpy,
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: dspConnSpyObj,
                },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
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

        (
            dspConnSpy.admin
                .projectsEndpoint as jasmine.SpyObj<ProjectsEndpointAdmin>
        ).getProjects.and.callFake(() => {
            const projects = MockProjects.mockProjects();
            return of(projects);
        });

        fixture = TestBed.createComponent(ProjectFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // todo: check the form submission, the validation rules of specific fields like shortcode and the whole form
});
