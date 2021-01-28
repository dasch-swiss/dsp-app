import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '@dasch-swiss/dsp-ui';
import { ComponentCommunicationEventService, EmitEvent, Events } from 'src/app/main/services/component-communication-event.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {

    returnUrl: string;

    constructor (private _titleService: Title,
        private _route: ActivatedRoute,
        private _router: Router,
        private _session: SessionService,
        private _componentCommsService: ComponentCommunicationEventService) {

        // set the page title
        this._titleService.setTitle('Login');

        // this.returnUrl = this._route.snapshot.queryParams['returnUrl'] || '/';
    }

    refresh(status: boolean) {

        // go to the dashboard:
        if (status && this._session.getSession()) {
            this._router.navigate(['dashboard']);
            // go to the previous route: this._router.navigate([this.returnUrl]);
            this._componentCommsService.emit(new EmitEvent(Events.LoginSuccess, true));
        }
    }

}
