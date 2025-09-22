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
import { Region } from '../region';
import { RegionService } from '../region.service';
import { OpenSeaDragonService } from './open-sea-dragon.service';
import { PolygonsForRegion } from './polygons-for-region.interface';
import { StillImageHelper } from './still-image-helper';

@Injectable()
export class OsdDrawerService implements OnDestroy {
  resource!: ReadResource;

  private _paintedPolygons: PolygonsForRegion = {};
  private _masterSvgOverlay: SVGElement | null = null;
  private readonly _masterOverlayId = 'master-regions-overlay';
  private _currentTooltip: HTMLElement | null = null;
  private _tooltipUpdateFrame: number | null = null;
  private _currentHighlightedRegion: string | null = null;
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

    this._osd.viewer.addHandler(
      'canvas-click',
      (
        event: OpenSeadragon.ViewerEvent & {
          originalTarget?: Element;
        }
      ) => {
        event.preventDefaultAction = true;
        const target = event.originalTarget as SVGElement;
        const regionIri = target.getAttribute('data-region-iri');
        if (regionIri === this._currentHighlightedRegion) {
          this._regionService.setHighlightedRegionClicked(regionIri);
        } else {
          this._regionService.selectRegion(regionIri);
        }
      }
    );
  }

  update(resource: ReadResource): void {
    this.resource = resource;
  }

  private _subscribeToSelectedRegion() {
    this._regionService.selectedRegion$.pipe(takeUntil(this._ngUnsubscribe)).subscribe(region => {
      this._highlightRegion(region);
    });
  }

  private _subscribeToRegions() {
    combineLatest([this._regionService.showRegions$, this._regionService.regions$])
      .pipe(takeUntil(this._ngUnsubscribe))
      .subscribe(([showRegions, regions]) => {
        if (!showRegions) {
          this._removeOverlays();
          return;
        }

        // Incremental update: only add/remove what changed
        this._updateRegionsIncrementally(regions.map(r => r.res));
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
    if (keep.length === 0) {
      this._osd.viewer.clearOverlays();
      this._masterSvgOverlay = null;
      this._paintedPolygons = {};
      this._currentHighlightedRegion = null;
      this._cdr.detectChanges();
    } else {
      const elementsToRemove = this._getPolygonsToRemove(keep.map(r => r.id));
      elementsToRemove.forEach(regionId => {
        delete this._paintedPolygons[regionId];
        if (this._masterSvgOverlay) {
          const regionElements = this._masterSvgOverlay.querySelectorAll(`[data-region-iri="${regionId}"]`);
          regionElements.forEach(el => el.remove());
        }
      });
    }
  }

  private _getPolygonsToRemove(keep: string[] = []): string[] {
    if (!keep.length) {
      return Object.keys(this._paintedPolygons);
    }
    return Object.keys(this._paintedPolygons).filter(el => !keep.includes(el));
  }

  private _updateRegionsIncrementally(regions: ReadResource[]): void {
    const currentRegionIds = Object.keys(this._paintedPolygons);
    const newRegionIds = regions.map(r => r.id);

    // Find regions to remove (exist in current but not in new)
    const regionsToRemove = currentRegionIds.filter(id => !newRegionIds.includes(id));

    // Find regions to add (exist in new but not in current)
    const regionsToAdd = regions.filter(r => !currentRegionIds.includes(r.id));

    // Remove deleted regions
    regionsToRemove.forEach(regionId => {
      delete this._paintedPolygons[regionId];
      if (this._masterSvgOverlay) {
        const regionElements = this._masterSvgOverlay.querySelectorAll(`[data-region-iri="${regionId}"]`);
        regionElements.forEach(el => el.remove());
        // Clean up tooltip
        const tooltip = document.getElementById(`tooltip-${regionId}`);
        tooltip?.remove();
      }
    });

    // Add new regions
    if (regionsToAdd.length > 0) {
      this._addRegionsToMasterSVG(regionsToAdd);
    }
  }

  private _addRegionsToMasterSVG(regions: ReadResource[]): void {
    if (!this._masterSvgOverlay) {
      // No master SVG exists, create it with all regions
      this._renderRegions(regions);
      return;
    }

    const stillImage = this.resource.properties[Constants.HasStillImageFileValue][0] as ReadStillImageFileValue;
    const aspectRatio = stillImage.dimY / stillImage.dimX;

    // Add only new regions to existing SVG
    regions.forEach(region => {
      const geom = new Region(region).getGeometries()[0];
      if (!geom) return;

      const colorValues: ReadColorValue[] = region.properties[Constants.HasColor] as ReadColorValue[];
      if (colorValues && colorValues.length) {
        geom.geometry.lineColor = colorValues[0].color;
      }

      const commentValue = region.properties[Constants.HasComment]
        ? region.properties[Constants.HasComment][0].strval
        : '';

      const rectGroup = this._createSVGRectangle(
        region.id,
        geom.geometry,
        aspectRatio,
        region.label,
        commentValue || ''
      );

      if (this._masterSvgOverlay) {
        this._masterSvgOverlay.appendChild(rectGroup);
      }
      this._paintedPolygons[region.id] = [rectGroup];
    });
  }

  private _renderRegions(regions: ReadResource[]): void {
    const stillImage = this.resource.properties[Constants.HasStillImageFileValue][0] as ReadStillImageFileValue;
    const aspectRatio = stillImage.dimY / stillImage.dimX;

    const geometries = StillImageHelper.collectAndSortGeometries(regions, this._paintedPolygons);

    // Create or update the master SVG overlay
    this._createMasterSVGOverlay(geometries, aspectRatio);
  }

  private _createMasterSVGOverlay(
    geometries: { geometry: RegionGeometry; region: ReadResource }[],
    aspectRatio: number
  ): void {
    // Remove existing master overlay if it exists
    if (this._masterSvgOverlay) {
      this._osd.viewer.removeOverlay(this._masterOverlayId);
    }

    // Create one master SVG element
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('id', this._masterOverlayId);
    svgElement.setAttribute('width', '100%');
    svgElement.setAttribute('height', '100%');
    svgElement.setAttribute('viewBox', `0 0 1 ${aspectRatio}`);
    svgElement.setAttribute('preserveAspectRatio', 'none');
    // Enable pointer events for the SVG - child elements will handle their own pointer events
    svgElement.style.pointerEvents = 'auto';

    // Add all rectangles to the SVG
    for (const geom of geometries) {
      const geometry: RegionGeometry = geom.geometry;
      const regionIri = geom.region.id;

      const colorValues: ReadColorValue[] = geom.region.properties[Constants.HasColor] as ReadColorValue[];
      if (colorValues && colorValues.length) {
        geometry.lineColor = colorValues[0].color;
      }

      const commentValue = geom.region.properties[Constants.HasComment]
        ? geom.region.properties[Constants.HasComment][0].strval
        : '';

      const rectGroup = this._createSVGRectangle(
        regionIri,
        geometry,
        aspectRatio,
        geom.region.label,
        commentValue || ''
      );
      svgElement.appendChild(rectGroup);

      // Track the rectangle elements for highlighting
      this._paintedPolygons[regionIri] = [rectGroup];
    }

    // Add the master SVG as a single overlay covering the entire image
    this._osd.viewer.addOverlay({
      id: this._masterOverlayId,
      element: svgElement,
      location: new OpenSeadragon.Rect(0, 0, 1, aspectRatio),
    });
    this._masterSvgOverlay = svgElement;
  }

  private _highlightRegion(regionIri: string | null) {
    this._unhighlightSelectedRegion();
    this._currentHighlightedRegion = regionIri;

    const rect = this._masterSvgOverlay?.querySelector(`rect[data-region-iri="${regionIri}"]`);
    const originalWidth = rect?.getAttribute('data-original-stroke-width') || '2';

    // get int from string and set to times two
    const highlightedStrokeWidth = parseInt(originalWidth, 10) * 2;
    // set the stroke width to the new value
    rect?.setAttribute('stroke-width', highlightedStrokeWidth.toString());
    const lineColor = rect?.getAttribute('stroke') || '#ff0000';
    rect?.setAttribute('fill', lineColor);
    rect?.setAttribute('fill-opacity', '0.15');
  }

  private _unhighlightSelectedRegion() {
    const rect = this._masterSvgOverlay?.querySelector(`rect[data-region-iri="${this._currentHighlightedRegion}"]`);
    const originalWidth = rect?.getAttribute('data-original-stroke-width') || '2';
    rect?.setAttribute('stroke-width', originalWidth);
    rect?.setAttribute('fill', 'none');
    rect?.removeAttribute('fill-opacity');
    this._currentHighlightedRegion = null;
  }

  private _createSVGRectangle(
    regionIri: string,
    geometry: RegionGeometry,
    aspectRatio: number,
    regionLabel: string,
    regionComment: string
  ): SVGGElement {
    const lineColor = geometry.lineColor || '#ff0000';
    const lineWidth = geometry.lineWidth || 2;

    // Create SVG group for this region
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('data-cy', 'annotation-rectangle');
    group.style.cursor = 'pointer';
    group.style.pointerEvents = 'all'; // Enable pointer events for this group

    const diffX = geometry.points[1].x - geometry.points[0].x;
    const diffY = geometry.points[1].y - geometry.points[0].y;

    const x = Math.min(geometry.points[0].x, geometry.points[0].x + diffX);
    let y = Math.min(geometry.points[0].y, geometry.points[0].y + diffY);
    const width = Math.abs(diffX);
    const height = Math.abs(diffY * aspectRatio);

    y *= aspectRatio;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x.toString());
    rect.setAttribute('y', y.toString());
    rect.setAttribute('width', width.toString());
    rect.setAttribute('height', height.toString());
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', lineColor);
    rect.setAttribute('stroke-width', lineWidth.toString());
    rect.setAttribute('vector-effect', 'non-scaling-stroke');
    // Store original stroke width for restoration when unhighlighting
    rect.setAttribute('data-original-stroke-width', lineWidth.toString());
    rect.setAttribute('data-region-iri', regionIri);
    rect.setAttribute('data-cy', 'annotation-rectangle');

    group.appendChild(rect);

    // Add click handler and tooltip
    this._setupSVGRectangleInteractions(group, regionIri, regionLabel, regionComment);

    return group;
  }

  private _setupSVGRectangleInteractions(
    groupElement: SVGGElement,
    regionIri: string,
    regionLabel: string,
    regionComment: string
  ): void {
    const tooltipId = `tooltip-${regionIri}`;
    let tooltip = document.getElementById(tooltipId);
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = tooltipId;
      tooltip.className = 'annotation-tooltip';
      tooltip.innerHTML = `<strong>${regionLabel}</strong><br>${regionComment}`;
      tooltip.style.display = 'none';
      tooltip.style.position = 'fixed';
      tooltip.style.zIndex = '10000';
      tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
      tooltip.style.color = 'white';
      tooltip.style.padding = '5px 10px';
      tooltip.style.borderRadius = '4px';
      tooltip.style.fontSize = '12px';
      tooltip.style.pointerEvents = 'none';
      document.body.appendChild(tooltip);
    }

    groupElement.addEventListener('mouseenter', (event: MouseEvent) => {
      this._hideCurrentTooltip();

      if (tooltip) {
        this._currentTooltip = tooltip;
        tooltip.style.display = 'block';
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY - 30}px`;
      }
    });

    groupElement.addEventListener('mousemove', (event: MouseEvent) => {
      if (tooltip && this._currentTooltip === tooltip) {
        // Cancel any pending update
        if (this._tooltipUpdateFrame !== null) {
          // don't update if already scheduled, makes it way smoother
          cancelAnimationFrame(this._tooltipUpdateFrame);
        }

        // Schedule position update for next frame
        this._tooltipUpdateFrame = requestAnimationFrame(() => {
          if (tooltip && this._currentTooltip === tooltip) {
            tooltip.style.left = `${event.clientX + 10}px`;
            tooltip.style.top = `${event.clientY - 30}px`;
          }
          this._tooltipUpdateFrame = null;
        });
      }
    });

    groupElement.addEventListener('mouseleave', () => {
      this._hideCurrentTooltip();
    });
  }

  private _hideCurrentTooltip(): void {
    if (this._currentTooltip) {
      this._currentTooltip.style.display = 'none';
      this._currentTooltip = null;
    }

    // Cancel any pending tooltip position update
    if (this._tooltipUpdateFrame !== null) {
      cancelAnimationFrame(this._tooltipUpdateFrame);
      this._tooltipUpdateFrame = null;
    }
  }

  ngOnDestroy() {
    this._hideCurrentTooltip();
    // Clean up tooltips
    if (this._masterSvgOverlay) {
      const regionGroups = this._masterSvgOverlay.querySelectorAll('[data-region-iri]');
      regionGroups.forEach(group => {
        const regionIri = group.getAttribute('data-region-iri');
        if (regionIri) {
          const tooltip = document.getElementById(`tooltip-${regionIri}`);
          if (tooltip) {
            tooltip.remove();
          }
        }
      });
    }
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }
}
