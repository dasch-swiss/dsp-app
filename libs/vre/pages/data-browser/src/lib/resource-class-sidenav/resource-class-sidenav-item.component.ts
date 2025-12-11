import { ChangeDetectorRef, Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Constants, KnoraApiConnection, ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { LocalizationService, OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslateService } from '@ngx-translate/core';
import {
  combineLatest,
  filter,
  finalize,
  first,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { DataBrowserPageService } from '../data-browser-page.service';
import { ResourceClassCountApi } from '../resource-class-count.api';

@Component({
  selector: 'app-resource-class-sidenav-item',
  template: `
    <div (click)="selectResourceClass()" class="item" [ngClass]="{ selected: isSelected$ | async }">
      <span style="flex: 1">
        {{ ontologiesLabel }}
      </span>
      <div
        style="
    justify-content: end;
    display: flex;
    align-items: center;
    color: #b9b9b9;
    margin-right: 0;">
        <span>{{ count$ | async }}</span>
        <mat-icon style="margin-left: 8px">{{ icon }}</mat-icon>
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
    `,
  ],
  standalone: false,
})
export class ResourceClassSidenavItemComponent implements OnInit, OnDestroy {
  @Input({ required: true }) resClass!: ResourceClassDefinitionWithAllLanguages;

  destroyed = new Subject<void>();
  icon!: string;
  ontologiesLabel!: string;
  ontologiesDescription!: string;
  count$!: Observable<number>;
  loading = true;

  ontologyLabel!: string;
  classLabel!: string;

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
          return this.resClass.id === selectedResClassId;
        })
      );
    })
  );

  constructor(
    private readonly _cd: ChangeDetectorRef,
    private readonly _ontologyService: OntologyService,
    private readonly _localizationService: LocalizationService,
    private readonly _translateService: TranslateService,
    private readonly _projectPageService: ProjectPageService,
    private readonly _router: Router,
    private readonly _route: ActivatedRoute,
    private readonly _resClassCountApi: ResourceClassCountApi,
    private readonly _dataBrowserPageService: DataBrowserPageService
  ) {}

  selectResourceClass() {
    this._router.navigate([this.ontologyLabel, this.classLabel], { relativeTo: this._route });
  }

  ngOnInit(): void {
    this.icon = this._getIcon();

    this._translateService.onLangChange.pipe(startWith(null), takeUntil(this.destroyed)).subscribe(() => {
      this.getOntologiesLabelsInPreferredLanguage();
      this.getOntologiesDescriptionInPreferredLanguage();
    });

    const [ontologyIri, className] = this.resClass.id.split('#');
    const ontologyName = OntologyService.getOntologyNameFromIri(ontologyIri);

    this.ontologyLabel = ontologyName;
    this.classLabel = className;

    this._loadData();
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  private _loadData() {
    this.count$ = this._dataBrowserPageService.onNavigationReload$.pipe(
      switchMap(() => this._resClassCountApi.getResourceClassCount(this.resClass.id)),
      finalize(() => {
        this.loading = false;
      })
    );
  }

  private getOntologiesLabelsInPreferredLanguage(): void {
    if (this.resClass.labels) {
      const label = this.resClass.labels.find(l => l.language === this._localizationService.getCurrentLanguage());
      this.ontologiesLabel = label ? label.value : this.resClass.labels[0].value;
      this._cd.markForCheck();
    }
  }

  private getOntologiesDescriptionInPreferredLanguage(): void {
    if (this.resClass.comments) {
      const description = this.resClass.comments.find(
        l => l.language === this._localizationService.getCurrentLanguage()
      );
      this.ontologiesDescription = description ? description.value : this.resClass.comments[0]?.value;
      this._cd.detectChanges();
    }
  }

  private _getIcon(): string {
    switch (this.resClass.subClassOf[0]) {
      case Constants.AudioRepresentation:
        return 'audio_file';
      case Constants.ArchiveRepresentation:
        return 'folder_zip';
      case Constants.DocumentRepresentation:
        return 'description';
      case Constants.MovingImageRepresentation:
        return 'video_file';
      case Constants.StillImageRepresentation:
        return 'image';
      case Constants.TextRepresentation:
        return 'text_snippet';
      default: // resource does not have a file representation
        return 'insert_drive_file';
    }
  }
}
