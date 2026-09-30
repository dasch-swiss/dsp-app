import { KnoraDate, KnoraPeriod, UpdateDateValue } from '@dasch-swiss/dsp-js';

import { populateValue } from './populate-value-method';

/**
 * The calendar is stored, not derived.
 *
 * `UpdateDateValue` carries `calendar` as a field beside the numerals, so a user who switches the
 * calendar of a value is editing what the record says the source used. These assert that the
 * chosen calendar reaches the payload — without which the save enabled by the gate would write
 * the date back under its old calendar.
 */
describe('populateValue, for a date value', () => {
  it('sends the calendar the date is expressed in', () => {
    const payload = new UpdateDateValue();

    populateValue(payload, new KnoraDate('JULIAN', 'CE', 2024, 6, 2));

    expect(payload.calendar).toBe('JULIAN');
  });

  it('sends the calendar chosen after a switch, not the one the value was read in', () => {
    const payload = new UpdateDateValue();

    // What the picker produces when a stored Gregorian date is switched to Julian.
    populateValue(payload, new KnoraDate('JULIAN', 'CE', 2024, 6, 2));

    expect(payload.calendar).toBe('JULIAN');
    expect([payload.startDay, payload.startMonth, payload.startYear]).toEqual([2, 6, 2024]);
  });

  it('takes a period’s calendar from its start, which governs the whole value', () => {
    const payload = new UpdateDateValue();

    populateValue(
      payload,
      new KnoraPeriod(new KnoraDate('ISLAMIC', 'noEra', 1445, 12, 8), new KnoraDate('ISLAMIC', 'noEra', 1446, 1, 8))
    );

    expect(payload.calendar).toBe('ISLAMIC');
  });

  // 'noEra' is how dsp-js spells "this calendar has no era"; it is not an era to send.
  it('omits the era for a calendar that has none', () => {
    const payload = new UpdateDateValue();

    populateValue(payload, new KnoraDate('ISLAMIC', 'noEra', 1445, 12, 8));

    expect(payload.startEra).toBeUndefined();
    expect(payload.endEra).toBeUndefined();
  });
});
