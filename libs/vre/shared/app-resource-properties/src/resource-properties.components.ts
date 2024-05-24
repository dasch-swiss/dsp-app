import { CreateResourceDialogComponent } from './lib/create-resource-dialog.component';
import { CreateResourceFormComponent } from './lib/create-resource-form.component';
import { CreateResourcePageComponent } from './lib/create-resource-page.component';
import { DeleteResourceDialogComponent } from './lib/delete-resource-dialog.component';
import { DeleteValueDialogComponent } from './lib/delete-value-dialog.component';
import { EditResourceLabelDialogComponent } from './lib/edit-resource-label-dialog.component';
import { EraseResourceDialogComponent } from './lib/erase-resource-dialog.component';
import { ExistingPropertyValueComponent } from './lib/existing-property-value.component';
import { IncomingStandoffLinkValueComponent } from './lib/incoming-standoff-link-value.component';
import { PropertiesDisplayComponent } from './lib/properties-display.component';
import { PropertiesToolbarComponent } from './lib/properties-toolbar.component';
import { PropertyRowComponent } from './lib/property-row.component';
import { PropertyValueActionBubbleComponent } from './lib/property-value-action-bubble.component';
import { PropertyValueCommentComponent } from './lib/property-value-comment.component';
import { PropertyValueSwitcherComponent } from './lib/property-value-switcher.component';
import { PropertyValueComponent } from './lib/property-value.component';
import { PropertyValuesComponent } from './lib/property-values.component';
import { ResourceInfoBarComponent } from './lib/resource-info-bar.component';
import { BaseSwitchComponent } from './lib/switch-components/base-switch.component';
import { ColorSwitchComponent } from './lib/switch-components/color-switch.component';
import { DateSwitchComponent } from './lib/switch-components/date-switch.component';
import { GeonameSwitchComponent } from './lib/switch-components/geoname-switch.component';
import { IntervalSwitchComponent } from './lib/switch-components/interval-switch.component';
import { LinkSwitchComponent } from './lib/switch-components/link-switch.component';
import { ListSwitchComponent } from './lib/switch-components/list-switch.component';
import { RichTextSwitchComponent } from './lib/switch-components/rich-text-switch.component';
import { TextHtmlSwitchComponent } from './lib/switch-components/text-html-switch.component';
import { TextSwitchComponent } from './lib/switch-components/text-switch.component';
import { TextTypesSelectorComponent } from './lib/switch-components/text-types-selector.component';
import { TimeSwitchComponent } from './lib/switch-components/time-switch.component';
import { UriSwitchComponent } from './lib/switch-components/uri-switch.component';
import { Upload2Component } from './lib/upload2.component';
import { GeonameValueComponent } from './lib/value-components/geoname-value.component';
import { LinkValueComponent } from './lib/value-components/link-value.component';
import { ListValueComponent } from './lib/value-components/list-value.component';
import { NestedMenuComponent } from './lib/value-components/nested-menu.component';
import { RichTextValueComponent } from './lib/value-components/rich-text-value.component';
import { TimeValueComponent } from './lib/value-components/time-value.component';

const valueComponents = [
  GeonameValueComponent,
  LinkValueComponent,
  ListValueComponent,
  NestedMenuComponent,
  RichTextValueComponent,
  TimeValueComponent,
];

const switchComponents = [
  TimeSwitchComponent,
  ColorSwitchComponent,
  IntervalSwitchComponent,
  LinkSwitchComponent,
  UriSwitchComponent,
  GeonameSwitchComponent,
  ListSwitchComponent,
  DateSwitchComponent,
  BaseSwitchComponent,
  RichTextSwitchComponent,
  TextSwitchComponent,
  TextHtmlSwitchComponent,
];

export const ResourcePropertiesComponents = [
  ...switchComponents,
  ...valueComponents,
  TextTypesSelectorComponent,
  DeleteValueDialogComponent,
  PropertyValuesComponent,
  PropertyValueSwitcherComponent,
  PropertyValueActionBubbleComponent,
  PropertyValueComponent,
  ExistingPropertyValueComponent,
  CreateResourceDialogComponent,
  CreateResourcePageComponent,
  CreateResourceFormComponent,
  Upload2Component,
  PropertiesToolbarComponent,
  PropertyValueCommentComponent,
  EditResourceLabelDialogComponent,
  DeleteResourceDialogComponent,
  EraseResourceDialogComponent,
  IncomingStandoffLinkValueComponent,
  PropertyRowComponent,
  ResourceInfoBarComponent,
  PropertiesDisplayComponent,
];
