import { Location } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router, NavigationStart, NavigationEnd, NavigationError, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-resource',
    templateUrl: './resource.component.html',
    styleUrls: ['./resource.component.scss']
})
export class ResourceComponent implements OnInit, OnDestroy {

    resourceIri: string;

    refresh: boolean;

    navigationSubscription: Subscription;

    constructor(private _route: ActivatedRoute,
                private _router: Router,
                private _location: Location) {

                  this._route.paramMap.subscribe((params: Params) => {
                    this.resourceIri = decodeURIComponent(params.get('id'));
                  });

                  this._router.events.subscribe( (event) => {

                    if (event instanceof NavigationStart) {
                        // Show loading indicator
//                        console.log('NavigationStart', this.resourceIri);
                    }

                    if (event instanceof NavigationEnd) {
                        // Hide loading indicator
                        this.refresh = true;
                        // console.log('NavigationEnd', this.resourceIri);
                        this.refresh = false;
                    }

                    if (event instanceof NavigationError) {
                        // Hide loading indicator

                        // Present error to user
                        console.error(event.error);
                    }
                });
    }

    ngOnInit() {
/*       this.navigationSubscription = this._route.paramMap.subscribe((params: ParamMap) => {
          this.refresh = true;
          // this.getResource(params.get('id'));
          this.refresh = false;
      }); */

  }

  ngOnDestroy() {
      if (this.navigationSubscription !== undefined) {
          this.navigationSubscription.unsubscribe();
      }
  }

    goBack() {
      this._location.back();
    }
}
