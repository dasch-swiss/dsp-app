import { Component, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

export interface ErrorMsg {
    status: number;
    message: string;
    description: string;
    action: 'goback' | 'reload';
    image: string;
}

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html',
    styleUrls: ['./error.component.scss']
})
export class ErrorComponent implements OnInit {

    @Input() status: number;

    // default error messages
    errorMessages: ErrorMsg[] = [
        {
            status: 0,
            message: 'Undefined Error',
            description: `Maybe I'm a teapot, maybe not.<br>
            But anyway, something undefined went wrong.`,
            action: 'goback',
            image: 'dsp-error.svg'
        },
        {
            status: 403,
            message: 'Forbidden',
            description: `Invalid Permissions.<br>
            Your request was valid but you do not have the<br>
            necessary permissions to access it.`,
            action: 'goback',
            image: 'dsp-error-403.svg'
        },
        {
            status: 404,
            message: 'Not found',
            description: `The content you were looking for cannot be found.`,
            action: 'goback',
            image: 'dsp-error-404.svg'
        },
        {
            status: 500,
            message: 'Internal Server Error',
            description: `The DaSCH Service Platform is not available at the moment.<br>
            An error has occured in a server side script.`,
            action: 'reload',
            image: 'dsp-error-500.svg'
        },
        {
            status: 503,
            message: 'Service unavailable',
            description: `The DaSCH Service Platform is not available at the moment.<br>
            The server is currently unavailable (overloaded or down).`,
            action: 'reload',
            image: 'dsp-error-503.svg'
        }
    ];

    // error message that will be shown in template
    errorMessage: ErrorMsg;

    constructor(
        private _titleService: Title,
        private _route: ActivatedRoute
    ) { }

    ngOnInit() {
        // status is not defined in Input parameter
        if (!this.status) {
            // but status is defined in app.routing
            this._route.data.subscribe(data => {
                this.status = data.status;
            });
        }

        // set the page title
        this._titleService.setTitle('DSP | Error ' + this.status);

        // get error message by status
        this.errorMessage = this.getErrorMsgByStatus(this.status);

        // if error message is not defined for the current status
        // use the default error message
        if (!this.errorMessage) {
            this.errorMessage = this.errorMessages[0];
        }

    }

    getErrorMsgByStatus(status: number): ErrorMsg {
        return this.errorMessages.filter(x => x.status === status)[0];
      }

    reload() {
        window.location.reload();
    }

}
