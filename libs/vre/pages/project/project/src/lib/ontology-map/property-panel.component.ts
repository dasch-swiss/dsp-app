import { Clipboard } from '@angular/cdk/clipboard';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Cardinality, Constants } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PropertyTypeIconPipe, PropertyTypeNamePipe } from '../data-models-rail/property-type.pipes';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { CanDo, DATA_MODEL_EDITOR, injectDataModelEditing } from './data-model-editor';
import { homeOf, propertyNameOf, propertyRows, propertyUsage, StandardTerm } from './ontology-graph-elements';

const CARDINALITY_KEY: Record<Cardinality, string> = {
  [Cardinality._1]: 'required',
  [Cardinality._0_1]: 'optional',
  [Cardinality._0_n]: 'many',
  [Cardinality._1_n]: 'oneOrMore',
};

const CARDINALITY_NOTATION: Record<Cardinality, string> = {
  [Cardinality._1]: '1',
  [Cardinality._0_1]: '0-1',
  [Cardinality._0_n]: '0-n',
  [Cardinality._1_n]: '1-n',
};

/**
 * The details of one property of a data model, docked beside the Ontology map: its description, the classes a link
 * points at or a value's type, and the classes that have it, each with how many values it takes there.
 */
@Component({
  selector: 'app-property-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatIcon, MatIconButton, MatTooltip, PropertyTypeIconPipe, PropertyTypeNamePipe, TranslatePipe],
  host: { '(keydown.escape)': 'closed.emit()' },
  template: `
    @let t = 'pages.ontologyMap.propertyPanel';
    @let c = 'pages.ontologyMap.classPanel';
    @if (usage(); as usage) {
      <section class="panel" data-cy="property-panel" [attr.aria-label]="usage.label">
        <header class="header">
          <span class="property-icon" [attr.data-type]="usage.type"
            ><mat-icon>{{ usage.type | propertyTypeIcon }}</mat-icon></span
          >
          <div class="title">
            <h2 data-cy="property-panel-title">{{ usage.label }}</h2>
            <span class="name-line">
              <code class="name" data-cy="property-panel-name">{{ name() }}</code>
              <button
                type="button"
                class="copy"
                [attr.aria-label]="'pages.ontologyMap.copyName' | translate"
                [matTooltip]="'pages.ontologyMap.copyName' | translate"
                (click)="copyName(propertyIri())">
                <mat-icon>content_copy</mat-icon>
              </button>
            </span>
          </div>
          <button
            mat-icon-button
            data-cy="property-panel-close"
            [attr.aria-label]="t + '.close' | translate"
            [matTooltip]="t + '.close' | translate"
            (click)="closed.emit()">
            <mat-icon>close</mat-icon>
          </button>
        </header>

        @if (usage.description) {
          <p class="description">{{ usage.description }}</p>
        }

        <!-- Where it sits among the properties: its parent, the standard terms it maps to, its sub-properties. -->
        @if (lineage(); as lineage) {
          <div class="lineage" data-cy="property-panel-lineage">
            @if (lineage.parent; as parent) {
              <span class="lineage-line">
                <mat-icon>subdirectory_arrow_right</mat-icon>
                <span
                  >{{ t + '.subPropertyOf' | translate }}
                  <button
                    type="button"
                    class="lineage-link"
                    data-cy="property-panel-parent"
                    (click)="propertySelected.emit(parent.id)">
                    {{ parent.label }}</button
                  ><code class="lineage-name">{{ parent.name }}</code></span
                >
              </span>
            }
            @for (term of lineage.terms; track term.iri) {
              <span class="lineage-line" data-cy="property-panel-term">
                <mat-icon>public</mat-icon>
                <span
                  >{{ t + '.standardTerm' | translate }}
                  <code class="term" [title]="term.iri">{{ term.short }}</code>
                  <span class="lineage-muted"
                    >{{ term.vocabulary }}
                    @if (term.through) {
                      · {{ t + '.through' | translate: { property: term.through } }}
                    }
                  </span></span
                >
              </span>
            }
            @if (lineage.subs.length) {
              <span class="lineage-line">
                <mat-icon>account_tree</mat-icon>
                <span
                  >{{ t + '.subProperties' | translate }}
                  @for (sub of lineage.subs; track sub.id; let last = $last) {
                    <button type="button" class="lineage-link" (click)="propertySelected.emit(sub.id)">
                      {{ sub.label }}</button
                    >{{ last ? '' : ',' }}
                  }
                </span>
              </span>
            }
          </div>
        }

        @if (usage.type !== 'Link') {
          <div class="facts">
            <div class="fact" data-cy="property-panel-type">
              <h3>{{ t + '.type' | translate }}</h3>
              <span class="type" [attr.data-type]="usage.type">
                <mat-icon>{{ usage.type | propertyTypeIcon }}</mat-icon
                >{{ usage.type | propertyTypeName }}
              </span>
            </div>
          </div>
        }

        <div class="group">
          <h3>{{ t + '.usedBy' | translate: { count: usage.users.length } }}</h3>
          @for (user of users(); track user.classIri) {
            <div class="user" data-cy="property-panel-user">
              <span class="dot" [style.background]="colors().get(user.classIri) ?? 'white'"></span>
              @if (user.navigable) {
                <button type="button" class="class-link" (click)="classSelected.emit(user.classIri)">
                  {{ user.classLabel }}
                </button>
              } @else {
                <span class="class-name">{{ user.classLabel }}</span>
              }
              @if (user.inheritedFrom) {
                <span class="inherited">{{
                  t + '.inheritedFrom' | translate: { class: user.inheritedFromLabel }
                }}</span>
              }
              @if (user.cardinality !== undefined) {
                <!-- As on the class cards: 1, 0-1, 1-n or 0-n, filled when required; in words on hover. -->
                <span
                  class="cardinality"
                  data-cy="property-panel-cardinality"
                  [class.required]="user.required"
                  [matTooltip]="c + '.' + user.cardinalityKey | translate"
                  >{{ user.cardinalityNotation }}</span
                >
              }
            </div>
          }
        </div>

        <!-- Kept in view at the bottom of the panel, as in the class panel. -->
        @if (canEdit()) {
          <div class="actions">
            <button mat-flat-button color="primary" data-cy="property-panel-edit" (click)="edit.emit(propertyIri())">
              <mat-icon>edit</mat-icon>
              {{ t + '.edit' | translate }}
            </button>
            @if (editing?.canDelete) {
              @let check = deleteCheck();
              <!-- Only once the API says no class or value uses the property; why not, on hover, otherwise. -->
              <span
                [matTooltip]="'pages.dataModels2.cannotDeleteProperty' | translate: { property: usage.label }"
                [matTooltipDisabled]="!check || check.canDo">
                <button
                  mat-stroked-button
                  class="delete"
                  data-cy="property-panel-delete"
                  [disabled]="!check?.canDo"
                  (click)="deleteProperty(usage.label)">
                  <mat-icon>delete</mat-icon>
                  {{ 'ui.common.actions.delete' | translate }}
                </button>
              </span>
            }
          </div>
        }
      </section>
    }
  `,
  styleUrl: './property-panel.component.css',
})
export class PropertyPanelComponent {
  private readonly _clipboard = inject(Clipboard);
  private readonly _notification = inject(NotificationService);
  private readonly _translate = inject(TranslateService);

