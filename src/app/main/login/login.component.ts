import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ComponentCommunicationEventService, EmitEvent, Events } from 'src/app/main/services/component-communication-event.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {

    returnUrl: string;

    constructor(private _titleService: Title,
        private _route: ActivatedRoute,
        private _router: Router,
        private _componentCommsService: ComponentCommunicationEventService) {

        // set the page title
        this._titleService.setTitle('Login');

        this.returnUrl = this._route.snapshot.queryParams['returnUrl'] || '/';
    }

    login(status: boolean) {

        // go to the dashboard:
        if (status) {
            // go to the previous route; if it's not the help page
            if (this.returnUrl !== 'help') {
                this._router.navigate([this.returnUrl]);
            } else {
                // otherwise go to the dashboard
                this._router.navigate(['dashboard']);
            }
            this._componentCommsService.emit(new EmitEvent(Events.loginSuccess, true));
        }
    }

    logout(status: boolean) {
        if (status) {
            // reload the page
            window.location.reload();
        }
    }

}
