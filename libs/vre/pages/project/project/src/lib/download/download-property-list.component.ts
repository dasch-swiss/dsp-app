import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-download-property-list',
  template: `
    @if (properties.length > 0) {
      <div style="margin-bottom: 16px">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
          <span style="font-weight: 500">{{ 'pages.dataBrowser.downloadDialog.properties' | translate }}</span>
          <div style="display: flex; gap: 8px">
            <button mat-button color="primary" (click)="selectAll()">
              {{ 'pages.dataBrowser.downloadDialog.selectAll' | translate }}
            </button>
            <button mat-button color="primary" (click)="selectNone()">
              {{ 'pages.dataBrowser.downloadDialog.selectNone' | translate }}
            </button>
          </div>
        </div>
      </div>

      <div style="max-height: 700px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 4px">
        @for (property of properties; track property.property.propDef.id) {
          <div
            style="display: flex; align-items: center; padding: 12px 8px; border-bottom: 1px solid #f5f5f5"
            [style.background-color]="property.selected ? '#f0f7ff' : 'transparent'">
            <mat-checkbox
              [checked]="property.selected"
              (change)="toggleProperty(property)"
              style="margin-right: 12px" />
            <div style="flex: 1">
              <div style="display: flex; align-items: center; gap: 8px">
                <span style="font-weight: 500">{{ property.property.propDef.label }}</span>
              </div>
              @if (property.property.propDef.comment; as comment) {
                <p style="margin: 0; color: #666; font-size: 13px">{{ comment }}</p>
              }
            </div>
          </div>
        }
      </div>

      <div style="margin-top: 8px; color: #666; font-size: 13px">
        {{
          'pages.dataBrowser.downloadDialog.selectedCount'
            | translate
              : {
                  count: selectedCount,
                  total: properties.length,
                }
        }}
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatButton, MatCheckbox, TranslateModule],
})
export class DownloadPropertyListComponent implements OnInit {
  @Input({ required: true }) propertyDefinitions!: PropertyInfoValues[];
  @Output() propertiesChange = new EventEmitter<string[]>();

  properties!: { selected: boolean; property: PropertyInfoValues }[];
  get selectedCount(): number {
    return this.properties.filter(p => p.selected).length;
  }

  emitProperties() {
    this.propertiesChange.emit(this.properties.filter(p => p.selected).map(p => p.property.propDef.id));
  }

  ngOnInit() {
    this.properties = this.propertyDefinitions.map(p => ({
      selected: false,
      property: p,
    }));
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

  toggleProperty(property: { selected: boolean; property: PropertyInfoValues }): void {
    property.selected = !property.selected;
    this.emitProperties();
  }
}
