import { Component, OnInit, ViewChild, DebugElement } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormGroup, UntypedFormBuilder, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GregorianCalendarDate, CalendarPeriod, CalendarDate } from '@dasch-swiss/jdnconvertiblecalendar';
import { MatJDNConvertibleCalendarDateAdapterModule } from '@dasch-swiss/jdnconvertiblecalendardateadapter';
import { JDNDatepickerDirective } from '../../jdn-datepicker-directive/jdndatepicker.directive';
import { TimeInputComponent, DateTime } from './time-input.component';

/**
 * test host component to simulate parent component.
 */
@Component({
  template: ` <div [formGroup]="form">
    <mat-form-field>
      <app-time-input #timeInput [formControlName]="'time'"></app-time-input>
    </mat-form-field>
  </div>`,
})
class TestHostComponent implements OnInit {
  @ViewChild('timeInput') timeInputComponent: TimeInputComponent;

  form: UntypedFormGroup;

  constructor(private _fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.form = this._fb.group({
      time: '2019-08-06T12:00:00Z',
    });
  }
}

/**
 * test host component to simulate parent component.
 */
@Component({
  template: ` <div [formGroup]="form">
    <mat-form-field>
      <app-time-input #timeInput [formControlName]="'time'" [valueRequiredValidator]="false"></app-time-input>
    </mat-form-field>
  </div>`,
})
class NoValueRequiredTestHostComponent implements OnInit {
  @ViewChild('timeInput') timeInputComponent: TimeInputComponent;

  form: UntypedFormGroup;

  constructor(private _fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.form = this._fb.group({
      time: new UntypedFormControl(null),
    });
  }
}

describe('TimeInputComponent', () => {
  let testHostComponent: TestHostComponent;
  let testHostFixture: ComponentFixture<TestHostComponent>;

  let datetimeInputComponentDe: DebugElement;
  let dateInputDebugElement: DebugElement;
  let dateInputNativeElement;
  let timeInputDebugElement: DebugElement;
  let timeInputNativeElement;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatJDNConvertibleCalendarDateAdapterModule,
        BrowserAnimationsModule,
      ],
      declarations: [TimeInputComponent, TestHostComponent, JDNDatepickerDirective],
    }).compileComponents();
  }));

  beforeEach(() => {
    testHostFixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = testHostFixture.componentInstance;
    testHostFixture.detectChanges();

    expect(testHostComponent).toBeTruthy();
    expect(testHostComponent.timeInputComponent).toBeTruthy();

    const hostCompDe = testHostFixture.debugElement;
    datetimeInputComponentDe = hostCompDe.query(By.directive(TimeInputComponent));

    dateInputDebugElement = datetimeInputComponentDe.query(By.css('input.date'));
    dateInputNativeElement = dateInputDebugElement.nativeElement;

    timeInputDebugElement = datetimeInputComponentDe.query(By.css('input.time'));
    timeInputNativeElement = timeInputDebugElement.nativeElement;
  });

  it('should initialize the date correctly', () => {
    expect(dateInputNativeElement.value).toEqual('06-08-2019');

    expect(timeInputNativeElement.value).toEqual('14:00');
  });

  it('should propagate changes made by the user', () => {
    testHostComponent.form.controls.time.setValue('1993-10-10T11:00:00Z');

    dateInputNativeElement.dispatchEvent(new Event('input'));

    testHostFixture.detectChanges();

    expect(testHostComponent.form.controls.time).toBeTruthy();
    expect(testHostComponent.form.controls.time.value).toEqual('1993-10-10T11:00:00Z');

    timeInputNativeElement.value = '17:00';

    timeInputNativeElement.dispatchEvent(new Event('input'));

    testHostFixture.detectChanges();

    expect(testHostComponent.form.controls.time).toBeTruthy();
    expect(testHostComponent.form.controls.time.value).toEqual('1993-10-10T16:00:00Z');
  });

  it('should return a timestamp from userInputToTimestamp()', () => {
    const calendarDate = new CalendarDate(1993, 10, 10);
    const gcd = new GregorianCalendarDate(new CalendarPeriod(calendarDate, calendarDate));
    const userInput = new DateTime(gcd, '12:00');

    const timestamp = testHostComponent.timeInputComponent.userInputToTimestamp(userInput);

    expect(timestamp).toEqual('1993-10-10T11:00:00Z');
  });

  it('should return a DateTime from convertTimestampToDateTime()', () => {
    const timestamp = '1993-10-10T11:00:00Z';

    const dateTime = testHostComponent.timeInputComponent.convertTimestampToDateTime(timestamp);

    expect(dateTime.date.toCalendarPeriod().periodStart.year).toEqual(1993);
    expect(dateTime.date.toCalendarPeriod().periodStart.month).toEqual(10);
    expect(dateTime.date.toCalendarPeriod().periodStart.day).toEqual(10);

    expect(dateTime.time).toEqual('12:00');
  });

  it("should mark the form's validity correctly", () => {
    expect(testHostComponent.timeInputComponent.valueRequiredValidator).toBe(true);
    expect(testHostComponent.timeInputComponent.form.valid).toBe(true);

    testHostComponent.timeInputComponent.timeFormControl.setValue(null);

    testHostComponent.timeInputComponent._handleInput();

    expect(testHostComponent.timeInputComponent.form.valid).toBe(false);

    testHostComponent.timeInputComponent.timeFormControl.setValue('');

    testHostComponent.timeInputComponent._handleInput();

    expect(testHostComponent.timeInputComponent.form.valid).toBe(false);
  });
});

describe('TimeInputComponent no value required', () => {
  let testHostComponent: NoValueRequiredTestHostComponent;
  let testHostFixture: ComponentFixture<NoValueRequiredTestHostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatJDNConvertibleCalendarDateAdapterModule,
        BrowserAnimationsModule,
      ],
      declarations: [TimeInputComponent, NoValueRequiredTestHostComponent, JDNDatepickerDirective],
    }).compileComponents();
  }));

  beforeEach(() => {
    testHostFixture = TestBed.createComponent(NoValueRequiredTestHostComponent);
    testHostComponent = testHostFixture.componentInstance;
    testHostFixture.detectChanges();

    expect(testHostComponent).toBeTruthy();
  });

  it('should receive the propagated valueRequiredValidator from the parent component', () => {
    expect(testHostComponent.timeInputComponent.valueRequiredValidator).toBe(false);
  });

  it("should mark the form's validity correctly", () => {
    expect(testHostComponent.timeInputComponent.form.valid).toBe(true);

    testHostComponent.timeInputComponent.timeFormControl.setValue('2019-08-06T12:00:00Z');

    testHostComponent.timeInputComponent._handleInput();

    expect(testHostComponent.timeInputComponent.form.valid).toBe(false);
  });
});
