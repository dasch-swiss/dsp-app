import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import {
  ReadResource,
  ReadValue,
  ResourcePropertyDefinitionWithAllLanguages,
  StringLiteralV2,
} from '@dasch-swiss/dsp-js';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { TranslatePipe } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';
import { MultipleViewerService } from '../comparison/multiple-viewer.service';
import { ProjectShortnameService } from '../project-shortname.service';

/**
 * One entry of the "Found in:" list. Exactly one field is set: `translationKey` for a hit on the
 * resource's own label — a UI string — and `labels` for a property, whose multi-language names the
 * template resolves the same way it resolves the resource class.
 */
interface FoundInEntry {
  readonly translationKey?: string;
  readonly labels?: StringLiteralV2[];
}

const RESOURCE_LABEL_KEY = 'pages.dataBrowser.resourceListItem.resourceLabel';

@Component({
  selector: 'app-resource-list-item',
  template: `
    <div
      class="item"
      [ngClass]="{
        highlighted: isHighlighted$ | async,
        search: multipleViewerService.searchKeyword !== undefined || visibleResourceClassLabels !== null,
      }"
      data-cy="resource-list-item"
      (mouseenter)="showCheckbox = true"
      (mouseleave)="showCheckbox = false"
      (click)="multipleViewerService.selectOneResource(resource)">
      <div style="display: flex; align-items: center; min-height: 40px">
        <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <div style="color: black">
            {{ resource.label }}
          </div>
          @let classLabels = visibleResourceClassLabels;
          @if (classLabels || foundIn.length > 0) {
            <div class="found-in">
              @if (classLabels) {
                <span class="semibold" data-cy="resource-class-label">{{
                  classLabels | appStringifyStringLiteral
                }}</span>
              }
              @if (foundIn.length > 0) {
                <span>
                  @if (classLabels) {
                    |
                  }
                  {{ 'pages.dataBrowser.resourceListItem.foundIn' | translate
                  }}<span class="semibold" data-cy="found-in-values">
                    <!-- The separator is part of the interpolation: as its own node it would pick up
                         the template's own indentation and render as "Réalisation , Titre". -->
                    @for (entry of foundIn; track $index) {
                      <span>{{
                        ($first ? '' : ', ') +
                          (entry.translationKey
                            ? (entry.translationKey | translate)
                            : (entry.labels | appStringifyStringLiteral))
                      }}</span>
                    }
                  </span></span
                >
              }
              @if (showProjectShortname && (projectShortname$ | async); as shortname) {
                <span>
                  | Project: <span class="semibold">{{ shortname }}</span></span
                >
              }
            </div>
          }
        </div>

        @if (showCheckbox || multipleViewerService.selectMode) {
          <mat-checkbox
            [checked]="isSelected$ | async"
            (change)="onCheckboxChanged($event)"
            (click)="$event.stopPropagation()" />
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .item {
        padding: 0 16px;
        cursor: pointer;
        &:hover {
          background-color: #ebebeb;
        }
        /* Rows with a metadata line below the label need vertical breathing room. Advanced search
           has no keyword yet still renders the class, so this cannot key on the keyword alone. */
        &.search {
          padding: 8px 16px;
        }
      }
      .highlighted {
        border-left: 2px solid #33678f;
        background-color: #d6e0e8;
      }
      mat-list-item {
        border-bottom: 1px solid #ebebeb;
      }

      .found-in {
        white-space: nowrap;
        text-overflow: ellipsis;
        margin-top: 8px;
        font-size: 12px;
      }
      .semibold {
        font-weight: 500;
      }
    `,
  ],
  imports: [AsyncPipe, NgClass, MatCheckbox, StringifyStringLiteralPipe, TranslatePipe],
})
export class ResourceListItemComponent implements OnInit {
  @Input({ required: true }) resource!: ReadResource;
  @Input() showProjectShortname = false;
  /**
   * Search results can mix resource classes, so the class is shown to tell them apart (DEV-5452).
   * Lists that are already scoped to a single class (the project sidenav) leave this off, where it
   * would repeat the same value on every row.
   */
  @Input() showResourceClass = false;

  showCheckbox = false;
  /**
   * Names are kept unresolved so the impure `appStringifyStringLiteral` / `translate` pipes can
   * re-render them on a UI language change — the point of holding the label arrays rather than the
   * single-language `ReadValue.propertyLabel`.
   */
  foundIn: FoundInEntry[] = [];

