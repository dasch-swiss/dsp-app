/** Material icon per value type, as `DataModelProperty.type` names it; types not named here show a generic one. */
const TYPE_ICON: Record<string, string> = {
  Text: 'short_text',
  Link: 'link',
  List: 'arrow_drop_down_circle',
  Date: 'event',
  Time: 'schedule',
  Uri: 'public',
  Int: 'pin',
  Decimal: 'pin',
  Boolean: 'check_box',
  Color: 'palette',
  Geoname: 'place',
  Interval: 'timelapse',
  Geom: 'category',
};

/** Shown names for value types whose local name reads poorly. */
const TYPE_NAME: Record<string, string> = { Uri: 'URI', Int: 'Integer', Geom: 'Geometry' };

export const typeIconOf = (type: string) => TYPE_ICON[type] ?? 'label';

export const typeNameOf = (type: string) => TYPE_NAME[type] ?? type;
