import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { StoredProject } from '@dasch-swiss/dsp-js';
import { LoadProjectsAction, ProjectsSelectors, UserSelectors } from '@dasch-swiss/vre/core/state';
import { Store } from '@ngxs/store';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-project-overview',
  templateUrl: './project-overview.component.html',
  styleUrls: ['./project-overview.component.scss'],
})
export class ProjectOverviewComponent implements OnInit, AfterViewInit {
  @ViewChild('filterInput') filterInput!: ElementRef;
  private _filter$ = new BehaviorSubject<string>('');

  activeProjects$ = combineLatest([this._store.select(ProjectsSelectors.allActiveProjects), this._filter$]).pipe(
    map(([projects, searchTerm]) => projects.filter(p => this.matchesSearchTerm(p, searchTerm)))
  );

  usersActiveProjects$ = combineLatest([this._store.select(UserSelectors.userActiveProjects), this._filter$]).pipe(
    map(([projects, searchTerm]) => projects.filter(p => this.matchesSearchTerm(p, searchTerm)))
  );

  notUsersActiveProjects$ = combineLatest([this._store.select(ProjectsSelectors.otherProjects), this._filter$]).pipe(
    map(([projects, searchTerm]) => projects.filter(p => this.matchesSearchTerm(p, searchTerm)))
  );

  userHasProjects$ = this.usersActiveProjects$.pipe(map(projects => projects.length > 0));
  isSysAdmin$ = this._store.select(UserSelectors.isSysAdmin);

  loading$ = this._store.select(ProjectsSelectors.isProjectsLoading);

  constructor(private _store: Store) {}

  ngOnInit() {
    this._store.dispatch(new LoadProjectsAction());
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
