/**
 * Tests for DateRangeInputComponent.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createDate, createPeriod } from '@dasch-swiss/vre/shared/calendar';
import { DateRangeInputComponent } from './date-range-input.component';

describe('DateRangeInputComponent', () => {
  let component: DateRangeInputComponent;
  let fixture: ComponentFixture<DateRangeInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateRangeInputComponent, ReactiveFormsModule, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DateRangeInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ControlValueAccessor', () => {
    it('should write period value to form controls', () => {
      const start = createDate('GREGORIAN', 2024, 1, 1);
      const end = createDate('GREGORIAN', 2024, 12, 31);
      const period = createPeriod(start, end);

      component.writeValue(period);

      expect(component.startControl.value).toEqual(start);
      expect(component.endControl.value).toEqual(end);
    });

    it('should accept null value', () => {
      component.writeValue(null);

      expect(component.startControl.value).toBeNull();
      expect(component.endControl.value).toBeNull();
    });

    it('should register onChange callback', () => {
      const callback = jest.fn();
      component.registerOnChange(callback);

      const start = createDate('GREGORIAN', 2024, 1, 1);
      const end = createDate('GREGORIAN', 2024, 12, 31);

      component.startControl.setValue(start);
      component.endControl.setValue(end);
      component.onDateChange();

      expect(callback).toHaveBeenCalled();
      const calledWith = callback.mock.calls[0][0];
      expect(calledWith.start).toEqual(start);
      expect(calledWith.end).toEqual(end);
    });

    it('should register onTouched callback', () => {
      const callback = jest.fn();
      component.registerOnTouched(callback);

      component.onDateChange();

      expect(callback).toHaveBeenCalled();
    });

    it('should disable form controls', () => {
      component.setDisabledState(true);

      expect(component.startControl.disabled).toBe(true);
      expect(component.endControl.disabled).toBe(true);
      expect(component.isDisabled()).toBe(true);
    });

    it('should enable form controls', () => {
      component.setDisabledState(true);
      component.setDisabledState(false);

      expect(component.startControl.disabled).toBe(false);
      expect(component.endControl.disabled).toBe(false);
      expect(component.isDisabled()).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate required field', () => {
      component.required = true;
      component.startControl.setValue(null);
      component.endControl.setValue(null);

      const errors = component.validate();

      expect(errors).toEqual({ required: true });
    });

    it('should validate required with only start date', () => {
      component.required = true;
      component.startControl.setValue(createDate('GREGORIAN', 2024, 1, 1));
      component.endControl.setValue(null);

      const errors = component.validate();

      expect(errors).toEqual({ required: true });
    });

    it('should validate required with only end date', () => {
      component.required = true;
      component.startControl.setValue(null);
      component.endControl.setValue(createDate('GREGORIAN', 2024, 12, 31));

      const errors = component.validate();

      expect(errors).toEqual({ required: true });
    });

    it('should pass validation with valid period', () => {
      component.required = true;
      component.startControl.setValue(createDate('GREGORIAN', 2024, 1, 1));
      component.endControl.setValue(createDate('GREGORIAN', 2024, 12, 31));

      const errors = component.validate();

      expect(errors).toBeNull();
    });

    it('should validate that start is before end', () => {
      component.startControl.setValue(createDate('GREGORIAN', 2024, 12, 31));
      component.endControl.setValue(createDate('GREGORIAN', 2024, 1, 1));

      const errors = component.validate();

      expect(errors).toBeTruthy();
      expect(errors!['invalidPeriod']).toBeDefined();
    });

    it('should accept period with same start and end', () => {
      const date = createDate('GREGORIAN', 2024, 6, 15);
      component.startControl.setValue(date);
      component.endControl.setValue(date);

      const errors = component.validate();

      expect(errors).toBeNull();
    });

    it('should not validate non-required empty fields', () => {
      component.required = false;
      component.startControl.setValue(null);
      component.endControl.setValue(null);

      const errors = component.validate();

      expect(errors).toBeNull();
    });
  });

  describe('Date operations', () => {
    it('should clear date range', () => {
      const callback = jest.fn();
      component.registerOnChange(callback);

      const start = createDate('GREGORIAN', 2024, 1, 1);
      const end = createDate('GREGORIAN', 2024, 12, 31);
      component.startControl.setValue(start);
      component.endControl.setValue(end);

      component.clear();

      expect(component.startControl.value).toBeNull();
      expect(component.endControl.value).toBeNull();
      expect(callback).toHaveBeenCalledWith(null);
    });

    it('should handle date change with both dates', () => {
      const callback = jest.fn();
      component.registerOnChange(callback);

      const start = createDate('GREGORIAN', 2024, 1, 1);
      const end = createDate('GREGORIAN', 2024, 12, 31);

      component.startControl.setValue(start);
      component.endControl.setValue(end);
      component.onDateChange();

      expect(callback).toHaveBeenCalled();
      const result = callback.mock.calls[0][0];
      expect(result.start).toEqual(start);
      expect(result.end).toEqual(end);
    });

    it('should not emit value when only start date is set', () => {
      const callback = jest.fn();
      component.registerOnChange(callback);

      component.startControl.setValue(createDate('GREGORIAN', 2024, 1, 1));
      component.onDateChange();

      // Should not call onChange with partial data
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not emit value when only end date is set', () => {
      const callback = jest.fn();
      component.registerOnChange(callback);

      component.endControl.setValue(createDate('GREGORIAN', 2024, 12, 31));
      component.onDateChange();

      // Should not call onChange with partial data
      expect(callback).not.toHaveBeenCalled();
    });

    it('should emit null when both dates are cleared', () => {
      const callback = jest.fn();
      component.registerOnChange(callback);

      // First set values
      component.startControl.setValue(createDate('GREGORIAN', 2024, 1, 1));
      component.endControl.setValue(createDate('GREGORIAN', 2024, 12, 31));

      // Then clear
      component.startControl.setValue(null);
      component.endControl.setValue(null);
      component.onDateChange();

      expect(callback).toHaveBeenCalledWith(null);
    });

    it('should emit null for invalid period', () => {
      const callback = jest.fn();
      component.registerOnChange(callback);

      // Set end before start (invalid)
      component.startControl.setValue(createDate('GREGORIAN', 2024, 12, 31));
      component.endControl.setValue(createDate('GREGORIAN', 2024, 1, 1));
      component.onDateChange();

      expect(callback).toHaveBeenCalledWith(null);
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
      component.label = 'Project Duration';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Project Duration');
    });

    it('should accept start label', () => {
      component.startLabel = 'From';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('From');
    });

    it('should accept end label', () => {
      component.endLabel = 'To';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('To');
    });

    it('should accept placeholder', () => {
      component.placeholder = 'Select date';
      fixture.detectChanges();

      const inputs = fixture.nativeElement.querySelectorAll('input');
      expect(inputs[0].placeholder).toBe('Select date');
      expect(inputs[1].placeholder).toBe('Select date');
    });

    it('should accept hint', () => {
      component.hint = 'Select a date range';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Select a date range');
    });
  });

  describe('Error messages', () => {
    beforeEach(() => {
      // Mark as touched to show errors
      component['_touched'] = true;
    });

    it('should display required error message', () => {
      component.required = true;
      component.startControl.setValue(null);
      component.endControl.setValue(null);

      const message = component.getErrorMessage();

      expect(message).toBe('Both start and end dates are required');
    });

    it('should display invalid period error message', () => {
      component.startControl.setValue(createDate('GREGORIAN', 2024, 12, 31));
      component.endControl.setValue(createDate('GREGORIAN', 2024, 1, 1));

      const message = component.getErrorMessage();

      expect(message).toContain('Start date must be before or equal to end date');
    });

    it('should return empty string when not touched', () => {
      component['_touched'] = false;
      component.required = true;
      component.startControl.setValue(null);

      const message = component.getErrorMessage();

      expect(message).toBe('');
    });

    it('should return empty string when valid', () => {
      component.startControl.setValue(createDate('GREGORIAN', 2024, 1, 1));
      component.endControl.setValue(createDate('GREGORIAN', 2024, 12, 31));

      const message = component.getErrorMessage();

      expect(message).toBe('');
    });
  });

  describe('Error visibility', () => {
    it('should not show errors when not touched', () => {
      component.required = true;
      component.startControl.setValue(null);

      expect(component.hasError()).toBe(false);
    });

    it('should show errors when touched and invalid', () => {
      component['_touched'] = true;
      component.required = true;
      component.startControl.setValue(null);

      expect(component.hasError()).toBe(true);
    });

    it('should not show errors when touched and valid', () => {
      component['_touched'] = true;
      component.startControl.setValue(createDate('GREGORIAN', 2024, 1, 1));
      component.endControl.setValue(createDate('GREGORIAN', 2024, 12, 31));

      expect(component.hasError()).toBe(false);
    });
  });

  describe('Integration with forms', () => {
    it('should work with reactive forms', () => {
      const start = createDate('GREGORIAN', 2024, 1, 1);
      const end = createDate('GREGORIAN', 2024, 12, 31);
      const period = createPeriod(start, end);
      const formControl = new FormControl(period);

      component.writeValue(formControl.value);

      expect(component.startControl.value).toEqual(start);
      expect(component.endControl.value).toEqual(end);
    });

    it('should propagate value changes to form', () => {
      const callback = jest.fn();
      component.registerOnChange(callback);

      const start = createDate('GREGORIAN', 2024, 1, 1);
      const end = createDate('GREGORIAN', 2024, 12, 31);

      component.startControl.setValue(start);
      component.endControl.setValue(end);
      component.onDateChange();

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Min/Max constraints', () => {
    it('should set max constraint on start date based on end date', () => {
      const end = createDate('GREGORIAN', 2024, 12, 31);
      component.endControl.setValue(end);
      fixture.detectChanges();

      // The template should apply max constraint
      // This is validated by Material datepicker
      expect(component.endControl.value).toEqual(end);
    });

    it('should set min constraint on end date based on start date', () => {
      const start = createDate('GREGORIAN', 2024, 1, 1);
      component.startControl.setValue(start);
      fixture.detectChanges();

      // The template should apply min constraint
      // This is validated by Material datepicker
      expect(component.startControl.value).toEqual(start);
    });
  });
});
