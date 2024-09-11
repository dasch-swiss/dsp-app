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
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import {
  ComponentCommunicationEventService,
  EmitEvent,
  Events,
  LocalizationService,
  OntologyService,
} from '@dasch-swiss/vre/shared/app-helper-services';
import {
  IClassItemsKeyValuePairs,
  LoadClassItemsCountAction,
  OntologyClassSelectors,
} from '@dasch-swiss/vre/shared/app-state';
import { TranslateService } from '@ngx-translate/core';
import { Actions, Select, Store, ofActionSuccessful } from '@ngxs/store';
import { Observable, Subject, Subscription, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ontology-class-item',
  templateUrl: './ontology-class-item.component.html',
  styleUrls: ['./ontology-class-item.component.scss'],
})
export class OntologyClassItemComponent implements OnInit, AfterViewInit, OnDestroy {
  destroyed: Subject<void> = new Subject<void>();

  @Input({ required: true }) resClass!: ResourceClassDefinitionWithAllLanguages;

  @Input() projectMember: boolean;

  @ViewChild('resClassLabel') resClassLabel: ElementRef;

  get results$(): Observable<number> {
    return combineLatest([
      this._store.select(OntologyClassSelectors.classItems),
      this._store.select(OntologyClassSelectors.isLoading),
    ]).pipe(map(([classItems]) => classItems[this.resClass.id]?.classItemsCount));
  }

  classLink: string;

  icon: string;

  componentCommsSubscriptions: Subscription[] = [];

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

  @Select(OntologyClassSelectors.classItems) classItems$: Observable<IClassItemsKeyValuePairs>;

  constructor(
    private _route: ActivatedRoute,
    private _componentCommsService: ComponentCommunicationEventService,
    private _cdr: ChangeDetectorRef,
    private _store: Store,
    private _actions$: Actions,
    private _cd: ChangeDetectorRef,
    private _router: Router,
    private _localizationService: LocalizationService,
    private _translateService: TranslateService
  ) {
    this._actions$.pipe(takeUntil(this.destroyed), ofActionSuccessful(LoadClassItemsCountAction)).subscribe(() => {
      this._cd.markForCheck();
    });
  }

  ngOnInit(): void {
    const uuid = this._route.snapshot.params.uuid;
    const splitIri = this.resClass.id.split('#');
    const ontologyName = OntologyService.getOntologyName(splitIri[0]);
    this.classLink = `${RouteConstants.projectRelative}/${uuid}/${RouteConstants.ontology}/${ontologyName}/${splitIri[1]}`;
    this.icon = this._getIcon();
    this._translateService.onLangChange.pipe(takeUntil(this.destroyed)).subscribe(() => {
      this.getOntologiesLabelsInPreferredLanguage();
    });
    this.getOntologiesLabelsInPreferredLanguage();
  }

  ngAfterViewInit(): void {
    this.tooltipDisabled = !this.isTextOverflowing(this.resClassLabel.nativeElement);
    this._cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.componentCommsSubscriptions.forEach(sub => sub.unsubscribe());
    this.destroyed.next();
    this.destroyed.complete();
  }

  selectItem() {
    this._componentCommsService.emit(new EmitEvent(Events.unselectedListItem));
  }

  isTextOverflowing(element: HTMLElement): boolean {
    if (element) {
      return element.scrollHeight > element.clientHeight;
    }
  }

  /**
   * Gets the ontology label in the preferred language of the user
   */
  private getOntologiesLabelsInPreferredLanguage(): void {
    const prefferedLanguage = this._localizationService.getCurrentLanguage();
    if (this.resClass.labels) {
      const label = this.resClass.labels.find(l => l.language === prefferedLanguage);
      this.ontologiesLabel = label ? label.value : this.resClass.labels[0].value;
      this._cd.markForCheck();
    }
  }

  /**
   * return the correct mat-icon depending on the subclass of the resource
   *
   * @returns mat-icon name as string
   */
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
