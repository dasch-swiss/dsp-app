import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { ListApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { LocalizationService, pickPreferredLanguageString } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, filter, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { injectDataModelEditing } from '../ontology-map/data-model-editor';
import { LanguageText } from '../sidenav/data-model-map/data-model-graph';
import { DataModelsRailState } from './data-models-rail-state';
import { HighlightPipe } from './highlight.pipe';
import { LanguageTextsComponent } from './language-texts.component';
import { LanguagesMenuComponent, parseLanguages } from './languages-menu.component';
import { RAIL_SECTION_STYLES } from './rail-section-styles';
import { rememberedSignal } from './remembered-signal';
import { expandableIds, VocabularyNode, vocabularyRows, VocabularyRow, vocabularyUses } from './vocabulary-tree';

/**
 * Data models 2 › Controlled vocabularies: the project's vocabularies in one tree table, each a line to open on its
 * values, and the values on theirs. A vocabulary names where the data model uses it. The search finds vocabularies and
 * values, opening what leads to them. To those who may edit, each line's menu adds, edits, moves and deletes values, in
 * the old list editor's dialogs.
 */
@Component({
  selector: 'app-data-model-lists',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HighlightPipe,
    LanguagesMenuComponent,
    LanguageTextsComponent,
    MatButton,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatMenu,
    MatMenuContent,
    MatMenuItem,
    MatMenuTrigger,
    MatPrefix,
    TranslatePipe,
  ],
  template: `
    @let r = 'pages.dataModels2';
    <div class="section">
      <div class="head">
        <h2>{{ r + '.lists' | translate }}</h2>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
          <mat-icon matPrefix>search</mat-icon>
          <input
            #search
            matInput
            data-cy="data-model-lists-search"
            [placeholder]="r + '.findList' | translate"
            [attr.aria-label]="r + '.findList' | translate"
            (input)="query.set(search.value)" />
        </mat-form-field>
        <span class="spacer"></span>
        <app-languages-menu [(chosen)]="languages" cyPrefix="data-model-lists" />
        <button mat-button type="button" data-cy="data-model-lists-expand" (click)="toggleAll()">
          <mat-icon>{{ allExpanded() ? 'unfold_less' : 'unfold_more' }}</mat-icon>
          {{ (allExpanded() ? r + '.collapseAll' : r + '.expandAll') | translate }}
        </button>
      </div>

      <div class="table-box">
        <table class="tree" data-cy="data-model-lists" role="treegrid" [attr.aria-label]="r + '.lists' | translate">
          <colgroup>
            <col class="name-column" />
            <col />
            <col class="used-column" />
          </colgroup>
          <thead>
            <tr>
              <th>{{ r + '.colVocabulary' | translate }}</th>
              <th>{{ r + '.colDescription' | translate }}</th>
              <th>{{ r + '.colUsedBy' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.node.id) {
              <tr
                [class.vocabulary]="row.depth === 0"
                [attr.aria-level]="row.depth + 1"
                [attr.aria-expanded]="row.expandable ? row.expanded : null"
                data-cy="data-model-lists-row">
                <td>
                  <span class="node" [style.padding-left.px]="row.depth * 24">
                    @if (row.expandable) {
                      <button
                        type="button"
                        class="toggle"
                        [attr.aria-label]="(row.expanded ? r + '.collapseRow' : r + '.expandRow') | translate"
                        (click)="toggle(row)">
                        <mat-icon>{{ row.expanded ? 'expand_more' : 'chevron_right' }}</mat-icon>
                      </button>
                    } @else {
                      <span class="leaf" aria-hidden="true"></span>
                    }
                    @if (row.depth === 0) {
                      <mat-icon class="list-icon">format_list_bulleted</mat-icon>
                    }
                    <app-language-texts
                      class="node-label"
                      cyPrefix="data-model-lists"
                      [kind]="row.depth === 0 ? 'label' : 'description'"
                      [texts]="textsOf(row.node.labels)"
                      [shown]="row.label"
                      [languages]="languages()"
                      [highlight]="[query()]" />
                    @if (row.count) {
                      <span class="count">{{ row.count }}</span>
                    }
                    @if (canEdit()) {
                      <span class="row-spacer"></span>
                      <button
                        mat-icon-button
                        type="button"
                        class="row-menu"
                        data-cy="data-model-lists-row-menu"
                        [attr.aria-label]="r + '.valueActions' | translate: { value: row.label }"
                        [matMenuTriggerFor]="actions"
                        [matMenuTriggerData]="{ row }">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                    }
                  </span>
                </td>
                <td class="description">
                  @if (row.description) {
                    <app-language-texts
                      kind="description"
                      cyPrefix="data-model-lists"
                      [texts]="textsOf(row.node.comments)"
                      [shown]="row.description"
                      [languages]="languages()" />
                  } @else if (row.depth === 0) {
                    <span class="none">—</span>
                  }
                </td>
                <td>
                  @if (row.depth === 0) {
                    <span class="chips">
                      @for (use of uses().get(row.node.id) ?? []; track use.property) {
                        <span class="property-chip"
                          ><mat-icon>format_list_bulleted</mat-icon>{{ use.propertyLabel }}</span
                        >
                        @for (iri of use.classes; track iri) {
                          <span class="chip"
                            ><span class="tab" [style.background]="state.colors().get(iri) ?? '#F3F4F6'"></span
                            ><span class="chip-label">{{ state.labelOf(iri) }}</span></span
                          >
                        }
                      } @empty {
                        <span class="none">{{ r + '.notUsed' | translate }}</span>
                      }
                    </span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
        <mat-menu #actions="matMenu">
          <ng-template matMenuContent let-row="row">
            <button mat-menu-item data-cy="data-model-lists-add-inside" (click)="addInside(row)">
              <mat-icon>subdirectory_arrow_right</mat-icon>{{ r + '.addValueInside' | translate }}
            </button>
            @if (row.depth > 0) {
              <button mat-menu-item data-cy="data-model-lists-add-after" (click)="addAfter(row)">
                <mat-icon>playlist_add</mat-icon>{{ r + '.addValueAfter' | translate }}
              </button>
              <button mat-menu-item data-cy="data-model-lists-edit" (click)="editValue(row)">
                <mat-icon>edit</mat-icon>{{ r + '.editValue' | translate }}
              </button>
              <button mat-menu-item [disabled]="row.position === 0" (click)="move(row, -1)">
                <mat-icon>arrow_upward</mat-icon>{{ r + '.moveUp' | translate }}
              </button>
              <button mat-menu-item [disabled]="row.position === row.siblings - 1" (click)="move(row, 1)">
                <mat-icon>arrow_downward</mat-icon>{{ r + '.moveDown' | translate }}
              </button>
              <button mat-menu-item class="delete" data-cy="data-model-lists-delete" (click)="deleteValue(row)">
                <mat-icon>delete</mat-icon>{{ r + '.deleteValue' | translate }}
              </button>
            }
          </ng-template>
        </mat-menu>

        @if (vocabularies() && rows().length === 0) {
          <p class="empty">{{ r + (vocabularies()!.length ? '.noMatch' : '.noLists') | translate }}</p>
        }
      </div>
    </div>
  `,
  styles: [
    RAIL_SECTION_STYLES,
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      .tree {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        background: white;
        font-size: 13px;

        .name-column {
          width: 38%;
        }

        .used-column {
          width: 30%;
        }

        th {
          position: sticky;
          top: 0;
          z-index: 1;
          padding: 10px 12px;
          text-align: left;
          font-size: 11.5px;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: $cool_gray_500;
          background: #f9fafb;
          border-bottom: 1px solid $cool_gray_200;
          border-right: 1px solid #e5e7eb;
        }

        td {
          padding: 6px 12px;
          vertical-align: middle;
          border-bottom: 1px solid $cool_gray_100;
          border-right: 1px solid #f3f4f6;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        tr {
          height: 36px;
        }

        tr.vocabulary {
          height: 44px;
          background: #fcfcfd;

          .node-label {
            font-weight: 500;
          }
        }
      }

      .node {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }

      .toggle {
        flex: none;
        display: flex;
        width: 24px;
        height: 24px;
        padding: 0;
        border: 0;
        border-radius: 4px;
        background: none;
        color: $cool_gray_600;
        cursor: pointer;

        &:hover {
          background: $cool_gray_100;
        }
      }

      .leaf {
        flex: none;
        width: 24px;
        display: flex;
        justify-content: center;

        &::before {
          content: '';
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: $cool_gray_300;
        }
      }

      .list-icon {
        flex: none;
        width: 16px;
        height: 16px;
        font-size: 16px;
        color: $primary;
      }

      .node-label {
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .row-spacer {
        flex: 1;
      }

      // The row's menu shows on the hovered or focused row, and while open.
      .row-menu {
        --mat-icon-button-state-layer-size: 28px;
        flex: none;
        width: 28px;
        height: 28px;
        padding: 2px;
        opacity: 0;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      tr:hover .row-menu,
      tr:focus-within .row-menu,
      .row-menu[aria-expanded='true'] {
        opacity: 1;
      }

      .delete {
        color: #b91c1c;

        mat-icon {
          color: inherit;
        }
      }

      .count {
        flex: none;
        padding: 0 6px;
        border-radius: 10px;
        background: $cool_gray_100;
        font-size: 11.5px;
        line-height: 18px;
        color: $cool_gray_600;
      }

      .description {
        color: $cool_gray_700;
      }

      .chips {
        flex-wrap: nowrap;
        align-items: center;
        overflow: hidden;
      }

      .chip {
        flex: none;
      }

      .property-chip {
        flex: none;
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 0 7px 0 5px;
        border-radius: 11px;
        background: $cool_gray_100;
        font-size: 12px;
        line-height: 22px;
        color: $cool_gray_700;

        mat-icon {
          width: 14px;
          height: 14px;
          font-size: 14px;
        }
      }

      mark {
        border-radius: 2px;
        background: #fde68a;
        color: inherit;
      }
    `,
  ],
})
export class DataModelListsComponent {
  readonly state = inject(DataModelsRailState);
  private readonly _listApi = inject(ListApiService);
  private readonly _localization = inject(LocalizationService);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _editing = injectDataModelEditing();
  /** Whether values can be added, edited, moved and deleted here. */
  readonly canEdit = computed(() => this.state.canEdit() && this._editing.canEditVocabularies);
  /** Read the vocabularies again, once a value changed. */
  private readonly _reload = signal(0);

  readonly query = signal('');
  /** The languages names and descriptions show in, as in the other tables: the app's, or all. */
  readonly languages = rememberedSignal<string[] | null>('dsp-data-models-languages', null, parseLanguages);
  /** The vocabularies and values opened, by IRI. */
  readonly expanded = signal(new Set<string>());

  /** Every vocabulary of the project with all its values; a vocabulary that cannot be read shows without them. */
  readonly vocabularies = toSignal(
    toObservable(computed(() => ({ lists: this.state.lists(), reload: this._reload() }))).pipe(
      switchMap(({ lists }) => {
        if (!lists) return of(undefined);
        if (!lists.length) return of([]);
        return forkJoin(lists.map(list => this._readVocabulary(list as unknown as VocabularyNode)));
      })
    )
  );

  readonly rows = computed(() =>
    vocabularyRows(
      this.vocabularies() ?? [],
      this.expanded(),
      this.query(),
      node => this._text(node.labels) || node.name || node.id,
      node => this._text(node.comments)
    )
  );

  /** Where the data model shown uses each vocabulary. */
  readonly uses = computed(() => {
    const graph = this.state.graph();
    return graph ? vocabularyUses(graph) : new Map();
  });

  readonly allExpanded = computed(() => {
    const ids = expandableIds(this.vocabularies() ?? []);
    return ids.length > 0 && ids.every(id => this.expanded().has(id));
  });

  private readonly _search = viewChild<ElementRef<HTMLInputElement>>('search');

  constructor() {
    // Arriving on the page, typing finds a vocabulary or a value.
    afterNextRender(() => this._search()?.nativeElement.focus());
  }

  toggle(row: VocabularyRow): void {
    this.expanded.update(expanded => {
      const next = new Set(expanded);
      if (!next.delete(row.node.id)) next.add(row.node.id);
      return next;
    });
  }

  /** Opens every vocabulary and value, or closes them all when they are. */
  toggleAll(): void {
    this.expanded.set(this.allExpanded() ? new Set() : new Set(expandableIds(this.vocabularies() ?? [])));
  }

  /** Adds a value at the end of the line's values, and opens the line to show it. */
  addInside(row: VocabularyRow): void {
    this._changed(this._editing.addVocabularyValue(row.node.id, row.node.children?.length ?? 0), row.node.id);
  }

  /** Adds a value right after the line, among its parent's values. */
  addAfter(row: VocabularyRow): void {
    if (row.parent) this._changed(this._editing.addVocabularyValue(row.parent, row.position + 1));
  }

  editValue(row: VocabularyRow): void {
    this._changed(this._editing.editVocabularyValue(row.node));
  }

  /** Moves the value one place up or down among its parent's values. */
  move(row: VocabularyRow, step: number): void {
    if (row.parent) this._changed(this._editing.moveVocabularyValue(row.node.id, row.parent, row.position + step));
  }

  deleteValue(row: VocabularyRow): void {
    this._changed(this._editing.deleteVocabularyValue(row.node));
  }

  /** Reads the vocabularies again once the change is saved, the line `open` opened to show it. */
  private _changed(saved: Observable<boolean>, open?: string): void {
    saved.pipe(filter(Boolean), takeUntilDestroyed(this._destroyRef)).subscribe(() => {
      if (open) this.expanded.update(expanded => new Set(expanded).add(open));
      this._reload.update(count => count + 1);
    });
  }

  /** A vocabulary's or value's texts with their language, for the language lines. */
  textsOf(texts: VocabularyNode['labels'] | undefined): LanguageText[] {
    return (texts ?? []).filter(text => !!text.language).map(text => ({ language: text.language!, value: text.value }));
  }

  private _text(texts: VocabularyNode['labels'] | undefined): string {
    return pickPreferredLanguageString(
      texts as Parameters<typeof pickPreferredLanguageString>[0],
      this._localization.currentLanguage
    );
  }

  private _readVocabulary(info: VocabularyNode): Observable<VocabularyNode> {
    return this._listApi.get(info.id).pipe(
      map(response => {
        const list = (response as unknown as { list?: { children?: VocabularyNode[] } }).list;
        return { ...info, children: list?.children ?? [] };
      }),
      catchError(() => of({ ...info, children: [] }))
    );
  }
}
