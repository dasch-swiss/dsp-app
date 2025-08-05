import { DeleteValueDialogComponent } from './lib/delete-value-dialog.component';
import { EditResourceLabelDialogComponent } from './lib/edit-resource-label-dialog.component';
import { EraseResourceDialogComponent } from './lib/erase-resource-dialog.component';
import { FootnoteParserPipe } from './lib/footnotes/footnote-parser.pipe';
import { FootnoteTooltipComponent } from './lib/footnotes/footnote-tooltip.component';
import { FootnoteDirective } from './lib/footnotes/footnote.directive';
import { FootnotesComponent } from './lib/footnotes/footnotes.component';
import { PropertyRowComponent } from './lib/property-row.component';
import { PropertyValueActionBubbleComponent } from './lib/property-value-action-bubble.component';
import { PropertyValueAddComponent } from './lib/property-value-add.component';
import { PropertyValueBasicCommentComponent } from './lib/property-value-basic-comment.component';
import { PropertyValueDisplayCommentComponent } from './lib/property-value-display-comment.component';
import { PropertyValueDisplayComponent } from './lib/property-value-display.component';
import { PropertyValueEditComponent } from './lib/property-value-edit.component';
import { PropertyValueUpdateComponent } from './lib/property-value-update.component';
import { PropertyValueComponent } from './lib/property-value.component';
import { PropertyValuesWithFootnotesComponent } from './lib/property-values-with-footnotes.component';
import { PropertyValuesComponent } from './lib/property-values.component';

export const ResourcePropertiesComponents = [
  DeleteValueDialogComponent,
  PropertyValuesComponent,
  PropertyValueActionBubbleComponent,
  PropertyValueComponent,
  PropertyValueEditComponent,
  PropertyValueDisplayComponent,
  PropertyValueDisplayCommentComponent,
  PropertyValueUpdateComponent,
  PropertyValueAddComponent,
  PropertyValuesWithFootnotesComponent,
  EditResourceLabelDialogComponent,
  EraseResourceDialogComponent,
  PropertyRowComponent,
  FootnotesComponent,
  FootnoteTooltipComponent,
  FootnoteDirective,
  FootnoteParserPipe,

  PropertyValueBasicCommentComponent,
];
