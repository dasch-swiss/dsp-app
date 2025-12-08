import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { DeleteValueDialogComponent, DeleteValueDialogProps } from './delete-value-dialog.component';
import { PropertyValueService } from './property-value.service';

@Component({
  selector: 'app-property-value-display',
  template: ` <app-template-viewer-switcher
      [myPropertyDefinition]="propertyValueService.propertyDefinition"
      [value]="propertyValueService.editModeData.values[index]"
      (templateFound)="templateFound($event)" />
    <div
      data-cy="property-value"
      class="pos-relative row"
      (mouseenter)="showBubble = true"
      (mouseleave)="showBubble = false">
      @if (showBubble && (propertyValueService.lastOpenedItem$ | async) !== index) {
        <app-property-value-action-bubble
          [date]="propertyValueService.editModeData.values[index].valueCreationDate"
          (editAction)="propertyValueService.toggleOpenedValue(index)"
          (deleteAction)="askToDelete()" />
      }

      <div class="value" [ngClass]="{ highlighted: isHighlighted }">
        @if (template) {
          <ng-container
            *ngTemplateOutlet="
              template;
              context: { item: propertyValueService.editModeData.values[index], index: index }
            "></ng-container>
        }
      </div>

      <app-property-value-display-comment [index]="index" />
    </div>`,
  styleUrls: ['./property-value-display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PropertyValueDisplayComponent implements OnInit {
  @Input({ required: true }) index!: number;

  template?: TemplateRef<any>;
  isHighlighted!: boolean;
  showBubble = false;

  constructor(
    public propertyValueService: PropertyValueService,
    private readonly _dialog: MatDialog,
    private readonly _viewContainerRef: ViewContainerRef,
    private readonly _route: ActivatedRoute,
    private readonly _cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this._highlightArkValue();
  }

  templateFound(template: TemplateRef<any>) {
    this.template = template;
    this._cd.detectChanges();
  }

  askToDelete() {
    this._dialog.open<DeleteValueDialogComponent, DeleteValueDialogProps>(DeleteValueDialogComponent, {
      data: { index: this.index },
      viewContainerRef: this._viewContainerRef,
    });
  }

  private _highlightArkValue() {
    this.isHighlighted =
      this._route.snapshot.queryParams['highlightValue'] ===
      this.propertyValueService.editModeData.values[this.index].uuid;
  }
}
