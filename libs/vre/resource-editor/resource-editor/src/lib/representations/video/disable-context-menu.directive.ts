import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appDisableContextMenu]',
  standalone: true,
})
export class DisableContextMenuDirective {
  @HostListener('contextmenu', ['$event'])
  onRightClick(event: Event) {
    event.preventDefault();
  }
}
