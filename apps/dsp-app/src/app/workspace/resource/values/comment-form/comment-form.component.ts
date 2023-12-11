import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
} from '@angular/core';
import {
    ControlContainer,
    FormControl,
    FormGroupDirective,
} from '@angular/forms';

@Component({
    selector: 'app-comment-form',
    templateUrl: './comment-form.component.html',
    styleUrls: ['./comment-form.component.scss'],
    viewProviders: [
        { provide: ControlContainer, useExisting: FormGroupDirective },
    ],
})
export class CommentFormComponent implements OnChanges {
    /**
     * the form control of the comment itself
     */
    @Input() commentFormControl: FormControl;

    /**
     * whether the valueFormControl has an error or not
     */
    @Input() valueFormControlHasError = false;

    /**
     * the valueFormControls value to which the comment belongs
     */
    @Input() valueFormControlValue: any;

    /**
     * emitting back the form control
     */
    @Output() commentFormControlChange: EventEmitter<FormControl> =
        new EventEmitter<FormControl>();

    /**
     * whether the comment field is editable or not
     */
    disallowed = false;

    ngOnChanges() {
        this.disallowed =
            (!this.valueFormControlValue || this.valueFormControlHasError) &&
            !this.commentFormControl.value;
    }
}
