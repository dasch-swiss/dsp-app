import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { ProgressIndicatorOverlayComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { combineLatest, take } from 'rxjs';
import { OntologyEditorHeaderComponent } from './ontology-editor-header.component';
import { OntologyPageService } from './ontology-page.service';
import { OntologySidenavComponent } from './ontology-sidenav.component';
import { OntologyEditService } from './services/ontology-edit.service';

@Component({
  selector: 'app-ontology',
  template: `
    <div class="ontology-editor">
      @if (isTransacting$ | async) {
        <div class="overlay-blocker">
          <app-progress-indicator-overlay class="floating-center" />
        </div>
      }
      <mat-sidenav-container class="ontology-editor-container">
        <mat-sidenav class="ontology-editor-sidenav" mode="side" position="end" opened>
          <app-ontology-sidenav />
        </mat-sidenav>
        <mat-sidenav-content class="ontology-editor-canvas drag-drop-stop">
          <app-ontology-editor-header class="sticky-header" />
          <div class="scroll">
            <router-outlet />
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styleUrls: ['./ontology-page.component.scss'],
  providers: [OntologyPageService, OntologyEditService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    MatSidenav,
    MatSidenavContainer,
    MatSidenavContent,
    OntologyEditorHeaderComponent,
    OntologySidenavComponent,
    ProgressIndicatorOverlayComponent,
    RouterOutlet,
  ],
})
export class OntologyPageComponent implements OnInit {
  project$ = this._projectPageService.currentProject$;
  ontology$ = this._oes.currentOntology$;

  isTransacting$ = this._oes.isTransacting$;

  constructor(
    private readonly _route: ActivatedRoute,
    private readonly _titleService: Title,
    private readonly _projectPageService: ProjectPageService,
    private readonly _oes: OntologyEditService
  ) {}

  ngOnInit() {
    this._setupPage();

    const ontoLabel = this._route.snapshot.params[RouteConstants.ontoParameter];
    this._oes.initOntologyByLabel(ontoLabel);
  }

  private _setupPage() {
    combineLatest([this.project$, this.ontology$])
      .pipe(take(1))
      .subscribe(([project, currentOntology]) => {
        this._titleService.setTitle(`Project ${project?.shortname} | Data model${currentOntology ? '' : 's'}`);
      });
  }
}
