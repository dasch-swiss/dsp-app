import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
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
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Cardinality, Constants, KnoraDate, KnoraPeriod, ReadValue } from '@dasch-swiss/dsp-js';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { CalendarDateService } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable, of, Subscription, switchMap } from 'rxjs';
import { startWith, takeWhile } from 'rxjs/operators';
import { TemplateEditorSwitcherComponent } from '../template-switcher/template-editor-switcher.component';
import { FormValueGroup } from './form-value-array.type';
import { PropertyValueBasicCommentComponent } from './property-value-basic-comment.component';
import { PropertyValueService } from './property-value.service';
import { propertiesTypeMapping } from './resource-payloads-mapping';

/**
 * The calendar a date value is expressed in, or null when there is no value.
 *
 * A period carries one calendar for the whole value, which its start holds.
 */
function calendarOf(value: KnoraDate | KnoraPeriod | null): string | null {
  if (value === null) {
    return null;
  }
  return value instanceof KnoraPeriod ? value.start.calendar : value.calendar;
}

@Component({
  selector: 'app-property-value-edit',
  imports: [
    AsyncPipe,
    NgTemplateOutlet,
    MatButton,
    MatIconButton,
    MatIcon,
    MatTooltip,
    TemplateEditorSwitcherComponent,
    PropertyValueBasicCommentComponent,
    TranslatePipe,
    AppProgressIndicatorComponent,
  ],
  template: `
    <app-template-editor-switcher
      [myPropertyDefinition]="propertyValueService.propertyDefinition"
      [resourceClassIri]="propertyValueService.editModeData.resource.type"
      [projectIri]="propertyValueService.editModeData.resource.attachedToProject"
      [projectShortcode]="projectShortcode"
      [value]="readValue"
      (templateFound)="foundTemplate($event)" />

    @if (!loading) {
      <!-- The editor, then its actions at the end of the same line — the same place and size as the
           Edit and Delete buttons of the value being shown: Cancel, and Save as the one filled
           button. The comment is a text link under the editor (DEV-7494). -->
      <div class="edit-line">
        <div class="edit-content">
          @if (template) {
            <ng-container *ngTemplateOutlet="template; context: { item: group.controls.item }"></ng-container>
          }
          @if (group.controls.comment.value !== null) {
            <app-property-value-basic-comment [control]="group.controls.comment" />
          }
          <button
            mat-button
            color="primary"
            type="button"
            class="comment-toggle"
            data-cy="toggle-comment-button"
            (click)="toggleCommentValue()">
            <mat-icon>{{ commentIsNotNull ? 'remove' : 'add' }}</mat-icon>
            {{
              (commentIsNotNull
                ? 'resourceEditor.resourceProperties.actions.removeComment'
                : 'resourceEditor.resourceProperties.actions.addComment'
              ) | translate
            }}
          </button>
        </div>
        <div class="value-actions edit-actions">
          <button
            mat-icon-button
            type="button"
            class="value-action value-action-muted"
            data-cy="undo-button"
            (click)="afterUndo.emit()"
            [attr.aria-label]="'resourceEditor.resourceProperties.actions.cancel' | translate"
            [matTooltip]="'resourceEditor.resourceProperties.actions.cancel' | translate">
            <mat-icon>close</mat-icon>
          </button>
          <button
            mat-icon-button
            type="button"
            class="value-action value-action-primary"
            data-cy="save-button"
            [disabled]="(hasValidValue$ | async) !== true"
            (click)="onSave()"
            [attr.aria-label]="'resourceEditor.resourceProperties.actions.save' | translate"
            [matTooltip]="'resourceEditor.resourceProperties.actions.save' | translate">
            <mat-icon>check_circle</mat-icon>
          </button>
        </div>
      </div>
    } @else {
      <app-progress-indicator [size]="'xsmall'" />
    }
  `,
  styleUrls: ['./property-value-actions.scss'],
  styles: [
    `
      .edit-line {
        display: flex;
        align-items: flex-start;
        gap: 4px;
        padding: var(--property-value-padding-block, 16px) 0;
        border-radius: 4px;
        /* None in the viewer; a denser host such as the Data tab's table sets one. */
        background: var(--property-value-edit-background, none);
      }
      .edit-content {
        flex: 1;
        min-width: 0;
      }
      /* Level with the middle of the editor's first field, as the shown value's actions are with
         its first line. */
      .edit-actions {
        padding-top: 14px;
      }
      .comment-toggle {
        --mat-button-text-container-height: 26px;
        --mat-button-text-horizontal-padding: 4px;
        font-size: 12px;
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    `,
  ],
})
export class PropertyValueEditComponent implements OnInit, OnDestroy {
  @Input({ required: true }) readValue!: ReadValue | undefined;

