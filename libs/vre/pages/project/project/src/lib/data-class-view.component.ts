import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { MultipleViewerComponent } from '@dasch-swiss/vre/pages/data-browser';
import { provideSearchFilters, StatementDraftStore } from '@dasch-swiss/vre/pages/search/search-filters';
import { OntologyService, ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { CenteredBoxComponent, NoResultsFoundComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { AngularSplitModule } from 'angular-split';
import { combineLatest, distinctUntilChanged, EMPTY, first, map, skip } from 'rxjs';
import { DataClassPanelComponent } from './data-class-panel.component';
import { provideDataClassSearch } from './data-class-query.service';
import { DataClassUrlStateService } from './data-class-url-state.service';
import { ProjectPageService } from './project-page.service';

@Component({
  selector: 'app-data-class-view',
  template: `
    @if (data$ | async; as classSelected) {
      @if (dataIsNotFound) {
        <app-centered-box>
          <app-no-results-found [message]="'pages.dataBrowser.dataClassView.noData' | translate" />
        </app-centered-box>
      } @else {
        <as-split>
          <as-split-area [size]="34" cdkScrollable>
            <app-data-class-panel [classSelected]="classSelected" />
          </as-split-area>
          <as-split-area [size]="66">
            <app-multiple-viewer (afterResourceDeleted)="onResourceDeleted()" />
          </as-split-area>
        </as-split>
      }
    } @else {
      <app-progress-indicator />
    }
  `,
  imports: [
    AsyncPipe,
    TranslatePipe,
    AngularSplitModule,
    CenteredBoxComponent,
    NoResultsFoundComponent,
    AppProgressIndicatorComponent,
    DataClassPanelComponent,
    MultipleViewerComponent,
  ],
  // Scoped here rather than on the panel so the class header and the list resolve one query, and so
  // a class switch tears the whole search state down with the view. `ResourceResultService` joins
  // them for the same reason: the count and pager move into the header in Phase 4, and they have to
  // read the same instance the list writes.
  providers: [...provideSearchFilters(), ...provideDataClassSearch(), ResourceResultService],
})
export class DataClassViewComponent {
  dataIsNotFound = false;
  data$ = combineLatest([
    this._route.params,
    this._projectPageService.currentProject$.pipe(first()),
    this._projectPageService.ontologies$,
  ]).pipe(
    map(([params, project, ontologies]) => {
      this.dataIsNotFound = false;
      const ontologyLabel = params[RouteConstants.ontologyParameter] as string;
      const classLabel = params[RouteConstants.classParameter] as string;

      const ontology = ontologies.find(
        ontology_ => ontology_.id === this._ontologyService.getOntologyIriFromRoute(project.shortcode, ontologyLabel)
      );

      if (!ontology) {
        this.dataIsNotFound = true;
        return EMPTY;
      }

      const classId = this._ontologyService.getClassIdFromParams(project.shortcode, ontologyLabel, classLabel);
      const resClass = Object.values(ontology.classes).find(cls => cls.id === classId);

      if (!resClass) {
        this.dataIsNotFound = true;
        return EMPTY;
      }

      return { ontologyLabel, classLabel, ontology, resClass: resClass as ResourceClassDefinitionWithAllLanguages };
    })
  );
  constructor(
    private readonly _projectPageService: ProjectPageService,
    private readonly _route: ActivatedRoute,
    private readonly _ontologyService: OntologyService,
    private readonly _urlState: DataClassUrlStateService,
    private readonly _draftStore: StatementDraftStore
  ) {
    this._clearSearchStateOnClassSwitch();
  }

  /**
   * A filter belongs to the class it was built against: its predicates come from that class, and
   * carrying `?filters=…` across a class switch would either silently match nothing or, worse, be
   * stripped field by field with no explanation.
   *
   * `skip(1)` is what makes a deep link work. The first emission is arrival, not a switch, and
   * resetting there would wipe the filters and sort out of the very URL the user was sent.
   */
  private _clearSearchStateOnClassSwitch(): void {
    this._route.params
      .pipe(
        map(params => params[RouteConstants.classParameter] as string),
        distinctUntilChanged(),
        skip(1),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this._urlState.reset();
        // Not part of the URL, so the reset navigation alone would leave a half-built filter from the
        // previous class sitting in the editor.
        this._draftStore.discardDrafts();
      });
  }

  onResourceDeleted() {
    this._projectPageService.reloadProject();
  }
}
