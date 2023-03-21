import { Component, Inject, OnInit } from '@angular/core';
import {
    MatLegacyDialogRef as MatDialogRef,
    MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import { Cardinality, ReadResource } from '@dasch-swiss/dsp-js';
import { PropertyInfoObject } from '@dsp-app/src/app/project/ontology/default-data/default-properties';
import { FilteredResources } from '@dsp-app/src/app/workspace/results/list-view/list-view.component';
import { GuiCardinality } from '../../project/ontology/property-info/property-info.component';
import { PropToDisplay } from '../../project/ontology/resource-class-info/resource-class-info.component';

export interface DialogData {
    mode: string; // switch mode
    id: string | number; // main iri or status code
    project?: string; // project code (or iri)
    title?: string;
    subtitle?: string;
    comment?: string;
    name?: string;
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
export class DialogComponent implements OnInit {
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

    ngOnInit() {}

    closeDialog(data: any): void {
        this.dialogRef.close();
    }

    replaceTitle(heading: { title: string; subtitle?: string }) {
        this.data.title = heading.title;

        if (heading.subtitle) {
            this.data.subtitle = heading.subtitle;
        }
    }

    onKey(event: KeyboardEvent) {
        this.comment = (event.target as HTMLInputElement).value;
    }
}
