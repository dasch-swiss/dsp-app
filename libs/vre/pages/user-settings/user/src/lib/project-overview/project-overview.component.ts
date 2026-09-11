import { AsyncPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { StoredProject } from '@dasch-swiss/dsp-js';
import { UserService } from '@dasch-swiss/vre/core/session';
import { FooterComponent } from '@dasch-swiss/vre/shared/app-help-page';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { TranslatePipe } from '@ngx-translate/core';
import { BehaviorSubject, Observable, combineLatest, map, tap } from 'rxjs';
import { AllProjectsService } from './all-projects.service';
import { ProjectCardComponent } from './project-card.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-project-overview',
  templateUrl: './project-overview.component.html',
  styleUrls: ['./project-overview.component.scss'],
  imports: [AsyncPipe, FooterComponent, MatIcon, TranslatePipe, ProjectCardComponent, AppProgressIndicatorComponent],
})
export class ProjectOverviewComponent implements AfterViewInit {
  @ViewChild('filterInput') filterInput!: ElementRef;

  loading = true;
  private _filter$ = new BehaviorSubject<string>('');

  allProjects$!: Observable<StoredProject[]>;
  usersProjects$!: Observable<StoredProject[]>;
  otherProjects$!: Observable<StoredProject[]>;
  userHasProjects$!: Observable<boolean>;
  isSysAdmin$!: Observable<boolean>;

  constructor(
    private readonly _userService: UserService,
    private readonly _allProjectsService: AllProjectsService
  ) {
    this.allProjects$ = combineLatest([this._allProjectsService.allProjects$, this._filter$]).pipe(
      map(([projects, searchTerm]) => projects.filter(p => this.matchesSearchTerm(p, searchTerm))),
      tap(() => {
        this.loading = false;
      })
    );
    this.usersProjects$ = combineLatest([this._userService.userProjects$, this._filter$]).pipe(
      map(([projects, searchTerm]) => projects.filter(p => this.matchesSearchTerm(p, searchTerm)))
    );
    this.otherProjects$ = combineLatest([this._allProjectsService.otherProjects$, this._filter$]).pipe(
      map(([projects, searchTerm]) => projects.filter(p => this.matchesSearchTerm(p, searchTerm))),
      tap(() => {
        this.loading = false;
      })
    );
    this.userHasProjects$ = this.usersProjects$.pipe(map(projects => projects.length > 0));
    this.isSysAdmin$ = this._userService.isSysAdmin$;
  }

  ngAfterViewInit(): void {
    this.filterInput.nativeElement.focus();
  }

  filterProjects(value: string) {
    this._filter$.next(value);
  }

  private matchesSearchTerm(project: StoredProject, searchTerm: string): boolean {
    const lower = searchTerm.toLowerCase();
    return (
      project.longname?.toLowerCase().includes(lower) ||
      project.shortcode.toLowerCase().includes(lower) ||
      project.shortname.toLowerCase().includes(lower)
    );
  }

  trackByFn = (index: number, item: StoredProject) => `${index}-${item.id}`;
}
