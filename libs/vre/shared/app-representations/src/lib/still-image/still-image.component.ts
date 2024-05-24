import {
  Component,
  ElementRef,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import {
  Constants,
  CreateColorValue,
  CreateGeomValue,
  CreateLinkValue,
  CreateResource,
  CreateTextValueAsString,
  KnoraApiConnection,
  Point2D,
  ReadColorValue,
  ReadFileValue,
  ReadResource,
  ReadStillImageFileValue,
  RegionGeometry,
  UpdateFileValue,
  UpdateResource,
  UpdateValue,
  WriteValueResponse,
} from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { DialogComponent } from '@dasch-swiss/vre/shared/app-common-to-move';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import * as OpenSeadragon from 'openseadragon';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { FileRepresentation } from '../file-representation';
import { getFileValue } from '../get-file-value';
import { Region } from '../region';
import { RegionService } from '../region.service';
import { RepresentationService } from '../representation.service';
import { EmitEvent, Events, UpdatedFileEventValue, ValueOperationEventService } from '../value-operation-event.service';
import { osdViewerConfig } from './osd-viewer.config';

/**
 * represents a region resource.
 */

/**
 * represents a geometry belonging to a specific region resource.
 */
class GeometryForRegion {
  /**
   *
   * @param geometry the geometrical information.
   * @param region the region the geometry belongs to.
   */
  constructor(
    readonly geometry: RegionGeometry,
    readonly region: ReadResource
  ) {}
}

/**
 * collection of `SVGPolygonElement` for individual regions.
 */
interface PolygonsForRegion {
  [key: string]: HTMLElement[];
}

@Component({
  selector: 'app-still-image',
  templateUrl: './still-image.component.html',
  styleUrls: ['./still-image.component.scss'],
})
export class StillImageComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) resource!: DspResource;

  get parentResource() {
    return this.resource.res;
  }

  get image() {
    return new FileRepresentation(getFileValue(this.resource)!);
  }

  get resourceIri() {
    return this.parentResource.id;
  }

  get attachedToProjectResource() {
    return this.parentResource.attachedToProject;
  }

  isEditor$: Observable<boolean> = combineLatest([
    this._store.select(UserSelectors.user),
    this._store.select(UserSelectors.userProjectAdminGroups),
  ]).pipe(
    map(([user, userProjectGroups]) => {
      return this.attachedToProjectResource
        ? ProjectService.IsProjectMemberOrAdminOrSysAdmin(user, userProjectGroups, this.attachedToProjectResource)
        : false;
    })
  );
  editorPermissions = false;

  imagesSub: Subscription | undefined;
  fileInfoSub: Subscription | undefined;

  loading = true;
  failedToLoad = false;

  regionDrawMode = false; // stores whether viewer is currently drawing a region
  private _regionDragInfo; // stores the information of the first click for drawing a region
  private _viewer: OpenSeadragon.Viewer;
  private _regions: PolygonsForRegion = {};

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _dialog: MatDialog,
    private _domSanitizer: DomSanitizer,
    private _elementRef: ElementRef,
    private _matIconRegistry: MatIconRegistry,
    private _notification: NotificationService,
    private _renderer: Renderer2,
    private _rs: RepresentationService,
    private _valueOperationEventService: ValueOperationEventService,
    private _regionService: RegionService,
    private _store: Store
  ) {
    OpenSeadragon.setString('Tooltips.Home', '');
    OpenSeadragon.setString('Tooltips.ZoomIn', '');
    OpenSeadragon.setString('Tooltips.ZoomOut', '');
    OpenSeadragon.setString('Tooltips.FullPage', '');

    // own draw region icon; because it does not exist in the material icons
    this._matIconRegistry.addSvgIcon(
      'draw_region_icon',
      this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/draw-region-icon.svg')
    );
  }

  /**
   * calculates the surface of a rectangular region.
   *
   * @param geom the region's geometry.
   * @returns the surface.
   */
  static surfaceOfRectangularRegion(geom: RegionGeometry): number {
    if (geom.type !== 'rectangle') {
      // console.log('expected rectangular region, but ' + geom.type + ' given');
      return 0;
    }

    const w = Math.max(geom.points[0].x, geom.points[1].x) - Math.min(geom.points[0].x, geom.points[1].x);
    const h = Math.max(geom.points[0].y, geom.points[1].y) - Math.min(geom.points[0].y, geom.points[1].y);

    return w * h;
  }

  ngOnInit() {
    this._setupViewer();
    this._loadImages();

    this.isEditor$.subscribe(isEditor => {
      this.editorPermissions = isEditor;
    });

    this._regionService.showRegions$.pipe(distinctUntilChanged()).subscribe(showRegion => {
      if (showRegion) {
        this._renderRegions();
      } else {
        this._removeOverlays();
      }
    });

    this._regionService.highlightRegion$.subscribe(region => {
      if (region === null) {
        this._unhighlightAllRegions();
        // TODO add this.removeOverlays() ?
        return;
      }
      this._highlightRegion(region);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['resource'].isFirstChange()) {
      return;
    }
    this._loadImages();
  }

  ngOnDestroy() {
    if (this._viewer) {
      this._viewer.destroy();
      this._viewer = undefined;
    }
    if (this.imagesSub) {
      this.imagesSub.unsubscribe();
    }

    if (this.fileInfoSub) {
      this.fileInfoSub.unsubscribe();
    }
  }

  /**
   * when the draw region button is clicked, this method is called from the html. It sets the draw mode to true and
   * prevents navigation by mouse (so that the region can be accurately drawn).
   */
  drawButtonClicked(): void {
    this.regionDrawMode = !this.regionDrawMode;
    this._viewer.setMouseNavEnabled(!this.regionDrawMode);
  }

  /**
   * display message to confirm the copy of the citation link (ARK URL)
   */
  openSnackBar(message: string) {
    this._notification.openSnackBar(message);
  }

  download(url: string) {
    this._rs.downloadFile(url, this.image.fileValue.filename);
  }

  openReplaceFileDialog() {
    const propId = this.parentResource.properties[Constants.HasStillImageFileValue][0].id;

    const dialogConfig: MatDialogConfig = {
      width: '800px',
      maxHeight: '80vh',
      position: {
        top: '112px',
      },
      data: {
        mode: 'replaceFile',
        title: '2D Image (Still Image)',
        subtitle: 'Update image of the resource',
        representation: 'stillImage',
        id: propId,
      },
      disableClose: true,
    };
    const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(data => {
      if (data) {
        this._replaceFile(data);
      }
    });
  }

  openImageInNewTab(url: string) {
    window.open(url, '_blank');
  }

  private _replaceFile(file: UpdateFileValue) {
    const updateRes = new UpdateResource();
    updateRes.id = this.parentResource.id;
    updateRes.type = this.parentResource.type;
    updateRes.property = Constants.HasStillImageFileValue;
    updateRes.value = file;
    this._dspApiConnection.v2.values
      .updateValue(updateRes as UpdateResource<UpdateValue>)
      .pipe(
        mergeMap(res =>
          this._dspApiConnection.v2.values.getValue(this.parentResource.id, (res as WriteValueResponse).uuid)
        )
      )
      .subscribe(res2 => {
        this._valueOperationEventService.emit(
          new EmitEvent(
            Events.FileValueUpdated,
            new UpdatedFileEventValue((res2 as ReadResource).properties[Constants.HasStillImageFileValue][0])
          )
        );
      });
  }

  /**
   * opens the dialog to enter further properties for the region after it has been drawn and calls the function to upload the region after confirmation
   * @param startPoint the start point of the drawing
   * @param endPoint the end point of the drawing
   * @param imageSize the image size for calculations
   * @param overlay the overlay element that represents the region
   */
  private _openRegionDialog(startPoint: Point2D, endPoint: Point2D, imageSize: Point2D, overlay: Element): void {
    const dialogConfig: MatDialogConfig = {
      width: '560px',
      maxHeight: '80vh',
      position: {
        top: '112px',
      },
      data: {
        mode: 'addRegion',
        title: 'Create a region',
        subtitle: 'Add further properties',
        id: this.resourceIri,
      },
      disableClose: true,
    };
    const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(data => {
      // remove the drawn rectangle as either the cancel button was clicked or the region will be displayed
      this._viewer.removeOverlay(overlay);
      if (data) {
        // data is null if the cancel button was clicked
        this._uploadRegion(startPoint, endPoint, imageSize, data.color, data.comment, data.label);
      }
    });
  }

  /**
   * uploads the region after being prepared by the dialog
   * @param startPoint the start point of the drawing
   * @param endPoint the end point of the drawing
   * @param imageSize the image size for calculations
   * @param color the value for the color entered in the form
   * @param comment the value for the comment entered in the form
   * @param label the value for the label entered in the form
   */
  private _uploadRegion(
    startPoint: Point2D,
    endPoint: Point2D,
    imageSize: Point2D,
    color: string,
    comment: string,
    label: string
  ) {
    this._dspApiConnection.v2.res
      .createResource(this._getPayloadUploadRegion(startPoint, endPoint, imageSize, color, comment, label))
      .subscribe(res => {
        this._viewer.destroy();
        this._setupViewer();
        this._regionService.addRegion((res as ReadResource).id);
      });
  }

  private _getPayloadUploadRegion(
    startPoint: Point2D,
    endPoint: Point2D,
    imageSize: Point2D,
    color: string,
    comment: string,
    label: string
  ) {
    const x1 = Math.max(Math.min(startPoint.x, imageSize.x), 0) / imageSize.x;
    const x2 = Math.max(Math.min(endPoint.x, imageSize.x), 0) / imageSize.x;
    const y1 = Math.max(Math.min(startPoint.y, imageSize.y), 0) / imageSize.y;
    const y2 = Math.max(Math.min(endPoint.y, imageSize.y), 0) / imageSize.y;
    const geomStr = `{"status":"active","lineColor":"${color}","lineWidth":2,"points":[{"x":${x1.toString()},"y":${y1.toString()}},{"x":${x2.toString()},"y":${y2.toString()}}],"type":"rectangle"}`;
    const createResource = new CreateResource();
    createResource.label = label;
    createResource.type = Constants.Region;
    const geomVal = new CreateGeomValue();
    geomVal.type = Constants.GeomValue;
    geomVal.geometryString = geomStr;
    const colorVal = new CreateColorValue();
    colorVal.type = Constants.ColorValue;
    colorVal.color = color;
    const linkVal = new CreateLinkValue();
    linkVal.type = Constants.LinkValue;
    console.log(this);
    linkVal.linkedResourceIri = this.resourceIri;
    createResource.properties = {
      [Constants.HasColor]: [colorVal],
      [Constants.IsRegionOfValue]: [linkVal],
      [Constants.HasGeometry]: [geomVal],
    };

    createResource.attachedToProject = this.parentResource.attachedToProject;
    if (comment) {
      const commentVal = new CreateTextValueAsString();
      commentVal.type = Constants.TextValue;
      commentVal.text = comment;
      createResource.properties[Constants.HasComment] = [commentVal];
    }
    return createResource;
  }

  /**
   * set up function for the region drawer
   */
  private _addRegionDrawer() {
    // eslint-disable-next-line no-new
    new OpenSeadragon.MouseTracker({
      element: this._viewer.canvas,
      pressHandler: event => {
        if (!this.regionDrawMode) {
          return;
        }
        const overlayElement = this._renderer.createElement('div');
        overlayElement.style.background = 'rgba(255,0,0,0.3)';
        const viewportPos = this._viewer.viewport.pointFromPixel((event as OpenSeadragon.ViewerEvent).position);
        this._viewer.addOverlay(overlayElement, new OpenSeadragon.Rect(viewportPos.x, viewportPos.y, 0, 0));
        this._regionDragInfo = {
          overlayElement,
          startPos: viewportPos,
        };
      },
      dragHandler: event => {
        if (!this._regionDragInfo) {
          return;
        }
        const viewPortPos = this._viewer.viewport.pointFromPixel((event as OpenSeadragon.ViewerEvent).position);
        const diffX = viewPortPos.x - this._regionDragInfo.startPos.x;
        const diffY = viewPortPos.y - this._regionDragInfo.startPos.y;
        const location = new OpenSeadragon.Rect(
          Math.min(this._regionDragInfo.startPos.x, this._regionDragInfo.startPos.x + diffX),
          Math.min(this._regionDragInfo.startPos.y, this._regionDragInfo.startPos.y + diffY),
          Math.abs(diffX),
          Math.abs(diffY)
        );

        this._viewer.updateOverlay(this._regionDragInfo.overlayElement, location);
        this._regionDragInfo.endPos = viewPortPos;
      },
      releaseHandler: () => {
        if (this.regionDrawMode) {
          const imageSize = this._viewer.world.getItemAt(0).getContentSize();
          const startPoint = this._viewer.viewport.viewportToImageCoordinates(this._regionDragInfo.startPos);
          const endPoint = this._viewer.viewport.viewportToImageCoordinates(this._regionDragInfo.endPos);
          this._openRegionDialog(startPoint, endPoint, imageSize, this._regionDragInfo.overlayElement);
          this._regionDragInfo = null;
          this.regionDrawMode = false;
          this._viewer.setMouseNavEnabled(true);
        }
      },
    });
  }

  /**
   * highlights the polygon elements associated with the given region.
   *
   * @param regionIri the Iri of the region whose polygon elements should be highlighted..
   */
  private _highlightRegion(regionIri: string) {
    const activeRegion: HTMLElement[] = this._regions[regionIri];

    if (activeRegion !== undefined) {
      for (const pol of activeRegion) {
        pol.setAttribute('class', 'region active');
      }
    }
  }

  /**
   * unhighlights the polygon elements of all regions.
   *
   */
  private _unhighlightAllRegions() {
    for (const reg in this._regions) {
      if (reg in this._regions) {
        for (const pol of this._regions[reg]) {
          pol.setAttribute('class', 'region');
        }
      }
    }
  }

  /**
   * initializes the OpenSeadragon _viewer
   */
  private _setupViewer(): void {
    const viewerContainer = this._elementRef.nativeElement.getElementsByClassName('osd-container')[0];

    this._viewer = new OpenSeadragon.Viewer({
      element: viewerContainer,
      ...osdViewerConfig,
    });

    this._viewer.addHandler('full-screen', args => {
      if (args.fullScreen) {
        viewerContainer.classList.add('fullscreen');
      } else {
        viewerContainer.classList.remove('fullscreen');
      }
    });

    this._addRegionDrawer();
  }

  /**
   * adds all images in this.images to the _viewer.
   * Images are positioned in a horizontal row next to each other.
   */
  private _openImages(): void {
    this.failedToLoad = false;

    const fileValues: ReadFileValue[] = [this.image.fileValue]; // TODO this was this.images.

    // display only the defined range of this.images
    const tileSources: object[] = StillImageComponent._prepareTileSourcesFromFileValues(fileValues);

    this._removeOverlays();
    this._viewer.addOnceHandler('open', args => {
      // check if the current image exists
      if (this.image.fileValue.fileUrl.includes(args.source['id'])) {
        // enable mouse navigation incl. zoom
        this._viewer.setMouseNavEnabled(true);
        // enable the navigator
        this._viewer.navigator.element.style.display = 'block';
        this.loading = false;
      }
    });
    this._viewer.open(tileSources);
  }

  /**
   * prepare tile sources from the given sequence of [[ReadFileValue]].
   *
   * @param imagesToDisplay the given file values to de displayed.
   * @returns the tile sources to be passed to OSD _viewer.
   */
  private static _prepareTileSourcesFromFileValues(imagesToDisplay: ReadFileValue[]): object[] {
    const images = imagesToDisplay as ReadStillImageFileValue[];

    let imageXOffset = 0;
    const imageYOffset = 0;
    const tileSources = [];

    // let i = 0;

    for (const image of images) {
      const sipiBasePath = `${image.iiifBaseUrl}/${image.filename}`;
      const width = image.dimX;
      const height = image.dimY;
      // construct OpenSeadragon tileSources according to https://openseadragon.github.io/docs/OpenSeadragon.Viewer.html#open
      tileSources.push({
        // construct IIIF tileSource configuration according to https://iiif.io/api/image/3.0
        tileSource: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          '@context': 'http://iiif.io/api/image/3/context.json',
          id: sipiBasePath,
          height,
          width,
          profile: ['level2'],
          protocol: 'http://iiif.io/api/image',
          tiles: [
            {
              scaleFactors: [1, 2, 4, 8, 16, 32],
              width: 1024,
            },
          ],
        },
        x: imageXOffset,
        y: imageYOffset,
        preload: true,
      });

      imageXOffset++;
    }

    return tileSources;
  }

  private _createSVGOverlay(
    regionIri: string,
    geometry: RegionGeometry,
    aspectRatio: number,
    regionLabel: string,
    regionComment: string
  ): void {
    const lineColor = geometry.lineColor;
    const lineWidth = geometry.lineWidth;

    const regEle: HTMLElement = this._renderer.createElement('div');
    regEle.id = `region-overlay-${Math.random() * 10000}`;
    regEle.className = 'region';
    regEle.setAttribute('style', `outline: solid ${lineColor} ${lineWidth}px;`);

    const diffX = geometry.points[1].x - geometry.points[0].x;
    const diffY = geometry.points[1].y - geometry.points[0].y;

    const loc = new OpenSeadragon.Rect(
      Math.min(geometry.points[0].x, geometry.points[0].x + diffX),
      Math.min(geometry.points[0].y, geometry.points[0].y + diffY),
      Math.abs(diffX),
      Math.abs(diffY * aspectRatio)
    );

    loc.y *= aspectRatio;

    this._viewer
      .addOverlay({
        element: regEle,
        location: loc,
      })
      .addHandler('canvas-click', event => {
        this._regionClicked((<any>event).originalTarget.dataset.regionIri);
      });

    this._regions[regionIri].push(regEle);

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
    regEle.dataset.regionIri = regionIri;
    regEle.addEventListener('click', () => {
      this._regionClicked(regionIri);
    });
  }

  private _loadImages() {
    // closing, so no more loading of short in between images if turning
    // multiple pages
    this._viewer.close();
    if (this.imagesSub) {
      this.imagesSub.unsubscribe();
    }
    this.imagesSub = this._rs
      .getFileInfo(this.image.fileValue.fileUrl, this.image.fileValue.filename)
      .pipe(
        tap(() => {
          this._openImages();
        }),
        switchMap(() => this._regionService.showRegions$)
      )
      .subscribe(
        showRegion => {
          this._unhighlightAllRegions();
          if (showRegion) {
            this._renderRegions();
          }
        },
        () => {
          this.failedToLoad = true;
          // disable mouse navigation incl. zoom
          this._viewer.setMouseNavEnabled(false);
          // disable the navigator
          this._viewer.navigator.element.style.display = 'none';
          // disable the region draw mode
          this.regionDrawMode = false;
          // stop loading tiles
          this._viewer.removeAllHandlers('open');
          this.loading = false;
        }
      );
  }

  /**
   * adds a ROI-overlay to the viewer for every region of every image in this.images
   */
  private _renderRegions(): void {
    /**
     * sorts rectangular regions by surface, so all rectangular regions are clickable.
     * Non-rectangular regions are ignored.
     *
     * @param geom1 first region.
     * @param geom2 second region.
     */
    const sortRectangularRegion = (geom1: GeometryForRegion, geom2: GeometryForRegion) => {
      if (geom1.geometry.type === 'rectangle' && geom2.geometry.type === 'rectangle') {
        const surf1 = StillImageComponent.surfaceOfRectangularRegion(geom1.geometry);
        const surf2 = StillImageComponent.surfaceOfRectangularRegion(geom2.geometry);

        // if reg1 is smaller than reg2, return 1
        // reg1 then comes after reg2 and thus is rendered later
        if (surf1 < surf2) {
          return 1;
        } else {
          return -1;
        }
      } else {
        return 0;
      }
    };

    this._removeOverlays();

    let imageXOffset = 0; // see documentation in this.openImages() for the usage of imageXOffset

    const image = this.image;
    const stillImage = image.fileValue as ReadStillImageFileValue;
    const aspectRatio = stillImage.dimY / stillImage.dimX;

    // collect all geometries belonging to this page
    const geometries: GeometryForRegion[] = [];
    this._regionService.regions
      .map(_resource => new Region(_resource.res))
      .forEach(reg => {
        this._regions[reg.regionResource.id] = [];
        const geoms = reg.getGeometries();

        geoms.forEach(geom => {
          const geomForReg = new GeometryForRegion(geom.geometry, reg.regionResource);

          geometries.push(geomForReg);
        });
      });

    // sort all geometries belonging to this page
    geometries.sort(sortRectangularRegion);

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

      if (!this.failedToLoad) {
        this._createSVGOverlay(geom.region.id, geometry, aspectRatio, geom.region.label, commentValue);
      }

      imageXOffset++;
    }
  }

  /**
   * removes SVG overlays from the DOM.
   */
  private _removeOverlays() {
    for (const reg in this._regions) {
      if (reg in this._regions) {
        for (const pol of this._regions[reg]) {
          if (pol instanceof HTMLElement) {
            pol.remove();
          }
        }
      }
    }

    this._regions = {};

    this._viewer.clearOverlays();
  }

  private _regionClicked(regionIri: string) {
    this._regionService.highlightRegion(regionIri);
  }
}
