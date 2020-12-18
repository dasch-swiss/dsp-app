import { Constants } from '@dasch-swiss/dsp-js';

export interface Property {
    group: string;
    elements: PropertyType[];
}

export interface PropertyType {
    icon: string;
    label: string;
    subPropOf: string;
    objectType?: string;
    gui_ele: string;
    group: string;
}

export class DefaultProperties {
    public static data: Property[] = [
        {
            group: 'Text',
            elements: [
                {
                    icon: 'short_text',
                    label: 'Short',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.TextValue,
                    gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'SimpleText',   // 'Input',
                    group: 'Text'       // redundant information, but otherwise we don't get the main group name after selecting type
                },
                {
                    icon: 'subject',
                    label: 'Paragraph',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.TextValue,
                    gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'Textarea',
                    group: 'Text'
                },
                {
                    icon: 'line_style',
                    label: 'Editor',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.TextValue,
                    gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'Richtext',
                    group: 'Text'
                }
            ]
        },
        {
            group: 'List',
            elements: [
                {
                    icon: 'radio_button_checked',
                    label: 'Multiple choice',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.ListValue,
                    gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'Radio',
                    group: 'List'
                },
                {
                    icon: 'check_box',
                    label: 'Checkboxes',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.ListValue,
                    gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'Checkbox',
                    group: 'List'
                },
                {
                    icon: 'arrow_drop_down_circle',
                    label: 'Dropdown',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.ListValue,
                    gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'List',     // 'Pulldown'
                    group: 'List'
                },
                {
                    icon: 'toggle_off',
                    label: 'On / Off',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.BooleanValue,
                    gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'Checkbox',    // 'Toggle',
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
                    gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'Date',
                    group: 'Date / Time'
                },
                {
                    icon: 'date_range',
                    label: 'Period',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.DateValue,
                    gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'Date',
                    group: 'Date / Time'
                },
                {
                    icon: 'access_time',
                    label: 'Time',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.TimeValue,
                    gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'Interval',
                    group: 'Date / Time'
                },
                {
                    icon: 'timelapse',
                    label: 'Duration',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.TimeValue,
                    gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'Interval',
                    group: 'Date / Time'
                }
            ]
        },
        {
            group: 'Number',
            elements: [
                {
                    icon: 'integer_icon',
                    label: 'Integer',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.IntValue,
                    gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'Spinbox',  // 'Number',
                    group: 'Number'
                },
                {
                    icon: 'decimal_icon',
                    label: 'Decimal',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.DecimalValue,
                    gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'Spinbox',  // 'Number',
                    group: 'Number'
                }
            ]
        },
        {
            group: 'Link',
            elements: [
                {
                    icon: 'link',
                    label: 'Other resource e.g. Person',
                    subPropOf: Constants.HasLinkTo,
                    objectType: Constants.Resource,
                    gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'Searchbox',    // 'Autocomplete',
                    group: 'Link'
                },
                // {
                //     icon: 'compare_arrows',
                //     label: 'External resource',
                //     subPropOf: Constants.HasValue,
                //     objectType: Constants.UriValue,
                //     gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'SimpleText',
                //     group: 'Link'
                // },
                {
                    icon: 'http',
                    label: 'External URL',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.UriValue,
                    gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'SimpleText',
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
                    gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'Geonames',
                    group: 'Location'
                }
            ]
        },
        {
            group: 'Shape',
            elements: [
                {
                    icon: 'color_lens',
                    label: 'Color',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.ColorValue,
                    gui_ele: Constants.SalsahGui + Constants.HashDelimiter + 'Colorpicker',
                    group: 'Shape'
                }
            ]
        }
    ];
}
