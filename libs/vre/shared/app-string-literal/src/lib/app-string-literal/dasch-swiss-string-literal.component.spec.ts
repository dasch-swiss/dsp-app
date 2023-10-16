import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppStringLiteralComponent } from './dasch-swiss-string-literal.component';
import {DspApiConnectionToken} from "@dasch-swiss/vre/shared/app-config";
import {SessionService} from "@dasch-swiss/vre/shared/app-session";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {By} from "@angular/platform-browser";
import {HarnessLoader} from "@angular/cdk/testing";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";

class MockSessionService {
    getSession() {
        return {
            id: 1,
            user: {
                lang: 'rm', // mock the users language to 'rm'
                name: 'aUser',
                sysAdmin: false,
                projectAdmin: []
            }
        };
    }
}


describe('AppStringLiteralComponent', () => {
    let component: AppStringLiteralComponent;
    let fixture: ComponentFixture<AppStringLiteralComponent>;
    let loader: HarnessLoader;

    beforeEach(async () => {
        // empty spy object to use in the providers
        const dspConnSpy = {};

        await TestBed.configureTestingModule({
            imports: [BrowserAnimationsModule, AppStringLiteralComponent],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: dspConnSpy,
                },
                {
                    provide: SessionService,
                    useClass: MockSessionService
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AppStringLiteralComponent);
        component = fixture.componentInstance;

        // Provide the necessary inputs to the component
        component.placeholder = 'List label';
        component.value = [
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
        component.textarea = false;

        loader = TestbedHarnessEnvironment.loader(fixture);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display the correct value for a language input', () => {
        // Get the input element from the template
        const inputElement: HTMLInputElement = fixture.debugElement.query(By.css('.inputValue')).nativeElement;
        expect(inputElement.value).toBe('Mund'); // even if the component.language === en
    });

    it('should set the correct value on changing the language', () => {
        // Simulate selecting a language
        component.setLanguage('de');
        fixture.detectChanges();

        // Get the input element from the template
        const inputElement: HTMLInputElement = fixture.debugElement.query(By.css('.inputValue')).nativeElement;

        // Check the value of the input element
        expect(inputElement.value).toBe('Welt');
    });

    it('should retain the changed value after switching languages and back to the language with the changed value', () => {
        // Set an initial language
        component.setLanguage('de');
        fixture.detectChanges();

        // Get the input element from the template and set a new value
        const inputElement: HTMLInputElement = fixture.debugElement.query(By.css('.inputValue')).nativeElement;
        inputElement.value = 'Neue Welt';
        inputElement.dispatchEvent(new Event('input')); // Dispatch the input event to update the form control

        // Switch to a different language and then switch back
        component.setLanguage('en');
        fixture.detectChanges();
        component.setLanguage('de');
        fixture.detectChanges();

        // Check if the input value is the one you set earlier
        expect(inputElement.value).toBe('Neue Welt');
    });

});
