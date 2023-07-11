import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { UriValueComponent } from './uri-value.component';
import {
    ReadUriValue,
    MockResource,
    UpdateUriValue,
    CreateUriValue,
} from '@dasch-swiss/dsp-js';
import { OnInit, Component, ViewChild, DebugElement } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { CommentFormComponent } from '../comment-form/comment-form.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-uri-value
        #inputVal
        [displayValue]="displayInputVal"
        [mode]="mode"
        [label]="label"
    ></app-uri-value>`,
})
class TestHostDisplayValueComponent implements OnInit {
    @ViewChild('inputVal') inputValueComponent: UriValueComponent;

    displayInputVal: ReadUriValue;

    mode: 'read' | 'update' | 'create' | 'search';

    label: string;

    ngOnInit() {
        MockResource.getTestThing().subscribe((res) => {
            const inputVal: ReadUriValue = res.getValuesAs(
                'http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri',
                ReadUriValue
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
    template: ` <app-uri-value #inputVal [mode]="mode"></app-uri-value>`,
})
class TestHostCreateValueComponent implements OnInit {
    @ViewChild('inputVal') inputValueComponent: UriValueComponent;

    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {
        this.mode = 'create';
    }
}

describe('UriValueComponent', () => {
    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                CommentFormComponent,
                UriValueComponent,
                TestHostDisplayValueComponent,
                TestHostCreateValueComponent,
            ],
            imports: [
                ReactiveFormsModule,
                MatInputModule,
                BrowserAnimationsModule,
            ],
        }).compileComponents();
    }));

    describe('display and edit a Uri value', () => {
        let testHostComponent: TestHostDisplayValueComponent;
        let testHostFixture: ComponentFixture<TestHostDisplayValueComponent>;
        let valueComponentDe: DebugElement;
        let valueInputDebugElement: DebugElement;
        let valueInputNativeElement;
        let valueReadModeDebugElement: DebugElement;
        let valueReadModeNativeElement;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(
                TestHostDisplayValueComponent
            );
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.inputValueComponent).toBeTruthy();

            const hostCompDe = testHostFixture.debugElement;
            valueComponentDe = hostCompDe.query(
                By.directive(UriValueComponent)
            );

            valueReadModeDebugElement = valueComponentDe.query(
                By.css('.rm-value')
            );
            valueReadModeNativeElement =
                valueReadModeDebugElement.nativeElement;
        });

        it('should display an existing value', () => {
            expect(
                testHostComponent.inputValueComponent.displayValue.uri
            ).toEqual('http://www.google.ch');

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();

            expect(testHostComponent.inputValueComponent.mode).toEqual('read');

            expect(valueReadModeNativeElement.innerText).toEqual(
                'http://www.google.ch'
            );

            const anchorDebugElement = valueReadModeDebugElement.query(
                By.css('a')
            );
            expect(anchorDebugElement.nativeElement).toBeDefined();

            expect(anchorDebugElement.attributes['href']).toEqual(
                'http://www.google.ch'
            );
            expect(anchorDebugElement.attributes['target']).toEqual('_blank');
        });

        it('should display an existing value with a label', () => {
            testHostComponent.label = 'testlabel';

            testHostFixture.detectChanges();

            expect(
                testHostComponent.inputValueComponent.displayValue.uri
            ).toEqual('http://www.google.ch');

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();

            expect(testHostComponent.inputValueComponent.mode).toEqual('read');

            expect(valueReadModeNativeElement.innerText).toEqual('testlabel');

            const anchorDebugElement = valueReadModeDebugElement.query(
                By.css('a')
            );
            expect(anchorDebugElement.nativeElement).toBeDefined();

            expect(anchorDebugElement.attributes['href']).toEqual(
                'http://www.google.ch'
            );
            expect(anchorDebugElement.attributes['target']).toEqual('_blank');
        });

        it('should make an existing value editable', () => {
            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            valueInputDebugElement = valueComponentDe.query(
                By.css('input.value')
            );
            valueInputNativeElement = valueInputDebugElement.nativeElement;

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'update'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();

            expect(valueInputNativeElement.value).toEqual(
                'http://www.google.ch'
            );

            valueInputNativeElement.value = 'http://www.reddit.com';

            valueInputNativeElement.dispatchEvent(new Event('input'));

            testHostFixture.detectChanges();

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();

            const updatedValue =
                testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateUriValue).toBeTruthy();

            expect((updatedValue as UpdateUriValue).uri).toEqual(
                'http://www.reddit.com'
            );
        });

        it('should validate an existing value with an added comment', () => {
            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            valueInputDebugElement = valueComponentDe.query(
                By.css('input.value')
            );
            valueInputNativeElement = valueInputDebugElement.nativeElement;

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'update'
            );

            expect(valueInputNativeElement.value).toEqual(
                'http://www.google.ch'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy(); // because no value nor the comment changed

            testHostComponent.inputValueComponent.commentFormControl.setValue(
                'this is a comment'
            );

            testHostFixture.detectChanges();

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();

            const updatedValue =
                testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateUriValue).toBeTruthy();

            expect((updatedValue as UpdateUriValue).valueHasComment).toEqual(
                'this is a comment'
            );
        });

        it('should not return an invalid update value', () => {
            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            valueInputDebugElement = valueComponentDe.query(
                By.css('input.value')
            );
            valueInputNativeElement = valueInputDebugElement.nativeElement;

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'update'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();

            expect(valueInputNativeElement.value).toEqual(
                'http://www.google.ch'
            );

            valueInputNativeElement.value = 'http://www.google.';

            valueInputNativeElement.dispatchEvent(new Event('input'));

            testHostFixture.detectChanges();

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();

            const updatedValue =
                testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue).toBeFalsy();
        });

        it('should restore the initially displayed value', () => {
            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            valueInputDebugElement = valueComponentDe.query(
                By.css('input.value')
            );
            valueInputNativeElement = valueInputDebugElement.nativeElement;

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'update'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();

            expect(valueInputNativeElement.value).toEqual(
                'http://www.google.ch'
            );

            valueInputNativeElement.value = 'http://www.reddit.com';

            valueInputNativeElement.dispatchEvent(new Event('input'));

            testHostFixture.detectChanges();

            testHostComponent.inputValueComponent.resetFormControl();

            expect(valueInputNativeElement.value).toEqual(
                'http://www.google.ch'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();
        });

        it('should set a new display value', () => {
            const newUri = new ReadUriValue();

            newUri.uri = 'http://www.reddit.com';
            newUri.id = 'updatedId';

            testHostComponent.displayInputVal = newUri;

            testHostFixture.detectChanges();

            expect(valueReadModeNativeElement.innerText).toEqual(
                'http://www.reddit.com'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();
        });
    });

    describe('create a URI value', () => {
        let testHostComponent: TestHostCreateValueComponent;
        let testHostFixture: ComponentFixture<TestHostCreateValueComponent>;
        let valueComponentDe: DebugElement;
        let valueInputDebugElement: DebugElement;
        let valueInputNativeElement;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(
                TestHostCreateValueComponent
            );
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.inputValueComponent).toBeTruthy();

            const hostCompDe = testHostFixture.debugElement;

            valueComponentDe = hostCompDe.query(
                By.directive(UriValueComponent)
            );
            valueInputDebugElement = valueComponentDe.query(
                By.css('input.value')
            );
            valueInputNativeElement = valueInputDebugElement.nativeElement;

            expect(testHostComponent.inputValueComponent.displayValue).toEqual(
                undefined
            );
            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeFalsy();
            expect(valueInputNativeElement.value).toEqual('');
            expect(
                testHostComponent.inputValueComponent.commentFormControl.value
            ).toEqual(null);
        });

        it('should create a value', () => {
            valueInputNativeElement.value = 'http://www.reddit.com';

            valueInputNativeElement.dispatchEvent(new Event('input'));

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual(
                'create'
            );

            expect(
                testHostComponent.inputValueComponent.form.valid
            ).toBeTruthy();

            const newValue =
                testHostComponent.inputValueComponent.getNewValue();

            expect(newValue instanceof CreateUriValue).toBeTruthy();

            expect((newValue as CreateUriValue).uri).toEqual(
                'http://www.reddit.com'
            );
        });

        it('should reset form after cancellation', () => {
            valueInputNativeElement.value = 'http://www.reddit.com';

            valueInputNativeElement.dispatchEvent(new Event('input'));

            testHostComponent.inputValueComponent.commentFormControl.setValue(
                'created comment'
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

            expect(valueInputNativeElement.value).toEqual('');

            expect(
                testHostComponent.inputValueComponent.commentFormControl.value
            ).toEqual(null);
        });
    });
});
