import { DateValueHandlerComponent } from '@dasch-swiss/vre/ui/date-picker';
import { AdminImageDirective } from './lib/admin-image/admin-image.directive';
import { AlternatedListComponent } from './lib/alternated-list.component';
import { ColorPickerComponent } from './lib/app-color-picker.component';
import { CenteredBoxComponent } from './lib/centered-box.component';
import { CenteredLayoutComponent } from './lib/centered-layout.component';
import { CenteredMessageComponent } from './lib/centered-message.component';
import { ChipListInputComponent } from './lib/chip-list-input.component';
import { CkEditorControlComponent } from './lib/ck-editor/ck-editor-control.component';
import { CkEditorComponent } from './lib/ck-editor/ck-editor.component';
import { CommonInputComponent } from './lib/common-input.component';
import { ConfirmDialogComponent } from './lib/dialog/confirm-dialog.component';
import { DialogHeaderComponent } from './lib/dialog-header.component';
import { DragDropDirective } from './lib/directives/drag-drop.directive';
import { DoubleChipSelectorComponent } from './lib/double-chip-selector.component';
import { HintComponent } from './lib/hint/hint.component';
import { HumanReadableDatePipe } from './lib/human-readable-date.pipe';
import { HumanReadableErrorPipe } from './lib/human-readable-error.pipe';
import { InvalidControlScrollDirective } from './lib/invalid-control-scroll.directive';
import { NoResultsFoundComponent } from './lib/no-results-found.component';
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

export const UiStandaloneComponents = [
  AddTargetBlankPipe,
  AdminImageDirective,
  AlternatedListComponent,
  CenteredBoxComponent,
  CenteredLayoutComponent,
  CenteredMessageComponent,
  ChipListInputComponent,
  CkEditorComponent,
  CkEditorControlComponent,
  ColorPickerComponent,
  CommonInputComponent,
  ConfirmDialogComponent,
  DialogHeaderComponent,
  DateValueHandlerComponent,
  HumanReadableErrorPipe,
  DoubleChipSelectorComponent,
  DragDropDirective,
  HintComponent,
  HumanReadableDatePipe,
  InternalLinkReplacerPipe,
  InvalidControlScrollDirective,
  IsFalsyPipe,
  KnoraDatePipe,
  LinkifyPipe,
  NoResultsFoundComponent,
  PagerComponent,
  TimeFormatDirective,
  TimeFormatPipe,
  TimeInputComponent,
  TimePipe,
  TitleFromCamelCasePipe,
  TruncatePipe,
];