  /** The data model, with its subclass relations, so inherited uses are told apart. */
  readonly graph = input.required<DataModelGraph>();
  /** IRI of the link property to describe. */
  readonly propertyIri = input.required<string>();
  /** Colour per class, as the graph draws them. */
  readonly colors = input<Map<string, string>>(new Map());
  /** Label of knora-api's "any resource", in the current language. */
  readonly anyResourceLabel = input('Any resource');
  /** Whether "Edit property" is offered. */
  readonly canEdit = input(false);

  /** The panel was closed. */
  readonly closed = output<void>();
  /** A class was clicked; emits its IRI, to describe it instead. */
  readonly classSelected = output<string>();
  /** "Edit property" was clicked; emits the property IRI. */
  readonly edit = output<string>();

  readonly usage = computed(() => propertyUsage(this.graph(), this.propertyIri()));
  readonly name = computed(() => this.nameOf(this.propertyIri()));

  /**
   * The classes that have the property, each with its label, whether it opens, and its cardinality as the class cards
   * show it: 1, 0-1, 1-n or 0-n, and in words.
   */
  readonly users = computed(() =>
    (this.usage()?.users ?? []).map(user => ({
      ...user,
      navigable: this.isNavigable(user.classIri),
      classLabel: this.labelOf(user.classIri),
      inheritedFromLabel: user.inheritedFrom ? this.labelOf(user.inheritedFrom) : undefined,
      required: user.cardinality === Cardinality._1 || user.cardinality === Cardinality._1_n,
      cardinalityKey: user.cardinality === undefined ? undefined : CARDINALITY_KEY[user.cardinality],
      cardinalityNotation: user.cardinality === undefined ? undefined : CARDINALITY_NOTATION[user.cardinality],
    }))
  );

