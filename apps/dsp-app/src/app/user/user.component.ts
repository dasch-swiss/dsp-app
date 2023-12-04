import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { AppGlobal } from '../app-global';
import { MenuItem } from '../main/declarations/menu-item';
import { Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';

@Component({
    selector: 'app-user',
    templateUrl: './user.component.html',
    styleUrls: ['./user.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent implements OnDestroy {
    isDestroyed = new Subject<void>();
    
    error: boolean;

    route: string;

    // for the sidenav
    open = true;

    navigation: MenuItem[] = AppGlobal.userNav;
    
    @Select(UserSelectors.username) username$: Observable<string>;
    
    routeConstants = RouteConstants;

    constructor(
        private _route: ActivatedRoute,
        private _titleService: Title,
    ) {
        // get the activated route; we need it for the viewer switch
        this.route = this._route.pathFromRoot[1].snapshot.url[0].path;

        // set the page title
        this.username$.pipe(takeUntil(this.isDestroyed))
            .subscribe((username: string) => this._titleService.setTitle(username));
    }

    ngOnDestroy() {
        this.isDestroyed.next();
        this.isDestroyed.complete();
    }
}
