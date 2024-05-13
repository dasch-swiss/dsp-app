import { DatePipe } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  Constants,
  CreateBooleanValue,
  CreateColorValue,
  CreateDateValue,
  CreateDecimalValue,
  CreateGeonameValue,
  CreateIntervalValue,
  CreateIntValue,
  CreateLinkValue,
  CreateListValue,
  CreateTextValueAsString,
  CreateTextValueAsXml,
  CreateTimeValue,
  CreateUriValue,
  CreateValue,
  ReadBooleanValue,
  ReadColorValue,
  ReadDateValue,
  ReadDecimalValue,
  ReadGeonameValue,
  ReadIntervalValue,
  ReadIntValue,
  ReadLinkValue,
  ReadListValue,
  ReadTextValue,
  ReadTimeValue,
  ReadUriValue,
  ReadValue,
  ResourcePropertyDefinition,
  UpdateBooleanValue,
  UpdateColorValue,
  UpdateDateValue,
  UpdateDecimalValue,
  UpdateGeonameValue,
  UpdateIntervalValue,
  UpdateIntValue,
  UpdateLinkValue,
  UpdateListValue,
  UpdateTextValueAsString,
  UpdateTextValueAsXml,
  UpdateTimeValue,
  UpdateUriValue,
  UpdateValue,
} from '@dasch-swiss/dsp-js';
import { CalendarDate, CalendarPeriod, GregorianCalendarDate } from '@dasch-swiss/jdnconvertiblecalendar';
import { CustomRegex } from '@dasch-swiss/vre/shared/app-common';
import { DateTime } from './date-time';
import { convertTimestampToDateTime, dateTimeTimestamp } from './date-time-timestamp';
import { handleXML } from './handle-xml';
import { populateValue } from './populate-value-method';

interface MappingParameters<T extends ReadValue> {
  control: (value?: T) => AbstractControl;
  mapping: (value: any, propertyDefinition?: any) => CreateValue;
  updateMapping: (id: string, value: any, propertyDefinition?: any) => UpdateValue;
}

