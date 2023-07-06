import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
    MatDialog,
    MatDialogConfig,
} from '@angular/material/dialog';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { FilteredResources } from '../results/list-view/list-view.component';

@Component({
    selector: 'app-intermediate',
    templateUrl: './intermediate.component.html',
    styleUrls: ['./intermediate.component.scss'],
})
export class IntermediateComponent {
    @Input() resources: FilteredResources;

    @Output() action: EventEmitter<string> = new EventEmitter<string>();

    // i18n plural mapping
    itemPluralMapping = {
        resource: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            '=1': 'Resource',
            other: 'Resources',
        },
    };

    constructor(
        private _dialog: MatDialog,
        private _errorHandler: AppErrorHandler
    ) {}

    /**
     * opens the dialog box with a form to create a link resource, to edit resources etc.
     * @param type 'link' --> TODO: will be expanded with other types like edit, delete etc.
     * @param data
     */
    openDialog(type: 'link', data: FilteredResources) {
        const title = 'Create a collection of ' + data.count + ' resources';

        const dialogConfig: MatDialogConfig = {
            width: '640px',
            maxHeight: '80vh',
            position: {
                top: '112px',
            },
            data: {
                mode: type + 'Resources',
                title: title,
                selectedResources: data,
            },
        };

        const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe(() => {
            // do something with the intermediate view... but what should we do / display? Maybe the new resource...
        });
    }
}
