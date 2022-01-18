import { Constants, ResourcePropertyDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';

/**
 * property object with all information to create or edit a property
 */
export interface PropertyInfoObject {
    propDef?: ResourcePropertyDefinitionWithAllLanguages;
    propType: DefaultProperty;
}

/**
 * property category can be
 * text, list, data and time, number, link, location and shape
 */
export interface PropertyCategory {
    group: string;
    elements: DefaultProperty[];
}

/**
 * own default property defined for the gui
 * with this information we can build the correct
 * property object to send it to the API
 */
export interface DefaultProperty {
    icon: string;
    label: string;
    description: string;
    subPropOf: string;
    objectType?: string;
    guiEle: string;
    group: string;
}

export class DefaultProperties {
    public static data: PropertyCategory[] = [
        {
            group: 'Text',
            elements: [
                {
                    icon: 'short_text',
                    label: 'Short',
                    description: 'Short text such as title or name',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.TextValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'SimpleText',   // better element would be: 'Input',
                    group: 'Text'       // redundant information, but otherwise we don't get the main group name after selecting type
                },
                {
                    icon: 'subject',
                    label: 'Paragraph',
                    description: 'Long text such as description; could have line breaks',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.TextValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Textarea',
                    group: 'Text'
                },
                {
                    icon: 'line_style',
                    label: 'Rich Text',
                    description: 'A rich text editor with formatting options',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.TextValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Richtext',
                    group: 'Text'
                }
            ]
        },
        {
            group: 'List',
            elements: [
                {
                    icon: 'arrow_drop_down_circle',
                    label: 'Dropdown',
                    description: 'Dropdown menu with values from predefined list',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.ListValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'List',     // better element would be: 'Pulldown' or 'Select'
                    group: 'List'
                }
            ]
        },
        {
            group: 'Boolean',
            elements: [
                {
                    icon: 'toggle_off',
                    label: 'Yes / No',
                    description: 'Yes or no, 1 or 0, true or false',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.BooleanValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Checkbox',    // should be 'Toggle' but it's not supported in DSP-Tangoh,
                    group: 'Boolean'
                }
            ]
        },
        {
            group: 'Date / Time',
            elements: [
                {
                    icon: 'calendar_today',
                    label: 'Date',
                    description: 'A date field with day, month and year',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.DateValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Date',
                    group: 'Date / Time'
                },
                // {
                //     icon: 'date_range',
                //     label: 'Period',
                //     description: 'A period of time between two dates',
                //     subPropOf: Constants.HasValue,
                //     objectType: Constants.DateValue,
                //     guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Date',
                //     group: 'Date / Time'
                // },
                {
                    icon: 'access_time',
                    label: 'Timestamp',
                    description: 'A single timestamp on a timeline',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.TimeValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'TimeStamp',
                    group: 'Date / Time'
                },
                {
                    icon: 'timelapse',
                    label: 'Time sequence',
                    description: 'A time sequence with start and end point on a timeline',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.IntervalValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Interval',
                    group: 'Date / Time'
                }
            ]
        },
        {
            group: 'Number',
            elements: [
                {
                    icon: '60fps',
                    label: 'Integer',
                    description: 'Integer value',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.IntValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Spinbox',  // 'Number',
                    group: 'Number'
                },
                {
                    icon: 'functions',
                    label: 'Decimal',
                    description: 'Decimal value',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.DecimalValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Spinbox',  // 'Number',
                    group: 'Number'
                },
                {
                    icon: 'filter_3',
                    label: 'Page number',
                    description: 'The page number is needed for page classes in case of part of properties',
                    subPropOf: Constants.KnoraApiV2 + Constants.HashDelimiter + 'seqnum',
                    objectType: Constants.IntValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Spinbox',  // 'Number',
                    group: 'Number'
                }
            ]
        },
        {
            group: 'Link / Relation',
            elements: [
                {
                    icon: 'link',
                    label: 'Link to class',
                    description: 'Refers to a resource class',
                    subPropOf: Constants.HasLinkTo,
                    objectType: Constants.LinkValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Searchbox',    // 'Autocomplete',
                    group: 'Link / Relation'
                },
                {
                    icon: 'extension',
                    label: 'Part of class',
                    description: 'Is part of a resource class',
                    subPropOf: Constants.KnoraApiV2 + Constants.HashDelimiter + 'isPartOf',
                    objectType: Constants.LinkValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Searchbox',    // 'Autocomplete',
                    group: 'Relation'
                },
                {
                    icon: 'language',
                    label: 'External URL',
                    description: 'Link to an external website',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.UriValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'SimpleText',
                    group: 'Link'
                }
            ]
        },
        {
            group: 'Location',
            elements: [
                {
                    icon: 'place',
                    label: 'Place',
                    description: 'Geographical location',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.GeonameValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Geonames',
                    group: 'Location'
                }
            ]
        },
        {
            group: 'Shape',
            elements: [
                {
                    icon: 'palette',
                    label: 'Color',
                    description: 'A simple color value',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.ColorValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Colorpicker',
                    group: 'Shape'
                }
            ]
        }
    ];
}
