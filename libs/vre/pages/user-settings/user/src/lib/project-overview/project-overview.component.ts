import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { StoredProject } from '@dasch-swiss/dsp-js';
import { UserService } from '@dasch-swiss/vre/core/session';
import { BehaviorSubject, combineLatest, map, tap } from 'rxjs';
import { AllProjectsService } from './all-projects.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-project-overview',
  templateUrl: './project-overview.component.html',
  styleUrls: ['./project-overview.component.scss'],
  standalone: false,
})
export class ProjectOverviewComponent implements AfterViewInit {
  @ViewChild('filterInput') filterInput!: ElementRef;

  loading = true;
  private _filter$ = new BehaviorSubject<string>('');

  activeProjects$ = combineLatest([this._allProjectsService.allActiveProjects$, this._filter$]).pipe(
    map(([projects, searchTerm]) => projects.filter(p => this.matchesSearchTerm(p, searchTerm))),
    tap(() => {
      this.loading = false;
    })
  );

  usersActiveProjects$ = combineLatest([this._userService.userActiveProjects$, this._filter$]).pipe(
    map(([projects, searchTerm]) => projects.filter(p => this.matchesSearchTerm(p, searchTerm)))
  );

  notUsersActiveProjects$ = combineLatest([this._allProjectsService.otherProjects$, this._filter$]).pipe(
    map(([projects, searchTerm]) => projects.filter(p => this.matchesSearchTerm(p, searchTerm))),
    tap(() => {
      this.loading = false;
    })
  );

  userHasProjects$ = this.usersActiveProjects$.pipe(map(projects => projects.length > 0));
  isSysAdmin$ = this._userService.isSysAdmin$;

  constructor(
    private _userService: UserService,
    private _allProjectsService: AllProjectsService
  ) {}

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
