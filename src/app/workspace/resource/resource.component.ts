import { Location } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
    ActivatedRoute,
    NavigationEnd,
    NavigationError,
    NavigationStart,
    Params,
    Router
} from '@angular/router';
import { ReadLinkValue, ReadProject } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-resource',
    templateUrl: './resource.component.html',
    styleUrls: ['./resource.component.scss']
})
export class ResourceComponent implements OnDestroy {

    @Input() resourceIri: string;

    refresh: boolean;

    navigationSubscription: Subscription;

    constructor(
        private _route: ActivatedRoute,
        private _router: Router,
        private _titleService: Title,
        private _location: Location) {

        if (!this.resourceIri) {
            this._route.paramMap.subscribe((params: Params) => {
                this.resourceIri = decodeURIComponent(params.get('id'));
            });
        }

        this._router.events.subscribe((event) => {

            this._titleService.setTitle('Resource view');

            if (event instanceof NavigationStart) {
                // show loading indicator
                // console.log('NavigationStart', this.resourceIri);
            }

            if (event instanceof NavigationEnd) {
                // hide loading indicator
                this.refresh = true;
                // console.log('NavigationEnd', this.resourceIri);
                this.refresh = false;
            }

            if (event instanceof NavigationError) {
                // hide loading indicator

                // present error to user
                console.error(event.error);
            }

        });
    }

    ngOnDestroy() {
        if (this.navigationSubscription !== undefined) {
            this.navigationSubscription.unsubscribe();
        }
    }

    goBack() {
        this._location.back();
    }

    // open project in new tab
    openProject(project: ReadProject){
        window.open('/project/' + project.shortcode, "_blank");
    }

    openResource(linkValue: ReadLinkValue) {
        window.open('/resource/' + encodeURIComponent(linkValue.linkedResource.id), "_blank");
    }
}
