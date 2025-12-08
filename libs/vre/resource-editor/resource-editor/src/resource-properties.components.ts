import { DeleteValueDialogComponent } from './lib/resource-properties/delete-value-dialog.component';
import { EditResourceLabelDialogComponent } from './lib/resource-properties/edit-resource-label-dialog.component';
import { EraseResourceDialogComponent } from './lib/resource-properties/erase-resource-dialog.component';
import { FootnoteParserPipe } from './lib/resource-properties/footnotes/footnote-parser.pipe';
import { FootnoteTooltipComponent } from './lib/resource-properties/footnotes/footnote-tooltip.component';
import { FootnoteDirective } from './lib/resource-properties/footnotes/footnote.directive';
import { FootnotesComponent } from './lib/resource-properties/footnotes/footnotes.component';
import { PropertyRowComponent } from './lib/resource-properties/property-row.component';
import { PropertyValueActionBubbleComponent } from './lib/resource-properties/property-value-action-bubble.component';
import { PropertyValueAddComponent } from './lib/resource-properties/property-value-add.component';
import { PropertyValueBasicCommentComponent } from './lib/resource-properties/property-value-basic-comment.component';
import { PropertyValueDisplayCommentComponent } from './lib/resource-properties/property-value-display-comment.component';
import { PropertyValueDisplayComponent } from './lib/resource-properties/property-value-display.component';
import { PropertyValueEditComponent } from './lib/resource-properties/property-value-edit.component';
import { PropertyValueUpdateComponent } from './lib/resource-properties/property-value-update.component';
import { PropertyValueComponent } from './lib/resource-properties/property-value.component';
import { PropertyValuesWithFootnotesComponent } from './lib/resource-properties/property-values-with-footnotes.component';
import { PropertyValuesComponent } from './lib/resource-properties/property-values.component';
import { WithBreaksPipe } from './lib/resource-properties/with-breaks.pipe';

export const ResourcePropertiesComponents = [
  DeleteValueDialogComponent,
  EditResourceLabelDialogComponent,
  EraseResourceDialogComponent,
  FootnoteDirective,
  FootnoteParserPipe,
  FootnoteTooltipComponent,
  FootnotesComponent,
  PropertyRowComponent,
  PropertyValueActionBubbleComponent,
  PropertyValueAddComponent,
  PropertyValueBasicCommentComponent,
  PropertyValueComponent,
  PropertyValueDisplayCommentComponent,
  PropertyValueDisplayComponent,
  PropertyValueEditComponent,
  PropertyValueUpdateComponent,
  PropertyValuesComponent,
  PropertyValuesWithFootnotesComponent,
  WithBreaksPipe,
];
