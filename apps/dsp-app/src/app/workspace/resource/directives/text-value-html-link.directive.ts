import { Directive, EventEmitter, HostListener, Output } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';

@Directive({
    selector: '[appHtmlLink]',
})
export class TextValueHtmlLinkDirective {
    @Output() internalLinkClicked = new EventEmitter<string>();
    @Output() internalLinkHovered = new EventEmitter<string>();

    /**
     * react to a click event for an internal link.
     *
     * @param targetElement the element that was clicked.
     */
    @HostListener('mousedown', ['$event.target'])
    onClick(targetElement) {
        if (
            targetElement.nodeName.toLowerCase() === 'a' &&
            targetElement.className
                .toLowerCase()
                .indexOf(Constants.SalsahLink) !== -1
        ) {
            this.internalLinkClicked.emit(targetElement.href);

            // preventDefault (propagation)
            return false;
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
            targetElement.className
                .toLowerCase()
                .indexOf(Constants.SalsahLink) !== -1
        ) {
            this.internalLinkHovered.emit(targetElement.href);

            // preventDefault (propagation)
            return false;
        }
    }
}