export const propertiesTypeMapping = new Map<string, MappingParameters<any>>([
  [
    Constants.IntValue,
    {
      control: (value?: ReadIntValue) => new FormControl(value?.int),
      mapping: (value: number) => {
        const newIntValue = new CreateIntValue();
        newIntValue.int = value;
        return newIntValue;
      },
      updateMapping: (id: string, value: number) => {
        const newIntValue = new UpdateIntValue();
        newIntValue.id = id;
        newIntValue.int = value;
        return newIntValue;
      },
    },
  ],
  [
    Constants.DecimalValue,
    {
      control: (value?: ReadDecimalValue) => new FormControl(value?.decimal ?? 0),

      mapping: (value: number) => {
        const newDecimalValue = new CreateDecimalValue();
        newDecimalValue.decimal = value;
        return newDecimalValue;
      },
      updateMapping: (id: string, value: number) => {
        const newDecimalValue = new UpdateDecimalValue();
        newDecimalValue.id = id;
        newDecimalValue.decimal = value;
        return newDecimalValue;
      },
    },
  ],
  [
    Constants.BooleanValue,
    {
      control: (value?: ReadBooleanValue) => new FormControl(value?.bool),

      mapping: (value: boolean) => {
        const newBooleanValue = new CreateBooleanValue();
        newBooleanValue.bool = value;
        return newBooleanValue;
      },
      updateMapping: (id: string, value: boolean) => {
        const newBooleanValue = new UpdateBooleanValue();
        newBooleanValue.id = id;
        newBooleanValue.bool = value;
        return newBooleanValue;
      },
    },
  ],
  [
    Constants.TextValue,
    {
      control: (value?: ReadTextValue) => {
        if (!value) return new FormControl(null);

        const pattern = /<\?xml version="1\.0" encoding="UTF-8"\?>\n<text>(.*)<\/text>/;
        const match = value.strval!.match(pattern);
        return new FormControl(match ? match[1] : value.strval);
      },

      mapping: (value: string, propertyDefinition: ResourcePropertyDefinition) => {
        switch (propertyDefinition.guiElement) {
          case Constants.GuiSimpleText:
          case Constants.GuiTextarea:
            const newTextValue = new CreateTextValueAsString();
            newTextValue.text = value;
            return newTextValue;
          case Constants.GuiRichText:
            const newTextValueXml = new CreateTextValueAsXml();
            newTextValueXml.xml = handleXML(value, false);
            newTextValueXml.mapping = Constants.StandardMapping;
            return newTextValueXml;
          default:
            throw new Error('No default value for text');
        }
      },
      updateMapping: (id: string, value: string, propertyDefinition: ResourcePropertyDefinition) => {
        switch (propertyDefinition.guiElement) {
          case Constants.GuiSimpleText:
          case Constants.GuiTextarea:
            const newTextValue = new UpdateTextValueAsString();
            newTextValue.id = id;
            newTextValue.text = value;
            return newTextValue;
          case Constants.GuiRichText:
            const newTextValueXml = new UpdateTextValueAsXml();
            newTextValueXml.id = id;
            newTextValueXml.xml = handleXML(value, false);
            newTextValueXml.mapping = Constants.StandardMapping;
            return newTextValueXml;
          default:
            throw new Error('No default value for text');
        }
      },
    },
  ],
  [
    Constants.TextValueAsXml, // TODO
    {
      control: (value?: ReadTextValue) => new FormControl(value?.strval),

      mapping: (value: string) => {
        const newTextValue = new CreateTextValueAsString();
        newTextValue.text = value;
        return newTextValue;
      },
      updateMapping: (id: string, value: string) => {
        const newTextValue = new UpdateTextValueAsString();
        newTextValue.id = id;
        newTextValue.text = value;
        return newTextValue;
      },
    },
  ],
  [
    Constants.DateValue,
    {
      control: (value?: ReadDateValue) => new FormControl(value?.date),
      mapping: (value: any) => {
        const newDateValue = new CreateDateValue();
        populateValue(newDateValue, value);
        return newDateValue;
      },
      updateMapping: (id: string, value: any) => {
        const newDateValue = new UpdateDateValue();
        newDateValue.id = id;
        populateValue(newDateValue, value);
        return newDateValue;
      },
    },
  ],
  [
    Constants.TimeValue,
    {
      control: (value?: ReadTimeValue) => {
        if (value) {
          const z = convertTimestampToDateTime(value.time, new DatePipe('en-US'));
          return new FormControl(z);
        }

        const today = new Date();
        const calendarDate = new CalendarDate(today.getFullYear(), (today.getMonth() + 1) % 12, today.getDate());
        const gcd = new GregorianCalendarDate(new CalendarPeriod(calendarDate, calendarDate));
        return new FormControl(new DateTime(gcd, '00:00'));
      },

      mapping: (value: DateTime) => {
        const newValue = dateTimeTimestamp(value.date, value.time);
        const newTimeValue = new CreateTimeValue();
        newTimeValue.time = newValue;
        return newTimeValue;
      },
      updateMapping: (id: string, value: DateTime) => {
        const newTimeValue = new UpdateTimeValue();
        newTimeValue.id = id;
        newTimeValue.time = dateTimeTimestamp(value.date, value.time);
        return newTimeValue;
      },
    },
  ],
  [
    Constants.IntervalValue,
    {
      control: (value?: ReadIntervalValue) =>
        new FormGroup({
          start: new FormControl(value?.start, Validators.required),
          end: new FormControl(value?.end, Validators.required),
        }),
      mapping: (value: { start: string; end: string }) => {
        const newIntervalValue = new CreateIntervalValue();
        newIntervalValue.start = parseFloat(value.start);
        newIntervalValue.end = parseFloat(value.end);
        return newIntervalValue;
      },
      updateMapping: (id: string, value: { start: number; end: number }) => {
        const newIntervalValue = new UpdateIntervalValue();
        newIntervalValue.id = id;
        newIntervalValue.start = value.start;
        newIntervalValue.end = value.end;
        return newIntervalValue;
      },
    },
  ],
  [
    Constants.ColorValue,
    {
      control: (value?: ReadColorValue) => new FormControl(value?.color ?? '#000000'),
      mapping: (value: string) => {
        const newColorValue = new CreateColorValue();
        newColorValue.color = value;
        return newColorValue;
      },
      updateMapping: (id: string, value: string) => {
        const newColorValue = new UpdateColorValue();
        newColorValue.id = id;
        newColorValue.color = value;
        return newColorValue;
      },
    },
  ],
  [
    Constants.ListValue,
    {
      control: (value?: ReadListValue) => new FormControl(value?.listNode ?? null),
      mapping: (value: string) => {
        const newListValue = new CreateListValue();
        newListValue.listNode = value;
        return newListValue;
      },
      updateMapping: (id: string, value: string) => {
        const newListValue = new UpdateListValue();
        newListValue.id = id;
        newListValue.listNode = value;
        return newListValue;
      },
    },
  ],
  [
    Constants.GeonameValue,
    {
      control: (value?: ReadGeonameValue) => new FormControl(value?.geoname),

      mapping: (value: string) => {
        const newGeonameValue = new CreateGeonameValue();
        newGeonameValue.geoname = value;
        return newGeonameValue;
      },
      updateMapping: (id: string, value: string) => {
        const newGeonameValue = new UpdateGeonameValue();
        newGeonameValue.id = id;
        newGeonameValue.geoname = value;
        return newGeonameValue;
      },
    },
  ],
  [
    Constants.LinkValue,
    {
      control: (value?: ReadLinkValue) =>
        new FormControl(value?.linkedResourceIri, [Validators.pattern(/http:\/\/rdfh.ch\/.*/)]),
      mapping: (value: string) => {
        const newLinkValue = new CreateLinkValue();
        newLinkValue.linkedResourceIri = value;
        return newLinkValue;
      },
      updateMapping: (id: string, value: string) => {
        const newLinkValue = new UpdateLinkValue();
        newLinkValue.id = id;
        newLinkValue.linkedResourceIri = value;
        return newLinkValue;
      },
    },
  ],
  [
    Constants.UriValue,
    {
      control: (value?: ReadUriValue) => new FormControl(value?.uri, [Validators.pattern(CustomRegex.URI_REGEX)]),
      mapping: (value: string) => {
        const newUriValue = new CreateUriValue();
        newUriValue.uri = value;
        return newUriValue;
      },
      updateMapping: (id: string, value: string) => {
        const newUriValue = new UpdateUriValue();
        newUriValue.id = id;
        newUriValue.uri = value;
        return newUriValue;
      },
    },
  ],
]);
