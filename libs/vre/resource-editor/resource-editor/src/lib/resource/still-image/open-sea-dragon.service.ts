import { Injectable } from '@angular/core';
import { Point2D } from '@dasch-swiss/dsp-js';
import { AccessTokenService } from '@dasch-swiss/vre/core/session';
import OpenSeadragon from 'openseadragon';
import { Subject } from 'rxjs';
import { osdViewerConfig } from './osd-viewer.config';
import { StillImageHelper } from './still-image-helper';

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
  private readonly _ZOOM_FACTOR = 0.2;
  private readonly _MIN_ZOOM_EPSILON = 1e-6;

  private _viewer!: OpenSeadragon.Viewer;

  private _drawing = false;

  get drawing() {
    return this._drawing;
  }

  private _rectangleInDrawing: {
    overlayElement: HTMLElement;
    startPos: OpenSeadragon.Point;
    endPos?: OpenSeadragon.Point;
  } | null = null;

  private _createdRectangleSubject = new Subject<Overlay>();
  createdRectangle$ = this._createdRectangleSubject.asObservable();

  constructor(private readonly _accessToken: AccessTokenService) {}

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
    this._addCustomHandlers(this._viewer);
    this._letPageScrollAtMinZoom(this._viewer);
  }

  /**
   * At minimum zoom the image cannot shrink further, so a zoom-out wheel gesture would be a no-op.
   * Hide it from OpenSeadragon instead and let it bubble, so the page scrolls rather than the
   * user having to move the cursor beside the viewer. Zooming in is never intercepted.
   */
  private _letPageScrollAtMinZoom(viewer: OpenSeadragon.Viewer): void {
    viewer.element.addEventListener(
      'wheel',
      (event: WheelEvent) => {
        // ctrlKey means trackpad pinch or browser zoom, not a scroll gesture.
        if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
          return;
        }

        const zoomingOut = event.deltaY > 0;
        if (!zoomingOut) {
          return;
        }

        const viewport = viewer.viewport;
        if (!viewport) {
          return;
        }

        // Compare the *target* zoom (getZoom(false)), not the current animated one. OpenSeadragon
        // glides toward its target over ~1.2s, so the current value still sits above the floor for
        // the whole animation - gating on it would swallow every wheel tick until the spring
        // settled. The target is clamped to getMinZoom() immediately, on the first tick that
        // bottoms out, so the page starts scrolling right away.
        if (viewport.getZoom(false) <= viewport.getMinZoom() + this._MIN_ZOOM_EPSILON) {
          // Do not preventDefault: scrolling the page IS the default action we want here.
          event.stopPropagation();
        }
      },
      { capture: true }
    );
  }

  toggleDrawing(): void {
    this._drawing = !this._drawing;

    if (this._drawing) {
      this._disableDefaultDragging();
      this._disableDoubleClickZooming();
    } else {
      this._enableDefaultDragging();
      this._enableDoubleClickZooming();
    }
  }

  private _disableDefaultDragging(): void {
    this._viewer.addHandler('canvas-drag', StillImageHelper.preventDefault);
  }

  private _disableDoubleClickZooming(): void {
    this._viewer.addHandler('canvas-double-click', StillImageHelper.preventDefault);
  }

  private _enableDefaultDragging(): void {
    this._viewer.removeHandler('canvas-drag', StillImageHelper.preventDefault);
  }

  private _enableDoubleClickZooming(): void {
    this._viewer.removeHandler('canvas-double-click', StillImageHelper.preventDefault);
  }

  zoom(direction: 1 | -1) {
    this._viewer.viewport.zoomBy(1 + direction * this._ZOOM_FACTOR);
  }

  private _addCustomHandlers(viewer: OpenSeadragon.Viewer): void {
    viewer.addHandler('canvas-press', event => this._onCanvasPress(event, viewer));
    viewer.addHandler('canvas-drag', event => this._onCanvasDrag(event, viewer));
    viewer.addHandler('canvas-release', () => this._onCanvasRelease(viewer));
  }

  private _onCanvasPress(event: OpenSeadragon.CanvasEvent, viewer: OpenSeadragon.Viewer): void {
    if (!this._drawing) {
      return;
    }
    const overlayElement: HTMLElement = document.createElement('div');
    overlayElement.style.background = this._OVERLAY_COLOR;
    const viewportPos = viewer.viewport.pointFromPixel(event.position);
    viewer.addOverlay(overlayElement, new OpenSeadragon.Rect(viewportPos.x, viewportPos.y, 0, 0));
    this._rectangleInDrawing = {
      overlayElement,
      startPos: viewportPos,
    };
  }

  private _onCanvasDrag(event: OpenSeadragon.CanvasEvent, viewer: OpenSeadragon.Viewer): void {
    if (!this._drawing || !this._rectangleInDrawing) {
      return;
    }
    const viewPortPos = viewer.viewport.pointFromPixel(event.position);
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
  }

  private _onCanvasRelease(viewer: OpenSeadragon.Viewer): void {
    if (!this._drawing || !this._rectangleInDrawing?.endPos) {
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
    this.toggleDrawing();
  }
}
