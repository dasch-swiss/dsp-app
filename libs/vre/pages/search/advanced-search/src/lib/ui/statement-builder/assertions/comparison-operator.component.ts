import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Operator } from '../../../operators.config';

@Component({
  selector: 'app-comparison-operator',
  standalone: true,
  imports: [CommonModule, MatInputModule, MatSelectModule],
  template: `
    <mat-form-field>
      <mat-label>Operator</mat-label>
      <mat-select
        [value]="selectedOperator"
        (selectionChange)="operatorChange.emit($event.value)"
        data-cy="comparison-operator-select">
        @for (operator of operators; track operator) {
          <mat-option [value]="operator" [attr.data-cy]="operator">{{ operator }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparisonOperatorComponent {
  @Input({ required: true }) operators!: Operator[];
  @Input() selectedOperator?: Operator = Operator.Equals;

  @Output() operatorChange = new EventEmitter<Operator>();
}
