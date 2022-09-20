import { OverlayContainer } from '@angular/cdk/overlay';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, OnInit, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    ApiResponseData,
    DeleteListNodeResponse,
    ListsEndpointAdmin, MockProjects,
    ProjectResponse, ReadProject,
    StringLiteral
} from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { DialogHeaderComponent } from 'src/app/main/dialog/dialog-header/dialog-header.component';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { StringifyStringLiteralPipe } from 'src/app/main/pipes/string-transformation/stringify-string-literal.pipe';
import { TruncatePipe } from 'src/app/main/pipes/string-transformation/truncate.pipe';
import { ListItemFormComponent, ListNodeOperation } from './list-item-form.component';
import { Session, SessionService } from '../../../main/services/session.service';
import { CacheService } from '../../../main/cache/cache.service';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
    <app-list-item-form
        #listItemForm
        [iri]="iri"
        [language]="language"
        (refreshParent)="updateView($event)"
        [projectIri]="projectIri"
        [projectCode]="projectCode"
        [projectStatus]="true"
        [labels]="labels">
    </app-list-item-form>`
})
class TestHostComponent implements OnInit {

    @ViewChild('listItemForm') listItemForm: ListItemFormComponent;

    iri = 'http://rdfh.ch/lists/0001/notUsedList01';

    language = 'en';

    projectIri = 'http://rdfh.ch/projects/0001';

    projectCode = '0001';

    labels: StringLiteral[];

    constructor() {}

    ngOnInit() {
        this.labels = [
            {
                value: 'node 1',
                language: 'en'
            }
        ];
    }

}

describe('ListItemFormComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let rootLoader: HarnessLoader;
    let overlayContainer: OverlayContainer;

    beforeEach(waitForAsync(() => {

        const listsEndpointSpyObj = {
            admin: {
                listsEndpoint: jasmine.createSpyObj('listsEndpoint', ['deleteListNode'])
            }
        };

        const sessionServiceSpy = jasmine.createSpyObj('SessionService', ['getSession']);

        const cacheServiceSpy = jasmine.createSpyObj('CacheService', ['get']);

        TestBed.configureTestingModule({
            declarations: [
                ListItemFormComponent,
                TestHostComponent,
                DialogComponent,
                DialogHeaderComponent,
                StringifyStringLiteralPipe,
                TruncatePipe
            ],
            imports: [
                BrowserAnimationsModule,
                MatIconModule,
                MatDialogModule,
                MatButtonModule,
                MatSnackBarModule,
                TranslateModule.forRoot()
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: listsEndpointSpyObj
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {}
                },
                {
                    provide: MatDialogRef,
                    useValue: {}
                },
                {
                    provide: SessionService,
                    useValue: sessionServiceSpy
                },
                {
                    provide: CacheService,
                    useValue: cacheServiceSpy
                }
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        // mock session service
        const sessionSpy = TestBed.inject(SessionService);

        (sessionSpy as jasmine.SpyObj<SessionService>).getSession.and.callFake(
            () => {
                const session: Session = {
                    id: 12345,
                    user: {
                        name: 'username',
                        jwt: 'myToken',
                        lang: 'en',
                        sysAdmin: true,
                        projectAdmin: []
                    }
                };

                return session;
            }
        );

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

        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();

        testHostComponent.listItemForm.showActionBubble = true;
        testHostFixture.detectChanges();

        overlayContainer = TestBed.inject(OverlayContainer);
        rootLoader = TestbedHarnessEnvironment.documentRootLoader(testHostFixture);
    });

    afterEach(async () => {
        const dialogs = await rootLoader.getAllHarnesses(MatDialogHarness);
        await Promise.all(dialogs.map(async d => await d.close()));

        // angular won't call this for us so we need to do it ourselves to avoid leaks.
        overlayContainer.ngOnDestroy();
    });

    it('should show a dialog box when the delete button is clicked', async () => {

        const deleteListNodeResponse: DeleteListNodeResponse = new DeleteListNodeResponse();
        deleteListNodeResponse.node.children = [];
        deleteListNodeResponse.node.id = 'http://rdfh.ch/lists/0001/notUsedList';
        deleteListNodeResponse.node.isRootNode = true;
        deleteListNodeResponse.node.name = 'notUsedList';
        deleteListNodeResponse.node.projectIri = 'http://rdfh.ch/projects/0001';

        const listSpy = TestBed.inject(DspApiConnectionToken);

        (listSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>).deleteListNode.and.callFake(
            () => {

                const response = deleteListNodeResponse;

                return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
            }
        );

        spyOn(testHostComponent.listItemForm.refreshParent, 'emit');

        const deleteButton = await rootLoader.getHarness(MatButtonHarness.with({ selector: '.delete' }));
        await deleteButton.click();

        const dialogHarnesses = await rootLoader.getAllHarnesses(MatDialogHarness);

        expect(dialogHarnesses.length).toEqual(1);

        const confirmButton = await rootLoader.getHarness(MatButtonHarness.with({ selector: '.confirm-button' }));

        await confirmButton.click();

        const listNodeOperation: ListNodeOperation = new ListNodeOperation();
        listNodeOperation.listNode = deleteListNodeResponse.node;
        listNodeOperation.operation = 'delete';

        testHostFixture.whenStable().then(() => {
            expect(listSpy.admin.listsEndpoint.deleteListNode).toHaveBeenCalledWith(testHostComponent.iri);
            expect(listSpy.admin.listsEndpoint.deleteListNode).toHaveBeenCalledTimes(1);

            expect(testHostComponent.listItemForm.refreshParent.emit).toHaveBeenCalledWith(listNodeOperation);
            expect(testHostComponent.listItemForm.refreshParent.emit).toHaveBeenCalledTimes(1);
        });

    });
});
