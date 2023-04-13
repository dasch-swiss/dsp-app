import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
    Component,
    forwardRef,
    Inject,
    Input,
    OnInit,
    ViewChild,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
    ControlValueAccessor,
    UntypedFormBuilder,
    UntypedFormGroup,
    NgControl,
    NG_VALUE_ACCESSOR,
    ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import {
    MatLegacyFormFieldControl as MatFormFieldControl,
    MatLegacyFormFieldModule as MatFormFieldModule,
} from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyInputHarness as MatInputHarness } from '@angular/material/legacy-input/testing';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { KnoraDate } from '@dasch-swiss/dsp-js';
import { Subject } from 'rxjs';
import { ValueLiteral } from '../operator';
import { SearchDateValueComponent } from './search-date-value.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-search-date-value
        #dateVal
        [formGroup]="form"
    ></app-search-date-value>`,
})
class TestHostComponent implements OnInit {
    @ViewChild('dateVal', { static: false })
    searchDateValComp: SearchDateValueComponent;

    form: UntypedFormGroup;

    constructor(private _fb: UntypedFormBuilder) {}

    ngOnInit() {
        this.form = this._fb.group({
            dateValue: [new KnoraDate('JULIAN', 'CE', 2018, 5, 19)],
        });
    }
}

@Component({
    selector: 'app-date-picker',
    template: '',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: forwardRef(() => TestDatePickerComponent),
        },
        { provide: MatFormFieldControl, useExisting: TestDatePickerComponent },
    ],
})
class TestDatePickerComponent
    implements ControlValueAccessor, MatFormFieldControl<any>
{
    @Input() value;
    @Input() disabled: boolean;
    @Input() empty: boolean;
    @Input() placeholder: string;
    @Input() required: boolean;
    @Input() shouldLabelFloat: boolean;
    @Input() errorStateMatcher: ErrorStateMatcher;
    @Input() valueRequiredValidator = true;

    @Input() calendar: string;
    stateChanges = new Subject<void>();

    errorState = false;
    focused = false;
    id = 'testid';
    ngControl: NgControl | null;
    onChange = (_: any) => {};

    writeValue(date: KnoraDate | null): void {
        this.value = date;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {}

    onContainerClick(event: MouseEvent): void {}

    setDescribedByIds(ids: string[]): void {}

    _handleInput(): void {
        this.onChange(this.value);
    }
}

describe('SearchDateValueComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let loader: HarnessLoader;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                SearchDateValueComponent,
                TestDatePickerComponent,
                TestHostComponent,
            ],
            imports: [
                BrowserAnimationsModule,
                MatButtonModule,
                MatFormFieldModule,
                MatIconModule,
                MatInputModule,
                MatMenuModule,
                ReactiveFormsModule,
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        loader = TestbedHarnessEnvironment.loader(testHostFixture);
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
    });

    it('should create', () => {
        expect(testHostComponent.searchDateValComp).toBeTruthy();
    });

    it('should get a date', async () => {
        // set date from date picker
        testHostComponent.searchDateValComp.form.controls['dateValue'].setValue(
            new KnoraDate('JULIAN', 'CE', 2018, 5, 19)
        );

        const julianDate = new ValueLiteral(
            'JULIAN:2018-5-19:2018-5-19',
            'http://api.knora.org/ontology/knora-api/simple/v2#Date'
        );

        const dateVal = testHostComponent.searchDateValComp.getValue();

        expect(dateVal).toEqual(julianDate);
    });
});
