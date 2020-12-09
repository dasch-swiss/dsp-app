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
                    gui_ele: Constants.SalsahGui + Constants.Delimiter + 'SimpleText',   // 'Input',
                    group: 'Text'       // redundant information, but otherwise we don't get the main group name after selecting type
                },
                {
                    icon: 'subject',
                    label: 'Paragraph',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.TextValue,
                    gui_ele: Constants.SalsahGui + Constants.Delimiter + 'Textarea',
                    group: 'Text'
                },
                {
                    icon: 'line_style',
                    label: 'Editor',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.TextValue,
                    gui_ele: Constants.SalsahGui + Constants.Delimiter + 'Richtext',
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
                    gui_ele: Constants.SalsahGui + Constants.Delimiter + 'Radio',
                    group: 'List'
                },
                {
                    icon: 'check_box',
                    label: 'Checkboxes',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.ListValue,
                    gui_ele: Constants.SalsahGui + Constants.Delimiter + 'Checkbox',
                    group: 'List'
                },
                {
                    icon: 'arrow_drop_down_circle',
                    label: 'Dropdown',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.ListValue,
                    gui_ele: Constants.SalsahGui + Constants.Delimiter + 'List',     // 'Pulldown'
                    group: 'List'
                },
                {
                    icon: 'toggle_off',
                    label: 'On / Off',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.BooleanValue,
                    gui_ele: Constants.SalsahGui + Constants.Delimiter + 'Checkbox',    // 'Toggle',
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
                    gui_ele: Constants.SalsahGui + Constants.Delimiter + 'Date',
                    group: 'Date / Time'
                },
                {
                    icon: 'date_range',
                    label: 'Period',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.DateValue,
                    gui_ele: Constants.SalsahGui + Constants.Delimiter + 'Date',
                    group: 'Date / Time'
                },
                {
                    icon: 'access_time',
                    label: 'Time',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.TimeValue,
                    gui_ele: Constants.SalsahGui + Constants.Delimiter + 'Interval',
                    group: 'Date / Time'
                },
                {
                    icon: 'timelapse',
                    label: 'Duration',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.TimeValue,
                    gui_ele: Constants.SalsahGui + Constants.Delimiter + 'Interval',
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
                    gui_ele: Constants.SalsahGui + Constants.Delimiter + 'Spinbox',  // 'Number',
                    group: 'Number'
                },
                {
                    icon: 'decimal_icon',
                    label: 'Decimal',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.DecimalValue,
                    gui_ele: Constants.SalsahGui + Constants.Delimiter + 'Spinbox',  // 'Number',
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
                    gui_ele: Constants.SalsahGui + Constants.Delimiter + 'Searchbox',    // 'Autocomplete',
                    group: 'Link'
                },
                // {
                //     icon: 'compare_arrows',
                //     label: 'External resource',
                //     subPropOf: Constants.HasValue,
                //     objectType: Constants.UriValue,
                //     gui_ele: Constants.SalsahGui + Constants.Delimiter + 'SimpleText',
                //     group: 'Link'
                // },
                {
                    icon: 'http',
                    label: 'External URL',
                    subPropOf: Constants.HasValue,
                    objectType: Constants.UriValue,
                    gui_ele: Constants.SalsahGui + Constants.Delimiter + 'SimpleText',
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
                    gui_ele: Constants.SalsahGui + Constants.Delimiter + 'Geonames',
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
                    gui_ele: Constants.SalsahGui + Constants.Delimiter + 'Colorpicker',
                    group: 'Shape'
                }
            ]
        }
    ];
}
