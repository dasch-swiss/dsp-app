import { Directive, HostListener } from '@angular/core';

@Directive({
    selector: '[appDisableContextMenu]',
})
export class DisableContextMenuDirective {
    constructor() {}

    @HostListener('contextmenu', ['$event'])
    onRightClick(event: Event) {
        event.preventDefault();
    }
}
