import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { AsyncPipe, NgClass } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { SearchTipsComponent } from '@dasch-swiss/vre/shared/app-common-to-move';
import { TranslatePipe } from '@ngx-translate/core';
import { map, startWith, Subject } from 'rxjs';
import { SearchResultComponent } from './search-result.component';

@Component({
  selector: 'app-project-fulltext-search-page',
  imports: [
    AsyncPipe,
    NgClass,
    ReactiveFormsModule,
    MatDivider,
    MatFormField,
    MatIcon,
    MatInput,
    MatSuffix,
    TranslatePipe,
    SearchResultComponent,
  ],
  template: `
    <div
      style="display: flex; justify-content: center; align-items: center; gap: 32px; padding: 16px;"
      [ngClass]="{ big: (isNotQuerying$ | async) }">
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
      <div class="whole-height">
        <app-search-result [query]="query" [projectId]="projectId" />
      </div>
    }
  `,
  styleUrls: ['./project-fulltext-search-page.component.scss'],
})
export class ProjectFulltextSearchPageComponent implements AfterViewInit, OnDestroy {
  querySubject = new Subject<string>();
  query$ = this.querySubject.asObservable();
  isNotQuerying$ = this.query$.pipe(
    map(v => v === ''),
    startWith(true)
  );

  formGroup = this._fb.group({ query: [''] });

  projectId = this._projectPageService.currentProject.id;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  private overlayRef: OverlayRef | null = null;

  constructor(
    private readonly _fb: FormBuilder,
    private readonly _overlay: Overlay,
    private readonly _projectPageService: ProjectPageService
  ) {}

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
