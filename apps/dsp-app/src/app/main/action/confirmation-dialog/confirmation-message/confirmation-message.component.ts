import { Component, Input } from '@angular/core';
import { ReadValue } from '@dasch-swiss/dsp-js';

@Component({
    selector: 'app-confirmation-message',
    templateUrl: './confirmation-message.component.html',
    styleUrls: ['./confirmation-message.component.scss'],
})
export class ConfirmationMessageComponent {
    @Input() value: ReadValue;
    comment?: string;

    onKey(event: KeyboardEvent) {
        this.comment = (event.target as HTMLInputElement).value;
    }
}
