import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import {
    ApiResponseData,
    GroupsEndpointAdmin,
    GroupsResponse,
    MockProjects,
    ReadGroup,
    StoredProject,
} from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { StatusComponent } from '@dsp-app/src/app/main/status/status.component';
import { SelectGroupComponent } from './select-group.component';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { Component, ViewChild } from '@angular/core';
import { MockProvider } from 'ng-mocks';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';

/**
 * test host component to simulate parent component.
 */
@Component({
    template:
        '<app-select-group #selectGroup projectCode="00FF" [projectid]="iri"></app-select-group>',
})
class TestHostHeaderComponent {
    @ViewChild('selectGroup') selectGroupComp: SelectGroupComponent;
    iri = 'http://rdfh.ch/projects/00FF';
}

describe('SelectGroupComponent', () => {
    let component: TestHostHeaderComponent;
    let fixture: ComponentFixture<TestHostHeaderComponent>;

    const appInitSpy = {
        dspAppConfig: {
            iriBase: 'http://rdfh.ch',
        },
    };

    beforeEach(waitForAsync(() => {
        const dspConnSpyObj = {
            admin: {
                groupsEndpoint: jasmine.createSpyObj('groupsEndpoint', [
                    'getGroups',
                ]),
            },
        };

        TestBed.configureTestingModule({
            declarations: [
                TestHostHeaderComponent,
                SelectGroupComponent,
                DialogComponent,
                StatusComponent,
            ],
            imports: [
                BrowserAnimationsModule,
                MatDialogModule,
                MatFormFieldModule,
                MatSelectModule,
                MatSnackBarModule,
                ReactiveFormsModule,
                RouterTestingModule,
            ],
            providers: [
                {
                    provide: AppConfigService,
                    useValue: appInitSpy,
                },
                MockProvider(AppLoggingService),
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

        (
            dspConnSpy.admin
                .groupsEndpoint as jasmine.SpyObj<GroupsEndpointAdmin>
        ).getGroups.and.callFake(() => {
            const response = new GroupsResponse();

            const projectResponse = MockProjects.mockProject();

            let storedProject = new StoredProject();
            storedProject = projectResponse.body.project;

            const group = new ReadGroup();
            group.id = 'http://rdfh.ch/groups/00FF/01234';
            group.name = 'test group';
            group.project = storedProject;

            const groups = [group];

            response.groups = groups;

            return of(
                ApiResponseData.fromAjaxResponse({ response } as AjaxResponse)
            );
        });
        fixture = TestBed.createComponent(TestHostHeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // todo: check if we get the list of groups
});
