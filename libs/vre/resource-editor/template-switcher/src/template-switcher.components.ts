import { CreateResourceDialogComponent } from './lib/create-resource-dialog.component';
import { MathJaxDirective } from './lib/mathjax/math-jax.directive';
import { NullableEditorComponent } from './lib/nullable-editor.component';
import { TemplateEditorSwitcherComponent } from './lib/template-editor-switcher.component';
import { TemplateViewerSwitcherComponent } from './lib/template-viewer-switcher.component';
import { BooleanValueComponent } from './lib/value-components/boolean-value.component';
import { ColorValueComponent } from './lib/value-components/color-value.component';
import { GeonameValueComponent } from './lib/value-components/geoname-value.component';
import { IntervalValueComponent } from './lib/value-components/interval-value.component';
import { LinkValueComponent } from './lib/value-components/link-value.component';
import { ListValueComponent } from './lib/value-components/list-value.component';
import { NestedMenuComponent } from './lib/value-components/nested-menu.component';
import { TimeValueComponent } from './lib/value-components/time-value.component';
import { ColorViewerComponent } from './lib/viewer-components/color-viewer.component';
import { DateViewerComponent } from './lib/viewer-components/date-viewer.component';
import { GeonameViewerComponent } from './lib/viewer-components/geoname-viewer.component';
import { IntervalViewerComponent } from './lib/viewer-components/interval-viewer.component';
import { LinkViewerComponent } from './lib/viewer-components/link-viewer.component';
import { ListViewerComponent } from './lib/viewer-components/list-viewer.component';
import { RichTextViewerComponent } from './lib/viewer-components/rich-text-viewer.component';
import { TextHtmlViewerComponent } from './lib/viewer-components/text-html-viewer.component';
import { TimeViewerComponent } from './lib/viewer-components/time-viewer.component';
import { UriViewerComponent } from './lib/viewer-components/uri-viewer.component';

export const TemplateSwitcherComponents = [
  // Value components
  GeonameValueComponent,
  ColorValueComponent,
  LinkValueComponent,
  IntervalValueComponent,
  ListValueComponent,
  NestedMenuComponent,
  TimeValueComponent,
  BooleanValueComponent,
  // Viewer components
  DateViewerComponent,
  GeonameViewerComponent,
  IntervalViewerComponent,
  LinkViewerComponent,
  ListViewerComponent,
  RichTextViewerComponent,
  TextHtmlViewerComponent,
  TimeViewerComponent,
  ColorViewerComponent,
  UriViewerComponent,
  // Other components
  TemplateViewerSwitcherComponent,
  TemplateEditorSwitcherComponent,
  MathJaxDirective,
  CreateResourceDialogComponent,
  NullableEditorComponent,
];