  // Only where the app provides the data model editor: without it, nothing here edits.
  readonly editing = inject(DATA_MODEL_EDITOR, { optional: true }) ? injectDataModelEditing() : undefined;
  private readonly _destroyRef = inject(DestroyRef);
  /** What the API says of deleting the property shown; none while it checks. */
  readonly deleteCheck = signal<CanDo | undefined>(undefined);

  constructor() {
    // Each property shown, for editors, is checked once: Delete is offered only when nothing uses it.
    effect(() => {
      const iri = this.propertyIri();
      const editing = this.editing;
      const check = this.canEdit() && !!editing?.canDelete;
      untracked(() => {
        this.deleteCheck.set(undefined);
        if (!check || !editing) return;
        editing
          .canDeleteProperty(iri)
          .pipe(takeUntilDestroyed(this._destroyRef))
          .subscribe(result => {
            if (this.propertyIri() === iri) this.deleteCheck.set(result);
          });
      });
    });
  }

  /** Deletes the property once confirmed, then closes the panel. */
  deleteProperty(label: string): void {
    this.editing
      ?.deleteProperty(this.propertyIri(), label)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(deleted => deleted && this.closed.emit());
  }

  /** A property named in the panel was clicked, its parent or a sub-property; emits its IRI, to show it instead. */
  readonly propertySelected = output<string>();

  /**
   * Where the property sits: its parent among the data model's properties, the standard terms it maps to, its own and
   * those it has through its parents, and its sub-properties; none when it has none of these.
   */
  readonly lineage = computed(() => {
    const rows = propertyRows(this.graph());
    const byId = new Map(rows.map(row => [row.id, row]));
    const row = byId.get(this.propertyIri());
    if (!row) return undefined;
    const parent = row.parent ? byId.get(row.parent) : undefined;
    const terms: (StandardTerm & { through?: string })[] = [...row.terms];
    const seen = new Set([row.id]);
    for (let up = parent; up && !seen.has(up.id); up = up.parent ? byId.get(up.parent) : undefined) {
      seen.add(up.id);
      terms.push(
        ...up.terms
          .filter(term => !terms.some(other => other.iri === term.iri))
          .map(term => ({ ...term, through: up!.label }))
      );
    }
    const subs = rows.filter(other => other.parent === row.id);
    if (!parent && !terms.length && !subs.length) return undefined;
    return { parent, terms, subs };
  });

  isNavigable(iri: string): boolean {
    return this.graph().nodes.some(node => node.id === iri && node.kind === 'class');
  }

  labelOf(iri: string): string {
    if (iri === Constants.Resource) return this.anyResourceLabel();
    return this.graph().nodes.find(node => node.id === iri)?.label ?? iri.substring(iri.lastIndexOf('#') + 1);
  }

  /** The name in the data model, such as `linkToVideo`. */
  nameOf(iri: string): string {
    return propertyNameOf(iri, homeOf(this.graph()));
  }

  copyName(iri: string): void {
    this._clipboard.copy(this.nameOf(iri));
    this._notification.openSnackBar(this._translate.instant('pages.ontologyMap.nameCopied'));
  }
}
