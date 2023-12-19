import {
  Directive,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { Subject } from 'rxjs';
import { tap, takeUntil } from 'rxjs/operators';

export interface IAutoCompleteScrollEvent {
  autoComplete: MatAutocomplete;
  scrollEvent: Event;
}

@Directive({
  standalone: true,
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'mat-autocomplete[optionsScroll]',
  exportAs: 'mat-autocomplete[optionsScroll]',
})
export class MatAutocompleteOptionsScrollDirective implements OnDestroy {
  @Input() thresholdPercent = 0.8;

  // eslint-disable-next-line @angular-eslint/no-output-rename
  @Output('optionsScroll') scrollEvent =
    new EventEmitter<IAutoCompleteScrollEvent>();
  _onDestroy = new Subject();
  constructor(public autoComplete: MatAutocomplete) {
    this.autoComplete.opened
      .pipe(
        tap(() => {
          // when autocomplete raises opened, panel is not yet created (by Overlay)
          // the panel will be available on next tick
          // the panel wil NOT open if there are no options to display

          // setTimeout is needed but we don't like it
          setTimeout(() => {
            // Note: remove listner just for safety, in case the close event is skipped.
            this.removeScrollEventListener();
            this.autoComplete.panel.nativeElement.addEventListener(
              'scroll',
              this.onScroll.bind(this)
            );
          }, 500);
        }),
        takeUntil(this._onDestroy)
      )
      .subscribe();

    this.autoComplete.closed
      .pipe(
        tap(() => this.removeScrollEventListener()),
        takeUntil(this._onDestroy)
      )
      .subscribe();
  }

  private removeScrollEventListener() {
    if (this.autoComplete?.panel) {
      this.autoComplete.panel.nativeElement.removeEventListener(
        'scroll',
        this.onScroll
      );
    }
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();

    this.removeScrollEventListener();
  }

  onScroll(event: Event) {
    if (this.thresholdPercent === undefined) {
      this.scrollEvent.next({
        autoComplete: this.autoComplete,
        scrollEvent: event,
      });
    } else {
      const scrollTop = (event.target as HTMLElement).scrollTop;
      const scrollHeight = (event.target as HTMLElement).scrollHeight;
      const elementHeight = (event.target as HTMLElement).clientHeight;
      const atBottom = scrollHeight === scrollTop + elementHeight;
      if (atBottom) {
        this.scrollEvent.next();
      }
    }
  }
}
