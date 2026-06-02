import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PropertyFormManager } from '../../service/property-form.manager';

@Component({
  selector: 'app-add-filter-button',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button mat-stroked-button (click)="onAdd()">
      <mat-icon>add</mat-icon>
      Add filter
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFilterButtonComponent {
  @Output() filterAdded = new EventEmitter<string>();

  private readonly _formManager = inject(PropertyFormManager);

  onAdd(): void {
    const blank = this._formManager.addBlankStatement();
    this.filterAdded.emit(blank.id);
  }
}
