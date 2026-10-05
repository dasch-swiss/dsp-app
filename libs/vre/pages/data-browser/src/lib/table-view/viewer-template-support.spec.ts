import {
  Constants,
  ReadIntValue,
  ReadTextValueAsHtml,
  ReadTextValueAsString,
  ReadTextValueAsXml,
  ReadValue,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { viewerCanRender } from './viewer-template-support';

function propDef(objectType: string): ResourcePropertyDefinitionWithAllLanguages {
  return { objectType } as ResourcePropertyDefinitionWithAllLanguages;
}

function xmlValue(mapping: string): ReadValue {
  const value = new ReadTextValueAsXml();
  value.mapping = mapping;
  return value;
}

describe('viewerCanRender', () => {
  it('AcceptsEveryObjectTypeTheSwitcherHasATemplateFor', () => {
    const switchable = [
      Constants.BooleanValue,
      Constants.ColorValue,
      Constants.DateValue,
      Constants.DecimalValue,
      Constants.GeolocationValue,
      Constants.GeonameValue,
      Constants.IntValue,
      Constants.IntervalValue,
      Constants.LinkValue,
      Constants.ListValue,
      Constants.RegionPreviewValue,
      Constants.TimeValue,
      Constants.UriValue,
    ];

    switchable.forEach(objectType => expect(viewerCanRender(propDef(objectType), new ReadIntValue())).toBe(true));
  });

  // The switcher's `default` branch throws, and it runs inside `ngAfterViewInit` — one column of a
  // type it has no case for would take down the change-detection pass the whole table renders in.
  it('RefusesAnObjectTypeTheSwitcherWouldThrowOn', () => {
    expect(viewerCanRender(propDef(Constants.GeomValue), new ReadIntValue())).toBe(false);
  });

  // A link *property* (as opposed to its link-value counterpart) carries the target class as its
  // object type, so the column model hands one of those through and it must not reach the switch.
  it('RefusesAPropertyWhoseObjectTypeIsAResourceClass', () => {
    expect(viewerCanRender(propDef('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'), new ReadIntValue())).toBe(
      false
    );
  });

  it('RefusesAColumnWithNoPropertyDefinitionAtAll', () => {
    expect(viewerCanRender(undefined, new ReadIntValue())).toBe(false);
  });

  it('AcceptsTheThreeTextValueShapesTheSwitcherHandles', () => {
    const text = propDef(Constants.TextValue);

    expect(viewerCanRender(text, new ReadTextValueAsString())).toBe(true);
    expect(viewerCanRender(text, new ReadTextValueAsHtml())).toBe(true);
    expect(viewerCanRender(text, xmlValue(Constants.StandardMapping))).toBe(true);
  });

  // `_manageTextDisplayValue` throws for these two rather than falling through: an XML value whose
  // mapping is a project's own has no viewer component, and a value that is not a text value at
  // all matches none of its `instanceof` branches.
  it('RefusesATextValueTheSwitcherWouldThrowOn', () => {
    const text = propDef(Constants.TextValue);

    expect(viewerCanRender(text, xmlValue('http://rdfh.ch/standoff/mappings/CustomMapping'))).toBe(false);
    expect(viewerCanRender(text, new ReadIntValue())).toBe(false);
  });
});
