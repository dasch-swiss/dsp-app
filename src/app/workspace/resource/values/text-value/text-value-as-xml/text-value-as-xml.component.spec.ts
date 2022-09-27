import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import {
    Component,
    DebugElement,
    Directive,
    EventEmitter,
    forwardRef,
    Input,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Constants, CreateTextValueAsXml, MockResource, ReadTextValueAsXml, UpdateTextValueAsXml } from '@dasch-swiss/dsp-js';
import { TextValueAsXMLComponent } from './text-value-as-xml.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    selector: 'ckeditor',
    template: '',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: forwardRef(() => TestCKEditorComponent),
        }
    ]
})
class TestCKEditorComponent implements ControlValueAccessor {

    @Input() config;

    @Input() editor;

    value;

    constructor() { }

    onChange = (_: any) => {
    };

    writeValue(obj: any) {
        this.value = obj;
    }

    registerOnChange(fn: any) {
        this.onChange = fn;
    }

    registerOnTouched(fn: any) {
    }

    _handleInput(): void {
        this.onChange(this.value);
    }

}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
        <app-text-value-as-xml #inputVal [displayValue]="displayInputVal" [mode]="mode" (internalLinkClicked)="standoffLinkClicked($event)" (internalLinkHovered)="standoffLinkHovered($event)">
        </app-text-value-as-xml>`
})
class TestHostDisplayValueComponent implements OnInit {

    @ViewChild('inputVal') inputValueComponent: TextValueAsXMLComponent;

    displayInputVal: ReadTextValueAsXml;

    mode: 'read' | 'update' | 'create' | 'search';

    refResClicked: string;

    refResHovered: string;

    ngOnInit() {

        MockResource.getTestThing().subscribe(
            res => {

                this.displayInputVal = res.getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasRichtext', ReadTextValueAsXml)[0];

                this.mode = 'read';
            }
        );

    }

    standoffLinkClicked(refResIri: string) {
        this.refResClicked = refResIri;
    }

    standoffLinkHovered(refResIri: string) {
        this.refResHovered = refResIri;
    }
}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
        <app-text-value-as-xml #inputVal [mode]="mode"></app-text-value-as-xml>`
})
class TestHostCreateValueComponent implements OnInit {

    @ViewChild('inputVal') inputValueComponent: TextValueAsXMLComponent;

    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {

        this.mode = 'create';

    }
}

@Directive({
    selector: '[appHtmlLink]'
})
export class TestTextValueHtmlLinkDirective {

    @Output() internalLinkClicked = new EventEmitter<string>();

    @Output() internalLinkHovered = new EventEmitter<string>();

}

