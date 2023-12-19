import { Component, DebugElement, OnInit, Pipe, PipeTransform, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  CreateTextValueAsString,
  MockResource,
  ReadTextValueAsString,
  UpdateTextValueAsString,
} from '@dasch-swiss/dsp-js';
import { CommentFormComponent } from '../../comment-form/comment-form.component';
import { TextValueAsStringComponent } from './text-value-as-string.component';

/**
 * mocked linkify pipe from main/pipes.
 */
@Pipe({ name: 'appLinkify' })
class MockPipe implements PipeTransform {
  transform(value: string): string {
    // do stuff here, if you want
    return value;
  }
}

/**
 * test host component to simulate parent component.
 */
@Component({
  template: ` <app-text-value-as-string
    #inputVal
    [displayValue]="displayInputVal"
    [mode]="mode"></app-text-value-as-string>`,
})
class TestHostDisplayValueComponent implements OnInit {
  @ViewChild('inputVal') inputValueComponent: TextValueAsStringComponent;

  displayInputVal: ReadTextValueAsString;

  mode: 'read' | 'update' | 'create' | 'search';

  ngOnInit() {
    MockResource.getTestThing().subscribe(res => {
      const inputVal: ReadTextValueAsString = res.getValuesAs(
        'http://0.0.0.0:3333/ontology/0001/anything/v2#hasText',
        ReadTextValueAsString
      )[0];

      this.displayInputVal = inputVal;

      this.mode = 'read';
    });
  }
}

/**
 * test host component to simulate parent component.
 */
@Component({
  template: ` <app-text-value-as-string
    #inputVal
    [displayValue]="displayInputVal"
    [mode]="mode"></app-text-value-as-string>`,
})
class TestHostDisplayValueCommentComponent implements OnInit {
  @ViewChild('inputVal') inputValueComponent: TextValueAsStringComponent;

  displayInputVal: ReadTextValueAsString;

  mode: 'read' | 'update' | 'create' | 'search';

  ngOnInit() {
    MockResource.getTestThing().subscribe(res => {
      const inputVal: ReadTextValueAsString = res.getValuesAs(
        'http://0.0.0.0:3333/ontology/0001/anything/v2#hasText',
        ReadTextValueAsString
      )[0];

      inputVal.valueHasComment = 'this is a comment';
      this.displayInputVal = inputVal;

      this.mode = 'read';
    });
  }
}

/**
 * test host component to simulate parent component.
 */
@Component({
  template: ` <app-text-value-as-string #inputVal [mode]="mode"></app-text-value-as-string>`,
})
class TestHostCreateValueComponent implements OnInit {
  @ViewChild('inputVal') inputValueComponent: TextValueAsStringComponent;

  mode: 'read' | 'update' | 'create' | 'search';

  ngOnInit() {
    this.mode = 'create';
  }
}

