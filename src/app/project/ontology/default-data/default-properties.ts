
export interface Property {
    group: string;
    elements: PropertyValue[];
}

export interface PropertyValue {
    icon: string;
    label: string;
    subPropOf: string;
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
                    subPropOf: 'knora-api:TextValue',
                    gui_ele: 'salsah-gui:SimpleText',   // 'Input',
                    group: 'Text'       // redundant information, but we don't get the main group name after select type
                },
                {
                    icon: 'subject',
                    label: 'Paragraph',
                    subPropOf: 'knora-api:TextValue',
                    gui_ele: 'salsah-gui:Textarea',
                    group: 'Text'
                },
                {
                    icon: 'line_style',
                    label: 'Editor',
                    subPropOf: 'knora-api:TextValue/richtext',
                    gui_ele: 'salsah-gui:Richtext   ',
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
                    subPropOf: 'knora-api:ListValue',
                    gui_ele: 'salsah-gui:Radio',
                    group: 'List'
                },
                {
                    icon: 'check_box',
                    label: 'Checkboxes',
                    subPropOf: 'knora-api:ListValue',
                    gui_ele: 'salsah-gui:Checkbox',
                    group: 'List'
                },
                {
                    icon: 'arrow_drop_down_circle',
                    label: 'Dropdown',
                    subPropOf: 'knora-api:ListValue',
                    gui_ele: 'salsah-gui:List',     // 'Pulldown'
                    group: 'List'
                },
                {
                    icon: 'toggle_off',
                    label: 'On / Off',
                    subPropOf: 'knora-api:BooleanValue',
                    gui_ele: 'salsah-gui:Radio',    // 'Toggle',
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
                    subPropOf: 'knora-api:DateValue',
                    gui_ele: 'salsah-gui:Date',
                    group: 'Date / Time'
                },
                {
                    icon: 'date_range',
                    label: 'Period',
                    subPropOf: 'knora-api:DateValue',
                    gui_ele: 'salsah-gui:Date',
                    group: 'Date / Time'
                },
                {
                    icon: 'access_time',
                    label: 'Time',
                    subPropOf: 'knora-api:IntervalValue',
                    gui_ele: 'salsah-gui:Interval',
                    group: 'Date / Time'
                },
                {
                    icon: 'timelapse',
                    label: 'Duration',
                    subPropOf: 'knora-api:IntervalValue',
                    gui_ele: 'salsah-gui:Interval',
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
                    subPropOf: 'knora-api:IntValue',
                    gui_ele: 'salsah-gui:Spinbox',  // 'Number',
                    group: 'Number'
                },
                {
                    icon: 'decimal_icon',
                    label: 'Decimal',
                    subPropOf: 'knora-api:DecimalValue',
                    gui_ele: 'salsah-gui:Spinbox',  // 'Number',
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
                    subPropOf: 'knora-api:LinkValue',
                    gui_ele: 'salsah-gui:Searchbox',    // 'Autocomplete',
                    group: 'Link'
                },
                {
                    icon: 'compare_arrows',
                    label: 'External resource',
                    subPropOf: 'knora-api:ExternalResValue',
                    gui_ele: 'salsah-gui:SimpleText',
                    group: 'Link'
                },
                {
                    icon: 'http',
                    label: 'External URL',
                    subPropOf: 'knora-api:UriValue',
                    gui_ele: 'salsah-gui:SimpleText',
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
                    subPropOf: 'knora-api:GeonameValue',
                    gui_ele: 'salsah-gui:Geonames',
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
                    subPropOf: 'knora-api:ColorValue',
                    gui_ele: 'salsah-gui:Colorpicker',
                    group: 'Shape'
                }
            ]
        }
    ];
}
