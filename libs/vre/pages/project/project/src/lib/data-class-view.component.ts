import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { MultipleViewerComponent } from '@dasch-swiss/vre/pages/data-browser';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { CenteredBoxComponent, NoResultsFoundComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSplitModule } from 'angular-split';
import { combineLatest, EMPTY, first, map } from 'rxjs';
import { DataClassPanelComponent } from './data-class-panel.component';
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
    TranslateModule,
    AngularSplitModule,
    CenteredBoxComponent,
    NoResultsFoundComponent,
    AppProgressIndicatorComponent,
    DataClassPanelComponent,
    MultipleViewerComponent,
  ],
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
    private readonly _ontologyService: OntologyService
  ) {}

  onResourceDeleted() {
    this._projectPageService.reloadProject();
  }
}
