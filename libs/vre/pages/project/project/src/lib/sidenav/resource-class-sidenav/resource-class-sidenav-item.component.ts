import { AsyncPipe, NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { LanguageStringDto, RepresentationClass } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { combineLatest, filter, first, map, of, startWith, switchMap } from 'rxjs';
import { DATA_CLASS_PARAM } from '../../data-class-url-state.service';
import { ProjectPageService } from '../../project-page.service';

@Component({
  selector: 'app-resource-class-sidenav-item',
  template: `
    <div (click)="selectResourceClass()" class="item" [ngClass]="{ selected: isSelected$ | async }">
      <span class="label">
        {{ label | appStringifyStringLiteral }}
      </span>
      <div class="metadata">
        <span>{{ count }}</span>
        <mat-icon class="icon">{{ icon }}</mat-icon>
      </div>
    </div>
  `,
  styles: [
    `
      .item {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        cursor: pointer;

        &:hover {
          background-color: #ebebeb;
        }
        &.selected {
          border-left: 2px solid #33678f;
          background-color: #d6e0e8;
        }
      }

      .label {
        flex: 1;
      }

      .metadata {
        justify-content: end;
        display: flex;
        align-items: center;
        color: #b9b9b9;
        margin-right: 0;
      }

      .icon {
        margin-left: 8px;
      }
    `,
  ],
  imports: [AsyncPipe, NgClass, MatIcon, StringifyStringLiteralPipe],
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

    // The view carries across a class switch; the query does not.
    //
    // Which view you are reading in is a property of the user, not of the class — switching class
    // in table view and landing back in the list is the app forgetting what you were doing. The
    // filters, term and sort are the opposite: they address *this* class's properties, and the
    // class view resets them on switch for exactly that reason.
    //
    // So `view` is named explicitly rather than preserving the whole query string. Naming the
    // params replaces them wholesale, which drops the rest — the same outcome the reset produces,
    // but without the extra navigation and the flash of a stale filter bar it would cause.
    //
    // Read off the router's current URL rather than this route's snapshot: query params belong to
    // the whole URL, and the sidenav sits outside the class view that owns the state service.
    const view = this._router.routerState.snapshot.root.queryParamMap.get(DATA_CLASS_PARAM.view);

    this._router.navigate([ontologyName, className], {
      relativeTo: this._route,
      queryParams: { [DATA_CLASS_PARAM.view]: view },
    });
  }
}