  isHighlighted$ = this.multipleViewerService.selectedResources$.pipe(
    map(resources => {
      if (this.multipleViewerService.selectMode) {
        return resources.map(r => r.id).includes(this.resource.id);
      } else {
        return resources.length > 0 && resources[0].id === this.resource.id;
      }
    })
  );

  isSelected$ = this.multipleViewerService.selectedResources$.pipe(
    map(resources => resources.map(r => r.id).includes(this.resource.id) && this.multipleViewerService.selectMode)
  );

  projectShortname$!: Observable<string>;

  /**
   * Prefers the multi-language labels off entityInfo so the class follows the UI language, and falls
   * back to the single-language resourceClassLabel, which dsp-js also fills in for deleted resources
   * and classes of unknown ontologies. `null` when neither source has a label, which the template
   * uses to drop the metadata line entirely rather than render it empty.
   *
   * Resolved once in `ngOnInit` rather than through a getter: `appStringifyStringLiteral` is impure
   * and memoizes on the array's identity, so handing it a freshly built array per change-detection
   * cycle would defeat that memo on every row.
   */
  resourceClassLabels: StringLiteralV2[] | null = null;

  /** The class labels only when they are actually shown, so the row's padding and the metadata
   * line agree on whether there is anything below the label. */
  get visibleResourceClassLabels(): StringLiteralV2[] | null {
    return this.showResourceClass ? this.resourceClassLabels : null;
  }

  constructor(
    public readonly multipleViewerService: MultipleViewerService,
    private readonly _projectShortnameService: ProjectShortnameService
  ) {}

  ngOnInit() {
    this.resourceClassLabels = this._resolveResourceClassLabels();

    const searchKeyword = this.multipleViewerService.searchKeyword;
    if (searchKeyword) {
      this._searchInResourceLabel(searchKeyword);
      this._searchInResourceProperty(searchKeyword);
    }

    this.projectShortname$ = this._projectShortnameService.getProjectShortname(this.resource.attachedToProject);
  }

  onCheckboxChanged(event: MatCheckboxChange) {
    if (event.checked) {
      this.multipleViewerService.addResources([this.resource]);
    } else {
      this.multipleViewerService.removeResources([this.resource]);
    }
  }

  private _resolveResourceClassLabels(): StringLiteralV2[] | null {
    const labels = this.resource.entityInfo?.classes[this.resource.type]?.labels;
    if (labels?.length) {
      return labels;
    }

    return this.resource.resourceClassLabel ? [{ value: this.resource.resourceClassLabel } as StringLiteralV2] : null;
  }

  private _searchInResourceLabel(keyword: string) {
    if (this.resource.label.toLowerCase().includes(keyword.toLowerCase())) {
      this.foundIn.push({ translationKey: RESOURCE_LABEL_KEY });
    }
  }

  /**
   * Deduplicates on the property IRI rather than on the resolved name: two values of the same
   * property must produce one entry regardless of the language the name happens to render in.
   */
  private _searchInResourceProperty(keyword: string) {
    Object.entries(this.resource.properties).forEach(([propertyIri, values]) => {
      const matches = values.some(value => value.strval && value.strval.toLowerCase().includes(keyword.toLowerCase()));
      if (!matches) {
        return;
      }

      const labels = this._resolvePropertyLabels(propertyIri, values[0]);
      if (labels) {
        this.foundIn.push({ labels });
      }
    });
  }

  /**
   * Mirrors `_resolveResourceClassLabels`: prefers the multi-language labels off `entityInfo`, and
   * falls back to the single-language `ReadValue.propertyLabel` that dsp-js resolves server-side.
   * `null` when neither has a name, which drops the entry rather than rendering an empty one.
   */
  private _resolvePropertyLabels(propertyIri: string, value: ReadValue): StringLiteralV2[] | null {
    const definition = this.resource.entityInfo?.properties[propertyIri] as
      ResourcePropertyDefinitionWithAllLanguages | undefined;
    if (definition?.labels?.length) {
      return definition.labels;
    }

    return value.propertyLabel ? [{ value: value.propertyLabel } as StringLiteralV2] : null;
  }
}
