import { Directive, ElementRef, HostListener, Input, Renderer2, ViewContainerRef } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Directive({
  selector: '[appLoadingButton]',
})
export class LoadingButtonDirective {
  @Input() isLoading: boolean = false;

  private spinnerElement: HTMLElement;
  spinnerComponentRef;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private viewContainerRef: ViewContainerRef
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
    this.spinnerComponentRef = this.viewContainerRef.createComponent(MatProgressSpinner);
    this.spinnerComponentRef.instance.mode = 'indeterminate';
    this.spinnerComponentRef.instance.diameter = 20;
    this.spinnerElement = this.spinnerComponentRef.location.nativeElement;
    this.renderer.setStyle(this.spinnerElement, 'margin-right', '8px');
    this.renderer.appendChild(this.el.nativeElement, this.spinnerElement);
  }

  private disableButton(): void {
    this.renderer.setProperty(this.el.nativeElement, 'disabled', true);
  }

  private enableButton(): void {
    this.renderer.setProperty(this.el.nativeElement, 'disabled', false);
  }

  private showSpinner(): void {
    this.renderer.setStyle(this.spinnerElement, 'display', 'inline-block');
  }

  private hideSpinner(): void {
    this.renderer.setStyle(this.spinnerElement, 'display', 'none');
  }
}
