import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { fulltextSearchTermValidator } from '@dasch-swiss/vre/shared/app-common';
import { TranslatePipe } from '@ngx-translate/core';
import { SearchTipsComponent } from './search-tips.component';

@Component({
  selector: 'app-global-search',
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule, TranslatePipe, OverlayModule],
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
        [placeholder]="'shared.header.searchEverywhere' | translate" />
      <button mat-icon-button class="small-icon-button">
        <mat-icon>search</mat-icon>
      </button>
    </form>
    @if (errorMessageKey; as messageKey) {
      <div class="search-error">{{ messageKey | translate }}</div>
    }
  `,
  styles: [
    `
      :host {
        position: relative;
        display: block;
      }
      .small-icon-button {
        transform: scale(0.8);
      }
      /* The header toolbar has a fixed height, so the message floats under the field instead of
         growing the bar. */
      .search-error {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        padding: 4px 16px;
        font-size: 12px;
        line-height: 16px;
        color: #f44336;
        background: #fcfdff;
        z-index: 1;
      }
    `,
  ],
})
export class GlobalSearchComponent implements OnDestroy {
  formGroup = this._fb.group({
    search: ['', [Validators.required, fulltextSearchTermValidator()]],
  });
  private overlayRef: OverlayRef | null = null;
  private _searchAttempted = false;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(
    private readonly _router: Router,
    private readonly _fb: FormBuilder,
    private readonly _overlay: Overlay
  ) {}

  /**
   * The key of the message to show under the field, or `null` when there is nothing to say. Nothing is
   * said until a search is actually attempted — complaining at the second keystroke of every term would
   * flag "de" on the way to "deutsch". An empty term says nothing either; `required` only stops the
   * submit. Once a submit has been refused the message tracks the term live, so it clears as it is
   * fixed — and a search that goes through resets the field to quiet for the next term.
   */
  get errorMessageKey(): string | null {
    if (!this._searchAttempted) {
      return null;
    }
    const control = this.formGroup.controls.search;
    if (control.hasError('searchTermTooShort')) {
      return 'pages.search.termValidation.tooShort';
    }
    if (control.hasError('searchWildcardTooShort')) {
      return 'pages.search.termValidation.wildcardTooShort';
    }
    return null;
  }

  showSearchTips() {
    // The tips overlay sits exactly where the error message does; showing both would stack them.
    if (this.overlayRef || this.errorMessageKey) {
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
    // The validators were already declared here but never consulted, so a term dsp-api rejects out of
    // hand ("de", "de*") still cost a navigation and a 400 (DEV-6930).
    const control = this.formGroup.controls.search;
    if (control.invalid) {
      this._searchAttempted = true;
      return;
    }
    // Cleared on a search that goes through, so the next term starts quiet again — otherwise the field
    // would flag the "b" of "buch" for the rest of the session once any term had been refused.
    this._searchAttempted = false;
    this._router.navigate([RouteConstants.search, control.value]);
  }

  ngOnDestroy() {
    this.hideSearchTips();
  }
}
