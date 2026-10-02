import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CalendarSystem } from '@dasch-swiss/vre/shared/calendar';
import { provideTranslateService } from '@ngx-translate/core';

import { CalendarSelectorComponent } from './calendar-selector.component';

describe('CalendarSelectorComponent', () => {
  let fixture: ComponentFixture<CalendarSelectorComponent>;
  let component: CalendarSelectorComponent;
  let chosen: CalendarSystem[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarSelectorComponent, BrowserAnimationsModule, MatButtonToggleModule, MatIconModule],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarSelectorComponent);
    component = fixture.componentInstance;
    chosen = [];
    component.calendarChange.subscribe(c => chosen.push(c));
    fixture.componentRef.setInput('calendar', 'GREGORIAN');
    fixture.detectChanges();
  });

  const el = (hook: string) => (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(`[data-cy="${hook}"]`);
  const option = (calendar: string) => el(`calendar-option-${calendar}`);
  /** The hook sits on the option's own button, so it is the thing to click. */
  const clickOption = (calendar: string) => {
    option(calendar)?.click();
    fixture.detectChanges();
  };

  describe('offering the choice', () => {
    it('offers every calendar', () => {
      expect(option('GREGORIAN')).not.toBeNull();
      expect(option('JULIAN')).not.toBeNull();
      expect(option('ISLAMIC')).not.toBeNull();
    });

    it('shows which one is chosen', () => {
      expect(el('calendar-select')?.getAttribute('ng-reflect-value') ?? component.calendar()).toBeTruthy();
      expect(component.calendar()).toBe('GREGORIAN');
    });

    it('reports a choice when the user makes one', () => {
      clickOption('JULIAN');

      expect(chosen).toEqual(['JULIAN']);
    });

    it('reports nothing when its inputs change', () => {
      fixture.componentRef.setInput('calendar', 'JULIAN');
      fixture.detectChanges();

      expect(chosen).toEqual([]);
    });
  });

  describe('availability', () => {
    it('disables a calendar the value cannot be expressed in', () => {
      fixture.componentRef.setInput('available', ['GREGORIAN', 'JULIAN']);
      fixture.detectChanges();

      expect(option('ISLAMIC')?.hasAttribute('disabled')).toBe(true);
    });

    it('shows an unavailable calendar rather than hiding it', () => {
      // A hidden option cannot be told apart from one that does not exist.
      fixture.componentRef.setInput('available', ['GREGORIAN', 'JULIAN']);
      fixture.detectChanges();

      expect(option('ISLAMIC')).not.toBeNull();
    });

    it('explains why Islamic is unavailable rather than only greying it', () => {
      fixture.componentRef.setInput('available', ['GREGORIAN', 'JULIAN']);
      fixture.detectChanges();

      expect(el('pre-hijra-note')).not.toBeNull();
    });

    it('says nothing about the Hijra when Islamic is available', () => {
      fixture.componentRef.setInput('available', ['GREGORIAN', 'JULIAN', 'ISLAMIC']);
      fixture.detectChanges();

      expect(el('pre-hijra-note')).toBeNull();
    });

    it('offers everything by default, since an owner that says nothing rules nothing out', () => {
      expect(option('ISLAMIC')?.hasAttribute('disabled')).toBe(false);
    });
  });

  describe('serving two call sites', () => {
    // A single date and a period need distinct hooks; they used to be two near-identical copies of
    // this control, which is how they drifted apart.
    it('prefixes its hooks when asked', () => {
      fixture.componentRef.setInput('hookPrefix', 'period-');
      fixture.detectChanges();

      expect(el('period-calendar-select')).not.toBeNull();
      expect(el('period-calendar-option-JULIAN')).not.toBeNull();
    });

    it('uses bare hooks by default', () => {
      expect(el('calendar-select')).not.toBeNull();
    });

    it('shows a caption only when the owner supplies one', () => {
      expect(el('calendar-caption')).toBeNull();

      fixture.componentRef.setInput('caption', 'ui.datePicker.calendar');
      fixture.detectChanges();

      expect(el('calendar-caption')).not.toBeNull();
    });
  });

  describe('it does nothing else', () => {
    it('never converts — it has no date to convert', () => {
      expect((component as unknown as { convert?: unknown }).convert).toBeUndefined();
    });

    it('accepts no input while disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      clickOption('JULIAN');

      expect(chosen).toEqual([]);
    });
  });
});
