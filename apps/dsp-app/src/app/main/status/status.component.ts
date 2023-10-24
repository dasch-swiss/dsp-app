import { Component, Inject, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import {
    ApiResponseData,
    HealthResponse,
    KnoraApiConnection,
} from '@dasch-swiss/dsp-js';
import {HttpStatusMsg} from '@dasch-swiss/vre/shared/assets/status-msg';
import {DspApiConnectionToken, RouteConstants} from '@dasch-swiss/vre/shared/app-config';

export interface StatusMsg {
    status: number;
    message: string;
    description: string;
    action?: 'goback' | 'reload' | 'goto';
    type?: 'info' | 'warning' | 'error';
    image?: string;
}

@Component({
    selector: 'app-status',
    templateUrl: './status.component.html',
    styleUrls: ['./status.component.scss'],
})
export class StatusComponent implements OnInit {
    @Input() status: number;

    @Input() comment?: string;
    @Input() url?: string;
    @Input() representation?:
        | 'archive'
        | 'audio'
        | 'document'
        | 'still-image'
        | 'video'
        | 'text';

    refresh = false;

    // error message that will be shown in template
    message: StatusMsg;

    // default error messages
    errorMessages: StatusMsg[] = [
        {
            status: 0,
            message: 'Undefined Error',
            description: `Maybe I'm a teapot, maybe not.<br>
            But anyway, something undefined went wrong.`,
            action: 'goback',
            image: 'dsp-error.svg',
        },
        {
            status: 204,
            message: 'No Content',
            description: `This content is not supported on small devices.
            Please resize the browser window or switch to a desktop computer.`,
            action: 'goback',
            image: 'dsp-error.svg',
        },
        {
            status: 403,
            message: 'Forbidden',
            description: `Invalid Permissions.<br>
            Your request was valid but you do not have the
            necessary permissions to access it.`,
            action: 'goback',
            image: 'dsp-error-403.svg',
        },
        {
            status: 404,
            message: 'Not found',
            description: 'The content you were looking for cannot be found.',
            action: 'goback',
            image: 'dsp-error-404.svg',
        },
        {
            status: 500,
            message: 'Internal Server Error',
            description: `The DaSCH Service Platform is not available at the moment.
            An error has occured in a server side script.`,
            action: 'reload',
            image: 'dsp-error-500.svg',
        },
        {
            status: 503,
            message: 'Service unavailable',
            description: `The DaSCH Service Platform is not available at the moment.
            The server is currently unavailable (overloaded or down).`,
            action: 'reload',
            image: 'dsp-error-503.svg',
        },
    ];

    homeLink = RouteConstants.home;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _titleService: Title,
        private _route: ActivatedRoute,
        private _status: HttpStatusMsg
    ) {}

    ngOnInit() {
        // status is not defined in Input parameter
        if (!this.status) {
            // but status is defined in app.routing
            this._route.data.subscribe((data) => {
                this.status = data.status;
                this.comment = data.comment;
                this.url = data.url;
            });
        }

        // get error message by status
        this.message = this.getMsgByStatus(this.status);

        if (this.representation) {
            this.comment = `There was an error loading the ${this.representation} file representation. Try to open it directly by clicking on the file url below:`;
            this.message.action = 'goto';
        } else {
            // set the page title only in case of main error
            this._titleService.setTitle(
                `DSP | ${this.getTypeByStatus(this.status).toUpperCase()} ${
                    this.status
                }`
            );
        }
    }

    getMsgByStatus(status: number): StatusMsg {
        let msg = this.errorMessages.filter((x) => x.status === status)[0];

        if (!msg) {
            msg = this._status.default[status];
            msg.status = status;
            msg.image = 'dsp-error.svg';
            msg.action = this.url ? 'goto' : undefined;
        }

        msg.type = this.getTypeByStatus(status);
        return msg;
    }

    getTypeByStatus(status: number): 'info' | 'warning' | 'error' {
        switch (true) {
            case status >= 0 && status < 203:
                return 'info';
            case status >= 203 && status < 400:
                return 'warning';
            case status >= 400 && status < 600:
                return 'error';
        }
    }

    reload() {
        // get api health status first and reload page only, if the api is running and status is healthy
        this.refresh = true;

        this._dspApiConnection.system.healthEndpoint
            .getHealthStatus()
            .subscribe(
                (response: ApiResponseData<HealthResponse>) => {
                    if (response.body.status) {
                        window.location.reload();
                    }
                },
                () => {
                    this.refresh = false;
                }
            );
    }
}
