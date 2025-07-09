import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectsSelectors } from '@dasch-swiss/vre/core/state';
import { Store } from '@ngxs/store';
import { combineLatest, Subject, take, takeUntil } from 'rxjs';
import { OntologyPageService } from './ontology-page.service';
import { OntologyEditService } from './services/ontology-edit.service';

@Component({
  selector: 'app-ontology',
  template: `
    <div class="ontology-editor" *ngIf="!disableContent">
      <div class="overlay-blocker" *ngIf="isTransacting$ | async">
        <app-progress-indicator class="floating-center" />
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
  providers: [OntologyPageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OntologyPageComponent implements OnInit, OnDestroy {
  project$ = this._store.select(ProjectsSelectors.currentProject);
  ontology$ = this._oes.currentOntology$;
  isAdmin$ = this._store.select(ProjectsSelectors.isCurrentProjectAdminOrSysAdmin);

  disableContent = false;
  isTransacting$ = this._oes.isTransacting$;

  private _destroy = new Subject<void>();

  constructor(
    private _route: ActivatedRoute,
    private _store: Store,
    private _titleService: Title,
    private _oes: OntologyEditService
  ) {}

  @HostListener('window:resize', ['$event']) onWindowResize() {
    this.disableContent = window.innerWidth <= 768;
  }

  ngOnInit() {
    this._setupPage();

    this.project$.pipe(takeUntil(this._destroy)).subscribe(project => {
      if (!project) {
        return;
      }
      const ontoLabel = this._route.snapshot.params[RouteConstants.ontoParameter];
      this._oes.initOntologyByLabel(ontoLabel);
    });
  }

  private _setupPage() {
    this.disableContent = window.innerWidth <= 768;

    combineLatest([this.project$, this.ontology$])
      .pipe(take(1))
      .subscribe(([project, currentOntology]) => {
        this._titleService.setTitle(`Project ${project?.shortname} | Data model${currentOntology ? '' : 's'}`);
      });
  }

  ngOnDestroy() {
    this._destroy.next();
    this._destroy.complete();
    this._oes.unloadOntology();
  }
}
