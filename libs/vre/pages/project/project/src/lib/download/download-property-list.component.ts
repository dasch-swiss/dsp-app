import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { TranslatePipe } from '@ngx-translate/core';

interface SelectableProperty {
  selected: boolean;
  property: PropertyInfoValues;
  // Lower-cased label in every language, so the filter matches whatever language the user types in.
  searchText: string;
}

@Component({
  selector: 'app-download-property-list',
  template: `
    @if (properties.length > 0) {
      <div class="toolbar">
        <!-- Ticked when all are selected, a dash when some are; clicking selects all or none. -->
        <mat-checkbox
          class="select-all"
          data-cy="download-select-all"
          [checked]="selectedCount === properties.length"
          [indeterminate]="selectedCount > 0 && selectedCount < properties.length"
          (change)="selectedCount === properties.length ? selectNone() : selectAll()">
          {{ 'pages.dataBrowser.downloadDialog.properties' | translate }}
          <span class="count" data-cy="download-selected-count">{{ selectedCount }} / {{ properties.length }}</span>
        </mat-checkbox>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filter">
          <mat-icon matPrefix>search</mat-icon>
          <input
            matInput
            data-cy="download-property-filter"
            [attr.aria-label]="'pages.dataBrowser.downloadDialog.filterProperties' | translate"
            [placeholder]="'pages.dataBrowser.downloadDialog.filterProperties' | translate"
            [(ngModel)]="filterText" />
        </mat-form-field>
      </div>

      <div class="list" data-cy="download-property-list">
        @for (property of filteredProperties; track property.property.propDef.id) {
          <mat-checkbox
            class="item"
            [checked]="property.selected"
            (change)="toggleProperty(property)"
            [matTooltip]="property.property.propDef.comments | appStringifyStringLiteral"
            matTooltipPosition="above">
            {{ property.property.propDef.labels | appStringifyStringLiteral }}
          </mat-checkbox>
        } @empty {
          <p class="empty">{{ 'pages.dataBrowser.downloadDialog.noMatchingProperties' | translate }}</p>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 12px;
        /* 5px + the checkbox's 11px touch padding lines its box up with the list's checkboxes. */
        padding: 0 16px 8px 5px;
        border-bottom: 1px solid #eef0f2;
      }

      .select-all {
        flex: 1 0 auto;
        font-weight: 500;
      }

      .count {
        margin-left: 6px;
        font-weight: 400;
        color: #666;
        font-variant-numeric: tabular-nums;
      }

      .filter {
        flex: 0 1 240px;
        min-width: 180px;
        --mat-form-field-container-height: 40px;
        --mat-form-field-container-vertical-padding: 8px;
      }

      .list {
        flex: 1;
        min-height: 0;
        overflow-x: hidden;
        overflow-y: auto;
        display: grid;
        /* 1 column on a phone, 2 at the default panel width, more when it is wider. */
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        align-content: start;
        /* The checkbox's 11px touch padding then lines its box up with the filter's 16px edge. */
        padding: 4px 8px 4px 5px;
      }

      .item {
        min-width: 0;
      }

      .item ::ng-deep .mdc-form-field {
        width: 100%;
        min-width: 0;
      }

      .item ::ng-deep label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .empty {
        grid-column: 1 / -1;
        margin: 16px 8px;
        color: #666;
        font-size: 13px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    MatCheckbox,
    MatFormField,
    MatIcon,
    MatInput,
    MatPrefix,
    MatTooltip,
    StringifyStringLiteralPipe,
    TranslatePipe,
  ],
})
export class DownloadPropertyListComponent implements OnInit {
  @Input({ required: true }) propertyDefinitions!: PropertyInfoValues[];
  @Output() propertiesChange = new EventEmitter<string[]>();

  properties!: SelectableProperty[];
  filterText = '';

  get selectedCount(): number {
    return this.properties.filter(p => p.selected).length;
  }

  get filteredProperties(): SelectableProperty[] {
    const query = this.filterText.trim().toLowerCase();
    return query ? this.properties.filter(p => p.searchText.includes(query)) : this.properties;
  }

  emitProperties() {
    this.propertiesChange.emit(this.properties.filter(p => p.selected).map(p => p.property.propDef.id));
  }

  ngOnInit() {
    this.properties = this.propertyDefinitions.map(p => ({
      selected: true,
      property: p,
      searchText: [p.propDef.label, ...(p.propDef.labels ?? []).map(l => l.value)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
    }));
    this.emitProperties();
  }

  selectAll(): void {
    this.properties.forEach(p => {
      p.selected = true;
    });
    this.emitProperties();
  }

  selectNone(): void {
    this.properties.forEach(p => {
      p.selected = false;
    });
    this.emitProperties();
  }

  toggleProperty(property: SelectableProperty): void {
    property.selected = !property.selected;
    this.emitProperties();
  }
}
