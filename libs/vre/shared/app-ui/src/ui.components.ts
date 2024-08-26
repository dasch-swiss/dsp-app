import { ConfirmDialogComponent } from './lib/dialog/confirm-dialog.component';
import { PagerComponent } from './lib/pager/pager.component';
import { TimeFormatPipe } from './lib/time-format.pipe';
import { TimeFormatDirective } from './lib/time-input/time-format.directive';
import { TimeInputComponent } from './lib/time-input/time-input.component';

export const UiComponents = [ConfirmDialogComponent, TimeInputComponent, TimeFormatDirective, TimeFormatPipe];
export const UiStandaloneComponents = [PagerComponent];
