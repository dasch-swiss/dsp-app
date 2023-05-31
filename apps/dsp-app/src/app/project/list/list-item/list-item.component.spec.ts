import {
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    OnInit,
    ViewChild,
} from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    ApiResponseData,
    ListNode,
    ListNodeInfo,
    ListResponse,
    ListsEndpointAdmin,
    MockProjects,
    ProjectResponse,
    ReadProject,
    RepositionChildNodeResponse,
} from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { ListNodeOperation } from '../list-item-form/list-item-form.component';
import { ListItemComponent } from './list-item.component';
import {
    Session,
    SessionService,
} from '../../../main/services/session.service';
import { CacheService } from '../../../main/cache/cache.service';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-list-item
        #listItem
        [list]="list"
        [parentIri]="parentIri"
        [projectIri]="projectIri"
        [projectUuid]="projectUuid"
    >
    </app-list-item>`,
})
class TestHostComponent implements OnInit {
    @ViewChild('listItem') listItem: ListItemComponent;

    list: ListNodeInfo[];

    parentIri = 'http://rdfh.ch/lists/0001/otherTreeList';

    projectIri = 'http://rdfh.ch/projects/0001';

    projectUuid = '0001';

    constructor() {}

    ngOnInit() {
        this.list = [
            {
                comments: [],
                id: 'http://rdfh.ch/lists/0001/otherTreeList',
                labels: [{ value: 'Tree List Node', language: 'en' }],
                isRootNode: true,
            },
        ];
    }
}

/**
 * mock ListItemForm.
 */
@Component({
    template: '<app-list-item-form></app-list-item-form>',
})
class MockListItemFormComponent {}

describe('ListItemComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(waitForAsync(() => {
        const listsEndpointSpyObj = {
            admin: {
                listsEndpoint: jasmine.createSpyObj('listsEndpoint', [
                    'getList',
                    'repositionChildNode',
                ]),
            },
        };

        const sessionServiceSpy = jasmine.createSpyObj('SessionService', [
            'getSession',
        ]);

        const cacheServiceSpy = jasmine.createSpyObj('CacheService', ['get']);

        TestBed.configureTestingModule({
            declarations: [
                ListItemComponent,
                MockListItemFormComponent,
                TestHostComponent,
            ],
            imports: [
                BrowserAnimationsModule,
                MatDialogModule,
                MatIconModule,
                MatSnackBarModule,
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: listsEndpointSpyObj,
                },
                {
                    provide: SessionService,
                    useValue: sessionServiceSpy,
                },
                {
                    provide: CacheService,
                    useValue: cacheServiceSpy,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
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
                        projectAdmin: [],
                    },
                };

                return session;
            }
        );

        // mock cache service
        const cacheSpy = TestBed.inject(CacheService);

        (cacheSpy as jasmine.SpyObj<CacheService>).get.and.callFake(() => {
            const response: ProjectResponse = new ProjectResponse();

            const mockProjects = MockProjects.mockProjects();

            response.project = mockProjects.body.projects[0];

            return of(response.project as ReadProject);
        });

        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (
            dspConnSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>
        ).getList.and.callFake(() => {
            const response = new ListResponse();
            response.list.listinfo.id =
                'http://rdfh.ch/lists/0001/otherTreeList';
            response.list.listinfo.isRootNode = true;
            response.list.listinfo.labels = [
                { value: 'Tree List Node Root', language: 'en' },
            ];
            response.list.children = [
                {
                    comments: [],
                    labels: [{ value: 'Tree List Node 01', language: 'en' }],
                    id: 'http://rdfh.ch/lists/0001/otherTreeList01',
                    children: [
                        {
                            comments: [],
                            labels: [
                                { value: 'Tree List Node 03', language: 'en' },
                            ],
                            id: 'http://rdfh.ch/lists/0001/otherTreeList03',
                            children: [],
                        },
                    ],
                },
                {
                    comments: [],
                    labels: [{ value: 'Tree List Node 02', language: 'en' }],
                    id: 'http://rdfh.ch/lists/0001/otherTreeList02',
                    children: [],
                },
            ];
            return of(
                ApiResponseData.fromAjaxResponse({ response } as AjaxResponse)
            );
        });

        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.listItem.list.length).toEqual(2);
    });

    it('should update the view to show a newly created node', () => {
        const listNodeOperation: ListNodeOperation = new ListNodeOperation();
        listNodeOperation.listNode = {
            children: [],
            comments: [],
            hasRootNode: 'http://rdfh.ch/lists/0001/otherTreeList',
            id: 'http://rdfh.ch/lists/0001/otherTreeList04',
            labels: [{ value: 'Tree List Node 04', language: 'en' }],
        };
        listNodeOperation.operation = 'create';

        testHostComponent.listItem.updateView(listNodeOperation);

        expect(testHostComponent.listItem.list.length).toEqual(3);
    });

    it('should update the view to show an updated node', () => {
        const listNodeOperation: ListNodeOperation = new ListNodeOperation();
        listNodeOperation.listNode = {
            children: undefined,
            comments: [],
            hasRootNode: 'http://rdfh.ch/lists/0001/otherTreeList',
            id: 'http://rdfh.ch/lists/0001/otherTreeList01',
            labels: [{ value: 'Tree List Node 0123', language: 'en' }],
            position: 0,
        };
        listNodeOperation.operation = 'update';

        testHostComponent.listItem.updateView(listNodeOperation);

        expect(testHostComponent.listItem.list.length).toEqual(2);

        expect(testHostComponent.listItem.list[0].labels).toEqual([
            { value: 'Tree List Node 0123', language: 'en' },
        ]);
    });

    it('should update the view to show an inserted node', () => {
        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (
            dspConnSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>
        ).getList.and.callFake(() => {
            const response = new ListResponse();
            response.list.listinfo.id =
                'http://rdfh.ch/lists/0001/otherTreeList';
            response.list.listinfo.isRootNode = true;
            response.list.listinfo.labels = [
                { value: 'Tree List Node Root', language: 'en' },
            ];
            response.list.children = [
                {
                    comments: [],
                    labels: [{ value: 'Tree List Node 01', language: 'en' }],
                    id: 'http://rdfh.ch/lists/0001/otherTreeList01',
                    children: [
                        {
                            comments: [],
                            labels: [
                                { value: 'Tree List Node 03', language: 'en' },
                            ],
                            id: 'http://rdfh.ch/lists/0001/otherTreeList03',
                            children: [],
                        },
                    ],
                },
                {
                    comments: [],
                    labels: [
                        {
                            value: 'Tree List Node 04 between node 01 and node 02',
                            language: 'en',
                        },
                    ],
                    id: 'http://rdfh.ch/lists/0001/otherTreeList04',
                    children: [],
                },
                {
                    comments: [],
                    labels: [{ value: 'Tree List Node 02', language: 'en' }],
                    id: 'http://rdfh.ch/lists/0001/otherTreeList02',
                    children: [],
                },
            ];
            return of(
                ApiResponseData.fromAjaxResponse({ response } as AjaxResponse)
            );
        });

        const listNodeOperation: ListNodeOperation = new ListNodeOperation();
        listNodeOperation.listNode = {
            children: undefined,
            comments: [],
            hasRootNode: 'http://rdfh.ch/lists/0001/otherTreeList',
            id: 'http://rdfh.ch/lists/0001/otherTreeList04',
            labels: [
                {
                    value: 'Tree List Node 04 between node 01 and node 02',
                    language: 'en',
                },
            ],
            position: 1,
        };

        listNodeOperation.operation = 'insert';

        testHostComponent.listItem.updateView(listNodeOperation);

        expect(testHostComponent.listItem.list.length).toEqual(3);

        expect(testHostComponent.listItem.list[1].labels).toEqual([
            {
                value: 'Tree List Node 04 between node 01 and node 02',
                language: 'en',
            },
        ]);

        expect(dspConnSpy.admin.listsEndpoint.getList).toHaveBeenCalledWith(
            testHostComponent.parentIri
        );

        // getList is called twice because it is also called in ngOnInit
        expect(dspConnSpy.admin.listsEndpoint.getList).toHaveBeenCalledTimes(2);
    });

    it('should update the view to remove a deleted node', () => {
        const listNodeOperation: ListNodeOperation = new ListNodeOperation();
        listNodeOperation.listNode = {
            children: [
                {
                    comments: [],
                    labels: [{ value: 'Tree List Node 02', language: 'en' }],
                    id: 'http://rdfh.ch/lists/0001/otherTreeList02',
                    children: [],
                },
            ],
            comments: [],
            isRootNode: true,
            id: 'http://rdfh.ch/lists/0001/otherTreeList01',
            labels: [{ value: 'Tree List Root', language: 'en' }],
            projectIri: 'http://rdfh.ch/projects/0001',
        };
        listNodeOperation.operation = 'delete';

        testHostComponent.listItem.updateView(listNodeOperation);

        expect(testHostComponent.listItem.list.length).toEqual(1);

        expect(testHostComponent.listItem.list[0].labels).toEqual([
            { value: 'Tree List Node 02', language: 'en' },
        ]);
    });

    it('should reposition the node in position 1 to position 0', () => {
        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (
            dspConnSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>
        ).repositionChildNode.and.callFake(() => {
            const response = new RepositionChildNodeResponse();
            response.node.id = 'http://rdfh.ch/lists/0001/otherTreeList';
            response.node.isRootNode = true;
            response.node.labels = [
                { value: 'Tree List Node Root', language: 'en' },
            ];
            response.node.children = [
                {
                    comments: [],
                    labels: [{ value: 'Tree List Node 02', language: 'en' }],
                    id: 'http://rdfh.ch/lists/0001/otherTreeList02',
                    children: [],
                    position: 0,
                },
                {
                    comments: [],
                    labels: [{ value: 'Tree List Node 01', language: 'en' }],
                    id: 'http://rdfh.ch/lists/0001/otherTreeList01',
                    children: [
                        {
                            comments: [],
                            labels: [
                                { value: 'Tree List Node 03', language: 'en' },
                            ],
                            id: 'http://rdfh.ch/lists/0001/otherTreeList03',
                            children: [],
                        },
                    ],
                    position: 1,
                },
            ];
            return of(
                ApiResponseData.fromAjaxResponse({ response } as AjaxResponse)
            );
        });

        expect(testHostComponent.listItem.list[1].id).toEqual(
            'http://rdfh.ch/lists/0001/otherTreeList02'
        );

        const listNodeOperation: ListNodeOperation = new ListNodeOperation();
        listNodeOperation.listNode = new ListNode();
        listNodeOperation.listNode.position = 0;
        listNodeOperation.operation = 'reposition';

        testHostComponent.listItem.updateView(listNodeOperation);

        expect(testHostComponent.listItem.list.length).toEqual(2);

        expect(testHostComponent.listItem.list[0].id).toEqual(
            'http://rdfh.ch/lists/0001/otherTreeList02'
        );
    });
});
