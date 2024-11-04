import { ChangeDetectorRef, Inject, Injectable, Renderer2 } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  Constants,
  KnoraApiConnection,
  Point2D,
  ReadColorValue,
  ReadResource,
  ReadStillImageFileValue,
  RegionGeometry,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppError } from '@dasch-swiss/vre/shared/app-error-handler';
import * as OpenSeadragon from 'openseadragon';
import { filter, switchMap } from 'rxjs/operators';
import { AddRegionFormDialogComponent, AddRegionFormDialogProps } from '../add-region-form-dialog.component';
import { RegionService } from '../region.service';
import { PolygonsForRegion } from './polygons-for-region.interface';
import { StillImageHelper } from './still-image-helper';

@Injectable()
export class OsdDrawerService {
  resource!: ReadResource;

  private _regionDragInfo: {
    overlayElement: HTMLElement;
    startPos: OpenSeadragon.Point;
    endPos?: OpenSeadragon.Point;
  } | null = null; // stores the information of the first click for drawing a region
  private _regions: PolygonsForRegion = {};

  public viewer!: OpenSeadragon.Viewer;

  public readonly ZOOM_FACTOR = 0.2;
  private readonly _REGION_COLOR = 'rgba(255,0,0,0.3)';

  constructor(
    private _renderer: Renderer2,
    private _regionService: RegionService,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _dialog: MatDialog,
    private _cdr: ChangeDetectorRef
  ) {}

  onInit(viewer: OpenSeadragon.Viewer, resource: ReadResource): void {
    this.resource = resource;
    this.viewer = viewer;

    this._regionService.imageIsLoaded$
      .pipe(
        filter(loaded => loaded),
        switchMap(() => this._regionService.regions$),
        switchMap(() => this._regionService.showRegions$)
      )
      .subscribe(showRegion => {
        this._regions = {};

        if (showRegion) {
          this._renderRegions();
        }
      });

    this._regionService.highlightRegion$.subscribe(region => {
      if (region === null) {
        this._unhighlightAllRegions();
        return;
      }
      this._highlightRegion(region);
    });
  }

  public trackClickEvents() {
    const viewer = this.viewer;
    return new OpenSeadragon.MouseTracker({
      element: viewer.canvas,
      pressHandler: event => {
        if (viewer.isMouseNavEnabled()) {
          return;
        }

        const overlayElement: HTMLElement = this._renderer.createElement('div');
        overlayElement.style.background = this._REGION_COLOR;
        const viewportPos = viewer.viewport.pointFromPixel((event as OpenSeadragon.ViewerEvent).position!);
        viewer.addOverlay(overlayElement, new OpenSeadragon.Rect(viewportPos.x, viewportPos.y, 0, 0));
        this._regionDragInfo = {
          overlayElement,
          startPos: viewportPos,
        };
      },
      dragHandler: event => {
        if (viewer.isMouseNavEnabled()) {
          return;
        }

        if (!this._regionDragInfo) {
          throw new AppError('Region drag info is not set');
        }

        const viewPortPos = viewer.viewport.pointFromPixel((event as OpenSeadragon.ViewerEvent).position!);
        const diffX = viewPortPos.x - this._regionDragInfo.startPos.x;
        const diffY = viewPortPos.y - this._regionDragInfo.startPos.y;
        const location = new OpenSeadragon.Rect(
          Math.min(this._regionDragInfo.startPos.x, this._regionDragInfo.startPos.x + diffX),
          Math.min(this._regionDragInfo.startPos.y, this._regionDragInfo.startPos.y + diffY),
          Math.abs(diffX),
          Math.abs(diffY)
        );

        viewer.updateOverlay(this._regionDragInfo.overlayElement, location);
        this._regionDragInfo.endPos = viewPortPos;
      },
      releaseHandler: () => {
        if (viewer.isMouseNavEnabled()) {
          return;
        }

        if (!this._regionDragInfo) {
          throw new AppError('Region drag info and draw mode are not set');
        }
        const imageSize = viewer.world.getItemAt(0).getContentSize();
        const startPoint = viewer.viewport.viewportToImageCoordinates(this._regionDragInfo.startPos);
        const endPoint = viewer.viewport.viewportToImageCoordinates(this._regionDragInfo.endPos!);
        this._openRegionDialog(startPoint, endPoint, imageSize, this._regionDragInfo.overlayElement);
        this._regionDragInfo = null;
        viewer.setMouseNavEnabled(false);
      },
    });
  }