  @Output() afterEdit = new EventEmitter<FormValueGroup>();
  @Output() afterUndo = new EventEmitter();
  template?: TemplateRef<any>;

  loading = false;
  private _subscription!: Subscription;

  group!: FormValueGroup;

  hasValidValue$?: Observable<boolean>;

  get commentIsNotNull() {
    return this.group.controls.comment.value !== null;
  }

  get projectShortcode(): string {
    return this._resourceService.getProjectShortcode(this.propertyValueService.editModeData.resource.id);
  }

  private readonly _cd = inject(ChangeDetectorRef);
  private readonly _resourceService = inject(ResourceService);
  private readonly _calendarDates = inject(CalendarDateService);
  public propertyValueService = inject(PropertyValueService);

  protected readonly Cardinality = Cardinality;

  ngOnInit() {
    const propertyType = propertiesTypeMapping.get(this.propertyValueService.propertyDefinition.objectType!)!;
    this.group = new FormGroup({
      item: propertyType.control(this.readValue ?? propertyType.newValue),
      comment: new FormControl(this.readValue?.valueHasComment || null),
    });

    const originalItem = this.group.controls.item.value;
    const originalComment = this.group.controls.comment.value;

    this.hasValidValue$ = this.group.valueChanges.pipe(
      startWith(null),
      switchMap(() =>
        of(
          this.group.controls.item.valid &&
            this.group.controls.item.value !== null &&
            this._hasChanged(originalItem, originalComment)
        )
      )
    );

    this._watchAndSetupCommentStatus();
  }

  /**
   * whether the user has actually altered the value, as opposed to restating it.
   *
   * Only date values are compared, and only when editing an existing one. Everything else keeps
   * the previous behaviour, where validity alone enables saving: widening this would quietly
   * change how all fifteen value types behave, which is not what this change is for.
   *
   * A date needs a comparison because converting it to another calendar rewrites every field
   * while meaning the same day — 15.06.2024 Gregorian is 02.06.2024 Julian — so comparing the
   * numerals alone would report an edit the user never made.
   *
   * **The calendar is part of the value, not a way of looking at it.** `UpdateDateValue` carries
   * `calendar` as a stored field beside the numerals, so choosing a different one is a real edit:
   * it changes what the record says the source used. Only restating both the same instant *and*
   * the same calendar is a no-op.
   */
  private _hasChanged(originalItem: unknown, originalComment: string | null): boolean {
    // Adding a value: there is nothing to differ from, so validity is the only question.
    if (this.readValue === undefined) {
      return true;
    }

    if (this.propertyValueService.propertyDefinition.objectType !== Constants.DateValue) {
      return true;
    }

    // An added and then emptied comment is still no comment.
    if ((this.group.controls.comment.value || null) !== (originalComment || null)) {
      return true;
    }

    const original = originalItem as KnoraDate | KnoraPeriod | null;
    const current = this.group.controls.item.value as KnoraDate | KnoraPeriod | null;

    if (calendarOf(original) !== calendarOf(current)) {
      return true;
    }

    return !this._calendarDates.dateValuesDenoteSameInstant(original, current);
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

        this._cd.detectChanges();
      });
  }
}
