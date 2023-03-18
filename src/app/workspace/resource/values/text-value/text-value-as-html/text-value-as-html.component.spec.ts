import { Component, Directive, EventEmitter, OnInit, Output, Pipe, PipeTransform, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReadTextValueAsHtml } from '@dasch-swiss/dsp-js';
import { TextValueAsHtmlComponent } from './text-value-as-html.component';

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

@Directive({
    selector: '[appHtmlLink]'
})
export class TestTextValueHtmlLinkDirective {

    @Output() internalLinkClicked = new EventEmitter<string>();

    @Output() internalLinkHovered = new EventEmitter<string>();

}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
    <app-text-value-as-html *ngIf="displayInputVal" #inputVal [displayValue]="displayInputVal" [mode]="mode"></app-text-value-as-html>`
})
class TestHostDisplayValueComponent implements OnInit {

    @ViewChild('inputVal') inputValueComponent: TextValueAsHtmlComponent;

    displayInputVal: ReadTextValueAsHtml;

    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {

        this.mode = 'read';
    }
}

describe('TextValueAsHtmlComponent', () => {

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                MockPipe,
                TestHostDisplayValueComponent,
                TextValueAsHtmlComponent
            ],
            imports: [
                ReactiveFormsModule,
                MatInputModule,
                BrowserAnimationsModule
            ],
            providers: []
        })
            .compileComponents();
    }));

    describe('display text value with markup', () => {
        let testHostComponent: TestHostDisplayValueComponent;
        let testHostFixture: ComponentFixture<TestHostDisplayValueComponent>;
        let hostCompDe;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(TestHostDisplayValueComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();

            hostCompDe = testHostFixture.debugElement;

        });

        it('should display an existing value', () => {

            const inputVal: ReadTextValueAsHtml = new ReadTextValueAsHtml();

            inputVal.hasPermissions = 'CR knora-admin:Creator|M knora-admin:ProjectMember|V knora-admin:KnownUser|RV knora-admin:UnknownUser';
            inputVal.userHasPermission = 'CR';
            inputVal.type = 'http://api.knora.org/ontology/knora-api/v2#TextValue';
            inputVal.id = 'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw/values/TEST_ID';
            inputVal.html =
                '<p>This is a <b>very</b> simple HTML document with a <a href="https://www.google.ch" target="_blank" class="dsp-link">link</a></p>';

            testHostComponent.displayInputVal = inputVal;

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent).toBeTruthy();

            const valueComponentDe = hostCompDe.query(By.directive(TextValueAsHtmlComponent));

            const valueParagraph = valueComponentDe.query(By.css('div.value'));
            const valueParagraphNativeElement = valueParagraph.nativeElement;

            expect(testHostComponent.inputValueComponent.displayValue.html)
                .toEqual('<p>This is a <b>very</b> simple HTML document with a <a href="https://www.google.ch" target="_blank" class="dsp-link">link</a></p>');

            expect(testHostComponent.inputValueComponent.mode).toEqual('read');

            expect(valueParagraphNativeElement.innerHTML)
                .toEqual('<p>This is a <b>very</b> simple HTML document with a <a href="https://www.google.ch" target="_blank" class="dsp-link">link</a></p>');

            const commentSpan = valueComponentDe.query(By.css('span.comment'));

            expect(commentSpan).toBe(null);

        });

        it('should display an existing value with a comment', () => {

            const inputVal: ReadTextValueAsHtml = new ReadTextValueAsHtml();

            inputVal.type = 'http://api.knora.org/ontology/knora-api/v2#TextValue';
            inputVal.id = 'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw/values/TEST_ID';
            inputVal.html =
                '<p>This is a <b>very</b> simple HTML document with a <a href="https://www.google.ch" target="_blank" class="dsp-link">link</a> and a comment</p>';
            inputVal.valueHasComment = 'very interesting';

            testHostComponent.displayInputVal = inputVal;

            testHostFixture.detectChanges();

            const valueComponentDe = hostCompDe.query(By.directive(TextValueAsHtmlComponent));

            const valueParagraph = valueComponentDe.query(By.css('div.value'));
            const valueParagraphNativeElement = valueParagraph.nativeElement;

            const commentSpan = valueComponentDe.query(By.css('span.comment'));
            const commentSpanNativeElement = commentSpan.nativeElement;

            expect(testHostComponent.inputValueComponent.displayValue.html)
                .toEqual('<p>This is a <b>very</b> simple HTML document with a <a href="https://www.google.ch" target="_blank" class="dsp-link">link</a> and a comment</p>');

            expect(testHostComponent.inputValueComponent.mode).toEqual('read');

            expect(valueParagraphNativeElement.innerHTML)
                .toEqual('<p>This is a <b>very</b> simple HTML document with a <a href="https://www.google.ch" target="_blank" class="dsp-link">link</a> and a comment</p>');

            expect(commentSpanNativeElement.innerText).toEqual('very interesting');

        });
    });
});