describe('TextValueAsStringComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        CommentFormComponent,
        MockPipe,
        TestHostDisplayValueComponent,
        TestHostDisplayValueCommentComponent,
        TextValueAsStringComponent,
        TestHostCreateValueComponent,
      ],
      imports: [ReactiveFormsModule, MatInputModule, BrowserAnimationsModule],
      providers: [],
    }).compileComponents();
  }));

  describe('display and edit a text value without markup', () => {
    let testHostComponent: TestHostDisplayValueComponent;
    let testHostFixture: ComponentFixture<TestHostDisplayValueComponent>;
    let valueComponentDe: DebugElement;

    let valueReadModeDebugElement: DebugElement;
    let valueReadModeNativeElement;

    let valueInputDebugElement: DebugElement;
    let valueInputNativeElement;

    beforeEach(() => {
      testHostFixture = TestBed.createComponent(TestHostDisplayValueComponent);
      testHostComponent = testHostFixture.componentInstance;
      testHostFixture.detectChanges();

      expect(testHostComponent).toBeTruthy();
      expect(testHostComponent.inputValueComponent).toBeTruthy();

      const hostCompDe = testHostFixture.debugElement;
      valueComponentDe = hostCompDe.query(By.directive(TextValueAsStringComponent));

      valueReadModeDebugElement = valueComponentDe.query(By.css('.rm-value'));
      valueReadModeNativeElement = valueReadModeDebugElement.nativeElement;
    });

    it('should display an existing value', () => {
      expect(testHostComponent.inputValueComponent.displayValue.text).toEqual('test');

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

      expect(testHostComponent.inputValueComponent.mode).toEqual('read');

      expect(valueReadModeNativeElement.innerText).toEqual('test');
    });

    it('should make an existing value editable', () => {
      testHostComponent.mode = 'update';

      testHostFixture.detectChanges();

      valueInputDebugElement = valueComponentDe.query(By.css('input.value'));
      valueInputNativeElement = valueInputDebugElement.nativeElement;

      expect(testHostComponent.inputValueComponent.mode).toEqual('update');

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      expect(valueInputNativeElement.value).toEqual('test');

      valueInputNativeElement.value = 'updated text';

      valueInputNativeElement.dispatchEvent(new Event('input'));

      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

      const updatedValue = testHostComponent.inputValueComponent.getUpdatedValue();

      expect(updatedValue instanceof UpdateTextValueAsString).toBeTruthy();

      expect((updatedValue as UpdateTextValueAsString).text).toEqual('updated text');
    });

    it('should not return an invalid update value', () => {
      testHostComponent.mode = 'update';

      testHostFixture.detectChanges();

      valueInputDebugElement = valueComponentDe.query(By.css('input.value'));
      valueInputNativeElement = valueInputDebugElement.nativeElement;

      expect(testHostComponent.inputValueComponent.mode).toEqual('update');

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      expect(valueInputNativeElement.value).toEqual('test');

      valueInputNativeElement.value = '';

      valueInputNativeElement.dispatchEvent(new Event('input'));

      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      const updatedValue = testHostComponent.inputValueComponent.getUpdatedValue();

      expect(updatedValue).toBeFalsy();
    });

    it('should restore the initially displayed value', () => {
      testHostComponent.mode = 'update';

      testHostFixture.detectChanges();

      valueInputDebugElement = valueComponentDe.query(By.css('input.value'));
      valueInputNativeElement = valueInputDebugElement.nativeElement;

      expect(testHostComponent.inputValueComponent.mode).toEqual('update');

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      expect(valueInputNativeElement.value).toEqual('test');

      valueInputNativeElement.value = 'updated text';

      valueInputNativeElement.dispatchEvent(new Event('input'));

      testHostFixture.detectChanges();

      testHostComponent.inputValueComponent.resetFormControl();

      expect(valueInputNativeElement.value).toEqual('test');

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();
    });

    it('should set a new display value', () => {
      const newStr = new ReadTextValueAsString();

      newStr.text = 'my updated text';
      newStr.id = 'updatedId';

      testHostComponent.displayInputVal = newStr;

      testHostFixture.detectChanges();

      expect(valueReadModeNativeElement.innerText).toEqual('my updated text');

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();
    });
  });

  describe('display and edit a text value and comment without markup', () => {
    let testHostComponent: TestHostDisplayValueCommentComponent;
    let testHostFixture: ComponentFixture<TestHostDisplayValueCommentComponent>;
    let valueComponentDe: DebugElement;

    let valueReadModeDebugElement: DebugElement;
    let valueReadModeNativeElement;

    let valueInputDebugElement: DebugElement;
    let valueInputNativeElement;

    beforeEach(() => {
      testHostFixture = TestBed.createComponent(TestHostDisplayValueCommentComponent);
      testHostComponent = testHostFixture.componentInstance;
      testHostFixture.detectChanges();

      expect(testHostComponent).toBeTruthy();
      expect(testHostComponent.inputValueComponent).toBeTruthy();

      const hostCompDe = testHostFixture.debugElement;

      valueComponentDe = hostCompDe.query(By.directive(TextValueAsStringComponent));
      valueReadModeDebugElement = valueComponentDe.query(By.css('.rm-value'));
      valueReadModeNativeElement = valueReadModeDebugElement.nativeElement;
    });

    it('should display an existing value with an added comment', () => {
      expect(testHostComponent.inputValueComponent.displayValue.text).toEqual('test');

      expect(testHostComponent.inputValueComponent.displayValue.valueHasComment).toEqual('this is a comment');

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

      expect(valueReadModeNativeElement.innerText).toEqual('test');
    });

    it('should make an existing value editable', () => {
      testHostComponent.mode = 'update';

      testHostFixture.detectChanges();

      valueInputDebugElement = valueComponentDe.query(By.css('input.value'));
      valueInputNativeElement = valueInputDebugElement.nativeElement;

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      expect(valueInputNativeElement.value).toEqual('test');

      expect(testHostComponent.inputValueComponent.commentFormControl.value).toEqual('this is a comment');

      valueInputNativeElement.value = 'updated text';

      valueInputNativeElement.dispatchEvent(new Event('input'));

      testHostComponent.inputValueComponent.commentFormControl.setValue('this is an updated comment');

      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

      const updatedValue = testHostComponent.inputValueComponent.getUpdatedValue();

      expect(updatedValue instanceof UpdateTextValueAsString).toBeTruthy();

      expect((updatedValue as UpdateTextValueAsString).text).toEqual('updated text');

      expect((updatedValue as UpdateTextValueAsString).valueHasComment).toEqual('this is an updated comment');
    });

    it('should not return an invalid update value', () => {
      testHostComponent.mode = 'update';

      testHostFixture.detectChanges();

      valueInputDebugElement = valueComponentDe.query(By.css('input.value'));
      valueInputNativeElement = valueInputDebugElement.nativeElement;

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      expect(valueInputNativeElement.value).toEqual('test');

      expect(testHostComponent.inputValueComponent.commentFormControl.value).toEqual('this is a comment');

      valueInputNativeElement.value = '';

      valueInputNativeElement.dispatchEvent(new Event('input'));

      testHostComponent.inputValueComponent.commentFormControl.setValue('this is an updated comment');

      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      const updatedValue = testHostComponent.inputValueComponent.getUpdatedValue();

      expect(updatedValue).toBeFalsy();
    });

    it('should restore the initially displayed value', () => {
      testHostComponent.mode = 'update';

      testHostFixture.detectChanges();

      valueInputDebugElement = valueComponentDe.query(By.css('input.value'));
      valueInputNativeElement = valueInputDebugElement.nativeElement;

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      expect(valueInputNativeElement.value).toEqual('test');

      valueInputNativeElement.value = 'updated text';

      valueInputNativeElement.dispatchEvent(new Event('input'));

      testHostComponent.inputValueComponent.commentFormControl.setValue('this is an updated comment');

      testHostFixture.detectChanges();

      testHostComponent.inputValueComponent.resetFormControl();

      expect(valueInputNativeElement.value).toEqual('test');

      testHostComponent.inputValueComponent.commentFormControl.setValue('this is a comment');

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();
    });

    it('should set a new display value', () => {
      const newStr = new ReadTextValueAsString();

      newStr.text = 'my updated text';
      newStr.valueHasComment = 'my updated comment';
      newStr.id = 'updatedId';

      testHostComponent.displayInputVal = newStr;

      testHostFixture.detectChanges();

      expect(valueReadModeNativeElement.innerText).toEqual('my updated text');

      expect(testHostComponent.inputValueComponent.displayValue.valueHasComment).toEqual('my updated comment');

      testHostComponent.mode = 'update';

      testHostFixture.detectChanges();

      testHostComponent.mode = 'read';
      testHostComponent.inputValueComponent.shouldShowComment = true;

      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.commentFormControl.value).toEqual('my updated comment');

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();
    });
  });

  describe('create a text value without markup', () => {
    let testHostComponent: TestHostCreateValueComponent;
    let testHostFixture: ComponentFixture<TestHostCreateValueComponent>;
    let valueComponentDe: DebugElement;
    let valueInputDebugElement: DebugElement;
    let valueInputNativeElement;

    beforeEach(() => {
      testHostFixture = TestBed.createComponent(TestHostCreateValueComponent);
      testHostComponent = testHostFixture.componentInstance;
      testHostFixture.detectChanges();

      expect(testHostComponent).toBeTruthy();
      expect(testHostComponent.inputValueComponent).toBeTruthy();

      const hostCompDe = testHostFixture.debugElement;

      valueComponentDe = hostCompDe.query(By.directive(TextValueAsStringComponent));
      valueInputDebugElement = valueComponentDe.query(By.css('input.value'));
      valueInputNativeElement = valueInputDebugElement.nativeElement;

      expect(testHostComponent.inputValueComponent.displayValue).toEqual(undefined);
      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();
      expect(valueInputNativeElement.value).toEqual('');
      testHostFixture.detectChanges();
      expect(testHostComponent.inputValueComponent.commentFormControl.value).toEqual(null);
    });

    it('should create a value', () => {
      valueInputNativeElement.value = 'created text';

      valueInputNativeElement.dispatchEvent(new Event('input'));

      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.mode).toEqual('create');

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

      const newValue = testHostComponent.inputValueComponent.getNewValue();

      expect(newValue instanceof CreateTextValueAsString).toBeTruthy();

      expect((newValue as CreateTextValueAsString).text).toEqual('created text');
    });

    it('should reset form after cancellation', () => {
      valueInputNativeElement.value = 'created text';

      valueInputNativeElement.dispatchEvent(new Event('input'));

      testHostComponent.inputValueComponent.commentFormControl.setValue('created comment');

      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.mode).toEqual('create');

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

      testHostComponent.inputValueComponent.resetFormControl();

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

      expect(valueInputNativeElement.value).toEqual('');

      expect(testHostComponent.inputValueComponent.commentFormControl.value).toEqual(null);
    });

    // *** begin testing comments ***

    // value: yes  comment:yes
    it('should allow a comment if a value exists', () => {
      valueInputNativeElement.value = 'test';

      valueInputNativeElement.dispatchEvent(new Event('input'));

      testHostComponent.inputValueComponent.commentFormControl.setValue('comment');

      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();
    });

    // value: yes  comment:no
    it('should allow no comment if a value exists', () => {
      valueInputNativeElement.value = 'test';

      valueInputNativeElement.dispatchEvent(new Event('input'));

      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();
    });

    // value: no  comment:yes
    it('should not allow a comment if a value does not exist', () => {
      testHostComponent.inputValueComponent.commentFormControl.setValue('comment');

      testHostFixture.detectChanges();

      expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();
    });

    // *** end testing comments ***
  });
});
