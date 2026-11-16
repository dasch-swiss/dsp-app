import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { DefaultProperties, DefaultProperty, PropertyCategory } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe } from '@ngx-translate/core';
import { of, switchMap } from 'rxjs';
import { AvailableProperties, DATA_MODEL_EDITOR, injectDataModelEditing } from './data-model-editor';

/**
 * "Add property" under a class's properties in its panel: a new property of a type, or one the project already has,
 * as the data model editor offers it. Only where the app provides the editor, for those who may edit.
 */
@Component({
  selector: 'app-add-property-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatIcon, MatMenu, MatMenuItem, MatMenuTrigger, MatTooltip, TranslatePipe],
  template: `
    @let a = 'pages.ontology.addPropertyMenu';
    @if (canAdd) {
      <button
        mat-button
        type="button"
        class="add"
        data-cy="class-panel-add-property"
        [class.row]="row()"
        [matMenuTriggerFor]="menu"
        (menuOpened)="opened.set(true)">
        <mat-icon>add</mat-icon>
        {{ a + '.addProperty' | translate }}
      </button>
      <mat-menu #menu="matMenu">
        <button mat-menu-item data-cy="class-panel-add-new-property" [matMenuTriggerFor]="types">
          {{ a + '.createNewFromType' | translate }}
        </button>
        <button
          mat-menu-item
          data-cy="class-panel-add-existing-property"
          [disabled]="!available()?.length"
          [matMenuTriggerFor]="existing">
          {{ a + '.addExistingProperty' | translate }}
        </button>
      </mat-menu>

      <mat-menu #types="matMenu">
        @for (category of categories; track category.group) {
          <button mat-menu-item [matMenuTriggerFor]="ofCategory">{{ category.group }}</button>
          <mat-menu #ofCategory="matMenu">
            @for (type of category.elements; track type.label) {
              <button mat-menu-item [matTooltip]="type.description" matTooltipPosition="after" (click)="addNew(type)">
                <mat-icon>{{ type.icon }}</mat-icon>
                {{ type.label }}
              </button>
            }
          </mat-menu>
        }
      </mat-menu>

      <mat-menu #existing="matMenu">
        @for (group of available() ?? []; track group.ontologyLabel) {
          <button mat-menu-item [disabled]="!group.properties.length" [matMenuTriggerFor]="ofModel">
            {{ group.ontologyLabel }}
          </button>
          <mat-menu #ofModel="matMenu" class="existing-properties">
            @for (property of group.properties; track property.iri) {
              <!-- A second line tells properties with the same label apart: what it holds, who uses it, its name. -->
              <button
                mat-menu-item
                class="existing"
                data-cy="class-panel-existing-property"
                [matTooltip]="property.description"
                matTooltipPosition="after"
                (click)="addExisting(property.iri)">
                <mat-icon>{{ property.icon }}</mat-icon>
                <span class="texts">
                  <span class="label">{{ property.label }}</span>
                  <span class="details">
                    {{ property.isLink ? '→ ' + property.type : property.type }}
                    ·
                    @if (property.usedBy.length) {
                      {{ a + '.usedBy' | translate: { classes: property.usedBy.join(', ') } }}
                    } @else {
                      {{ a + '.notUsed' | translate }}
                    }
                    · <code>{{ property.name }}</code>
                  </span>
                </span>
              </button>
            }
          </mat-menu>
        }
      </mat-menu>
    }
  `,
  styles: [
    `
      .add {
        margin-top: 4px;
        height: 32px;
        font-size: 13px;
      }

      // An existing property on two lines: its label, then what tells it apart from others with the same label.
      .existing {
        --mat-menu-item-label-text-line-height: 1.3;
        min-height: 52px;
        padding-block: 6px;
      }

      .texts {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .label,
      .details {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .details {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.6);

        code {
          font-family: 'Roboto Mono', monospace;
          font-size: 11.5px;
          color: #336790;
        }
      }

      // As a card's last row: the whole line is the button, square, its text at the start.
      .add.row {
        width: 100%;
        margin: 0;
        height: 28px;
        padding: 0 16px;
        justify-content: flex-start;
        border-radius: 0;
        font-size: 12.5px;
        --mat-button-text-container-shape: 0;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          margin-right: 4px;
        }
      }
    `,
  ],
})
export class AddPropertyMenuComponent {
  /** Whether properties can be added here, in the data model editor's dialogs. */
  readonly canAdd = !!inject(DATA_MODEL_EDITOR, { optional: true });
  // Only where the app provides the editor: without it, nothing here edits.
  private readonly _editing = this.canAdd ? injectDataModelEditing() : undefined;

  readonly classIri = input.required<string>();
  /** Whether the button spans its whole line, as a card's last row, rather than sitting under the panel's list. */
  readonly row = input(false);

  readonly categories: PropertyCategory[] = DefaultProperties.data;

  /** The menu was opened once: the project's properties are read then, not with every panel. */
  readonly opened = signal(false);
  readonly available = toSignal<AvailableProperties[] | undefined>(
    toObservable(this.opened).pipe(
      switchMap(opened =>
        opened && this._editing ? this._editing.availableProperties(this.classIri()) : of(undefined)
      )
    )
  );

  addNew(type: DefaultProperty): void {
    this._editing?.addNewProperty(this.classIri(), type);
  }

  addExisting(propertyIri: string): void {
    this._editing?.addExistingProperty(this.classIri(), propertyIri);
  }
}
