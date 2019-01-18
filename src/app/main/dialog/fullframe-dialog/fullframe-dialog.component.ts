import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * this is a pseudo dialog box;
 * it's not the one from material,
 * because this it's a fullframe filling "dialog" page
 */
@Component({
    selector: 'app-fullframe-dialog',
    templateUrl: './fullframe-dialog.component.html',
    styleUrls: ['./fullframe-dialog.component.scss']
})
export class FullframeDialogComponent implements OnInit {

    @Input() content?: string;

    /**
     * mode can be "edit" or "new"
     */
    mode: string;

    constructor(private _route: ActivatedRoute,
                private _router: Router) {
        this._route.data.subscribe(
            (data: any) => {
                this.content = data.component.name;
            }
        );
        this.mode = this._route.snapshot.url[this._route.snapshot.url.length - 1].path;
    }

    ngOnInit() {
    }

    close() {
        const returnUrl: string = this._route.snapshot.queryParams['returnUrl'] || '/';
        this._router.navigate([returnUrl]);
    }

}
