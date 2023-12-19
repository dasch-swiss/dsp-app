import { Component, DebugElement, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
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
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
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
    [propertyDef]="propertyDef"></app-list-value>`,
})
class TestHostDisplayValueComponent implements OnInit {
  @ViewChild('inputVal') inputValueComponent: ListValueComponent;

  displayInputVal: ReadListValue;
  propertyDef: ResourcePropertyDefinition;

  mode: 'read' | 'update' | 'create' | 'search';
  ngOnInit() {
    MockResource.getTestThing().subscribe(res => {
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
    [propertyDef]="propertyDef"></app-list-value>`,
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
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatSnackBarModule,
        MatTooltipModule,
        ReactiveFormsModule,
      ],
      providers: [
        MockProvider(AppLoggingService),
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

    beforeEach(() => {
      const valuesSpy = TestBed.inject(DspApiConnectionToken);
      (
        valuesSpy.v2.list as jasmine.SpyObj<ListsEndpointV2>
      ).getList.and.callFake(() => {
        const res = new ListNodeV2();
        res.id = 'http://rdfh.ch/lists/0001/treeList01';
        res.label = 'Tree list node 01';
        res.isRootNode = false;
        res.children = [];
        return of(res);
      });

      testHostFixture = TestBed.createComponent(TestHostDisplayValueComponent);
      testHostComponent = testHostFixture.componentInstance;
      testHostFixture.detectChanges();

      expect(testHostComponent).toBeTruthy();
      expect(testHostComponent.inputValueComponent).toBeTruthy();

      const hostCompDe = testHostFixture.debugElement;

      valueComponentDe = hostCompDe.query(By.directive(ListValueComponent));
      valueReadModeDebugElement = valueComponentDe.query(By.css('.rm-value'));
      valueReadModeNativeElement = valueReadModeDebugElement.nativeElement;
    });

    it('should display an existing value', () => {
      expect(
        testHostComponent.inputValueComponent.displayValue.listNode
      ).toMatch('http://rdfh.ch/lists/0001/treeList01');
      expect(
        testHostComponent.inputValueComponent.displayValue.listNodeLabel
      ).toMatch('Tree list node 01');

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

      expect(testHostComponent.inputValueComponent.mode).toEqual('read');

      expect(valueReadModeNativeElement.innerText).toEqual('Tree list node 01');
    });

    it('should make list value editable as button', () => {
      const valuesSpy = TestBed.inject(DspApiConnectionToken);
      (
        valuesSpy.v2.list as jasmine.SpyObj<ListsEndpointV2>
      ).getList.and.callFake(() => {
        const res = new ListNodeV2();
        res.id = 'http://rdfh.ch/lists/0001/treeList';
        res.label = 'Listenwurzel';
        res.isRootNode = true;
        return of(res);
      });
      testHostComponent.mode = 'update';
      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.mode).toEqual('update');

      expect(valuesSpy.v2.list.getList).toHaveBeenCalledTimes(3);
      expect(valuesSpy.v2.list.getList).toHaveBeenCalledWith(
        'http://rdfh.ch/lists/0001/treeList'
      );
      expect(
        testHostComponent.inputValueComponent.listRootNode.children.length
      ).toEqual(0);

      const dropdownDe = valueComponentDe.query(By.css('.dropdown'));
      const dropdownLabel = valueComponentDe.query(By.css('.label'));

      expect(dropdownDe).toBeTruthy();

      expect(dropdownLabel.nativeElement.textContent.trim()).toBe(
        'Tree list node 01'
      );

      expect(testHostComponent.inputValueComponent.selectedNode.label).toBe(
        'Tree list node 01'
      );
    });

    it('should validate an existing value with an added comment', () => {
      const valuesSpy = TestBed.inject(DspApiConnectionToken);
      (
        valuesSpy.v2.list as jasmine.SpyObj<ListsEndpointV2>
      ).getList.and.callFake(() => {
        const res = new ListNodeV2();
        res.id = 'http://rdfh.ch/lists/0001/treeList';
        res.label = 'Listenwurzel';
        res.isRootNode = true;
        return of(res);
      });

      testHostComponent.mode = 'update';

      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.mode).toEqual('update');

      // set a comment value
      testHostComponent.inputValueComponent.commentFormControl.setValue(
        'this is a comment'
      );

      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

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

    beforeEach(() => {
      const valuesSpy = TestBed.inject(DspApiConnectionToken);

      (
        valuesSpy.v2.list as jasmine.SpyObj<ListsEndpointV2>
      ).getList.and.callFake(() => {
        const res = new ListNodeV2();
        res.id = 'http://rdfh.ch/lists/0001/treeList';
        res.label = 'Listenwurzel';
        res.isRootNode = true;
        return of(res);
      });

      testHostFixture = TestBed.createComponent(TestHostCreateValueComponent);
      testHostComponent = testHostFixture.componentInstance;
      testHostComponent.mode = 'create';

      testHostFixture.detectChanges();

      expect(testHostComponent).toBeTruthy();
      expect(testHostComponent.inputValueComponent).toBeTruthy();
      expect(testHostComponent.inputValueComponent.mode).toEqual('create');
      expect(valuesSpy.v2.list.getList).toHaveBeenCalledTimes(1);
    });

    it('should create a value', () => {
      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();
      testHostComponent.inputValueComponent.valueFormControl.setValue(
        'http://rdfh.ch/lists/0001/treeList01'
      );
      testHostFixture.detectChanges();
      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();
      const newValue = testHostComponent.inputValueComponent.getNewValue();

      expect(newValue instanceof CreateListValue).toBeTruthy();

      expect((newValue as CreateListValue).listNode).toEqual(
        'http://rdfh.ch/lists/0001/treeList01'
      );
    });

    it('should reset form after cancellation', () => {
      // simulate user input
      const newList = 'http://rdfh.ch/lists/0001/treeList01';

      testHostComponent.inputValueComponent.valueFormControl.setValue(newList);

      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.mode).toEqual('create');

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

      testHostComponent.inputValueComponent.resetFormControl();

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      expect(
        testHostComponent.inputValueComponent.valueFormControl.value
      ).toEqual(null);

      expect(
        testHostComponent.inputValueComponent.commentFormControl.value
      ).toEqual(null);
    });
  });
});
