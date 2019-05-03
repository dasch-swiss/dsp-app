import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthenticationService } from '@knora/authentication';

/*
export interface KnoraHeadersResponse {
    'Server': string;
    'Date': Date;
    'Content-Type': string;
    'Content-Lenght': number;
}
*/

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    session: boolean = false;

    constructor (private _titleService: Title,
        // @Inject(KuiCoreConfigToken) public config: KuiCoreConfig,
        // private _http: HttpClient,
        // private _projects: ProjectsService,
        private _auth: AuthenticationService) {

        // set the page title
        this._titleService.setTitle('Knora User Interface | Research Layer');

        this.session = this._auth.session();
    }

    ngOnInit() {

        // this.getVersion();

        /*
        this._http.get<HttpResponse<any>>(this.config.api + '/admin/projects', { observe: 'response' })
            .subscribe(
                (resp: HttpResponse<any>) => {
                    console.log('Stackoverflow', resp);
                }
            );

        this._http.get(this.config.api + '/v2/authentication').pipe(
            map((result: any) => {
                console.log(result.headers.get('Server'));
                // console.log('AuthenticationService - authenticate - result: ', result);
                // return true || false
                // return result.status === 200;
            })
        );
        */


        /*
        this.getConfigResponse().subscribe(resp => {

            // display its headers
            const keys = resp.headers.keys();
            const headers = keys.map(key =>
                `${key}: ${resp.headers.get(key)}`);

            // access the body directly, which is typed as `Config`.
            //this.config = { ... resp.body };
            console.log('getConfigResponse', headers);
        });
        */

        // get info about the logged-in person;
        // in case of guest user show landing page without full header

    }

    /*
        getConfigResponse(): Observable<HttpResponse<KnoraHeadersResponse>> {
            return this._http.get<KnoraHeadersResponse>(
                this.config.api + '/admin/projects', { observe: 'response' }
            );
        }

        getVersion(): void {

            // const requestOptions = new RequestOptions({ headers: null, withCredentials: true });

            // const jwt = JSON.parse(localStorage.getItem('session')).user.jwt;

            const httpOptions = {
                headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
                observe: 'response' as 'response'
                // withCredentials: true
            };

            // {headers: headers, observe: "response"}
            this._http.get(this.config.api + '/admin/projects', httpOptions).subscribe(
                (response: HttpResponse<any>) => {
                    // setTimeout(() => {
                    // console.log(this.resource);
                    // this.initContent();
                    console.log('get version response', response.headers.get('server'));
                    // }, 500);
                }
            );

        }
        */
}


/*
import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HeaderInterceptor implements HttpInterceptor {
    constructor () { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const headers = req.headers
            .set('Content-Type', 'application/json');
        const authReq = req.clone({ headers });
        return next.handle(authReq);
    }
}
*/