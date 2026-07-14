import { inject, Pipe, PipeTransform } from '@angular/core';
import { LocalizationService, pickPreferredLanguageString } from '@dasch-swiss/vre/shared/app-helper-services';
import { IriLabelPair, StatementElement } from '../../model';
import { Operator } from '../../operators.config';
import { StatementDraftStore } from '../../service/statement-draft.store';

@Pipe({ name: 'chipLabel', standalone: true, pure: false })
export class ChipLabelPipe implements PipeTransform {
  private readonly MAX_VALUE_LENGTH = 20;
  private readonly _localizationService = inject(LocalizationService);
  private readonly _draftStore = inject(StatementDraftStore);

  /**
   * Human-readable label for a filter chip, including its subcriteria. A sub-query renders its nested
   * conditions inline after a `where (...)`, joined with `and`, and recurses to any depth — e.g.
   * `author matches Person where (name is like "Rita" and age greater than 30)`.
   */
  transform(statement: StatementElement): string {
    const base = this._formatStatement(statement);
    const children = this._draftStore.childrenOf(statement).filter(c => !c.isPristine);
    if (children.length === 0) return base;
    const parts = children.map(child => this.transform(child));
    return `${base} where (${parts.join(' and ')})`;
  }

  /** Format a single statement's predicate/operator/value, without its subcriteria. */
  private _formatStatement(statement: StatementElement): string {
    const prop = statement.selectedPredicate
      ? pickPreferredLanguageString(statement.selectedPredicate.labels, this._localizationService.currentLanguage)
      : '';
    const op = statement.selectedOperator;
    if (!op) return prop;

    if (op === Operator.Exists) return `${prop} exists`;
    if (op === Operator.NotExists) return `${prop} does not exist`;

    const rawValue = this._resolveValueLabel(statement);
    const value = rawValue ? this._truncate(rawValue) : '…';

    if (op === Operator.IsLike) return `${prop} is like "${value}"`;
    // Matches targets a resource class / linked resource (a name, not a text literal), so it reads better
    // unquoted — e.g. `author matches Person where (…)`.
    if (op === Operator.Matches) return `${prop} matches ${value}`;

    return `${prop} ${op} ${value}`;
  }

  private _resolveValueLabel(statement: StatementElement): string | undefined {
    const v = statement.selectedObjectValue;
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object') {
      return pickPreferredLanguageString((v as IriLabelPair).labels, this._localizationService.currentLanguage);
    }
    return undefined;
  }

  private _truncate(value: string): string {
    return value.length > this.MAX_VALUE_LENGTH ? `${value.slice(0, this.MAX_VALUE_LENGTH)}…` : value;
  }
}
