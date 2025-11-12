import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Cardinality, ReadValue } from '@dasch-swiss/dsp-js';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { Subscription } from 'rxjs';
import { startWith, takeWhile } from 'rxjs/operators';
import { FormValueGroup } from './form-value-array.type';
import { PropertyValueService } from './property-value.service';
import { propertiesTypeMapping } from './resource-payloads-mapping';

@Component({
  selector: 'app-property-value-edit',
  template: `
    <app-template-editor-switcher
      [myPropertyDefinition]="propertyValueService.propertyDefinition"
      [resourceClassIri]="propertyValueService.editModeData.resource.type"
      [projectIri]="propertyValueService.editModeData.resource.attachedToProject"
      [projectShortcode]="projectShortcode"
      [value]="readValue"
      (templateFound)="foundTemplate($event)" />

    @if (!loading) {
      <div style="display: flex; padding: 16px 0">
        <div style="flex: 1">
          @if (template) {
            <ng-container *ngTemplateOutlet="template; context: { item: group.controls.item }"></ng-container>
          }
          @if (group.controls.comment.value !== null) {
            <app-property-value-basic-comment [control]="group.controls.comment" />
          }
        </div>
        <div style="display: flex; width: 144px">
          <button
            (click)="afterUndo.emit()"
            mat-icon-button
            color="primary"
            [matTooltip]="'resourceEditor.resourceProperties.actions.undo' | translate">
            <mat-icon>undo</mat-icon>
          </button>
          <button
            mat-icon-button
            type="button"
            color="primary"
            (click)="toggleCommentValue()"
            data-cy="toggle-comment-button"
            [matTooltip]="
              commentIsNotNull
                ? ('resourceEditor.resourceProperties.actions.removeComment' | translate)
                : ('resourceEditor.resourceProperties.actions.addComment' | translate)
            ">
            <mat-icon>{{ commentIsNotNull ? 'speaker_notes_off' : 'add_comment' }}</mat-icon>
          </button>
          @if (group.controls.item.value !== null) {
            <button
              (click)="onSave()"
              [matTooltip]="'resourceEditor.resourceProperties.actions.save' | translate"
              mat-icon-button
              data-cy="save-button"
              color="primary">
              <mat-icon>save</mat-icon>
            </button>
          }
        </div>
      </div>
    } @else {
      <app-progress-indicator [size]="'xsmall'" />
    }
  `,
  standalone: false,
})
export class PropertyValueEditComponent implements OnInit, OnDestroy {
  @Input({ required: true }) readValue!: ReadValue | undefined;

  @Output() afterEdit = new EventEmitter<FormValueGroup>();
  @Output() afterUndo = new EventEmitter();
  template?: TemplateRef<any>;

  loading = false;
  private _subscription!: Subscription;

  group!: FormValueGroup;

  get commentIsNotNull() {
    return this.group.controls.comment.value !== null;
  }

  get projectShortcode(): string {
    return this._resourceService.getProjectShortcode(this.propertyValueService.editModeData.resource.id);
  }

  private readonly _cd = inject(ChangeDetectorRef);
  private readonly _resourceService = inject(ResourceService);
  public propertyValueService = inject(PropertyValueService);

  protected readonly Cardinality = Cardinality;

  ngOnInit() {
    const propertyType = propertiesTypeMapping.get(this.propertyValueService.propertyDefinition.objectType!)!;
    this.group = new FormGroup({
      item: propertyType.control(this.readValue ?? propertyType.newValue),
      comment: new FormControl(this.readValue?.valueHasComment || null),
    });

    this._watchAndSetupCommentStatus();
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  foundTemplate(template: TemplateRef<any>) {
    this.template = template;
    this._cd.detectChanges();
  }

  onSave() {
    if (this.group.invalid) return;
    this.afterEdit.emit(this.group);
  }

  toggleCommentValue() {
    this.group.controls.comment.setValue(this.commentIsNotNull ? null : '');
  }

  private _watchAndSetupCommentStatus() {
    this._subscription = this.group.controls.item.statusChanges
      .pipe(
        startWith(null),
        takeWhile(() => this.group !== undefined)
      )
      .subscribe(status => {
        if (status === 'INVALID' || this.group.controls.item.value === null) {
          this.group.controls.comment.disable();
        } else if (status === 'VALID') {
          this.group.controls.comment.enable();
        }
      });
  }
}
