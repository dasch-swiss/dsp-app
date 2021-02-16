import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, resolveForwardRef, ViewChild } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ApiResponseData, ListNode, ListNodeInfo, ListResponse, ListsEndpointAdmin, StringLiteral } from '@dasch-swiss/dsp-js';
import {
    DspActionModule,
    DspApiConnectionToken
} from '@dasch-swiss/dsp-ui';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { ErrorComponent } from 'src/app/main/error/error.component';
import { ListItemFormComponent, ListNodeOperation } from '../list-item-form/list-item-form.component';
import { ListItemComponent } from './list-item.component';

/**
 * Test host component to simulate parent component.
 */
@Component({
    template: `
    <app-list-item
        #listItem
        [list]="list"
        [parentIri]="parentIri"
        [projectIri]="projectIri"
        [projectcode]="projectCode">
    </app-list-item>`
})
class TestHostComponent implements OnInit {

    @ViewChild('listItem') listItem: ListItemComponent;

    list: ListNodeInfo[];

    parentIri = 'http://rdfh.ch/lists/0001/otherTreeList';

    projectIri = 'http://rdfh.ch/projects/0001';

    projectCode = '0001';

    constructor() {}

    ngOnInit() {
        this.list = [
            {
                comments: [],
                id: 'http://rdfh.ch/lists/0001/otherTreeList',
                labels: [{value: 'Tree List Node', language: 'en'}],
                isRootNode: true
            }
        ];
    }

}

/**
 * Mock ListItemForm.
 */
@Component({
    template: `<app-list-item-form></app-list-item-form>`
})
class MockListItemFormComponent { }

describe('ListItemComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async(() => {

        const listsEndpointSpyObj = {
            admin: {
                listsEndpoint: jasmine.createSpyObj('listsEndpoint', ['getList'])
            }
        };

        TestBed.configureTestingModule({
            declarations: [
                ListItemComponent,
                MockListItemFormComponent,
                TestHostComponent
            ],
            imports: [
                BrowserAnimationsModule,
                DspActionModule,
                MatIconModule
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: listsEndpointSpyObj
                }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        })
            .compileComponents();
    }));

    beforeEach(() => {

        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (dspConnSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>).getList.and.callFake(
            () => {
                const response = new ListResponse();
                response.list.listinfo.id = 'http://rdfh.ch/lists/0001/otherTreeList';
                response.list.listinfo.isRootNode = true;
                response.list.listinfo.labels = [{value: 'Tree List Node Root', language: 'en'}];
                response.list.children = [
                    {
                        comments: [],
                        labels: [{value: 'Tree List Node 01', language: 'en'}],
                        id: 'http://rdfh.ch/lists/0001/otherTreeList01',
                        children: [
                            {
                                comments: [],
                                labels: [{value: 'Tree List Node 03', language: 'en'}],
                                id: 'http://rdfh.ch/lists/0001/otherTreeList03',
                                children: []
                            }
                        ]
                    },
                    {
                        comments: [],
                        labels: [{value: 'Tree List Node 02', language: 'en'}],
                        id: 'http://rdfh.ch/lists/0001/otherTreeList02',
                        children: []
                    }
                ];
                return of(ApiResponseData.fromAjaxResponse({response} as AjaxResponse));
            }
        );

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
                labels: [{value: 'Tree List Node 04', language: 'en'}]
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
                labels: [{value: 'Tree List Node 0123', language: 'en'}],
                position: 0
        };
        listNodeOperation.operation = 'update';

        testHostComponent.listItem.updateView(listNodeOperation);

        expect(testHostComponent.listItem.list.length).toEqual(2);

        expect(testHostComponent.listItem.list[0].labels).toEqual([{value: 'Tree List Node 0123', language: 'en'}]);
    });

    it('should update the view to remove a deleted node', () => {
        const listNodeOperation: ListNodeOperation = new ListNodeOperation();
        listNodeOperation.listNode = {
                children: [
                    {
                        comments: [],
                        labels: [{value: 'Tree List Node 02', language: 'en'}],
                        id: 'http://rdfh.ch/lists/0001/otherTreeList02',
                        children: []
                    }
                ],
                comments: [],
                isRootNode: true,
                id: 'http://rdfh.ch/lists/0001/otherTreeList01',
                labels: [{value: 'Tree List Root', language: 'en'}],
                projectIri: 'http://rdfh.ch/projects/0001'
        };
        listNodeOperation.operation = 'delete';

        testHostComponent.listItem.updateView(listNodeOperation);

        expect(testHostComponent.listItem.list.length).toEqual(1);

        expect(testHostComponent.listItem.list[0].labels).toEqual([{value: 'Tree List Node 02', language: 'en'}]);
    });
});
