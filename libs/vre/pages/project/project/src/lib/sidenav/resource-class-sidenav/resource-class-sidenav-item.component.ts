import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { LanguageStringDto, RepresentationClass } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { map } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import { TooltipIfTruncatedDirective } from '../tooltip-if-truncated.directive';
import { navigateToResourceClass, selectedResourceClassIri$ } from './resource-class-route';

@Component({
  selector: 'app-resource-class-sidenav-item',
  template: `
    @let label_ = label | appStringifyStringLiteral;
    @let selected = isSelected$ | async;
    <!-- Full-bleed row: the class's type icon, its name, then its count (DEV-7494, sidebar design I4). -->
    <button
      type="button"
      class="item"
      [class.selected]="selected"
      [attr.aria-current]="selected ? 'page' : null"
      [appTooltipIfTruncated]="label_"
      [truncated]="labelText"
      (click)="selectResourceClass()">
      <mat-icon class="icon" aria-hidden="true">{{ icon }}</mat-icon>
      <!-- The full name in a tooltip, but only when it is cut off (DEV-7494). -->
      <span #labelText class="label">{{ label_ }}</span>
      <span class="count">{{ count | number }}</span>
    </button>
  `,
  styles: [
    `
      @use '../../../../../../../../../apps/dsp-app/src/styles/config' as *;

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
        color: $cool_gray_800;

        &:hover {
          background: $cool_gray_100;
        }

        &:focus-visible {
          outline: 2px solid $primary;
          outline-offset: -2px;
        }

        /* The result list's selection, exactly: tint and accent bar, nothing else — so the two
           lists side by side mark "selected" the same way. */
        &.selected {
          border-left-color: $primary;
          background: $primary_100;
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
        color: $cool_gray_400;
        font-variant-numeric: tabular-nums;
      }

      .icon {
        flex: none;
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: $cool_gray_400;
      }
    `,
  ],
  imports: [AsyncPipe, DecimalPipe, MatIcon, StringifyStringLiteralPipe, TooltipIfTruncatedDirective],
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

  isSelected$ = selectedResourceClassIri$(
    this._router,
    this._route,
    this._ontologyService,
    this._projectPageService
  ).pipe(map(selectedIri => this.iri === selectedIri));

  constructor(
    private readonly _ontologyService: OntologyService,
    private readonly _projectPageService: ProjectPageService,
    private readonly _router: Router,
    private readonly _route: ActivatedRoute
  ) {}

  selectResourceClass() {
    navigateToResourceClass(this._router, this._route, this.iri);
  }
}