  private _renderRegions() {
    let imageXOffset = 0; // see documentation in this.openImages() for the usage of imageXOffset

    const stillImage = this.resource.properties[Constants.HasStillImageFileValue][0] as ReadStillImageFileValue;
    const aspectRatio = stillImage.dimY / stillImage.dimX;

    const geometries = StillImageHelper.collectAndSortGeometries(this._regionService.regions, this._regions);

    // render all geometries for this page
    for (const geom of geometries) {
      const geometry = geom.geometry;

      const colorValues: ReadColorValue[] = geom.region.properties[Constants.HasColor] as ReadColorValue[];

      // if the geometry has a color property, use that value as the color for the line
      if (colorValues && colorValues.length) {
        geometry.lineColor = colorValues[0].color;
      }

      const commentValue = geom.region.properties[Constants.HasComment]
        ? geom.region.properties[Constants.HasComment][0].strval
        : '';

      this._createSVGOverlay(geom.region.id, geometry, aspectRatio, geom.region.label, commentValue || '');

      imageXOffset++;
    }
  }

  private _createSVGOverlay(
    regionIri: string,
    geometry: RegionGeometry,
    aspectRatio: number,
    regionLabel: string,
    regionComment: string
  ): void {
    const viewer = this.viewer;

    const { regEle, loc } = this._createRectangle(geometry, aspectRatio);
    viewer
      .addOverlay({
        element: regEle,
        location: loc,
      })
      .addHandler('canvas-click', event => {
        this._regionService.highlightRegion((<any>event).originalTarget.dataset.regionIri);
      });

    this._regions[regionIri].push(regEle);
    this._createTooltip(regionLabel, regionComment, regEle, regionIri);
  }

  private _openRegionDialog(startPoint: Point2D, endPoint: Point2D, imageSize: Point2D, overlay: Element): void {
    this._dialog
      .open<AddRegionFormDialogComponent, AddRegionFormDialogProps>(AddRegionFormDialogComponent, {
        data: {
          resourceIri: this.resource.id,
        },
      })
      .afterClosed()
      .subscribe(data => {
        this.viewer.setMouseNavEnabled(true);
        this._cdr.detectChanges();
        this.viewer.removeOverlay(overlay);
        if (data) {
          this._uploadRegion(startPoint, endPoint, imageSize, data.color, data.comment, data.label);
        }
      });
  }

  private _uploadRegion(
    startPoint: Point2D,
    endPoint: Point2D,
    imageSize: Point2D,
    color: string,
    comment: string,
    label: string
  ) {
    this._dspApiConnection.v2.res
      .createResource(
        StillImageHelper.getPayloadUploadRegion(
          this.resource.id,
          this.resource.attachedToProject,
          startPoint,
          endPoint,
          imageSize,
          color,
          comment,
          label
        )
      )
      .subscribe(res => {
        const regionId = (res as ReadResource).id;
        this._regionService.showRegions(true);
        this._regionService.updateRegions();
        this._regionService.highlightRegion(regionId);
      });
  }

  private _highlightRegion(regionIri: string) {
    const activeRegions: HTMLElement[] = this._regions[regionIri];

    if (activeRegions !== undefined) {
      for (const pol of activeRegions) {
        pol.setAttribute('class', 'region active');
      }
    }
  }

  private _unhighlightAllRegions() {
    for (const reg in this._regions) {
      if (reg in this._regions) {
        for (const pol of this._regions[reg]) {
          pol.setAttribute('class', 'region');
        }
      }
    }
  }

  private _createRectangle(
    geometry: RegionGeometry,
    aspectRatio: number
  ): {
    regEle: HTMLElement;
    loc: OpenSeadragon.Rect;
  } {
    const lineColor = geometry.lineColor;
    const lineWidth = geometry.lineWidth;

    const regEle: HTMLElement = this._renderer.createElement('div');
    regEle.id = `region-overlay-${Math.random() * 10000}`;
    regEle.className = 'region';
    regEle.setAttribute('style', `outline: solid ${lineColor} ${lineWidth}px;`);
    regEle.setAttribute('data-cy', 'annotation-rectangle');

    const diffX = geometry.points[1].x - geometry.points[0].x;
    const diffY = geometry.points[1].y - geometry.points[0].y;

    const loc = new OpenSeadragon.Rect(
      Math.min(geometry.points[0].x, geometry.points[0].x + diffX),
      Math.min(geometry.points[0].y, geometry.points[0].y + diffY),
      Math.abs(diffX),
      Math.abs(diffY * aspectRatio)
    );

    loc.y *= aspectRatio;
    return { regEle, loc };
  }

  private _createTooltip(regionLabel: string, regionComment: string, regEle: HTMLElement, regionIri: string): void {
    const comEle: HTMLElement = this._renderer.createElement('div');
    comEle.className = 'annotation-tooltip';
    comEle.innerHTML = `<strong>${regionLabel}</strong><br>${regionComment}`;
    regEle.append(comEle);

    regEle.addEventListener('mousemove', (event: MouseEvent) => {
      comEle.setAttribute('style', `display: block; left: ${event.clientX}px; top: ${event.clientY}px`);
    });
    regEle.addEventListener('mouseleave', () => {
      comEle.setAttribute('style', 'display: none');
    });
    regEle.dataset['regionIri'] = regionIri;
  }
}
