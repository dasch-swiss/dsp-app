import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StoredProject } from '@dasch-swiss/dsp-js';
import { ProjectService } from 'src/app/workspace/resource/services/project.service';

@Component({
    selector: 'app-project-tile',
    templateUrl: './project-tile.component.html',
    styleUrls: ['./project-tile.component.scss']
})
export class ProjectTileComponent implements OnInit {

    @Input() project: StoredProject;
    @Input() sysAdmin: Boolean; // used to show settings button

    constructor(
        private _router: Router,
        private _projectService: ProjectService
    ) { }

    ngOnInit(): void {
    }

    navigateTo(id: string, path: 'workspace' | 'settings') {
        const uuid = this._projectService.iriToUuid(id);

        switch (path) {
            case 'workspace':
                this._router.navigate(['/beta/project/' + uuid]);
                break;

            case 'settings':
                this._router.navigate(['/beta/project/' + uuid + '/settings/collaboration']);
                break;

            default:
                break;
        }
    }
}
