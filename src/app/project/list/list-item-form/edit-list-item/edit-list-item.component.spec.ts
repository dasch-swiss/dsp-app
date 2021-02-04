import { Component, DebugElement, OnInit, ViewChild } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ApiResponseData, ListNodeInfoResponse, ListsEndpointAdmin, UpdateChildNodeRequest } from '@dasch-swiss/dsp-js';
import { DspActionModule, DspApiConnectionToken, ProgressIndicatorComponent } from '@dasch-swiss/dsp-ui';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { EditListItemComponent } from './edit-list-item.component';

/**
 * Test host component to simulate parent component.
 */
@Component({
    template: `<app-edit-list-item #editListItem [iri]="iri" [projectIri]="projectIri"></app-edit-list-item>`
})
class TestHostComponent implements OnInit {

    @ViewChild('editListItem') editListItem: EditListItemComponent;

    iri = 'http://rdfh.ch/lists/0001/otherTreeList01';

    projectIri = 'http://rdfh.ch/projects/0001';

    constructor() {}

    ngOnInit() {
    }

}

describe('EditListItemComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let editListItemComponentDe: DebugElement;
    let formInvalidMessageDe: DebugElement;

    beforeEach(async(() => {

        const listsEndpointSpyObj = {
            admin: {
                listsEndpoint: jasmine.createSpyObj('listsEndpoint', ['getListNodeInfo', 'updateChildNode'])
            }
        };

        TestBed.configureTestingModule({
            declarations: [
                EditListItemComponent,
                TestHostComponent,
                ProgressIndicatorComponent,
            ],
            imports: [
                BrowserAnimationsModule,
                DspActionModule,
                TranslateModule.forRoot()
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: listsEndpointSpyObj
                }
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (dspConnSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>).getListNodeInfo.and.callFake(
            () => {
                const response = new ListNodeInfoResponse();
                response.nodeinfo.id = 'http://rdfh.ch/lists/0001/otherTreeList01';
                response.nodeinfo.labels = [{'value': 'Tree list node 01', 'language': 'en'}];
                response.nodeinfo.comments = [{'value': 'My comment', 'language': 'en'}];
                return of(ApiResponseData.fromAjaxResponse({response} as AjaxResponse));
            }
        );

        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();

        const hostCompDe = testHostFixture.debugElement;
        editListItemComponentDe = hostCompDe.query(By.directive(EditListItemComponent));
        expect(editListItemComponentDe).toBeTruthy();
    });

    it('should assign labels and comments', () => {
        const dspConnSpy = TestBed.inject(DspApiConnectionToken);
        expect(testHostComponent.editListItem.labels).toEqual([{'value': 'Tree list node 01', 'language': 'en'}]);
        expect(testHostComponent.editListItem.comments).toEqual([{'value': 'My comment', 'language': 'en'}]);
        expect(dspConnSpy.admin.listsEndpoint.getListNodeInfo).toHaveBeenCalledTimes(1);
        expect(dspConnSpy.admin.listsEndpoint.getListNodeInfo).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/otherTreeList01');

    });

    it('should update labels when the value changes', () => {
        expect(testHostComponent.editListItem.labels).toEqual([{'value': 'Tree list node 01', 'language': 'en'}]);
        testHostComponent.editListItem.handleData([{'value': 'Tree list node 01', 'language': 'en'}, {'value': 'Baumlistenknoten 01', 'language': 'de'}], 'labels');
        expect(testHostComponent.editListItem.labels).toEqual([{'value': 'Tree list node 01', 'language': 'en'}, {'value': 'Baumlistenknoten 01', 'language': 'de'}]);
        expect(testHostComponent.editListItem.saveButtonDisabled).toBeFalsy();
        testHostComponent.editListItem.handleData([], 'labels');
        expect(testHostComponent.editListItem.saveButtonDisabled).toBeTruthy();
        testHostFixture.detectChanges();
        formInvalidMessageDe = editListItemComponentDe.query(By.css('span.invalid-form'));
        expect(formInvalidMessageDe.nativeElement.innerText).toEqual('A label is required.');
    });

    it('should update comments when the value changes', () => {
        expect(testHostComponent.editListItem.comments).toEqual([{'value': 'My comment', 'language': 'en'}]);
        testHostComponent.editListItem.handleData([{'value': 'My comment', 'language': 'en'}, {'value': 'Mein Kommentar', 'language': 'de'}], 'comments');
        expect(testHostComponent.editListItem.comments).toEqual([{'value': 'My comment', 'language': 'en'}, {'value': 'Mein Kommentar', 'language': 'de'}]);
        expect(testHostComponent.editListItem.saveButtonDisabled).toBeFalsy();
        testHostComponent.editListItem.handleData([], 'comments');
        expect(testHostComponent.editListItem.saveButtonDisabled).toBeFalsy();
    });

    it('should update the child node info', () => {
        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        testHostComponent.editListItem.handleData([{'value': 'Tree list node 01', 'language': 'en'}, {'value': 'Baumlistenknoten 01', 'language': 'de'}], 'labels');
        testHostComponent.editListItem.handleData([{'value': 'My comment', 'language': 'en'}, {'value': 'Mein Kommentar', 'language': 'de'}], 'comments');

        (dspConnSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>).updateChildNode.and.callFake(
            () => {
                const response = new ListNodeInfoResponse();
                response.nodeinfo.id = 'http://rdfh.ch/lists/0001/otherTreeList01';
                response.nodeinfo.labels = [{'value': 'Tree list node 01', 'language': 'en'}, {'value': 'Baumlistenknoten 01', 'language': 'de'}];
                response.nodeinfo.comments = [{'value': 'My comment', 'language': 'en'}, {'value': 'Mein Kommentar', 'language': 'de'}];

                expect(testHostComponent.editListItem.labels).toEqual(response.nodeinfo.labels);
                expect(testHostComponent.editListItem.comments).toEqual(response.nodeinfo.comments);

                return of(ApiResponseData.fromAjaxResponse({response} as AjaxResponse));
            }
        );

        const childNodeUpdateData: UpdateChildNodeRequest = new UpdateChildNodeRequest();
        childNodeUpdateData.projectIri = testHostComponent.editListItem.projectIri;
        childNodeUpdateData.listIri = testHostComponent.editListItem.iri;
        childNodeUpdateData.labels = testHostComponent.editListItem.labels;
        childNodeUpdateData.comments = testHostComponent.editListItem.comments;

        testHostComponent.editListItem.updateChildNode();
        expect(dspConnSpy.admin.listsEndpoint.updateChildNode).toHaveBeenCalledTimes(1);
        expect(dspConnSpy.admin.listsEndpoint.updateChildNode).toHaveBeenCalledWith(childNodeUpdateData);
    });
});
