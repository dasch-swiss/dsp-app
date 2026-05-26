import { Pipe, PipeTransform } from '@angular/core';
import { StatementElement } from '../../model';
import { Operator } from '../../operators.config';

@Pipe({ name: 'chipLabel', standalone: true, pure: true })
export class ChipLabelPipe implements PipeTransform {
  private readonly MAX_VALUE_LENGTH = 20;

  transform(statement: StatementElement): string {
    const prop = statement.selectedPredicate?.label ?? '';
    const op = statement.selectedOperator;
    if (!op) return prop;

    if (op === Operator.Exists) return `${prop} exists`;
    if (op === Operator.NotExists) return `${prop} does not exist`;

    const rawValue = this._resolveValueLabel(statement);
    const value = rawValue ? this._truncate(rawValue) : '…';

    if (op === Operator.IsLike) return `${prop} is like "${value}"`;
    if (op === Operator.Matches) return `${prop} matches "${value}"`;

    return `${prop} ${op} ${value}`;
  }

  private _resolveValueLabel(statement: StatementElement): string | undefined {
    const v = statement.selectedObjectValue;
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object') return (v as { label?: string }).label;
    return undefined;
  }

  private _truncate(value: string): string {
    return value.length > this.MAX_VALUE_LENGTH ? `${value.slice(0, this.MAX_VALUE_LENGTH)}…` : value;
  }
}
