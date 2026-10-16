import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { LanguageStringDto, RepresentationClass } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { combineLatest, filter, first, map, of, startWith, switchMap } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';

@Component({
  selector: 'app-resource-class-sidenav-item',
  template: `
    @let label_ = label | appStringifyStringLiteral;
    <!-- Full-bleed row: the class's type icon, its name, then its count (DEV-7494, sidebar design I4). -->
    <button
      type="button"
      class="item"
      [class.selected]="isSelected$ | async"
      [attr.aria-current]="(isSelected$ | async) ? 'page' : null"
      [title]="label_"
      (click)="selectResourceClass()">
      <mat-icon class="icon" aria-hidden="true">{{ icon }}</mat-icon>
      <span class="label">{{ label_ }}</span>
      <span class="count">{{ count | number }}</span>
    </button>
  `,
  styles: [
    `
      .item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        height: 34px;
        /* 14px + the 2px selection bar: text on the same 16px gutter as the rest of the page. */
        padding: 0 12px 0 14px;
        border: 0;
        border-left: 2px solid transparent;
        background: transparent;
        cursor: pointer;
        text-align: left;
        font: 400 14px/1 var(--font-sans, Roboto, sans-serif);
        color: #1f2937;

        &:hover {
          background: #f3f4f6;
        }

        &:focus-visible {
          outline: 2px solid var(--primary, #336790);
          outline-offset: -2px;
        }

        /* The result list's selection, exactly: tint and accent bar, nothing else — so the two
           lists side by side mark "selected" the same way. */
        &.selected {
          border-left-color: #33678f;
          background: #d6e0e8;
        }
      }

      .label {
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .count {
        flex: none;
        font-size: 12px;
        font-weight: 400;
        color: #9ca3af;
        font-variant-numeric: tabular-nums;
      }

      .icon {
        flex: none;
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #9ca3af;
      }
    `,
  ],
  imports: [AsyncPipe, DecimalPipe, MatIcon, StringifyStringLiteralPipe],
})
export class ResourceClassSidenavItemComponent {
  @Input({ required: true }) iri!: string;
  @Input({ required: true }) count!: number;
  @Input({ required: true }) label!: LanguageStringDto[];
  @Input({ required: true }) representationClass!: RepresentationClass;

  get icon(): string {
    switch (this.representationClass) {
      case 'ArchiveRepresentation':
        return 'folder_zip';
      case 'AudioRepresentation':
        return 'audio_file';
      case 'DocumentRepresentation':
        return 'description';
      case 'MovingImageRepresentation':
        return 'video_file';
      case 'StillImageRepresentation':
        return 'image';
      case 'TextRepresentation':
        return 'text_snippet';
      case 'WithoutRepresentation':
      default: // resource does not have a file representation
        return 'insert_drive_file';
    }
  }

  isSelected$ = this._router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    startWith(null),
    switchMap(() => {
      const firstChild = this._route.firstChild;
      if (!firstChild) {
        return of(false);
      }
      return combineLatest([firstChild.params, this._projectPageService.currentProject$.pipe(first())]).pipe(
        map(([params, project]) => {
          const selectedResClassId = this._ontologyService.getClassIdFromParams(
            project.shortcode,
            params[RouteConstants.ontologyParameter],
            params[RouteConstants.classParameter]
          );
          return this.iri === selectedResClassId;
        })
      );
    })
  );

  constructor(
    private readonly _ontologyService: OntologyService,
    private readonly _projectPageService: ProjectPageService,
    private readonly _router: Router,
    private readonly _route: ActivatedRoute
  ) {}

  selectResourceClass() {
    const [ontologyIri, className] = this.iri.split('#');
    const ontologyName = OntologyService.getOntologyNameFromIri(ontologyIri);

    this._router.navigate([ontologyName, className], { relativeTo: this._route });
  }
}
