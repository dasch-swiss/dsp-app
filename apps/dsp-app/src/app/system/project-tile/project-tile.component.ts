import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StoredProject } from '@dasch-swiss/dsp-js';
import { TileLinks, routeParams } from '@dsp-app/src/app/user/overview/overview.component';

@Component({
    selector: 'app-project-tile',
    templateUrl: './project-tile.component.html',
    styleUrls: ['./project-tile.component.scss'],
})
export class ProjectTileComponent {
    @Input() project: StoredProject;
    @Input() sysAdmin: boolean; // used to show settings button
    @Output() buttonClicked = new EventEmitter<routeParams>();

    constructor() {}

    emitButtonClicked(id: string, path: TileLinks) {
        const params: routeParams = { id, path };
        this.buttonClicked.emit(params);
    }
}
