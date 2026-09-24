import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Constants, KnoraDate, KnoraPeriod, ReadDateValue, ReadIntValue, ReadValue } from '@dasch-swiss/dsp-js';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { provideTranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { PropertyValueEditComponent } from './property-value-edit.component';
import { PropertyValueService } from './property-value.service';

/**
 * A calendar switch restates a date; it does not edit it. The save button must stay inert, or a
 * reader who merely looks at a value in another calendar can rewrite its stored calendar — the
 * calendar travels in the update payload, so that save is a real mutation (DEV-7372).
 */
describe('PropertyValueEditComponent save gating', () => {
  let fixture: ComponentFixture<PropertyValueEditComponent>;
  let component: PropertyValueEditComponent;

  const propertyValueServiceStub = (objectType: string) => ({
    propertyDefinition: { objectType, id: 'http://example.org/prop' },
    editModeData: { resource: { id: 'http://rdfh.ch/res', type: 'Thing', attachedToProject: 'p' }, values: [] },
  });

  const mount = async (objectType: string, readValue: ReadValue | undefined) => {
    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [PropertyValueEditComponent],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        providers: [
          provideTranslateService(),
          { provide: PropertyValueService, useValue: propertyValueServiceStub(objectType) },
          // Only reached by the template's projectShortcode getter, which the mock template drops.
          { provide: ResourceService, useValue: { getProjectShortcode: () => '0000' } },
        ],
      })
      .overrideComponent(PropertyValueEditComponent, { set: { template: '<div>Mock</div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(PropertyValueEditComponent);
    component = fixture.componentInstance;
    component.readValue = readValue;
    fixture.detectChanges();
  };

  const canSave = () => firstValueFrom(component.hasValidValue$!);

  const dateValue = (date: KnoraDate | KnoraPeriod): ReadDateValue =>
    ({ date, valueHasComment: undefined }) as unknown as ReadDateValue;

  describe('editing an existing date', () => {
    it('cannot be saved before anything is touched', async () => {
      await mount(Constants.DateValue, dateValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)));

      await expect(canSave()).resolves.toBe(false);
    });

    it('cannot be saved after only the calendar changed, because the day is the same', async () => {
      await mount(Constants.DateValue, dateValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)));

      // What the picker produces on a switch: the same instant, every field rewritten.
      component.group.controls.item.setValue(new KnoraDate('JULIAN', 'CE', 2024, 6, 2));

      await expect(canSave()).resolves.toBe(false);
    });

    it('can be saved once the date itself is altered', async () => {
      await mount(Constants.DateValue, dateValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)));

      component.group.controls.item.setValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 16));

      await expect(canSave()).resolves.toBe(true);
    });

    it('can be saved when the date is altered after a calendar switch', async () => {
      await mount(Constants.DateValue, dateValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)));

      component.group.controls.item.setValue(new KnoraDate('JULIAN', 'CE', 2024, 6, 2));
      component.group.controls.item.setValue(new KnoraDate('JULIAN', 'CE', 2024, 6, 3));

      await expect(canSave()).resolves.toBe(true);
    });

    it('can be saved when only the comment changed', async () => {
      await mount(Constants.DateValue, dateValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)));

      component.group.controls.comment.setValue('a note');

      await expect(canSave()).resolves.toBe(true);
    });

    it('treats a precision change as a real edit', async () => {
      await mount(Constants.DateValue, dateValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)));

      component.group.controls.item.setValue(new KnoraDate('GREGORIAN', 'CE', 2024));

      await expect(canSave()).resolves.toBe(true);
    });
  });

  describe('editing an existing period', () => {
    const period = () =>
      new KnoraPeriod(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15), new KnoraDate('GREGORIAN', 'CE', 2024, 7, 15));

    it('cannot be saved after only the calendar changed on both ends', async () => {
      await mount(Constants.DateValue, dateValue(period()));

      component.group.controls.item.setValue(
        new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 2024, 6, 2), new KnoraDate('JULIAN', 'CE', 2024, 7, 2))
      );

      await expect(canSave()).resolves.toBe(false);
    });

    it('can be saved once one end moves', async () => {
      await mount(Constants.DateValue, dateValue(period()));

      component.group.controls.item.setValue(
        new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 2024, 6, 2), new KnoraDate('JULIAN', 'CE', 2024, 7, 3))
      );

      await expect(canSave()).resolves.toBe(true);
    });
  });

  describe('scope of the change', () => {
    it('lets a newly added date be saved, since there is nothing to differ from', async () => {
      await mount(Constants.DateValue, undefined);

      component.group.controls.item.setValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      await expect(canSave()).resolves.toBe(true);
    });

    it('leaves a non-date value type gated on validity alone', async () => {
      // The edit component serves all fifteen value types; narrowing the gate to dates keeps this
      // change from quietly altering how the rest of them save.
      await mount(Constants.IntValue, { int: 42, valueHasComment: undefined } as unknown as ReadIntValue);

      await expect(canSave()).resolves.toBe(true);
    });
  });
});
