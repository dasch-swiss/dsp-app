import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, DebugElement, OnInit, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyInputHarness as MatInputHarness } from '@angular/material/legacy-input/testing';
import { MatMenuModule } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StringLiteral } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { SessionService } from '@dasch-swiss/vre/shared/app-session';
import { StringLiteralInputComponent } from './string-literal-input.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-string-literal-input
        #stringLiteralInputVal
        [placeholder]="'List label'"
        [value]="labels"
        [language]="language"
        [textarea]="isTextarea"
    >
    </app-string-literal-input>`,
})
class TestHostStringLiteralInputComponent implements OnInit {
    @ViewChild('stringLiteralInputVal')
    stringLiteralInputComponent: StringLiteralInputComponent;

    labels: StringLiteral[];

    language: string;

    isTextarea: boolean;

    ngOnInit() {
        this.labels = [
            {
                value: 'Welt',
                language: 'de',
            },
            {
                value: 'World',
                language: 'en',
            },
            {
                value: 'Monde',
                language: 'fr',
            },
            {
                value: 'Mondo',
                language: 'it',
            },
            {
                value: 'Mund',
                language: 'rm',
            },
        ];

        this.language = 'en';
    }
}

describe('StringLiteralInputComponent', () => {
    let testHostComponent: TestHostStringLiteralInputComponent;
    let testHostFixture: ComponentFixture<TestHostStringLiteralInputComponent>;
    let loader: HarnessLoader;

    let sliComponentDe: DebugElement;
    let sliMenuDebugElement: DebugElement;
    let sliMenuNativeElement;
    let langButton;

    beforeEach(waitForAsync(() => {
        // empty spy object to use in the providers for the SessionService injection
        const dspConnSpy = {};

        TestBed.configureTestingModule({
            declarations: [
                StringLiteralInputComponent,
                TestHostStringLiteralInputComponent,
            ],
            imports: [
                MatMenuModule,
                MatInputModule,
                MatIconModule,
                MatButtonToggleModule,
                MatFormFieldModule,
                BrowserAnimationsModule,
                ReactiveFormsModule,
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: dspConnSpy,
                },
                SessionService,
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(
            TestHostStringLiteralInputComponent
        );
        testHostComponent = testHostFixture.componentInstance;
        loader = TestbedHarnessEnvironment.loader(testHostFixture);
        testHostFixture.detectChanges();
        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.stringLiteralInputComponent).toBeTruthy();

        const hostCompDe = testHostFixture.debugElement;
        sliComponentDe = hostCompDe.query(
            By.directive(StringLiteralInputComponent)
        );

        expect(sliComponentDe).toBeTruthy();
    });

    it('should load values and assign them to the correct language', async () => {
        const inputElement = await loader.getHarness(
            MatInputHarness.with({ selector: '.inputValue' })
        );

        expect(await inputElement.getValue()).toEqual('World');

        const langSelectButtonElement = await loader.getHarness(
            MatButtonHarness.with({ selector: '.select-lang' })
        );

        expect(langSelectButtonElement).toBeTruthy();

        // open language select button
        await langSelectButtonElement.click();

        // get reference to the mat-menu
        sliMenuDebugElement = sliComponentDe.query(By.css('.lang-menu'));

        // get reference to mat-menu native element in order to be able to access the buttons
        sliMenuNativeElement = sliMenuDebugElement.nativeElement;

        // select 'de' button
        langButton = sliMenuNativeElement.children[0].children[0];

        // simulate a user click on the button element to switch input value to the german value
        langButton.click();

        // expect the value of the german input to equal 'Welt'
        expect(await inputElement.getValue()).toEqual('Welt');

        // select 'fr' button
        langButton = sliMenuNativeElement.children[0].children[1];

        // switch to french
        langButton.click();

        // expect the value of the french input to equal 'Monde'
        expect(await inputElement.getValue()).toEqual('Monde');

        // select 'it' button
        langButton = sliMenuNativeElement.children[0].children[2];

        // switch to italian
        langButton.click();

        // expect the value of the italian input to equal 'Mondo'
        expect(await inputElement.getValue()).toEqual('Mondo');

        // select 'rm' button
        langButton = sliMenuNativeElement.children[0].children[4];

        // switch to romansh
        langButton.click();

        // expect the value of the romansh input to equal 'Mund'
        expect(await inputElement.getValue()).toEqual('Mund');
    });

    it('should change a value and assign it to the correct language', async () => {
        const inputElement = await loader.getHarness(
            MatInputHarness.with({ selector: '.inputValue' })
        );

        const langSelectButtonElement = await loader.getHarness(
            MatButtonHarness.with({ selector: '.select-lang' })
        );

        expect(langSelectButtonElement).toBeTruthy();

        // open language select button
        await langSelectButtonElement.click();

        // get reference to the mat-menu
        sliMenuDebugElement = sliComponentDe.query(By.css('.lang-menu'));

        // get reference to mat-menu native element in order to be able to access the buttons
        sliMenuNativeElement = sliMenuDebugElement.nativeElement;

        // select 'de' button
        langButton = sliMenuNativeElement.children[0].children[0];

        // simulate a user click on the button element to switch input value to the german value
        langButton.click();

        // expect the value of the german input to equal 'Welt'
        expect(await inputElement.getValue()).toEqual('Welt');

        // set new value for the german text
        await inputElement.setValue('neue Welt');

        // select 'fr' button
        langButton = sliMenuNativeElement.children[0].children[1];

        // switch to french
        langButton.click();

        // expect the value of the french input to equal 'Monde'
        expect(await inputElement.getValue()).toEqual('Monde');

        // select 'de' button
        langButton = sliMenuNativeElement.children[0].children[0];

        // switch back to german
        langButton.click();

        // expect the value to equal the new value given earlier
        expect(await inputElement.getValue()).toEqual('neue Welt');
    });

    it('should switch input to a textarea and assign the values to the correct language', async () => {
        testHostComponent.isTextarea = true;

        testHostFixture.detectChanges();

        const inputElement = await loader.getHarness(
            MatInputHarness.with({ selector: '.textAreaValue' })
        );

        // get reference to the mat-menu
        sliMenuDebugElement = sliComponentDe.query(
            By.css('.string-literal-select-lang')
        );

        // get reference to mat-menu native element in order to be able to access the buttons
        sliMenuNativeElement = sliMenuDebugElement.nativeElement;

        // select 'de' button
        langButton = sliMenuNativeElement.children[0];

        // simulate a user click on the button element to switch input value to the german value
        langButton.click();

        // expect the value of the german input to equal 'Welt'
        expect(await inputElement.getValue()).toEqual('Welt');

        // select 'fr' button
        langButton = sliMenuNativeElement.children[1];

        // switch to french
        langButton.click();

        // expect the value of the french input to equal 'Monde'
        expect(await inputElement.getValue()).toEqual('Monde');

        // select 'it' button
        langButton = sliMenuNativeElement.children[2];

        // switch to italian
        langButton.click();

        // expect the value of the italian input to equal 'Mondo'
        expect(await inputElement.getValue()).toEqual('Mondo');

        // select 'en' button
        langButton = sliMenuNativeElement.children[3];

        // switch to english
        langButton.click();

        // expect the value of the english input to equal 'World'
        expect(await inputElement.getValue()).toEqual('World');

        // select 'rm' button
        langButton = sliMenuNativeElement.children[4];

        // switch to english
        langButton.click();

        // expect the value of the romansh input to equal 'Mund'
        expect(await inputElement.getValue()).toEqual('Mund');
    });

    it('should store a new value inside a textarea in the correct language', async () => {
        testHostComponent.isTextarea = true;

        testHostFixture.detectChanges();

        const inputElement = await loader.getHarness(
            MatInputHarness.with({ selector: '.textAreaValue' })
        );

        // get reference to the mat-menu
        sliMenuDebugElement = sliComponentDe.query(
            By.css('.string-literal-select-lang')
        );

        // get reference to mat-menu native element in order to be able to access the buttons
        sliMenuNativeElement = sliMenuDebugElement.nativeElement;

        // select 'en' button
        langButton = sliMenuNativeElement.children[3];

        // switch to english
        langButton.click();

        // expect the value of the english input to equal 'World'
        expect(await inputElement.getValue()).toEqual('World');

        // set new value for the german text
        await inputElement.setValue('Brave New World');

        // select 'de' button
        langButton = sliMenuNativeElement.children[0];

        // simulate a user click on the button element to switch input value to the german value
        langButton.click();

        // expect the value of the german input to equal 'Welt'
        expect(await inputElement.getValue()).toEqual('Welt');

        // select 'en' button again
        langButton = sliMenuNativeElement.children[3];

        // switch back to english
        langButton.click();

        // expect the value of the english input to equal the new value 'Brave New World'
        expect(await inputElement.getValue()).toEqual('Brave New World');
    });

    it('should update values and assign them to the correct language when langauges object is changed', async () => {
        const inputElement = await loader.getHarness(
            MatInputHarness.with({ selector: '.inputValue' })
        );

        expect(await inputElement.getValue()).toEqual('World');

        testHostComponent.labels = [
            {
                value: 'Welt',
                language: 'de',
            },
            {
                value: 'Brave New World',
                language: 'en',
            },
            {
                value: 'Monde',
                language: 'fr',
            },
            {
                value: 'Mondo',
                language: 'it',
            },
            {
                value: 'Mund',
                language: 'rm',
            },
        ];

        testHostFixture.detectChanges();

        expect(await inputElement.getValue()).toEqual('Brave New World');
    });
});
