import { Component, DebugElement, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    CreateListValue,
    ListNodeV2,
    ListsEndpointV2,
    MockResource,
    ReadListValue,
    ResourcePropertyDefinition,
    UpdateListValue,
} from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { DspApiConnectionToken } from '@dsp-app/src/app/main/declarations/dsp-api-tokens';
import { CommentFormComponent } from '../comment-form/comment-form.component';
import { ListValueComponent } from './list-value.component';
import { SublistValueComponent } from './subList-value/sublist-value.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-list-value
        #inputVal
        [displayValue]="displayInputVal"
        [mode]="mode"
        [propertyDef]="propertyDef"
    ></app-list-value>`,
})
class TestHostDisplayValueComponent implements OnInit {
    @ViewChild('inputVal') inputValueComponent: ListValueComponent;

    displayInputVal: ReadListValue;
    propertyDef: ResourcePropertyDefinition;

    mode: 'read' | 'update' | 'create' | 'search';
    ngOnInit() {
        MockResource.getTestThing().subscribe((res) => {
            const inputVal: ReadListValue = res.getValuesAs(
                'http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem',
                ReadListValue
            )[0];
            this.displayInputVal = inputVal;
            this.mode = 'read';
        });
        this.propertyDef = new ResourcePropertyDefinition();
        this.propertyDef.guiAttributes.push(
            'hlist=<http://rdfh.ch/lists/0001/treeList>'
        );
    }
}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-list-value
        #inputVal
        [mode]="mode"
        [propertyDef]="propertyDef"
    ></app-list-value>`,
})
class TestHostCreateValueComponent implements OnInit {
    @ViewChild('inputVal') inputValueComponent: ListValueComponent;

    mode: 'read' | 'update' | 'create' | 'search';
    propertyDef: ResourcePropertyDefinition;

    ngOnInit() {
        this.mode = 'create';
        this.propertyDef = new ResourcePropertyDefinition();
        this.propertyDef.guiAttributes.push(
            'hlist=<http://rdfh.ch/lists/0001/treeList>'
        );
    }
}

