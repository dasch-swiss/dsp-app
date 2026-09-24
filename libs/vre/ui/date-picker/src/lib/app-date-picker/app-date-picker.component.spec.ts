import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { KnoraDate } from '@dasch-swiss/dsp-js';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { AppDatePickerComponent } from './app-date-picker.component';

describe('DatePickerComponent', () => {
  let component: AppDatePickerComponent;
  let fixture: ComponentFixture<AppDatePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppDatePickerComponent,
        BrowserAnimationsModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatMenuModule,
        MatSelectModule,
        ReactiveFormsModule,
      ],
      providers: [Subject, provideTranslateService(), TranslateService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppDatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('switching the calendar (DEV-7372)', () => {
    // Before this, switching the calendar kept the numerals and relabelled them: 15.06.2024
    // Gregorian became 15.06.2024 Julian, a different day, saved with no warning.
    const switchTo = (calendar: string) => {
      component.form.controls['calendar'].setValue(calendar);
      fixture.detectChanges();
    };

    it('converts the entered date to the same day in the new calendar', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      switchTo('JULIAN');

      expect(component.value?.calendar).toBe('JULIAN');
      expect(component.value?.year).toBe(2024);
      expect(component.value?.month).toBe(6);
      expect(component.value?.day).toBe(2);
    });

    it('does not merely relabel the entered numerals', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      switchTo('JULIAN');

      expect(component.value?.day).not.toBe(15);
    });

    it('round-trips back to the original day when switched back', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      switchTo('JULIAN');
      switchTo('GREGORIAN');

      expect(component.value?.day).toBe(15);
      expect(component.value?.month).toBe(6);
      expect(component.value?.year).toBe(2024);
    });

    it('converts into the Islamic calendar', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      switchTo('ISLAMIC');

      expect(component.value?.calendar).toBe('ISLAMIC');
      expect(component.value?.year).toBe(1445);
      expect(component.value?.month).toBe(12);
      expect(component.value?.day).toBe(8);
    });

    it('keeps a year-precision date year-precision, taking the start of the span', () => {
      component.value = new KnoraDate('JULIAN', 'CE', 1582);

      switchTo('GREGORIAN');

      expect(component.value?.year).toBe(1582);
      expect(component.value?.month).toBeUndefined();
      expect(component.value?.day).toBeUndefined();
    });

    it('preserves BCE across a conversion', () => {
      component.value = new KnoraDate('JULIAN', 'BCE', 44, 3, 15);

      switchTo('GREGORIAN');

      expect(component.value?.era).toBe('BCE');
      expect(component.value?.year).toBe(44);
    });

    it('leaves an empty picker alone, since there is nothing to convert', () => {
      switchTo('JULIAN');

      expect(component.form.controls['calendar'].value).toBe('JULIAN');
    });
  });
});
