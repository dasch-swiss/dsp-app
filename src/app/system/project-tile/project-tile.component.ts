import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StoredProject } from '@dasch-swiss/dsp-js';

@Component({
    selector: 'app-project-tile',
    templateUrl: './project-tile.component.html',
    styleUrls: ['./project-tile.component.scss']
})
export class ProjectTileComponent implements OnInit {

    @Input() project: StoredProject;
    @Input() sysAdmin: Boolean; // used to show settings button

    constructor(private _router: Router) { }

    ngOnInit(): void {
    }

    navigateTo(shortCode: string, path: 'dashboard' | 'settings') {
        switch (path) {
            case 'dashboard':
                this._router.navigate(['/beta/project/' + shortCode]);
                break;

            case 'settings':
                this._router.navigate(['/beta/project/' + shortCode + '/settings/collaboration']);
                break;

            default:
                break;
        }
    }
}
