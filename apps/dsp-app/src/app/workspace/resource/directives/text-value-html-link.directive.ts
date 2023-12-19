import { Directive, EventEmitter, HostListener, Output } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';

@Directive({
  selector: '[appHtmlLink]',
})
export class TextValueHtmlLinkDirective {
  @Output() internalLinkClicked = new EventEmitter<string>();
  @Output() internalLinkHovered = new EventEmitter<string>();

  /**
   * react to a click event for a link (left mouse button only). If it is an internal link, emit the event.
   * If it is an external link, open it in a new tab.
   *
   * @param event: The mouse event.
   */
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    const targetElement = event.target as HTMLAnchorElement;
    if (
      !targetElement ||
      targetElement?.nodeName?.toLowerCase() !== 'a' ||
      event.button === 2 || // right mouse button
      event.button === 1 // middle mouse button
    ) {
      // only handle left mouse click events on links, all other events are ignored here
      return;
    }
    if (targetElement?.className.toLowerCase().indexOf(Constants.SalsahLink) !== -1) {
      // if it is an internal link, override all behaviour, so also second mouse button clicks, hence the iris
      // like "rdfh.ch/ ..." can not be dereferenced outside the app by a browser
      this.internalLinkClicked.emit(targetElement.href);
      // prevent the default action for internal links
      event.preventDefault();
    } else {
      // left mouse clicks on external links
      // open in a new tab
      window.open(targetElement.href, '_blank');
      event.preventDefault();
    }
  }

  /**
   * react to a mouse down event for a link (middle and second mouse button).
   * For middle mouse and second mouse button clicks there is need to
   * handle mousedown events instead of click events in order to override browsers default behaviour
   * (open in new tab, context menu). The default behaviour is prevented for internal links.
   *
   * @param event: The mouse event.
   */
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    const targetElement = event.target as HTMLAnchorElement;

    if (!targetElement || targetElement.nodeName.toLowerCase() !== 'a') {
      return; // only handle mouse events on links
    }

    // handle middle mouse and second mouse clicks here
    if (event.button === 1 || event.button === 2) {
      if (targetElement.className.toLowerCase().indexOf(Constants.SalsahLink) !== -1) {
        this.internalLinkClicked.emit(targetElement.href);
        event.preventDefault();
      }
    }
  }

  /**
   * react to a mouseover event for an internal link.
   *
   * @param targetElement the element that was hovered.
   */
  @HostListener('mouseover', ['$event.target'])
  onMouseOver(targetElement) {
    if (
      targetElement.nodeName.toLowerCase() === 'a' &&
      targetElement.className.toLowerCase().indexOf(Constants.SalsahLink) !== -1
    ) {
      this.internalLinkHovered.emit(targetElement.href);

      // preventDefault (propagation)
      return false;
    }
  }
}
