import { AsyncPipe, NgStyle } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ListNodeV2WithAllLanguages, ReadListValue, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { listRootIriFromGuiAttributes } from '@dasch-swiss/vre/shared/app-common';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { combineLatest, map, Observable, of } from 'rxjs';
import { PropertyValueService } from '../../property-value/property-value.service';

@Component({
  selector: 'app-list-viewer',
  imports: [AsyncPipe, NgStyle, MatIconModule, MatTooltipModule, StringifyStringLiteralPipe],
  template: `
    <div data-cy="list-switch" class="list-path">
      @for (node of nodes$ | async; track node.id; let last = $last; let index = $index) {
        @let comment = node.comments | appStringifyStringLiteral;
        <span
          [ngStyle]="{ 'font-weight': last && index > 0 ? 'bold' : 'normal' }"
          [matTooltip]="comment"
          [matTooltipDisabled]="!comment"
          >{{ node.labels | appStringifyStringLiteral }}</span
        >
        @if (!last) {
          <mat-icon class="list-path-separator">chevron_right</mat-icon>
        }
      }
    </div>
  `,
  styles: [
    `
      /* In a narrow column (the table's) the path wraps between its nodes rather than squeezing every
         node down to a letter per line, and the separators keep their size. */
      .list-path {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
      }
      .list-path-separator {
        flex: none;
      }
    `,
  ],
})
export class ListViewerComponent implements OnInit {
  @Input() value!: ReadListValue;
  @Input() propertyDef!: ResourcePropertyDefinition;
  nodes$!: Observable<ListNodeV2WithAllLanguages[]>;

  constructor(
    private _propertyValueService: PropertyValueService,
    private _localizationService: LocalizationService
  ) {}

  ngOnInit() {
    // Derive the list root from the property definition (already in memory) instead of a
    // /v2/node round trip whose only purpose was to read hasRootNode.
    const rootIri = listRootIriFromGuiAttributes(this.propertyDef.guiAttributes);
    if (!rootIri) {
      this.nodes$ = of([]);
      return;
    }

    // One whole-list fetch shared by every value of this property (and, in the table, by every
    // cell of the column), so N values from the same list issue a single /v2/lists request, not N.
    const tree$ = this._propertyValueService.getList$(rootIri).pipe(
      map(v => ListViewerComponent.lookFor([v], this.value.listNode) as ListNodeV2WithAllLanguages[]),
      map(tree => tree.slice(1))
    );

    // Re-emit on language change so AsyncPipe triggers a change-detection pass
    // and the impure label/comment pipes resolve against the new language.
    this.nodes$ = combineLatest([tree$, this._localizationService.currentLanguage$]).pipe(map(([tree]) => tree));
  }

  static lookFor(tree: ListNodeV2WithAllLanguages[], id: string): ListNodeV2WithAllLanguages[] | null {
    const node = tree[tree.length - 1];
    if (node.id === id) {
      return tree;
    }
    for (const childNode of node.children) {
      const found = ListViewerComponent.lookFor([...tree, childNode], id);
      if (found !== null) {
        return found;
      }
    }
    return null;
  }
}
