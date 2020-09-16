import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ComponentCommunicationEventService, EmitEvent, Events } from 'src/app/services/component-communication-event.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

    returnUrl: string;

    constructor (private _titleService: Title,
        private _route: ActivatedRoute,
        private _router: Router,
        private _componentCommsService: ComponentCommunicationEventService) {

        // set the page title
        this._titleService.setTitle('Login');

        this.returnUrl = this._route.snapshot.queryParams['returnUrl'] || '/';
    }

    ngOnInit() {
    }

    refresh(status: boolean) {

        // go to previous route:
        if (status) {
            this._router.navigate([this.returnUrl]);
            this._componentCommsService.emit(new EmitEvent(Events.LoginSuccess, true));
        }
    }

}
