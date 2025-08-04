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
import { Cardinality } from '@dasch-swiss/dsp-js';
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
      <app-property-value-action-bubble
        *ngIf="showBubble && (propertyValueService.lastOpenedItem$ | async) !== index"
        [date]="propertyValueService.editModeData.values[index].valueCreationDate"
        [showDelete]="index > 0 || [Cardinality._0_1, Cardinality._0_n].includes(propertyValueService.cardinality)"
        (editAction)="propertyValueService.toggleOpenedValue(index)"
        (deleteAction)="askToDelete()" />

      <div class="value" [ngClass]="{ highlighted: isHighlighted }">
        <ng-container *ngIf="template">
          <ng-container
            *ngTemplateOutlet="
              template;
              context: { item: propertyValueService.editModeData.values[index] }
            "></ng-container>
        </ng-container>
      </div>

      <app-property-value-display-comment [index]="index" />
    </div>`,
  styleUrls: ['./property-value-display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyValueDisplayComponent implements OnInit {
  @Input({ required: true }) index!: number;

  template?: TemplateRef<any>;
  isHighlighted!: boolean;
  showBubble = false;

  constructor(
    public propertyValueService: PropertyValueService,
    private _dialog: MatDialog,
    private _viewContainerRef: ViewContainerRef,
    private _route: ActivatedRoute,
    private _cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this._highlightArkValue();
  }

  templateFound(template: TemplateRef<any>) {
    this.template = template;
    this._cd.detectChanges();
  }

  protected readonly Cardinality = Cardinality;

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
