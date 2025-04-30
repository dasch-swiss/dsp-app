import { AdminImageDirective } from './lib/admin-image/admin-image.directive';
import { AlternatedListComponent } from './lib/alternated-list.component';
import { CenteredLayoutComponent } from './lib/centered-layout.component';
import { ChipListInputComponent } from './lib/chip-list-input.component';
import { CkEditorControlComponent } from './lib/ck-editor/ck-editor-control.component';
import { CkEditorComponent } from './lib/ck-editor/ck-editor.component';
import { ColorPickerComponent } from './lib/color-picker/color-picker.component';
import { CommonInputComponent } from './lib/common-input.component';
import { ConfirmDialogComponent } from './lib/dialog/confirm-dialog.component';
import { DragDropDirective } from './lib/directives/drag-drop.directive';
import { HintComponent } from './lib/hint/hint.component';
import { HumanReadableDatePipe } from './lib/human-readable-date.pipe';
import { InvalidControlScrollDirective } from './lib/invalid-control-scroll.directive';
import { PagerComponent } from './lib/pager/pager.component';
import { AddTargetBlankPipe } from './lib/pipes/add-target-blank.pipe';
import { KnoraDatePipe } from './lib/pipes/formatting/knoradate.pipe';
import { InternalLinkReplacerPipe } from './lib/pipes/internal-link-replacer.pipe';
import { IsFalsyPipe } from './lib/pipes/isFalsy.piipe';
import { LinkifyPipe } from './lib/pipes/string-transformation/linkify.pipe';
import { TitleFromCamelCasePipe } from './lib/pipes/string-transformation/title-from-camel-case.pipe';
import { TruncatePipe } from './lib/pipes/string-transformation/truncate.pipe';
import { TimePipe } from './lib/pipes/time.pipe';
import { TimeFormatPipe } from './lib/time-format.pipe';
import { TimeFormatDirective } from './lib/time-input/time-format.directive';
import { TimeInputComponent } from './lib/time-input/time-input.component';

export const UiComponents = [
  ConfirmDialogComponent,
  TimeInputComponent,
  TimeFormatDirective,
  TimeFormatPipe,
  CkEditorComponent,
  CkEditorControlComponent,
  InvalidControlScrollDirective,
  ChipListInputComponent,
  CommonInputComponent,
  ColorPickerComponent,
  AdminImageDirective,
  CenteredLayoutComponent,
  DragDropDirective,
  KnoraDatePipe,
  IsFalsyPipe,
  TimePipe,
  TitleFromCamelCasePipe,
  LinkifyPipe,
  TruncatePipe,
  HintComponent,
  InternalLinkReplacerPipe,
  AddTargetBlankPipe,
  AlternatedListComponent,
  HumanReadableDatePipe,
];
export const UiStandaloneComponents = [PagerComponent];