describe('ListValueComponent', () => {
    beforeEach(waitForAsync(() => {
        const valuesSpyObj = {
            v2: {
                values: jasmine.createSpyObj('values', [
                    'updateValue',
                    'getValue',
                    'setValue',
                ]),
                list: jasmine.createSpyObj('list', ['getList']),
            },
        };
        TestBed.configureTestingModule({
            declarations: [
                CommentFormComponent,
                ListValueComponent,
                SublistValueComponent,
                TestHostDisplayValueComponent,
                TestHostCreateValueComponent,
            ],
            imports: [
                BrowserAnimationsModule,
                MatDialogModule,
                MatInputModule,
                MatMenuModule,
                MatSnackBarModule,
                MatTooltipModule,
                ReactiveFormsModule,
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: valuesSpyObj,
                },
            ],
        }).compileComponents();
    }));

    describe('display and edit a list value', () => {
        let testHostComponent: TestHostDisplayValueComponent;
        let testHostFixture: ComponentFixture<TestHostDisplayValueComponent>;
        let valueComponentDe: DebugElement;
        let valueReadModeDebugElement: DebugElement;
        let valueReadModeNativeElement;
        let commentInputDebugElement: DebugElement;
        let commentInputNativeElement;

        beforeEach(() => {
            const valuesSpy = TestBed.inject(DspApiConnectionToken);
            (
                valuesSpy.v2.list as jasmine.SpyObj<ListsEndpointV2>
            ).getList.and.callFake((rootNodeIri: string) => {
                const res = new ListNodeV2();
                res.id = 'http://rdfh.ch/lists/0001/treeList01';
                res.label = 'Tree list node 01';
                res.isRootNode = false;
                res.children = [];
                return of(res);
            });

            testHostFixture = TestBed.createComponent(
                TestHostDisplayValueComponent
            );
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.inputValueComponent).toBeTruthy();

            const hostCompDe = testHostFixture.debugElement;

            valueComponentDe = hostCompDe.query(
                By.directive(ListValueComponent)
            );
            valueReadModeDebugElement = valueComponentDe.query(
                By.css('.rm-value')
            );
            valueReadModeNativeElement =
                valueReadModeDebugElement.nativeElement;
        });

        it('should display an existing value', () => {
            expect(
                testHostComponent.inputValueComponent.displayValue.listNode
            ).toMatch('http://rdfh.ch/lists/0001/treeList01');
            expect(
                testHostComponent.inputValueComponent.displayValue.listNodeLabel
            ).toMatch('Tree list node 01');

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();

            expect(testHostComponent.inputValueComponent.mode).toEqual('read');

            expect(valueReadModeNativeElement.innerText).toEqual(
                'Tree list node 01'
            );
        });

        it('should make list value editable as button', () => {
            const valuesSpy = TestBed.inject(DspApiConnectionToken);
            (
                valuesSpy.v2.list as jasmine.SpyObj<ListsEndpointV2>
            ).getList.and.callFake((rootNodeIri: string) => {
                const res = new ListNodeV2();
                res.id = 'http://rdfh.ch/lists/0001/treeList';
                res.label = 'Listenwurzel';
                res.isRootNode = true;
                return of(res);
            });
            testHostComponent.mode = 'update';
            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'update'
            );

            expect(valuesSpy.v2.list.getList).toHaveBeenCalledTimes(3);
            expect(valuesSpy.v2.list.getList).toHaveBeenCalledWith(
                'http://rdfh.ch/lists/0001/treeList'
            );
            expect(
                testHostComponent.inputValueComponent.listRootNode.children
                    .length
            ).toEqual(0);

            const openListButtonDe = valueComponentDe.query(By.css('button'));

            expect(openListButtonDe.nativeElement.textContent.trim()).toBe(
                'Tree list node 01'
            );

            expect(
                testHostComponent.inputValueComponent.selectedNode.label
            ).toBe('Tree list node 01');

            const openListButtonEle: HTMLElement =
                openListButtonDe.nativeElement;
            openListButtonEle.click();
            testHostFixture.detectChanges();

            testHostComponent.inputValueComponent.menuTrigger.openMenu();
        });

        it('should validate an existing value with an added comment', () => {
            const valuesSpy = TestBed.inject(DspApiConnectionToken);
            (
                valuesSpy.v2.list as jasmine.SpyObj<ListsEndpointV2>
            ).getList.and.callFake((rootNodeIri) => {
                const res = new ListNodeV2();
                res.id = 'http://rdfh.ch/lists/0001/treeList';
                res.label = 'Listenwurzel';
                res.isRootNode = true;
                return of(res);
            });

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'update'
            );

            // set a comment value
            testHostComponent.inputValueComponent.commentFormControl.setValue(
                'this is a comment'
            );

            testHostFixture.detectChanges();

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();

            const updatedValue =
                testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateListValue).toBeTruthy();

            expect((updatedValue as UpdateListValue).valueHasComment).toEqual(
                'this is a comment'
            );
        });
    });
    describe('create a list value', () => {
        let testHostComponent: TestHostCreateValueComponent;
        let testHostFixture: ComponentFixture<TestHostCreateValueComponent>;
        let valueComponentDe: DebugElement;
        let commentInputDebugElement: DebugElement;
        let commentInputNativeElement;
        beforeEach(() => {
            const valuesSpy = TestBed.inject(DspApiConnectionToken);

            (
                valuesSpy.v2.list as jasmine.SpyObj<ListsEndpointV2>
            ).getList.and.callFake((rootNodeIri: string) => {
                const res = new ListNodeV2();
                res.id = 'http://rdfh.ch/lists/0001/treeList';
                res.label = 'Listenwurzel';
                res.isRootNode = true;
                return of(res);
            });

            testHostFixture = TestBed.createComponent(
                TestHostCreateValueComponent
            );
            testHostComponent = testHostFixture.componentInstance;
            testHostComponent.mode = 'create';

            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.inputValueComponent).toBeTruthy();
            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'create'
            );
            expect(valuesSpy.v2.list.getList).toHaveBeenCalledTimes(1);
            const hostCompDe = testHostFixture.debugElement;

            valueComponentDe = hostCompDe.query(
                By.directive(ListValueComponent)
            );
        });
        it('should create a value', () => {
            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();
            testHostComponent.inputValueComponent.valueFormControl.setValue(
                'http://rdfh.ch/lists/0001/treeList01'
            );
            testHostFixture.detectChanges();
            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();
            const newValue =
                testHostComponent.inputValueComponent.getNewValue();

            expect(newValue instanceof CreateListValue).toBeTruthy();

            expect((newValue as CreateListValue).listNode).toEqual(
                'http://rdfh.ch/lists/0001/treeList01'
            );
        });

        it('should reset form after cancellation', () => {
            // simulate user input
            const newList = 'http://rdfh.ch/lists/0001/treeList01';

            testHostComponent.inputValueComponent.valueFormControl.setValue(
                newList
            );

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'create'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();

            testHostComponent.inputValueComponent.resetFormControl();

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();

            expect(
                testHostComponent.inputValueComponent.valueFormControl.value
            ).toEqual(null);

            expect(
                testHostComponent.inputValueComponent.commentFormControl.value
            ).toEqual(null);
        });
    });
});
