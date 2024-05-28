import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogComponent, FilteredResources } from '@dasch-swiss/vre/shared/app-common-to-move';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-intermediate',
  templateUrl: './intermediate.component.html',
  styleUrls: ['./intermediate.component.scss'],
})
export class IntermediateComponent {
  @Input({ required: true }) resources!: FilteredResources;
  @Output() action = new EventEmitter<string>();

  itemPluralMapping = {
    resource: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '=1': 'Resource',
      other: 'Resources',
    },
  };

  constructor(private _dialog: MatDialog) {}

  openDialog(type: 'link', data: FilteredResources) {
    const title = `Create a collection of ${data.count} resources`;

    const dialogConfig: MatDialogConfig = {
      width: '640px',
      maxHeight: '80vh',
      position: {
        top: '112px',
      },
      data: {
        mode: 'linkResources',
        title,
        selectedResources: data,
      },
    };

    this._dialog.open(DialogComponent, dialogConfig);
  }
}
