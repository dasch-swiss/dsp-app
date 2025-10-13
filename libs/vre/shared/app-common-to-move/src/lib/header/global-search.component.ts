import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { SearchTipsComponent } from '@dasch-swiss/vre/pages/search/search';

@Component({
  selector: 'app-global-search',
  template: `
    <form
      [formGroup]="formGroup"
      (ngSubmit)="search()"
      style="border: 1px solid #ebebeb; display: flex; align-items: center; height: 40px">
      <input
        #searchInput
        [formControl]="formGroup.controls.search"
        (focus)="showSearchTips()"
        (blur)="hideSearchTips()"
        style="border: none; outline: none; padding: 0 16px; font-size: 14px; min-width: 260px"
        placeholder="Search everywhere" />
      <button mat-icon-button class="small-icon-button">
        <mat-icon>search</mat-icon>
      </button>
    </form>
  `,
  styles: [
    `
      .small-icon-button {
        transform: scale(0.8);
      }
    `,
  ],
  standalone: false,
})
export class GlobalSearchComponent implements OnDestroy {
  formGroup = this._fb.group({
    search: ['', [Validators.required, Validators.minLength(3)]],
  });
  private overlayRef: OverlayRef | null = null;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(
    private readonly _router: Router,
    private readonly _fb: FormBuilder,
    private readonly _overlay: Overlay
  ) {}

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
          offsetX: -130,
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
  search() {
    this.hideSearchTips();
    const query = this.formGroup.controls.search.value;
    this._router.navigate([RouteConstants.search, query]);
  }

  ngOnDestroy() {
    this.hideSearchTips();
  }
}
