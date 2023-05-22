import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, DebugElement, Input, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection, MockProjects, ProjectResponse, ReadProject, StringLiteral } from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AppInitService } from '@dsp-app/src/app/app-init.service';
import { DspApiConfigToken, DspApiConnectionToken } from '@dsp-app/src/app/main/declarations/dsp-api-tokens';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { StatusComponent } from '@dsp-app/src/app/main/status/status.component';
import { ProjectService } from '@dsp-app/src/app/workspace/resource/services/project.service';
import { TestConfig } from '@dsp-app/src/test.config';
import { CacheService } from '@dsp-app/src/app/main/cache/cache.service';
import { DescriptionComponent } from './description.component';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { MatButtonHarness } from '@angular/material/button/testing';

@Component ({
    template: '<app-description #description></app-description>'
})
class TestHostDescriptionComponent {
    @ViewChild('description') descriptionComp: DescriptionComponent;
}

/**
 * test component that mocks StringLiteralInputComponent
 */
@Component({ selector: 'app-string-literal-input', template: '' })
class MockStringLiteralInputComponent {
    @Input() placeholder = 'Label';
    @Input() language: string;
    @Input() textarea: boolean;
    @Input() value: StringLiteral[] = [];
    @Input() disabled: boolean;
    @Input() readonly: boolean;
    constructor() { }
}

describe('DescriptionComponent', () => {
    let testHostComponent: TestHostDescriptionComponent;
    let testHostFixture: ComponentFixture<TestHostDescriptionComponent>;
    let descriptionComponentDe: DebugElement;
    let rootLoader: HarnessLoader;

    beforeEach(waitForAsync(() => {


        const cacheServiceSpy = jasmine.createSpyObj('CacheService', ['get', 'set']);
        const projectServiceSpy = jasmine.createSpyObj('ProjectService', ['iriToUuid']);

        TestBed.configureTestingModule({
            declarations: [
                DescriptionComponent,
                TestHostDescriptionComponent,
                MockStringLiteralInputComponent,
                DialogComponent,
                StatusComponent
            ],
            imports: [
                FormsModule,
                BrowserAnimationsModule,
                MatChipsModule,
                MatDialogModule,
                MatDividerModule,
                MatFormFieldModule,
                MatIconModule,
                MatInputModule,
                MatSlideToggleModule,
                MatSnackBarModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot()
            ],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        parent: {
                            paramMap: of({
                                get: (param: string) => {
                                    if (param === 'uuid') {
                                        return TestConfig.ProjectUuid;
                                    }
                                },
                            }),
                            snapshot: {
                                url: [{ path: 'project' }],
                            },
                        },
                    },
                },
                AppInitService,
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig,
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig),
                },
                {
                    provide: CacheService,
                    useValue: cacheServiceSpy
                },
                {
                    provide: ProjectService,
                    useValue: projectServiceSpy
                },
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        // mock cache service
        const cacheSpy = TestBed.inject(CacheService);

        (cacheSpy as jasmine.SpyObj<CacheService>).get.and.callFake(() => {
            const response: ProjectResponse = new ProjectResponse();

            const mockProjects = MockProjects.mockProjects();

            response.project = mockProjects.body.projects[0];

            return of(response.project as ReadProject);
        });
    });

    // mock localStorage
    beforeEach(() => {
        let store = {};

        spyOn(localStorage, 'getItem').and.callFake(
            (key: string): string => store[key] || null
        );
        spyOn(localStorage, 'removeItem').and.callFake((key: string): void => {
            delete store[key];
        });
        spyOn(localStorage, 'setItem').and.callFake(
            (key: string, value: string): string => (store[key] = <any>value)
        );
        spyOn(localStorage, 'clear').and.callFake(() => {
            store = {};
        });
    });

    beforeEach(() => {
        localStorage.setItem(
            'session',
            JSON.stringify(TestConfig.CurrentSession)
        );

        testHostFixture = TestBed.createComponent(TestHostDescriptionComponent);
        testHostComponent = testHostFixture.componentInstance;
        rootLoader = TestbedHarnessEnvironment.documentRootLoader(testHostFixture);
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();

        const hostCompDe = testHostFixture.debugElement;
        descriptionComponentDe = hostCompDe.query(By.directive(DescriptionComponent));
        expect(descriptionComponentDe).toBeTruthy();
    });

    it('should get the session', () => {
        expect<any>(localStorage.getItem('session')).toBe(
            JSON.stringify(TestConfig.CurrentSession)
        );
    });

    it('should display the description in read mode', () => {
        const desc = descriptionComponentDe.query(By.css('.description-rm'));
        expect(desc).toBeTruthy();
    });

    it('should not display the edit button as a regular user', async () => {
        testHostComponent.descriptionComp.projectAdmin = false;
        testHostComponent.descriptionComp.sysAdmin = false;

        testHostFixture.detectChanges();

        const editBtn = await rootLoader.getAllHarnesses(MatButtonHarness.with({ selector: '.app-toolbar-action button' }));

        expect(editBtn.length).toEqual(0);
    });

    it('should display the edit button as an admin', async () => {
        testHostComponent.descriptionComp.projectAdmin = true;
        testHostComponent.descriptionComp.sysAdmin = true;

        testHostFixture.detectChanges();

        const editBtn = await rootLoader.getHarness(MatButtonHarness.with({ selector: '.app-toolbar-action button' }));

        await editBtn.click();

        const form = descriptionComponentDe.query(By.css('.description-form'));
        expect(form).toBeTruthy();
    });

    // todo: check the project name, if there is description and keywords, check if we can edit the project info if the user is project admin or system admin (edit btn displayed)
    // check if you get the project by shortcode
    // check if you get the project metadata
});
