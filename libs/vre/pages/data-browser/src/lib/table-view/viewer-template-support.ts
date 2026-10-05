import {
  Constants,
  ReadTextValueAsHtml,
  ReadTextValueAsString,
  ReadTextValueAsXml,
  ReadValue,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';

/** The object types `TemplateViewerSwitcherComponent._getDisplayTemplate` has a `case` for. */
const SWITCHABLE_OBJECT_TYPES: ReadonlySet<string> = new Set([
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
  Constants.TextValue,
  Constants.TimeValue,
  Constants.UriValue,
]);

/**
 * Whether a text value is one of the three shapes the switcher knows how to render.
 *
 * `_manageTextDisplayValue` throws `The text value is not supported` for anything else — in
 * practice an XML value carried by a mapping that is not the standard one, for which the switcher
 * has no viewer component. An absent value never reaches the throw: it falls through to the
 * gui-element branch, which always answers with a template.
 */
function isRenderableTextValue(value: ReadValue | undefined): boolean {
  if (value === undefined || value instanceof ReadTextValueAsString || value instanceof ReadTextValueAsHtml) {
    return true;
  }

  return value instanceof ReadTextValueAsXml && value.mapping === Constants.StandardMapping;
}

/**
 * Whether a cell may mount the resource viewer's template switcher for this value.
 *
 * Asked *before* the switcher is mounted, and that is the whole point. The switcher's own
 * `default` branch ends in `throw`, and it runs in `ngAfterViewInit` — a lifecycle hook, with no
 * seam a host could wrap in a `try`. In the resource viewer that throw is close to unreachable,
 * because the editor only ever renders properties it has already built a `PropertyInfoValues` for.
 * A table is a different proposition: the column model is built straight from the ontology, so a
 * single property of a type the switcher has not learned about yet would raise during the table's
 * change-detection pass and blank all forty columns of every row, not just its own cell.
 *
 * So the question is answered here and an unsupported value falls back to its `strval` — exactly
 * what every cell rendered before the switcher was adopted. Degrading to the old rendering for one
 * property is a cost worth paying; losing the page is not.
 *
 * The switch is mirrored rather than shared because the switcher's lives in the resource editor
 * and reaches its answers through `@ViewChild` template refs. If it ever grows a fallback of its
 * own this function becomes dead weight and should go — until then, a type added there and not
 * here renders as a string here, which is a visible regression but not a broken page.
 */
export function viewerCanRender(
  propertyDefinition: ResourcePropertyDefinitionWithAllLanguages | undefined,
  value: ReadValue | undefined
): boolean {
  const objectType = propertyDefinition?.objectType;

  if (objectType === undefined || !SWITCHABLE_OBJECT_TYPES.has(objectType)) {
    return false;
  }

  return objectType !== Constants.TextValue || isRenderableTextValue(value);
}
