import { Injectable } from '@angular/core';
import { AccessTokenService } from '@dasch-swiss/vre/shared/app-session';
import * as OpenSeadragon from 'openseadragon';
import { osdViewerConfig } from './osd-viewer.config';

@Injectable()
export class OpenSeaDragonService {
  private _viewer!: OpenSeadragon.Viewer;

  get viewer(): OpenSeadragon.Viewer {
    return this._viewer;
  }

  set viewer(htmlElement: HTMLElement) {
    const accessToken = this._accessToken.getAccessToken();

    const viewerConfig: OpenSeadragon.Options = {
      ...osdViewerConfig,
      element: htmlElement,
      loadTilesWithAjax: true,
    };

    if (accessToken) {
      viewerConfig.ajaxHeaders = {
        Authorization: `Bearer ${accessToken}`,
      };
    }

    this._viewer = new OpenSeadragon.Viewer(viewerConfig);
  }

  constructor(private _accessToken: AccessTokenService) {}
}
