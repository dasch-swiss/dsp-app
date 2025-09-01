import { ChangeDetectionStrategy, Component, HostListener, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { combineLatest, take } from 'rxjs';
import { OntologyPageService } from './ontology-page.service';
import { OntologyEditService } from './services/ontology-edit.service';

@Component({
  selector: 'app-ontology',
  template: `
    <div class="ontology-editor" *ngIf="!disableContent">
      <div class="overlay-blocker" *ngIf="isTransacting$ | async">
        <app-progress-indicator [size]="'large'" class="floating-center" />
      </div>

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

    <app-status *ngIf="disableContent" [status]="204" />
  `,
  styleUrls: ['./ontology-page.component.scss'],
  providers: [OntologyPageService, OntologyEditService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OntologyPageComponent implements OnInit {
  project$ = this._projectPageService.currentProject$;
  ontology$ = this._oes.currentOntology$;

  disableContent = false;
  isTransacting$ = this._oes.isTransacting$;

  constructor(
    private _route: ActivatedRoute,
    private _titleService: Title,
    private _projectPageService: ProjectPageService,
    private _oes: OntologyEditService
  ) {}

  @HostListener('window:resize', ['$event']) onWindowResize() {
    this.disableContent = window.innerWidth <= 768;
  }

  ngOnInit() {
    this._setupPage();

    const ontoLabel = this._route.snapshot.params[RouteConstants.ontoParameter];
    this._oes.initOntologyByLabel(ontoLabel);
  }

  private _setupPage() {
    this.disableContent = window.innerWidth <= 768;

    combineLatest([this.project$, this.ontology$])
      .pipe(take(1))
      .subscribe(([project, currentOntology]) => {
        this._titleService.setTitle(`Project ${project?.shortname} | Data model${currentOntology ? '' : 's'}`);
      });
  }
}
