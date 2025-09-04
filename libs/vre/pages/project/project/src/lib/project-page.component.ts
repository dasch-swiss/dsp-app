import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { filter, startWith, Subject, takeUntil } from 'rxjs';
import { ProjectPageService } from './project-page.service';

@Component({
  selector: 'app-project-page',
  template: `
    <mat-sidenav-container style="flex: 1" autosize>
      <mat-sidenav mode="side" [(opened)]="sideNavOpened" [disableClose]="true" style="overflow: visible">
        <app-project-sidenav-collapse-button
          *ngIf="sideNavOpened"
          [expand]="false"
          (toggleSidenav)="toggleSidenav()"
          style="position: absolute; right: -11px; top: 21px" />
        <app-project-sidenav />
      </mat-sidenav>
      <mat-sidenav-content>
        <app-project-sidenav-collapse-button
          *ngIf="!sideNavOpened"
          [expand]="true"
          (toggleSidenav)="toggleSidenav()"
          style="position: absolute; top: 21px; left: 8px" />

        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styleUrls: ['./project-page.component.scss'],
  providers: [ProjectPageService],
})
export class ProjectPageComponent implements OnInit, OnDestroy {
  hasProjectAdminRights$ = this._projectPageService.hasProjectAdminRights$;
  sideNavOpened = true;
  currentOntologyName: undefined | string;

  destroyed: Subject<void> = new Subject<void>();

  protected readonly RouteConstants = RouteConstants;

  constructor(
    private _router: Router,
    protected _route: ActivatedRoute,
    private _titleService: Title,
    private _projectPageService: ProjectPageService
  ) {}

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    const element = event.target as HTMLElement;
    if (event.key === '[' && !element.matches('input, textarea')) {
      this.toggleSidenav();
    }
  }

  ngOnInit() {
    this._route.params.subscribe(params => {
      this._projectPageService.setCurrentProjectUuid(params[RouteConstants.uuidParameter]);
    });

    this._projectPageService.currentProject$.subscribe(project => {
      this._titleService.setTitle(project.shortname);
    });

    this._projectPageService.hasProjectMemberRights$.subscribe();

    this._router.events
      .pipe(
        takeUntil(this.destroyed),
        filter(e => e instanceof NavigationEnd),
        startWith(null)
      )
      .subscribe(() => {
        this.currentOntologyName = this.getParamFromRouteTree('onto');
      });
  }

  private getParamFromRouteTree(param: string): string | undefined {
    let route = this._router.routerState.root;
    while (route) {
      if (route.snapshot.paramMap.has(param)) {
        return route.snapshot.paramMap.get(param) || undefined;
      }
      route = route.firstChild!;
    }
    return undefined;
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  toggleSidenav() {
    this.sideNavOpened = !this.sideNavOpened;
  }
}
