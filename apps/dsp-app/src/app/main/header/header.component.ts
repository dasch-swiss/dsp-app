import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AppConfigService, RouteConstants, DspConfig } from '@dasch-swiss/vre/shared/app-config';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { Subscription } from 'rxjs';
import { SearchParams } from '../../workspace/results/list-view/list-view.component';
import { DialogComponent } from '../dialog/dialog.component';
import { ComponentCommunicationEventService, Events } from '../services/component-communication-event.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  session = false;
  show = false;
  searchParams: SearchParams;
  helpLink = RouteConstants.help;

  dsp: DspConfig;

  componentCommsSubscription: Subscription;

  homeLink = RouteConstants.home;

  constructor(
    private _appConfigService: AppConfigService,
    private _componentCommsService: ComponentCommunicationEventService,
    private _dialog: MatDialog,
    private _domSanitizer: DomSanitizer,
    private _matIconRegistry: MatIconRegistry,
    private _notification: NotificationService,
    private _router: Router
  ) {
    // create own logo icon to use them in mat-icons
    this._matIconRegistry.addSvgIcon(
      'dasch_mosaic_icon_color',
      this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/dasch-mosaic-icon-color.svg')
    );

    this.dsp = this._appConfigService.dspConfig;
  }

  ngOnInit() {
    this.componentCommsSubscription = this._componentCommsService.on(Events.loginSuccess, () => {
      this._notification.openSnackBar('Login successful');
    });
  }

  ngOnDestroy() {
    // unsubscribe from the ValueOperationEventService when component is destroyed
    if (this.componentCommsSubscription !== undefined) {
      this.componentCommsSubscription.unsubscribe();
    }
  }

  /**
   * show or hide search bar in phone version
   */
  showSearchBar() {
    this.show = !this.show;
  }

  doSearch(search: SearchParams) {
    // reset search params
    this.searchParams = undefined;

    // we can do the routing here or send the search param
    // to (resource) list view directly
    this.searchParams = search;

    if (this.searchParams.mode && this.searchParams.query) {
      let doSearchRoute = `/${RouteConstants.search}/${this.searchParams.mode}/${encodeURIComponent(
        this.searchParams.query
      )}`;

      if (this.searchParams.filter && this.searchParams.filter.limitToProject) {
        doSearchRoute += `/${encodeURIComponent(this.searchParams.filter.limitToProject)}`;
      }

      this._router.navigate([doSearchRoute]);
    }
  }

  openDialog(mode: string, name?: string, iri?: string): void {
    const dialogConfig: MatDialogConfig = {
      width: '840px',
      maxHeight: '80vh',
      position: {
        top: '112px',
      },
      data: { mode, title: name, id: iri },
    };

    this._dialog.open(DialogComponent, dialogConfig);
  }
}
