import { ChangeDetectorRef, DestroyRef, inject, Pipe, PipeTransform } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StringLiteralV2 } from '@dasch-swiss/dsp-js';
import { LocalizationService, pickPreferredLanguageString } from '@dasch-swiss/vre/shared/app-helper-services';
import { IriLabelPair, PropertyObjectType, StatementElement } from '../../model';
import { Operator } from '../../operators.config';
import { ListNodeLabelResolver } from '../../service/list-node-label.resolver';
import { OntologyDataService } from '../../service/ontology-data.service';
import { StatementDraftStore } from '../../service/statement-draft.store';

@Pipe({ name: 'chipLabel', standalone: true, pure: false })
export class ChipLabelPipe implements PipeTransform {
  private readonly MAX_VALUE_LENGTH = 20;
  private readonly _localizationService = inject(LocalizationService);
  private readonly _draftStore = inject(StatementDraftStore);
  private readonly _listResolver = inject(ListNodeLabelResolver);
  private readonly _ontology = inject(OntologyDataService);
  private readonly _destroyRef = inject(DestroyRef);
  /**
   * Marks the enclosing OnPush view for check when the resolver or ontology emits. The chip's host
   * (`filter-chip.component`) is `OnPush`, and `pure: false` on its own only re-runs the pipe when the
   * host re-checks — so a fresh label from the list-node resolver never reaches the DOM unless we
   * schedule the host explicitly. Angular injects the pipe's owning view's `ChangeDetectorRef` here.
   */
  private readonly _cdr = inject(ChangeDetectorRef);

  private _resourceClassLabels = new Map<string, StringLiteralV2[]>();

  constructor() {
    this._ontology.resourceClasses$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(pairs => {
      this._resourceClassLabels = new Map(pairs.map(p => [p.iri, p.labels]));
      this._cdr.markForCheck();
    });
    this._listResolver.changes$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(() => {
      // A list tree finished loading. Schedule the host so the next CD cycle re-runs `transform()`
      // and the chip retranslates from the newly-cached labels.
      this._cdr.markForCheck();
    });
  }

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
    if (!v || typeof v !== 'object') return undefined;
    const pair = v as IriLabelPair;
    // Prefer a multi-language label resolved from live data (list tree / ontology) — this is what makes
    // the chip re-translate on language switch. Fall back to the stored labels only if the resolver has
    // not (yet) loaded the source data. Under DEV-6857 the URL no longer carries a `valueLabel` for list
    // and resource-class chips, so the fallback here is either an in-session `IriLabelPair.labels`
    // (still multi-language while the tree is loaded once) or the IRI itself.
    const resolved = this._resolveMultiLanguageLabels(statement, pair.iri);
    const language = this._localizationService.currentLanguage;
    if (resolved) {
      const picked = pickPreferredLanguageString(resolved, language);
      if (picked) return picked;
    }
    const picked = pickPreferredLanguageString(pair.labels, language);
    if (picked) return picked;
    // Last-resort fallback so the chip never renders empty during a still-loading list fetch.
    return pair.iri;
  }

  /**
   * Look up multi-language labels for the given object IRI, choosing the source by the statement's
   * object type: list values come from the loaded list tree (via {@link ListNodeLabelResolver}), and
   * `Matches` on a link property targets a resource class whose labels live in the ontology. Returns
   * undefined if the source is not (yet) available; the caller then falls back to the stored labels.
   */
  private _resolveMultiLanguageLabels(statement: StatementElement, iri: string): StringLiteralV2[] | undefined {
    if (statement.objectType === PropertyObjectType.ListValueObject) {
      const rootIri = statement.selectedPredicate?.listObjectIri;
      if (!rootIri) return undefined;
      return this._listResolver.getLabels(rootIri, iri);
    }
    if (statement.objectType === PropertyObjectType.ResourceObject) {
      return this._resourceClassLabels.get(iri);
    }
    return undefined;
  }

  private _truncate(value: string): string {
    return value.length > this.MAX_VALUE_LENGTH ? `${value.slice(0, this.MAX_VALUE_LENGTH)}…` : value;
  }
}
