import { Injectable } from '@angular/core';
import { Point2D } from '@dasch-swiss/dsp-js';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { AccessTokenService } from '@dasch-swiss/vre/core/session';
import OpenSeadragon from 'openseadragon';
import { Subject } from 'rxjs';
import { osdViewerConfig } from './osd-viewer.config';

interface Overlay {
  startPoint: Point2D;
  endPoint: Point2D;
  imageSize: Point2D;
  overlay: Element;
}

@Injectable({ providedIn: 'root' })
export class OpenSeaDragonService {
  get viewer() {
    return this._viewer;
  }

  private readonly _OVERLAY_COLOR = 'rgba(255,0,0,0.3)';
  private readonly ZOOM_FACTOR = 0.2;

  private _viewer!: OpenSeadragon.Viewer;

  private _rectangleInDrawing: {
    overlayElement: HTMLElement;
    startPos: OpenSeadragon.Point;
    endPos?: OpenSeadragon.Point;
  } | null = null;

  private _createdRectangleSubject = new Subject<Overlay>();
  createdRectangle$ = this._createdRectangleSubject.asObservable();

  constructor(private _accessToken: AccessTokenService) {}

  onInit(htmlElement: HTMLElement) {
    const viewerConfig: OpenSeadragon.Options = {
      ...osdViewerConfig,
      element: htmlElement,
      loadTilesWithAjax: true,
    };

    const accessToken = this._accessToken.getAccessToken();
    if (accessToken) {
      viewerConfig.ajaxHeaders = {
        Authorization: `Bearer ${accessToken}`,
      };
    }

    this._viewer = new OpenSeadragon.Viewer(viewerConfig);
    this._trackClickEvents(this._viewer);
  }

  zoom(direction: 1 | -1) {
    this._viewer.viewport.zoomBy(1 + direction * this.ZOOM_FACTOR);
  }

  private _trackClickEvents(viewer: OpenSeadragon.Viewer) {
    return new OpenSeadragon.MouseTracker({
      element: viewer.canvas,
      pressHandler: event => {
        if (viewer.isMouseNavEnabled()) {
          return;
        }

        const overlayElement: HTMLElement = document.createElement('div');
        overlayElement.style.background = this._OVERLAY_COLOR;
        const viewportPos = viewer.viewport.pointFromPixel((event as OpenSeadragon.ViewerEvent).position!);
        viewer.addOverlay(overlayElement, new OpenSeadragon.Rect(viewportPos.x, viewportPos.y, 0, 0));
        this._rectangleInDrawing = {
          overlayElement,
          startPos: viewportPos,
        };
      },
      dragHandler: event => {
        if (viewer.isMouseNavEnabled()) {
          return;
        }

        if (!this._rectangleInDrawing) {
          throw new AppError('Rectangle is not set');
        }

        const viewPortPos = viewer.viewport.pointFromPixel((event as OpenSeadragon.ViewerEvent).position!);
        const diffX = viewPortPos.x - this._rectangleInDrawing.startPos.x;
        const diffY = viewPortPos.y - this._rectangleInDrawing.startPos.y;
        const location = new OpenSeadragon.Rect(
          Math.min(this._rectangleInDrawing.startPos.x, this._rectangleInDrawing.startPos.x + diffX),
          Math.min(this._rectangleInDrawing.startPos.y, this._rectangleInDrawing.startPos.y + diffY),
          Math.abs(diffX),
          Math.abs(diffY)
        );

        viewer.updateOverlay(this._rectangleInDrawing.overlayElement, location);
        this._rectangleInDrawing.endPos = viewPortPos;
      },
      releaseHandler: () => {
        if (viewer.isMouseNavEnabled()) {
          return;
        }

        if (!this._rectangleInDrawing) {
          throw new AppError('Rectangle is not set');
        }

        if (!this._rectangleInDrawing.endPos) {
          return;
        }

        const imageSize = viewer.world.getItemAt(0).getContentSize();
        const startPoint = viewer.viewport.viewportToImageCoordinates(this._rectangleInDrawing.startPos);
        const endPoint = viewer.viewport.viewportToImageCoordinates(this._rectangleInDrawing.endPos);
        this._createdRectangleSubject.next({
          startPoint,
          endPoint,
          imageSize,
          overlay: this._rectangleInDrawing.overlayElement,
        });

        this._rectangleInDrawing = null;
      },
    });
  }
}
