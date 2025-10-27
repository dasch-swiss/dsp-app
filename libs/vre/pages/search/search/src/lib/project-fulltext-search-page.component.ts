import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { map, startWith, Subject } from 'rxjs';
import { SearchTipsComponent } from './search-tips.component';

@Component({
  selector: 'app-project-fulltext-search-page',
  template: `
    <div
      style="display: flex; justify-content: center; align-items: center; gap: 32px; padding: 16px;"
      [ngClass]="{ big: (isNotQuerying$ | async) }">
      <a mat-stroked-button [routerLink]="['..', 'advanced-search']">
        <mat-icon>swap_horiz</mat-icon>
        {{ 'pages.search.fullTextSearch.switchToAdvancedSearch' | translate }}
      </a>
      <form [formGroup]="formGroup" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" style="width: 600px">
          <input
            #searchInput
            matInput
            [formControl]="formGroup.controls.query"
            type="text"
            [placeholder]="'pages.search.fullTextSearch.placeholder' | translate"
            (focus)="showSearchTips()"
            (blur)="hideSearchTips()" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </form>
    </div>

    @if (query$ | async; as query) {
      <mat-divider />

      <app-project-fulltext-search-result [query]="query" [projectId]="projectId" />
    }
  `,
  styles: [
    `
      :host ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none !important;
      }

      .big {
        margin-top: 70px;
        flex-direction: column;
      }
    `,
  ],
  standalone: false,
})
export class ProjectFulltextSearchPageComponent implements AfterViewInit, OnInit, OnDestroy {
  querySubject = new Subject<string>();
  query$ = this.querySubject.asObservable();
  isNotQuerying$ = this.query$.pipe(
    map(v => v === ''),
    startWith(true)
  );

  formGroup = this._fb.group({ query: [''] });

  projectId!: string;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  private overlayRef: OverlayRef | null = null;

  constructor(
    private readonly _fb: FormBuilder,
    private readonly _overlay: Overlay,
    public readonly projectPageService: ProjectPageService
  ) {}

  ngOnInit() {
    this.projectId = this.projectPageService.currentProjectId;
  }

  ngAfterViewInit() {
    this.searchInput.nativeElement.focus();
  }

  showSearchTips() {
    if (this.overlayRef) {
      return;
    }

    const positionStrategy = this._overlay
      .position()
      .flexibleConnectedTo(this.searchInput)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 25,
          offsetX: -17,
        },
      ]);

    this.overlayRef = this._overlay.create({
      positionStrategy,
      hasBackdrop: false,
      scrollStrategy: this._overlay.scrollStrategies.reposition(),
      width: '570px',
    });

    const portal = new ComponentPortal(SearchTipsComponent);
    this.overlayRef.attach(portal);
  }

  hideSearchTips() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  onSubmit() {
    if (!this.formGroup.valid) {
      return;
    }
    this.searchInput.nativeElement.blur();

    this.querySubject.next(this.formGroup.controls.query.value!);
  }

  ngOnDestroy() {
    this.hideSearchTips();
  }
}
