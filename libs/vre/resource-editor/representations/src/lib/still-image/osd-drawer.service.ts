import { ChangeDetectorRef, Inject, Injectable, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  Constants,
  KnoraApiConnection,
  ReadColorValue,
  ReadResource,
  ReadStillImageFileValue,
  RegionGeometry,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import * as OpenSeadragon from 'openseadragon';
import { combineLatest, filter, map, of, Subject, switchMap, takeUntil } from 'rxjs';
import { AddRegionFormDialogComponent, AddRegionFormDialogProps } from '../add-region-form-dialog.component';
import { RegionService } from '../region.service';
import { OpenSeaDragonService } from './open-sea-dragon.service';
import { PolygonsForRegion } from './polygons-for-region.interface';
import { StillImageHelper } from './still-image-helper';

@Injectable()
export class OsdDrawerService implements OnDestroy {
  resource!: ReadResource;

  private _paintedPolygons: PolygonsForRegion = {};
  private _ngUnsubscribe = new Subject<void>();

  constructor(
    private _osd: OpenSeaDragonService,
    private _regionService: RegionService,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _dialog: MatDialog,
    private _cdr: ChangeDetectorRef
  ) {}

  onInit(resource: ReadResource): void {
    this.resource = resource;

    this._subscribeToRegions();
    this._subscribeToSelectedRegion();
    this._subscribeToCreatedRectangle();

    this._osd.viewer.addHandler('canvas-click', event => {
      const regionIri = (<any>event).originalTarget.dataset.regionIri;
      if (regionIri) {
        this._regionService.selectRegion(regionIri);
      }
    });
  }

  update(resource: ReadResource): void {
    this.resource = resource;
  }

  private _subscribeToSelectedRegion() {
    this._regionService.selectedRegion$.pipe(takeUntil(this._ngUnsubscribe)).subscribe(region => {
      this._unhighlightAllRegions();
      if (region === null) {
        return;
      }
      this._highlightRegion(region);
    });
  }

  private _subscribeToRegions() {
    combineLatest([this._regionService.showRegions$, this._regionService.regions$])
      .pipe(takeUntil(this._ngUnsubscribe))
      .subscribe(([showRegions, regions]) => {
        if (!showRegions) {
          this._removeOverlays();
        }

        if (showRegions) {
          this._removeOverlays(regions.map(r => r.res));
          this._renderRegions(regions.map(r => r.res));
        }
      });
  }

  private _subscribeToCreatedRectangle() {
    this._osd.createdRectangle$
      .pipe(takeUntil(this._ngUnsubscribe))
      .pipe(
        switchMap(overlay =>
          this._dialog
            .open<AddRegionFormDialogComponent, AddRegionFormDialogProps>(AddRegionFormDialogComponent, {
              data: {
                resourceIri: this.resource.id,
              },
            })
            .afterClosed()
            .pipe(map(data => ({ data, overlay })))
        )
      )
      .pipe(
        switchMap(({ data, overlay }) => {
          this._osd.viewer.removeOverlay(overlay.overlay);
          this._cdr.detectChanges();

          if (!data) {
            // User pressed on cancel
            return of(null);
          }

          return this._dspApiConnection.v2.res.createResource(
            StillImageHelper.getPayloadUploadRegion(
              this.resource.id,
              this.resource.attachedToProject,
              overlay.startPoint,
              overlay.endPoint,
              overlay.imageSize,
              data.color,
              data.comment,
              data.label
            )
          );
        }),
        filter(data => !!data),
        takeUntil(this._ngUnsubscribe),
        switchMap(res =>
          this._regionService.updateRegions$().pipe(
            map(() => {
              return res;
            })
          )
        )
      )
      .subscribe(res => {
        const regionId = (res as ReadResource).id;
        this._regionService.selectRegion(regionId);
      });
  }

  private _removeOverlays(keep: ReadResource[] = []): void {
    const elementsToRemove = this._getPolygonsToRemove(keep.map(r => r.id));
    elementsToRemove.forEach(r => {
      const e = this._osd.viewer.getOverlayById(r);
      if (e) {
        delete this._paintedPolygons[r];
        this._osd.viewer.clearOverlays();
        this._cdr.detectChanges();
      }
    });
  }

  private _getPolygonsToRemove(keep: string[] = []): string[] {
    if (!keep.length) {
      return Object.keys(this._paintedPolygons);
    }
    return Object.keys(this._paintedPolygons).filter(el => !keep.includes(el));
  }

  private _renderRegions(regions: ReadResource[]): void {
    let imageXOffset = 0; // see documentation in this.openImages() for the usage of imageXOffset

    const stillImage = this.resource.properties[Constants.HasStillImageFileValue][0] as ReadStillImageFileValue;
    const aspectRatio = stillImage.dimY / stillImage.dimX;

    const geometries = StillImageHelper.collectAndSortGeometries(regions, this._paintedPolygons);

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
    const { regEle, loc } = this._createRectangle(regionIri, geometry, aspectRatio);
    this._osd.viewer.addOverlay({
      id: regionIri,
      element: regEle,
      location: loc,
    });

    this._paintedPolygons[regionIri].push(regEle);
    this._createTooltip(regionLabel, regionComment, regEle, regionIri);
  }

  private _highlightRegion(regionIri: string) {
    const activeRegions: HTMLElement[] = this._paintedPolygons[regionIri];

    if (activeRegions !== undefined) {
      for (const pol of activeRegions) {
        pol.setAttribute('class', 'region active');
      }
    }
  }

  private _unhighlightAllRegions() {
    for (const reg in this._paintedPolygons) {
      if (reg in this._paintedPolygons) {
        for (const pol of this._paintedPolygons[reg]) {
          pol.setAttribute('class', 'region');
        }
      }
    }
  }

  private _createRectangle(
    regionIri: string,
    geometry: RegionGeometry,
    aspectRatio: number
  ): {
    regEle: HTMLElement;
    loc: OpenSeadragon.Rect;
  } {
    const lineColor = geometry.lineColor;
    const lineWidth = geometry.lineWidth;

    const regEle: HTMLElement = document.createElement('div');
    regEle.id = regionIri;
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
    const comEle: HTMLElement = document.createElement('div');
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

  ngOnDestroy() {
    this._ngUnsubscribe.complete();
  }
}
