/**
 * Tests for DateInputComponent.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createDate } from '@dasch-swiss/vre/shared/calendar';
import { DateInputComponent } from './date-input.component';

describe('DateInputComponent', () => {
  let component: DateInputComponent;
  let fixture: ComponentFixture<DateInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateInputComponent, ReactiveFormsModule, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DateInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ControlValueAccessor', () => {
    it('should write value to form control', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      component.writeValue(date);

      expect(component.dateControl.value).toEqual(date);
    });

    it('should accept null value', () => {
      component.writeValue(null);

      expect(component.dateControl.value).toBeNull();
    });

    it('should register onChange callback', () => {
      const callback = jest.fn();
      component.registerOnChange(callback);

      const date = createDate('GREGORIAN', 2024, 1, 15);
      component.onDateChange(date);

      expect(callback).toHaveBeenCalledWith(date);
    });

    it('should register onTouched callback', () => {
      const callback = jest.fn();
      component.registerOnTouched(callback);

      component.onDateChange(null);

      expect(callback).toHaveBeenCalled();
    });

    it('should disable form control', () => {
      component.setDisabledState(true);

      expect(component.dateControl.disabled).toBe(true);
      expect(component.isDisabled()).toBe(true);
    });

    it('should enable form control', () => {
      component.setDisabledState(true);
      component.setDisabledState(false);

      expect(component.dateControl.disabled).toBe(false);
      expect(component.isDisabled()).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate required field', () => {
      component.required = true;
      component.dateControl.setValue(null);

      const errors = component.validate();

      expect(errors).toEqual({ required: true });
    });

    it('should pass validation with valid date', () => {
      component.required = true;
      const date = createDate('GREGORIAN', 2024, 1, 15);
      component.dateControl.setValue(date);

      const errors = component.validate();

      expect(errors).toBeNull();
    });

    it('should not validate non-required empty field', () => {
      component.required = false;
      component.dateControl.setValue(null);

      const errors = component.validate();

      expect(errors).toBeNull();
    });
  });

  describe('Date operations', () => {
    it('should clear date', () => {
      const callback = jest.fn();
      component.registerOnChange(callback);

      const date = createDate('GREGORIAN', 2024, 1, 15);
      component.dateControl.setValue(date);

      component.clear();

      expect(component.dateControl.value).toBeNull();
      expect(callback).toHaveBeenCalledWith(null);
    });

    it('should handle date change', () => {
      const callback = jest.fn();
      component.registerOnChange(callback);

      const date = createDate('GREGORIAN', 2024, 1, 15);
      component.onDateChange(date);

      expect(callback).toHaveBeenCalledWith(date);
    });
  });

  describe('Calendar system', () => {
    it('should default to GREGORIAN', () => {
      expect(component['_calendarSystem']()).toBe('GREGORIAN');
    });

    it('should accept calendar system change', () => {
      component.calendarSystem = 'JULIAN';
      expect(component['_calendarSystem']()).toBe('JULIAN');
    });
  });

  describe('Input properties', () => {
    it('should accept label', () => {
      component.label = 'Birth Date';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Birth Date');
    });

    it('should accept placeholder', () => {
      component.placeholder = 'Enter date';
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input.placeholder).toBe('Enter date');
    });

    it('should accept hint', () => {
      component.hint = 'Format: YYYY-MM-DD';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Format: YYYY-MM-DD');
    });

    it('should accept min date', () => {
      const minDate = createDate('GREGORIAN', 2024, 1, 1);
      component.minDate = minDate;
      fixture.detectChanges();

      expect(component.minDate).toEqual(minDate);
    });

    it('should accept max date', () => {
      const maxDate = createDate('GREGORIAN', 2024, 12, 31);
      component.maxDate = maxDate;
      fixture.detectChanges();

      expect(component.maxDate).toEqual(maxDate);
    });
  });

  describe('Error messages', () => {
    it('should display required error message', () => {
      component.dateControl.setErrors({ required: true });
      const message = component.getErrorMessage();

      expect(message).toBe('Date is required');
    });

    it('should display invalid date error message', () => {
      component.dateControl.setErrors({ invalidDate: true });
      const message = component.getErrorMessage();

      expect(message).toBe('Invalid date');
    });

    it('should display min date error message', () => {
      component.dateControl.setErrors({ matDatepickerMin: true });
      const message = component.getErrorMessage();

      expect(message).toBe('Date is before minimum allowed date');
    });

    it('should display max date error message', () => {
      component.dateControl.setErrors({ matDatepickerMax: true });
      const message = component.getErrorMessage();

      expect(message).toBe('Date is after maximum allowed date');
    });

    it('should display default error message', () => {
      component.dateControl.setErrors({ unknown: true });
      const message = component.getErrorMessage();

      expect(message).toBe('Invalid date');
    });
  });

  describe('Integration with forms', () => {
    it('should work with reactive forms', () => {
      const formControl = new FormControl(createDate('GREGORIAN', 2024, 1, 15));

      component.writeValue(formControl.value);

      expect(component.dateControl.value).toEqual(formControl.value);
    });

    it('should propagate value changes to form', () => {
      const callback = jest.fn();
      component.registerOnChange(callback);

      const newDate = createDate('GREGORIAN', 2024, 6, 15);
      component.onDateChange(newDate);

      expect(callback).toHaveBeenCalledWith(newDate);
    });
  });
});
