import { OverlayContainer } from '@angular/cdk/overlay';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiResponseData, DeleteListResponse, ListNodeInfo, ListsEndpointAdmin, ListsResponse, MockProjects, ProjectResponse, ProjectsEndpointAdmin, ReadProject } from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { AppInitService } from 'src/app/app-init.service';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { DialogHeaderComponent } from 'src/app/main/dialog/dialog-header/dialog-header.component';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { StringifyStringLiteralPipe } from 'src/app/main/pipes/string-transformation/stringify-string-literal.pipe';
import { TruncatePipe } from 'src/app/main/pipes/string-transformation/truncate.pipe';
import { Session, SessionService } from 'src/app/main/services/session.service';
import { TestConfig } from 'test.config';
import { ListComponent } from './list.component';

/**
 * test Host Component
 */
@Component({
    template: '<app-list #listComponent></app-list>'
})
class TestHostComponent {
    @ViewChild('listComponent') listComponent: ListComponent;
}

/**
 * mock ListItem.
 */
@Component({
    template: '<app-list-item></app-list-item>'
})
class MockListItemComponent { }

/**
 * mock ListItemForm.
 */
@Component({
    template: '<app-list-item-form></app-list-item-form>'
})
class MockListItemFormComponent { }

describe('ListComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let rootLoader: HarnessLoader;
    let overlayContainer: OverlayContainer;

    const appInitSpy = {
        dspAppConfig: {
            iriBase: 'http://rdfh.ch'
        }
    };

    beforeEach(waitForAsync(() => {

        const dspConnSpyObj = {
            admin: {
                listsEndpoint: jasmine.createSpyObj('listsEndpoint', ['getListsInProject', 'deleteListNode']),
                projectsEndpoint: jasmine.createSpyObj('projectsEndpoint', ['getProjectByIri'])
            }
        };

        const sessionServiceSpy = jasmine.createSpyObj('SessionService', ['getSession']);

        const cacheServiceSpy = jasmine.createSpyObj('CacheService', ['get']);

        const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);

        TestBed.configureTestingModule({
            declarations: [
                ListComponent,
                TestHostComponent,
                MockListItemComponent,
                MockListItemFormComponent,
                DialogComponent,
                DialogHeaderComponent,
                StringifyStringLiteralPipe,
                TruncatePipe
            ],
            imports: [
                BrowserAnimationsModule,
                MatButtonModule,
                MatDialogModule,
                MatIconModule,
                MatSelectModule,
                MatSnackBarModule,
                MatToolbarModule,
                MatTooltipModule,
                ReactiveFormsModule,
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
                                }
                            }),
                            snapshot: {
                                url: [
                                    { path: 'project' }
                                ]
                            }
                        },
                        params: of(
                            { list: 'mockList01' },
                        ),
                        snapshot: {
                            params: [
                                { id: 'http://rdfh.ch/lists/0001/mockList01' }
                            ]
                        }
                    }
                },
                {
                    provide: AppInitService,
                    useValue: appInitSpy
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: dspConnSpyObj
                },
                {
                    provide: SessionService,
                    useValue: sessionServiceSpy
                },
                {
                    provide: CacheService,
                    useValue: cacheServiceSpy
                },
                {
                    provide: Router,
                    useValue: routerSpy
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {}
                },
                {
                    provide: MatDialogRef,
                    useValue: {}
                }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents();
    }));

    afterEach(async () => {
        const dialogs = await rootLoader.getAllHarnesses(MatDialogHarness);
        await Promise.all(dialogs.map(async d => await d.close()));

        // angular won't call this for us so we need to do it ourselves to avoid leaks.
        overlayContainer.ngOnDestroy();
    });

    describe('Displaying lists', () => {
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

            // mock router
            const routerSpy = TestBed.inject(Router);

            (routerSpy as jasmine.SpyObj<Router>).navigate.and.stub();
            (routerSpy as jasmine.SpyObj<Router>).navigateByUrl.and.stub();

            // mock lists endpoint
            const dspConnSpy = TestBed.inject(DspApiConnectionToken);

            (dspConnSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>).getListsInProject.and.callFake(
                () => {
                    const response = new ListsResponse();

                    response.lists = new Array<ListNodeInfo>();

                    const mockList1 = new ListNodeInfo();
                    mockList1.comments = [];
                    mockList1.id = 'http://rdfh.ch/lists/0001/mockList01';
                    mockList1.isRootNode = true;
                    mockList1.labels = [{ language: 'en', value: 'Mock List 01' }];
                    mockList1.projectIri = 'http://rdfh.ch/projects/myProjectIri';

                    const mockList2 = new ListNodeInfo();
                    mockList2.comments = [];
                    mockList2.id = 'http://rdfh.ch/lists/0001/mockList02';
                    mockList2.isRootNode = true;
                    mockList2.labels = [{ language: 'en', value: 'Mock List 02' }];
                    mockList2.projectIri = 'http://rdfh.ch/projects/myProjectIri';

                    response.lists.push(mockList1, mockList2);

                    return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
                }
            );

            testHostFixture = TestBed.createComponent(TestHostComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            overlayContainer = TestBed.inject(OverlayContainer);
            rootLoader = TestbedHarnessEnvironment.documentRootLoader(testHostFixture);

            // mock projects endpoint
            (dspConnSpy.admin.projectsEndpoint as jasmine.SpyObj<ProjectsEndpointAdmin>).getProjectByIri.and.callFake(
                () => {
                    const response = new ProjectResponse();

                    const mockProjects = MockProjects.mockProjects();

                    response.project = mockProjects.body.projects[0];

                    return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
                }
            );

            expect(testHostComponent.listComponent.session).toBeTruthy();
            expect(testHostComponent).toBeTruthy();
        });

        it('should get the project', () => {
            const mockProject = MockProjects.mockProjects().body.projects[0];

            expect(testHostComponent.listComponent.project).toEqual(mockProject);
        });

        it('should initialize the list of lists', () => {
            const listOfLists = new Array<ListNodeInfo>();

            const list1 = new ListNodeInfo();
            list1.comments = [];
            list1.id = 'http://rdfh.ch/lists/0001/mockList01';
            list1.isRootNode = true;
            list1.labels = [{ language: 'en', value: 'Mock List 01' }];
            list1.projectIri = 'http://rdfh.ch/projects/myProjectIri';

            const list2 = new ListNodeInfo();
            list2.comments = [];
            list2.id = 'http://rdfh.ch/lists/0001/mockList02';
            list2.isRootNode = true;
            list2.labels = [{ language: 'en', value: 'Mock List 02' }];
            list2.projectIri = 'http://rdfh.ch/projects/myProjectIri';

            listOfLists.push(list1, list2);

            expect(testHostComponent.listComponent.lists).toEqual(listOfLists);
        });

        it('should open a list', async () => {
            const select = await rootLoader.getHarness(MatSelectHarness);

            await select.open();

            const options = await select.getOptions({ text: 'Mock List 01 (en)' });

            expect(options.length).toEqual(1);

            await options[0].click();

            expect(testHostComponent.listComponent.list.id).toEqual('http://rdfh.ch/lists/0001/mockList01');
        });
    });

    describe('Delete list with lists remaining after deletion', () => {
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

            // mock router
            const routerSpy = TestBed.inject(Router);

            (routerSpy as jasmine.SpyObj<Router>).navigate.and.stub();
            (routerSpy as jasmine.SpyObj<Router>).navigateByUrl.and.stub();

            // mock lists endpoint
            const dspConnSpy = TestBed.inject(DspApiConnectionToken);

            (dspConnSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>).getListsInProject.and.callFake(
                () => {
                    const response = new ListsResponse();

                    response.lists = new Array<ListNodeInfo>();

                    const mockList1 = new ListNodeInfo();
                    mockList1.comments = [];
                    mockList1.id = 'http://rdfh.ch/lists/0001/mockList01';
                    mockList1.isRootNode = true;
                    mockList1.labels = [{ language: 'en', value: 'Mock List 01' }];
                    mockList1.projectIri = 'http://rdfh.ch/projects/myProjectIri';

                    const mockList2 = new ListNodeInfo();
                    mockList2.comments = [];
                    mockList2.id = 'http://rdfh.ch/lists/0001/mockList02';
                    mockList2.isRootNode = true;
                    mockList2.labels = [{ language: 'en', value: 'Mock List 02' }];
                    mockList2.projectIri = 'http://rdfh.ch/projects/myProjectIri';

                    response.lists.push(mockList1, mockList2);

                    return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
                }
            );

            testHostFixture = TestBed.createComponent(TestHostComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            overlayContainer = TestBed.inject(OverlayContainer);
            rootLoader = TestbedHarnessEnvironment.documentRootLoader(testHostFixture);

            // mock projects endpoint
            (dspConnSpy.admin.projectsEndpoint as jasmine.SpyObj<ProjectsEndpointAdmin>).getProjectByIri.and.callFake(
                () => {
                    const response = new ProjectResponse();

                    const mockProjects = MockProjects.mockProjects();

                    response.project = mockProjects.body.projects[0];

                    return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
                }
            );

            expect(testHostComponent.listComponent.session).toBeTruthy();
            expect(testHostComponent).toBeTruthy();
        });

        it('should delete a root node and the first of the remaining lists should be shown', async () => {
            const deleteListResponse: DeleteListResponse = new DeleteListResponse();
            deleteListResponse.deleted = true;
            deleteListResponse.iri = 'http://rdfh.ch/lists/0001/mockList01';

            const listSpy = TestBed.inject(DspApiConnectionToken);

            // mock delete list root node response
            (listSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>).deleteListNode.and.callFake(
                () => {
                    const response = deleteListResponse;

                    return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
                }
            );

            // mock the call to the API again because we call the API again after deletion to get the lists
            // therefore the mock call in the BeforeEach method above will not work since it returns two lists
            // after deletion, we should only have one list
            (listSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>).getListsInProject.and.callFake(
                () => {
                    const response = new ListsResponse();

                    response.lists = new Array<ListNodeInfo>();

                    const mockList2 = new ListNodeInfo();
                    mockList2.comments = [];
                    mockList2.id = 'http://rdfh.ch/lists/0001/mockList02';
                    mockList2.isRootNode = true;
                    mockList2.labels = [{ language: 'en', value: 'Mock List 02' }];
                    mockList2.projectIri = 'http://rdfh.ch/projects/myProjectIri';

                    response.lists.push(mockList2);

                    return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
                }
            );

            // open first list among lists
            const select = await rootLoader.getHarness(MatSelectHarness);

            await select.open();

            const options = await select.getOptions({ text: 'Mock List 01 (en)' });

            expect(options.length).toEqual(1);

            await options[0].click();

            // click delete button
            const deleteButton = await rootLoader.getHarness(MatButtonHarness.with({ selector: '.delete' }));
            await deleteButton.click();

            // get dialog harness
            const dialogHarnesses = await rootLoader.getAllHarnesses(MatDialogHarness);

            expect(dialogHarnesses.length).toEqual(1);

            // click confirm button
            const confirmButton = await rootLoader.getHarness(MatButtonHarness.with({ selector: '.confirm-button' }));

            await confirmButton.click();

            testHostFixture.whenStable().then(() => {
                expect(listSpy.admin.listsEndpoint.deleteListNode).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/mockList01');
                expect(listSpy.admin.listsEndpoint.deleteListNode).toHaveBeenCalledTimes(1);

                expect(testHostComponent.listComponent.lists.length).toEqual(1);
                expect(testHostComponent.listComponent.lists[0].id).toEqual('http://rdfh.ch/lists/0001/mockList02');

                expect(testHostComponent.listComponent.listIri).toEqual(testHostComponent.listComponent.lists[0].id);
            });
        });
    });

    describe('Delete list with no lists remaining after deletion', () => {
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

            // mock router
            const routerSpy = TestBed.inject(Router);

            (routerSpy as jasmine.SpyObj<Router>).navigate.and.stub();
            (routerSpy as jasmine.SpyObj<Router>).navigateByUrl.and.stub();

            // mock lists endpoint
            const dspConnSpy = TestBed.inject(DspApiConnectionToken);

            (dspConnSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>).getListsInProject.and.callFake(
                () => {
                    const response = new ListsResponse();

                    response.lists = new Array<ListNodeInfo>();

                    const mockList1 = new ListNodeInfo();
                    mockList1.comments = [];
                    mockList1.id = 'http://rdfh.ch/lists/0001/mockList01';
                    mockList1.isRootNode = true;
                    mockList1.labels = [{ language: 'en', value: 'Mock List 01' }];
                    mockList1.projectIri = 'http://rdfh.ch/projects/myProjectIri';

                    response.lists.push(mockList1);

                    return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
                }
            );

            testHostFixture = TestBed.createComponent(TestHostComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            overlayContainer = TestBed.inject(OverlayContainer);
            rootLoader = TestbedHarnessEnvironment.documentRootLoader(testHostFixture);

            // mock projects endpoint
            (dspConnSpy.admin.projectsEndpoint as jasmine.SpyObj<ProjectsEndpointAdmin>).getProjectByIri.and.callFake(
                () => {
                    const response = new ProjectResponse();

                    const mockProjects = MockProjects.mockProjects();

                    response.project = mockProjects.body.projects[0];

                    return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
                }
            );

            expect(testHostComponent.listComponent.session).toBeTruthy();
            expect(testHostComponent).toBeTruthy();
        });

        it('should delete a root node and no list should be shown', async () => {
            const deleteListResponse: DeleteListResponse = new DeleteListResponse();
            deleteListResponse.deleted = true;
            deleteListResponse.iri = 'http://rdfh.ch/lists/0001/mockList01';

            const listSpy = TestBed.inject(DspApiConnectionToken);

            // mock delete list root node response
            (listSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>).deleteListNode.and.callFake(
                () => {
                    const response = deleteListResponse;

                    return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
                }
            );

            // mock the call to the API again because we call the API again after deletion to get the lists
            // therefore the mock call in the BeforeEach method above will not work since it returns two lists
            // after deletion, we should only have NO lists remaining
            (listSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>).getListsInProject.and.callFake(
                () => {
                    const response = new ListsResponse();

                    response.lists = new Array<ListNodeInfo>();

                    return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
                }
            );

            // open first list among lists
            const select = await rootLoader.getHarness(MatSelectHarness);

            await select.open();

            const options = await select.getOptions({ text: 'Mock List 01 (en)' });

            expect(options.length).toEqual(1);

            await options[0].click();

            // click delete button
            const deleteButton = await rootLoader.getHarness(MatButtonHarness.with({ selector: '.delete' }));
            await deleteButton.click();

            // get dialog harness
            const dialogHarnesses = await rootLoader.getAllHarnesses(MatDialogHarness);

            expect(dialogHarnesses.length).toEqual(1);

            // click confirm button
            const confirmButton = await rootLoader.getHarness(MatButtonHarness.with({ selector: '.confirm-button' }));

            await confirmButton.click();

            testHostFixture.whenStable().then(() => {
                expect(listSpy.admin.listsEndpoint.deleteListNode).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/mockList01');
                expect(listSpy.admin.listsEndpoint.deleteListNode).toHaveBeenCalledTimes(1);

                expect(testHostComponent.listComponent.lists.length).toEqual(0);

                expect(testHostComponent.listComponent.list).toBeNull();
                expect(testHostComponent.listComponent.listIri).toBeUndefined();
            });
        });
    });

});
