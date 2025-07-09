import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants, ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { LoadClassItemsCountAction, OntologyClassSelectors, ProjectsSelectors } from '@dasch-swiss/vre/core/state';
import { LocalizationService, OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslateService } from '@ngx-translate/core';
import { Actions, ofActionSuccessful, Store } from '@ngxs/store';
import { combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resource-class-sidenav-item',
  templateUrl: './resource-class-sidenav-item.component.html',
  styleUrls: ['./resource-class-sidenav-item.component.scss'],
})
export class ResourceClassSidenavItemComponent implements OnInit, AfterViewInit, OnDestroy {
  destroyed: Subject<void> = new Subject<void>();

  @Input({ required: true }) resClass!: ResourceClassDefinitionWithAllLanguages;

  @ViewChild('resClassLabel') resClassLabel: ElementRef;

  isMember$ = this._store.select(ProjectsSelectors.isCurrentProjectAdminSysAdminOrMember);

  classLink: string;

  icon: string;

  tooltipDisabled = true;

  // i18n setup
  itemPluralMapping = {
    entry: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '=1': '1 Entry',
      other: '# Entries',
    },
  };

  ontologiesLabel: string;

  get results$(): Observable<number> {
    return combineLatest([
      this._store.select(OntologyClassSelectors.classItems),
      this._store.select(OntologyClassSelectors.isLoading),
    ]).pipe(map(([classItems]) => classItems[this.resClass.id]?.classItemsCount));
  }

  constructor(
    private _actions$: Actions,
    private _cd: ChangeDetectorRef,
    private _localizationService: LocalizationService,
    private _route: ActivatedRoute,
    private _router: Router,
    private _store: Store,
    private _translateService: TranslateService
  ) {
    this._actions$.pipe(takeUntil(this.destroyed), ofActionSuccessful(LoadClassItemsCountAction)).subscribe(() => {
      this._cd.markForCheck();
    });
  }

  ngOnInit(): void {
    const projectUuid = this._route.snapshot.paramMap.get(RouteConstants.uuidParameter);
    const [ontologyIri, className] = this.resClass.id.split('#');
    const ontologyName = OntologyService.getOntologyName(ontologyIri);
    this._store.dispatch(new LoadClassItemsCountAction(ontologyIri, this.resClass.id));
    this.classLink = `${RouteConstants.projectRelative}/${projectUuid}/${RouteConstants.ontology}/${ontologyName}/${className}`;
    this.icon = this._getIcon();
    this._translateService.onLangChange.pipe(takeUntil(this.destroyed)).subscribe(() => {
      this.getOntologiesLabelsInPreferredLanguage();
    });
    this.getOntologiesLabelsInPreferredLanguage();
  }

  ngAfterViewInit(): void {
    this.tooltipDisabled = !this.isTextOverflowing(this.resClassLabel.nativeElement);
    this._cd.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  isTextOverflowing(element: HTMLElement): boolean {
    return element.scrollHeight > element.clientHeight;
  }

  private getOntologiesLabelsInPreferredLanguage(): void {
    const prefferedLanguage = this._localizationService.getCurrentLanguage();
    if (this.resClass.labels) {
      const label = this.resClass.labels.find(l => l.language === prefferedLanguage);
      this.ontologiesLabel = label ? label.value : this.resClass.labels[0].value;
      this._cd.markForCheck();
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

  goToAddClassInstance() {
    const link = `${this.classLink}/${RouteConstants.addClassInstance}`;
    this._router.navigate(['/']).then(() => this._router.navigate([link]));
  }
}