describe('TextValueAsXMLComponent', () => {

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                TextValueAsXMLComponent,
                TestHostDisplayValueComponent,
                TestCKEditorComponent,
                TestHostCreateValueComponent,
                TestTextValueHtmlLinkDirective
            ],
            imports: [
                ReactiveFormsModule,
                MatInputModule,
                BrowserAnimationsModule
            ]
        })
            .compileComponents();
    }));

    describe('display and edit a text value with xml markup', () => {
        let testHostComponent: TestHostDisplayValueComponent;
        let testHostFixture: ComponentFixture<TestHostDisplayValueComponent>;

        let valueComponentDe: DebugElement;

        let valueReadModeDebugElement: DebugElement;
        let valueReadModeNativeElement;

        let ckeditorDe: DebugElement;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(TestHostDisplayValueComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            const hostCompDe = testHostFixture.debugElement;
            valueComponentDe = hostCompDe.query(By.directive(TextValueAsXMLComponent));

            valueReadModeDebugElement = valueComponentDe.query(By.css('.rm-value'));
            valueReadModeNativeElement = valueReadModeDebugElement.nativeElement;

            // reset before each it
            ckeditorDe = undefined;

        });

        it('should display an existing value for the standard mapping as formatted text', () => {

            expect(testHostComponent.inputValueComponent.displayValue.xml).toEqual('<?xml version="1.0" encoding="UTF-8"?>\n<text><p>test with <strong>markup</strong></p></text>');

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

            expect(testHostComponent.inputValueComponent.mode).toEqual('read');

            expect(valueReadModeNativeElement.innerHTML).toEqual('\n<p>test with <strong>markup</strong></p>');

        });

        it('should display an existing value for the standard mapping as formatted text and react to clicking on a standoff link', () => {

            expect(testHostComponent.inputValueComponent.displayValue.xml).toEqual('<?xml version="1.0" encoding="UTF-8"?>\n<text><p>test with <strong>markup</strong></p></text>');

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

            expect(testHostComponent.inputValueComponent.mode).toEqual('read');

            expect(valueReadModeNativeElement.innerHTML).toEqual('\n<p>test with <strong>markup</strong></p>');

            expect(testHostComponent.refResClicked).toBeUndefined();

            const debugElement = valueComponentDe.query(By.directive(TestTextValueHtmlLinkDirective));

            // https://stackoverflow.com/questions/50611721/how-to-access-property-of-directive-in-a-test-host-in-angular-5/51716105
            const linkDirective = debugElement.injector.get(TestTextValueHtmlLinkDirective);

            // simulate click event on a standoff link
            linkDirective.internalLinkClicked.emit('testIri');

            expect(testHostComponent.refResClicked).toEqual('testIri');

        });

        it('should display an existing value for the standard mapping as formatted text and react to hovering on a standoff link', () => {

            expect(testHostComponent.inputValueComponent.displayValue.xml).toEqual('<?xml version="1.0" encoding="UTF-8"?>\n<text><p>test with <strong>markup</strong></p></text>');

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

            expect(testHostComponent.inputValueComponent.mode).toEqual('read');

            expect(valueReadModeNativeElement.innerHTML).toEqual('\n<p>test with <strong>markup</strong></p>');

            expect(testHostComponent.refResHovered).toBeUndefined();

            const debugElement = valueComponentDe.query(By.directive(TestTextValueHtmlLinkDirective));

            // https://stackoverflow.com/questions/50611721/how-to-access-property-of-directive-in-a-test-host-in-angular-5/51716105
            const linkDirective = debugElement.injector.get(TestTextValueHtmlLinkDirective);

            // simulate click event on a standoff link
            linkDirective.internalLinkHovered.emit('testIri');

            expect(testHostComponent.refResHovered).toEqual('testIri');

        });

        it('should display an existing value for a custom mapping as XML source code', () => {

            const newXml = new ReadTextValueAsXml();

            newXml.xml = '<?xml version="1.0" encoding="UTF-8"?><text><p>my updated text</p></text>';
            newXml.mapping = 'http://rdfh.ch/standoff/mappings/customMapping';

            newXml.id = 'id';

            testHostComponent.displayInputVal = newXml;

            testHostFixture.detectChanges();

            valueReadModeDebugElement = valueComponentDe.query(By.css('.rm-value'));

            valueReadModeNativeElement = valueReadModeDebugElement.nativeElement;

            expect(valueReadModeNativeElement.innerText).toEqual(
                '<?xml version="1.0" encoding="UTF-8"?><text><p>my updated text</p></text>');

            // custom mappings are not supported by this component
            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

        });

        it('should make an existing value editable', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            ckeditorDe = valueComponentDe.query(By.directive(TestCKEditorComponent));

            expect(testHostComponent.inputValueComponent.mode).toEqual('update');

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            expect(testHostComponent.inputValueComponent.valueFormControl.disabled).toBeFalsy();

            expect(ckeditorDe.componentInstance.value).toEqual('\n<p>test with <strong>markup</strong></p>');

            // simulate input in ckeditor
            ckeditorDe.componentInstance.value = '\n<p>test with a lot of <strong>markup</strong></p>';
            ckeditorDe.componentInstance._handleInput();

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

            const updatedValue = testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateTextValueAsXml).toBeTruthy();

            expect((updatedValue as UpdateTextValueAsXml).xml).toEqual('<?xml version="1.0" encoding="UTF-8"?><text>\n' +
                '<p>test with a lot of <strong>markup</strong></p></text>');

        });

        it('should not return an invalid update value', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            ckeditorDe = valueComponentDe.query(By.directive(TestCKEditorComponent));

            expect(testHostComponent.inputValueComponent.mode).toEqual('update');

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            expect(ckeditorDe.componentInstance.value).toEqual('\n<p>test with <strong>markup</strong></p>');

            // simulate input in ckeditor
            ckeditorDe.componentInstance.value = '';
            ckeditorDe.componentInstance._handleInput();

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            const updatedValue = testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue).toBeFalsy();

        });

        it('should restore the initially displayed value', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            ckeditorDe = valueComponentDe.query(By.directive(TestCKEditorComponent));

            expect(testHostComponent.inputValueComponent.mode).toEqual('update');

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            expect(ckeditorDe.componentInstance.value).toEqual('\n<p>test with <strong>markup</strong></p>');

            // simulate input in ckeditor
            ckeditorDe.componentInstance.value = '<p>updated text<p></p>';
            ckeditorDe.componentInstance._handleInput();

            testHostFixture.detectChanges();

            testHostComponent.inputValueComponent.resetFormControl();

            expect(ckeditorDe.componentInstance.value).toEqual('\n<p>test with <strong>markup</strong></p>');

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

        });

        it('should set a new display value', () => {

            const newXml = new ReadTextValueAsXml();

            newXml.xml = '<?xml version="1.0" encoding="UTF-8"?><text><p>my updated text</p></text>';
            newXml.mapping = Constants.StandardMapping;

            newXml.id = 'updatedId';

            testHostComponent.displayInputVal = newXml;

            testHostFixture.detectChanges();

            expect(valueReadModeNativeElement.innerHTML).toEqual('<p>my updated text</p>');

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

        });

        it('convert markup received from CKEditor: <i> -> <em>', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            ckeditorDe = valueComponentDe.query(By.directive(TestCKEditorComponent));

            // simulate input in ckeditor
            ckeditorDe.componentInstance.value = '<p>test <i>with</i> a lot of <i>markup</i></p>';
            ckeditorDe.componentInstance._handleInput();

            testHostFixture.detectChanges();

            expect((testHostComponent.inputValueComponent.getUpdatedValue() as UpdateTextValueAsXml).xml)
                .toEqual('<?xml version="1.0" encoding="UTF-8"?><text><p>test <em>with</em> a lot of <em>markup</em></p></text>');

        });

        it('convert markup received from CKEditor: <hr> -> <hr/>', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            ckeditorDe = valueComponentDe.query(By.directive(TestCKEditorComponent));

            // simulate input in ckeditor
            ckeditorDe.componentInstance.value = '<p>test with horizontal line <hr></p>';
            ckeditorDe.componentInstance._handleInput();

            testHostFixture.detectChanges();

            expect((testHostComponent.inputValueComponent.getUpdatedValue() as UpdateTextValueAsXml).xml)
                .toEqual('<?xml version="1.0" encoding="UTF-8"?><text><p>test with horizontal line <hr/></p></text>');

        });

        it('convert markup received from CKEditor: <br> -> <br/>', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            ckeditorDe = valueComponentDe.query(By.directive(TestCKEditorComponent));

            // simulate input in ckeditor
            ckeditorDe.componentInstance.value = '<p>test with soft break <br></p>';
            ckeditorDe.componentInstance._handleInput();

            testHostFixture.detectChanges();

            expect((testHostComponent.inputValueComponent.getUpdatedValue() as UpdateTextValueAsXml).xml)
                .toEqual('<?xml version="1.0" encoding="UTF-8"?><text><p>test with soft break <br/></p></text>');

        });

        it('convert markup received from CKEditor: <s></s> -> <strike></strike>', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            ckeditorDe = valueComponentDe.query(By.directive(TestCKEditorComponent));

            // simulate input in ckeditor
            ckeditorDe.componentInstance.value = '<p>test with <s>struck</s> word</p>';
            ckeditorDe.componentInstance._handleInput();

            testHostFixture.detectChanges();

            expect((testHostComponent.inputValueComponent.getUpdatedValue() as UpdateTextValueAsXml).xml)
                .toEqual('<?xml version="1.0" encoding="UTF-8"?><text><p>test with <strike>struck</strike> word</p></text>');

        });

        it('remove markup received from CKEditor: <figure class=""></figure>', () => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            ckeditorDe = valueComponentDe.query(By.directive(TestCKEditorComponent));

            // simulate input in ckeditor
            ckeditorDe.componentInstance.value = '<p><figure class="table"><table><tbody><tr><td>test</td><td>test</td></tr><tr><td>test</td><td>test</td></tr></tbody></table></figure></p>';
            ckeditorDe.componentInstance._handleInput();

            testHostFixture.detectChanges();

            expect((testHostComponent.inputValueComponent.getUpdatedValue() as UpdateTextValueAsXml).xml)
                .toEqual('<?xml version="1.0" encoding="UTF-8"?><text><p><table><tbody><tr><td>test</td><td>test</td></tr><tr><td>test</td><td>test</td></tr></tbody></table></p></text>');

        });

    });

    describe('create a text value with markup', () => {

        let testHostComponent: TestHostCreateValueComponent;
        let testHostFixture: ComponentFixture<TestHostCreateValueComponent>;
        let ckeditorDe: DebugElement;

        let valueComponentDe: DebugElement;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(TestHostCreateValueComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            const hostCompDe = testHostFixture.debugElement;

            ckeditorDe = hostCompDe.query(By.directive(TestCKEditorComponent));

            valueComponentDe = hostCompDe.query(By.directive(TextValueAsXMLComponent));
        });

        it('should create a value', () => {

            // simulate input in ckeditor
            ckeditorDe.componentInstance.value = '<p>created text<p></p>';
            ckeditorDe.componentInstance._handleInput();

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual('create');
            expect(testHostComponent.inputValueComponent.valueFormControl.disabled).toBeFalsy();

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

            const newValue = testHostComponent.inputValueComponent.getNewValue();

            expect(newValue instanceof CreateTextValueAsXml).toBeTruthy();

            expect((newValue as CreateTextValueAsXml).xml).toEqual('<?xml version="1.0" encoding="UTF-8"?><text><p>created text<p></p></text>');
            expect((newValue as CreateTextValueAsXml).mapping).toEqual(Constants.StandardMapping);
        });

        it('should reset form after cancellation', () => {
            ckeditorDe.componentInstance.value = '<p>created text<p></p>';
            ckeditorDe.componentInstance._handleInput();

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual('create');

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

            testHostComponent.inputValueComponent.resetFormControl();

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            expect(ckeditorDe.componentInstance.value).toEqual(null);

        });

    });

});
