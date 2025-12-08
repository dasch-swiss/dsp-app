import { CreateResourceDialogComponent } from './lib/template-switcher/create-resource-dialog.component';
import { MathJaxDirective } from './lib/template-switcher/mathjax/math-jax.directive';
import { NullableEditorComponent } from './lib/template-switcher/nullable-editor.component';
import { TemplateEditorSwitcherComponent } from './lib/template-switcher/template-editor-switcher.component';
import { TemplateViewerSwitcherComponent } from './lib/template-switcher/template-viewer-switcher.component';
import { BooleanValueComponent } from './lib/template-switcher/value-components/boolean-value.component';
import { ColorValueComponent } from './lib/template-switcher/value-components/color-value.component';
import { GeonameValueComponent } from './lib/template-switcher/value-components/geoname-value.component';
import { IntervalValueComponent } from './lib/template-switcher/value-components/interval-value.component';
import { LinkValueComponent } from './lib/template-switcher/value-components/link-value.component';
import { ListValueComponent } from './lib/template-switcher/value-components/list-value.component';
import { NestedMenuComponent } from './lib/template-switcher/value-components/nested-menu.component';
import { TimeValueComponent } from './lib/template-switcher/value-components/time-value.component';
import { ColorViewerComponent } from './lib/template-switcher/viewer-components/color-viewer.component';
import { DateViewerComponent } from './lib/template-switcher/viewer-components/date-viewer.component';
import { GeonameViewerComponent } from './lib/template-switcher/viewer-components/geoname-viewer.component';
import { IntervalViewerComponent } from './lib/template-switcher/viewer-components/interval-viewer.component';
import { LinkViewerComponent } from './lib/template-switcher/viewer-components/link-viewer.component';
import { ListViewerComponent } from './lib/template-switcher/viewer-components/list-viewer.component';
import { ParagraphViewerComponent } from './lib/template-switcher/viewer-components/paragraph-viewer.component';
import { RichTextViewerComponent } from './lib/template-switcher/viewer-components/rich-text-viewer.component';
import { TextHtmlViewerComponent } from './lib/template-switcher/viewer-components/text-html-viewer.component';
import { TimeViewerComponent } from './lib/template-switcher/viewer-components/time-viewer.component';
import { UriViewerComponent } from './lib/template-switcher/viewer-components/uri-viewer.component';

export const TemplateSwitcherComponents = [
  BooleanValueComponent,
  ColorValueComponent,
  ColorViewerComponent,
  CreateResourceDialogComponent,
  DateViewerComponent,
  GeonameValueComponent,
  GeonameViewerComponent,
  IntervalValueComponent,
  IntervalViewerComponent,
  LinkValueComponent,
  LinkViewerComponent,
  ListValueComponent,
  ListViewerComponent,
  MathJaxDirective,
  NestedMenuComponent,
  NullableEditorComponent,
  ParagraphViewerComponent,
  RichTextViewerComponent,
  TemplateEditorSwitcherComponent,
  TemplateViewerSwitcherComponent,
  TextHtmlViewerComponent,
  TimeValueComponent,
  TimeViewerComponent,
  UriViewerComponent,
];
