import { Component, DebugElement, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    ApiResponseData,
    CreateChildNodeRequest,
    DeleteChildNodeCommentsResponse,
    ListNodeInfoResponse,
    ListsEndpointAdmin,
    MockProjects,
    ProjectResponse,
    ReadProject,
    UpdateChildNodeRequest
} from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { AppInitService } from 'src/app/app-init.service';
import { ProgressIndicatorComponent } from 'src/app/main/action/progress-indicator/progress-indicator.component';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { ProjectService } from 'src/app/workspace/resource/services/project.service';
import { EditListItemComponent } from './edit-list-item.component';

/**
 * test host component to simulate parent component for updating an existing child node.
 */
@Component({
    template: '<app-edit-list-item #editListItem [iri]="iri" [mode]="mode" [projectIri]="projectIri"></app-edit-list-item>'
})
class TestHostUpdateChildNodeComponent {

    @ViewChild('editListItem') editListItem: EditListItemComponent;

    iri = 'http://rdfh.ch/lists/0001/otherTreeList01';

    mode = 'update';

    projectIri = 'http://rdfh.ch/projects/Lw3FC39BSzCwvmdOaTyLqQ';

    constructor() { }
}

/**
 * test host component to simulate parent component for inserting a new child node.
 */
@Component({
    template: '<app-edit-list-item #editListItem [iri]="iri" [mode]="mode" [parentIri]="parentIri" [position]="position" [projectCode]="projectCode" [projectIri]="projectIri"></app-edit-list-item>'
})
class TestHostInsertChildNodeComponent {

    @ViewChild('editListItem') editListItem: EditListItemComponent;

    iri = 'http://rdfh.ch/lists/0001/otherTreeList01';

    mode = 'insert';

    parentIri = 'http://rdfh.ch/lists/0001/otherTreeList';

    position = 0;

    projectCode = '0001';

    projectIri = 'http://rdfh.ch/projects/Lw3FC39BSzCwvmdOaTyLqQ';

    constructor() { }
}

