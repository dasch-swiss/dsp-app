import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Cardinality, ReadResource, ReadUser } from '@dasch-swiss/dsp-js';
import { PropertyInfoObject } from '@dasch-swiss/vre/shared/app-helper-services';
import { PropToDisplay } from '@dasch-swiss/vre/shared/app-state';
import { FilteredResources } from '../filtered-resources.interface';
import { GuiCardinality } from '../gui-cardinality.interface';

export interface DialogData {
  mode: string; // switch mode
  id: string | number; // main iri or status code
  project?: string; // project code (or iri)
  title?: string;
  subtitle?: string;
  comment?: string;
  name?: string;
  user?: ReadUser;
  existing?: string[];
  propInfo?: PropertyInfoObject;
  currentCardinality?: Cardinality;
  targetCardinality?: GuiCardinality;
  classProperties?: PropToDisplay[];
  position?: number;
  parentIri?: string;
  parentResource?: ReadResource;
  projectUuid?: string;
  selectedResources?: FilteredResources;
  resourceClassDefinition?: string;
  fullSize?: boolean;
  ontoIri?: string;
  representation?: string; // respresentation type (stillImage, audio, etc.)
}

export interface ConfirmationWithComment {
  confirmed: boolean;
  comment?: string;
}

export enum DialogEvent {
  DialogCanceled,
}

@Component({
  selector: 'app-material-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss'],
})
export class DialogComponent {
  DialogEvent = DialogEvent;
  notYetImplemented = `The component <strong>${this.data.mode}</strong> is not implemented yet.`;

  comment?: string;

  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    if (this.data.fullSize) {
      // do not animate the dialog box
      this.dialogRef.addPanelClass('full-size-dialog');
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onKey(event: KeyboardEvent) {
    this.comment = (event.target as HTMLInputElement).value;
  }
}
