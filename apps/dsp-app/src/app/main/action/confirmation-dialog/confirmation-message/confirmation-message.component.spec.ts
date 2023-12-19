import { Component, OnInit } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockResource, ReadIntValue } from '@dasch-swiss/dsp-js';
import { ConfirmationMessageComponent } from './confirmation-message.component';

/**
 * test host component to simulate parent component with a confirmation dialog.
 */
@Component({
  template: ` <app-confirmation-message [value]="testValue"></app-confirmation-message>`,
})
class ConfirmationMessageTestHostComponent implements OnInit {
  testValue: ReadIntValue;

  constructor() {}

  ngOnInit() {
    MockResource.getTestThing().subscribe(res => {
      this.testValue = res.getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger', ReadIntValue)[0];
    });
  }
}

describe('ConfirmationMessageComponent', () => {
  let testHostComponent: ConfirmationMessageTestHostComponent;
  let testHostFixture: ComponentFixture<ConfirmationMessageTestHostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmationMessageTestHostComponent, ConfirmationMessageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    testHostFixture = TestBed.createComponent(ConfirmationMessageTestHostComponent);
    testHostComponent = testHostFixture.componentInstance;
    testHostFixture.detectChanges();
  });

  it('should create', () => {
    expect(testHostComponent).toBeTruthy();
  });

  it('should bind the values correctly', () => {
    testHostComponent.testValue.valueHasComment = 'My comment';
    testHostFixture.detectChanges();

    const hostCompDe = testHostFixture.debugElement;
    const valueComponentDe = hostCompDe.query(By.directive(ConfirmationMessageComponent));

    expect(valueComponentDe).toBeTruthy();

    const label = valueComponentDe.query(By.css('.val-label')).nativeElement;
    expect(label.innerText).toEqual('Confirming this action will delete the following value from Integer:');

    const value = valueComponentDe.query(By.css('.val-value')).nativeElement;
    expect(value.innerText).toEqual('Value: 1');

    const comment = valueComponentDe.query(By.css('.val-comment')).nativeElement;
    expect(comment.innerText).toEqual('Value Comment: My comment');

    const creationDate = valueComponentDe.query(By.css('.val-creation-date')).nativeElement;
    expect(creationDate.innerText).toEqual('Value Creation Date: 2018-05-28T15:52:03.897Z');
  });

  it('should default to "no comment" if the value does not contain a comment', () => {
    testHostComponent.testValue.valueHasComment = null;
    testHostFixture.detectChanges();

    const hostCompDe = testHostFixture.debugElement;
    const valueComponentDe = hostCompDe.query(By.directive(ConfirmationMessageComponent));

    expect(valueComponentDe).toBeTruthy();

    const comment = valueComponentDe.query(By.css('.val-comment')).nativeElement;
    expect(comment.innerText).toEqual('Value Comment: No comment');
  });
});