describe('EditListItemComponent', () => {
    let testHostComponent: TestHostUpdateChildNodeComponent;
    let testHostFixture: ComponentFixture<TestHostUpdateChildNodeComponent>;
    let editListItemComponentDe: DebugElement;
    let formInvalidMessageDe: DebugElement;

    const appInitSpy = {
        dspAppConfig: {
            iriBase: 'http://rdfh.ch'
        }
    };

    beforeEach(waitForAsync(() => {

        const listsEndpointSpyObj = {
            admin: {
                listsEndpoint: jasmine.createSpyObj('listsEndpoint', ['getListNodeInfo', 'updateChildNode', 'createChildNode', 'deleteChildComments'])
            }
        };

        const cacheServiceSpy = jasmine.createSpyObj('CacheService', ['get', 'set']);

        const projectServiceSpy = jasmine.createSpyObj('ProjectService', ['iriToUuid']);

        TestBed.configureTestingModule({
            declarations: [
                EditListItemComponent,
                TestHostUpdateChildNodeComponent,
                TestHostInsertChildNodeComponent,
                ProgressIndicatorComponent,
            ],
            imports: [
                BrowserAnimationsModule,
                MatDialogModule,
                MatSnackBarModule,
                TranslateModule.forRoot()
            ],
            providers: [
                {
                    provide: AppInitService,
                    useValue: appInitSpy
                },
                {
                    provide: ProjectService,
                    useValue: projectServiceSpy
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: listsEndpointSpyObj
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
    });

    describe('update list child node', () => {
        beforeEach(() => {
            const dspConnSpy = TestBed.inject(DspApiConnectionToken);

            (dspConnSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>).getListNodeInfo.and.callFake(
                () => {
                    const response = new ListNodeInfoResponse();
                    response.nodeinfo.id = 'http://rdfh.ch/lists/0001/otherTreeList01';
                    response.nodeinfo.labels = [{ 'value': 'Tree list node 01', 'language': 'en' }];
                    response.nodeinfo.comments = [{ 'value': 'My comment', 'language': 'en' }];
                    return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
                }
            );

            testHostFixture = TestBed.createComponent(TestHostUpdateChildNodeComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();

            const hostCompDe = testHostFixture.debugElement;
            editListItemComponentDe = hostCompDe.query(By.directive(EditListItemComponent));
            expect(editListItemComponentDe).toBeTruthy();
        });

        it('should assign labels and comments', () => {
            const dspConnSpy = TestBed.inject(DspApiConnectionToken);
            expect(testHostComponent.editListItem.labels).toEqual([{ 'value': 'Tree list node 01', 'language': 'en' }]);
            expect(testHostComponent.editListItem.comments).toEqual([{ 'value': 'My comment', 'language': 'en' }]);
            expect(dspConnSpy.admin.listsEndpoint.getListNodeInfo).toHaveBeenCalledTimes(1);
            expect(dspConnSpy.admin.listsEndpoint.getListNodeInfo).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/otherTreeList01');
        });

        it('should update labels when the value changes', () => {
            expect(testHostComponent.editListItem.labels).toEqual([{ 'value': 'Tree list node 01', 'language': 'en' }]);
            testHostComponent.editListItem.handleData([{ 'value': 'Tree list node 01', 'language': 'en' }, { 'value': 'Baumlistenknoten 01', 'language': 'de' }], 'labels');
            expect(testHostComponent.editListItem.labels).toEqual([{ 'value': 'Tree list node 01', 'language': 'en' }, { 'value': 'Baumlistenknoten 01', 'language': 'de' }]);
            expect(testHostComponent.editListItem.saveButtonDisabled).toBeFalsy();
            testHostComponent.editListItem.handleData([], 'labels');
            expect(testHostComponent.editListItem.saveButtonDisabled).toBeTruthy();
            testHostFixture.detectChanges();
            formInvalidMessageDe = editListItemComponentDe.query(By.css('mat-hint.invalid-form'));
            expect(formInvalidMessageDe.nativeElement.innerText).toEqual('A label is required.');
        });

        it('should update comments when the value changes', () => {
            expect(testHostComponent.editListItem.comments).toEqual([{ 'value': 'My comment', 'language': 'en' }]);
            testHostComponent.editListItem.handleData([{ 'value': 'My comment', 'language': 'en' }, { 'value': 'Mein Kommentar', 'language': 'de' }], 'comments');
            expect(testHostComponent.editListItem.comments).toEqual([{ 'value': 'My comment', 'language': 'en' }, { 'value': 'Mein Kommentar', 'language': 'de' }]);
            expect(testHostComponent.editListItem.saveButtonDisabled).toBeFalsy();
            testHostComponent.editListItem.handleData([], 'comments');
            expect(testHostComponent.editListItem.saveButtonDisabled).toBeFalsy();
        });

        it('should update the child node info', () => {
            const dspConnSpy = TestBed.inject(DspApiConnectionToken);

            testHostComponent.editListItem.handleData([{ 'value': 'Tree list node 01', 'language': 'en' }, { 'value': 'Baumlistenknoten 01', 'language': 'de' }], 'labels');
            testHostComponent.editListItem.handleData([{ 'value': 'My comment', 'language': 'en' }, { 'value': 'Mein Kommentar', 'language': 'de' }], 'comments');

            (dspConnSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>).updateChildNode.and.callFake(
                () => {
                    const response = new ListNodeInfoResponse();
                    response.nodeinfo.id = 'http://rdfh.ch/lists/0001/otherTreeList01';
                    response.nodeinfo.labels = [{ 'value': 'Tree list node 01', 'language': 'en' }, { 'value': 'Baumlistenknoten 01', 'language': 'de' }];
                    response.nodeinfo.comments = [{ 'value': 'My comment', 'language': 'en' }, { 'value': 'Mein Kommentar', 'language': 'de' }];

                    expect(testHostComponent.editListItem.labels).toEqual(response.nodeinfo.labels);
                    expect(testHostComponent.editListItem.comments).toEqual(response.nodeinfo.comments);

                    return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
                }
            );

            const updateChildNodeRequest: UpdateChildNodeRequest = new UpdateChildNodeRequest();
            updateChildNodeRequest.projectIri = testHostComponent.editListItem.projectIri;
            updateChildNodeRequest.listIri = testHostComponent.editListItem.iri;
            updateChildNodeRequest.labels = testHostComponent.editListItem.labels;
            updateChildNodeRequest.comments = testHostComponent.editListItem.comments;

            testHostComponent.editListItem.updateChildNode();
            expect(dspConnSpy.admin.listsEndpoint.updateChildNode).toHaveBeenCalledTimes(1);
            expect(dspConnSpy.admin.listsEndpoint.updateChildNode).toHaveBeenCalledWith(updateChildNodeRequest);
        });

        it('should delete the child node comments', () => {
            const dspConnSpy = TestBed.inject(DspApiConnectionToken);

            testHostComponent.editListItem.handleData([{ 'value': 'Tree list node 01', 'language': 'en' }, { 'value': 'Baumlistenknoten 01', 'language': 'de' }], 'labels');
            testHostComponent.editListItem.handleData([], 'comments');

            (dspConnSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>).updateChildNode.and.callFake(
                () => {
                    const response = new ListNodeInfoResponse();
                    response.nodeinfo.id = 'http://rdfh.ch/lists/0001/otherTreeList01';
                    response.nodeinfo.labels = [{ 'value': 'Tree list node 01', 'language': 'en' }, { 'value': 'Baumlistenknoten 01', 'language': 'de' }];
                    response.nodeinfo.comments = [];

                    expect(testHostComponent.editListItem.labels).toEqual(response.nodeinfo.labels);
                    expect(testHostComponent.editListItem.comments.length).toEqual(0);

                    return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
                }
            );

            (dspConnSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>).deleteChildComments.and.callFake(
                () => {
                    const response = new DeleteChildNodeCommentsResponse();
                    response.commentsDeleted = true;
                    response.nodeIri = 'http://rdfh.ch/lists/0001/otherTreeList01';

                    return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
                }
            );

            const updateChildNodeRequest: UpdateChildNodeRequest = new UpdateChildNodeRequest();
            updateChildNodeRequest.projectIri = testHostComponent.editListItem.projectIri;
            updateChildNodeRequest.listIri = testHostComponent.editListItem.iri;
            updateChildNodeRequest.labels = testHostComponent.editListItem.labels;
            updateChildNodeRequest.comments = undefined;

            testHostComponent.editListItem.updateChildNode();
            expect(dspConnSpy.admin.listsEndpoint.updateChildNode).toHaveBeenCalledTimes(1);
            expect(dspConnSpy.admin.listsEndpoint.updateChildNode).toHaveBeenCalledWith(updateChildNodeRequest);

            expect(dspConnSpy.admin.listsEndpoint.deleteChildComments).toHaveBeenCalledTimes(1);
            expect(dspConnSpy.admin.listsEndpoint.deleteChildComments).toHaveBeenCalledWith(updateChildNodeRequest.listIri);
        });
    });

    describe('insert list child node', () => {
        beforeEach(() => {
            testHostFixture = TestBed.createComponent(TestHostInsertChildNodeComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();

            const hostCompDe = testHostFixture.debugElement;
            editListItemComponentDe = hostCompDe.query(By.directive(EditListItemComponent));
            expect(editListItemComponentDe).toBeTruthy();

            const projectServiceSpy = TestBed.inject(ProjectService);

            (projectServiceSpy as jasmine.SpyObj<ProjectService>).iriToUuid.and.callFake(
                (iri: string) => 'Lw3FC39BSzCwvmdOaTyLqQ'
            );
        });

        it('should instantiate empty arrays for labels and comments', () => {
            expect(testHostComponent.editListItem.labels).toEqual([]);
            expect(testHostComponent.editListItem.comments).toEqual([]);
        });

        it('should create (insert) a new child node', () => {
            const dspConnSpy = TestBed.inject(DspApiConnectionToken);

            testHostComponent.editListItem.handleData([{ 'value': 'My new child node value', 'language': 'en' }], 'labels');
            testHostComponent.editListItem.handleData([{ 'value': 'My new child node comment', 'language': 'en' }], 'comments');

            (dspConnSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>).createChildNode.and.callFake(
                () => {
                    const response = new ListNodeInfoResponse();
                    response.nodeinfo.name = 'My new child node';
                    response.nodeinfo.id = 'http://rdfh.ch/lists/0001/otherTreeList0123';
                    response.nodeinfo.labels = [{ 'value': 'My new child node value', 'language': 'en' }];
                    response.nodeinfo.comments = [{ 'value': 'My new child node comment', 'language': 'en' }];
                    response.nodeinfo.position = 0;

                    expect(testHostComponent.editListItem.labels).toEqual(response.nodeinfo.labels);
                    expect(testHostComponent.editListItem.comments).toEqual(response.nodeinfo.comments);
                    expect(testHostComponent.editListItem.position).toEqual(response.nodeinfo.position);

                    return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
                }
            );

            const createChildNodeRequest: CreateChildNodeRequest = new CreateChildNodeRequest();
            createChildNodeRequest.projectIri = testHostComponent.editListItem.projectIri;
            createChildNodeRequest.labels = testHostComponent.editListItem.labels;
            createChildNodeRequest.comments = testHostComponent.editListItem.comments;
            createChildNodeRequest.position = testHostComponent.editListItem.position;
            createChildNodeRequest.parentNodeIri = testHostComponent.editListItem.parentIri;

            testHostComponent.editListItem.insertChildNode();
            expect(dspConnSpy.admin.listsEndpoint.createChildNode).toHaveBeenCalledTimes(1);
        });
    });
});
