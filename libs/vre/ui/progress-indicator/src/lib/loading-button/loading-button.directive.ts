import { Directive, ElementRef, HostListener, Input, OnChanges, Renderer2, ViewContainerRef } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Directive({
  selector: '[appLoadingButton]',
})
export class LoadingButtonDirective implements OnChanges {
  @Input() isLoading = false;

  private spinnerElement!: HTMLElement;
  spinnerComponentRef!: any;

  constructor(
    private readonly _el: ElementRef,
    private readonly _renderer: Renderer2,
    private readonly _viewContainerRef: ViewContainerRef
  ) {
    this.attachSpinnerElement();
  }

  // Listen for click events on the button
  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    if (this.isLoading) {
      // Prevent click events when the button is in the loading state
      event.preventDefault();
      event.stopPropagation();
    }
  }

  // Update the button's appearance based on the loading state
  ngOnChanges(): void {
    if (this.isLoading) {
      this.disableButton();
      this.showSpinner();
    } else {
      this.enableButton();
      this.hideSpinner();
    }
  }

  private attachSpinnerElement(): void {
    this.spinnerComponentRef = this._viewContainerRef.createComponent(MatProgressSpinner);
    this.spinnerComponentRef.instance.mode = 'indeterminate';
    this.spinnerComponentRef.instance.diameter = 20;
    this.spinnerElement = this.spinnerComponentRef.location.nativeElement;
    this._renderer.setStyle(this.spinnerElement, 'margin-right', '8px');
    this._renderer.appendChild(this._el.nativeElement, this.spinnerElement);
  }

  private disableButton(): void {
    this._renderer.setProperty(this._el.nativeElement, 'disabled', true);
  }

  private enableButton(): void {
    this._renderer.setProperty(this._el.nativeElement, 'disabled', false);
  }

  private showSpinner(): void {
    this._renderer.setStyle(this.spinnerElement, 'display', 'inline-block');
  }

  private hideSpinner(): void {
    this._renderer.setStyle(this.spinnerElement, 'display', 'none');
  }
}
