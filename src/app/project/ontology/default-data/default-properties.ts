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
                    subPropOf: Constants.HasValue,
                    objectType: Constants.TextValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'SimpleText',   // 'Input',
                    group: 'Text'       // redundant information, but otherwise we don't get the main group name after selecting type
                },
                {
                    icon: 'subject',
                    label: 'Paragraph',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.TextValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Textarea',
                    group: 'Text'
                },
                {
                    icon: 'line_style',
                    label: 'Editor',
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
                    subPropOf: Constants.HasValue,
                    objectType: Constants.ListValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'List',     // 'Pulldown'
                    group: 'List'
                },
                {
                    icon: 'check_box',
                    label: 'Checkboxes',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.ListValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Checkbox',
                    group: 'List'
                },
                {
                    icon: 'radio_button_checked',
                    label: 'Multiple choice',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.ListValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Radio',
                    group: 'List'
                },
                {
                    icon: 'toggle_off',
                    label: 'On / Off',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.BooleanValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Checkbox',    // 'Toggle',
                    group: 'List'
                }
            ]
        },
        {
            group: 'Date / Time',
            elements: [
                {
                    icon: 'calendar_today',
                    label: 'Date',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.DateValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Date',
                    group: 'Date / Time'
                },
                {
                    icon: 'date_range',
                    label: 'Period',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.DateValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Date',
                    group: 'Date / Time'
                },
                {
                    icon: 'access_time',
                    label: 'Timestamp',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.TimeValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'TimeStamp',
                    group: 'Date / Time'
                },
                {
                    icon: 'timelapse',
                    label: 'Duration',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.TimeValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Interval',
                    group: 'Date / Time'
                }
            ]
        },
        {
            group: 'Number',
            elements: [
                {
                    icon: 'money',
                    label: 'Integer',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.IntValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Spinbox',  // 'Number',
                    group: 'Number'
                },
                {
                    icon: 'functions',
                    label: 'Decimal',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.DecimalValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Spinbox',  // 'Number',
                    group: 'Number'
                }
            ]
        },
        {
            group: 'Link',
            elements: [
                {
                    icon: 'link',
                    label: 'Resource class',
                    subPropOf: Constants.HasLinkTo,
                    objectType: Constants.LinkValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Searchbox',    // 'Autocomplete',
                    group: 'Link'
                },
                // {
                //     icon: 'picture_in_picture',
                //     label: 'Part of resource class',
                //     subPropOf: Constants.KnoraApiV2 + Constants.HashDelimiter + 'isPartOf',
                //     objectType: Constants.LinkValue,
                //     guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Searchbox',    // 'Autocomplete',
                //     group: 'Link'
                // },
                // {
                //     icon: 'compare_arrows',
                //     label: 'External resource',
                //     subPropOf: Constants.HasValue,
                //     objectType: Constants.UriValue,
                //     guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'SimpleText',
                //     group: 'Link'
                // },
                {
                    icon: 'language',
                    label: 'External URL',
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
                    subPropOf: Constants.HasValue,
                    objectType: Constants.ColorValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Colorpicker',
                    group: 'Shape'
                },
                {
                    icon: 'format_shapes',
                    label: 'Geometry',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.GeomValue,
                    guiEle: Constants.SalsahGui + Constants.HashDelimiter + 'Geometry',
                    group: 'Shape'
                }
            ]
        }
    ];
}
