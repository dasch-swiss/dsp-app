import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
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
  ReadGeomValue,
  ReadResource,
  ReadStillImageFileValue,
  RegionGeometry,
  UpdateFileValue,
  UpdateResource,
  UpdateValue,
  WriteValueResponse,
} from '@dasch-swiss/dsp-js';
import { DspCompoundPosition } from '@dasch-swiss/vre/shared/app-common';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import * as OpenSeadragon from 'openseadragon';
import { Subscription } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { DialogComponent } from '../../../../main/dialog/dialog.component';
import {
  EmitEvent,
  Events,
  UpdatedFileEventValue,
  ValueOperationEventService,
} from '../../services/value-operation-event.service';
import { FileRepresentation } from '../file-representation';
import { RepresentationService } from '../representation.service';

/**
 * represents a region resource.
 */
export class Region {
  /**
   *
   * @param regionResource a resource of type Region
   */
  constructor(readonly regionResource: ReadResource) {}

  /**
   * get all geometry information belonging to this region.
   *
   */
  getGeometries() {
    return this.regionResource.properties[Constants.HasGeometry] as ReadGeomValue[];
  }
}

/**
 * represents a still image file value including its regions.
 */
export class StillImageRepresentation {
  /**
   *
   * @param stillImageFileValue a [[ReadStillImageFileValue]] representing an image.
   * @param regions the regions belonging to the image.
   */
  constructor(
    readonly stillImageFileValue: ReadStillImageFileValue,
    readonly regions: Region[]
  ) {}
}

/**
 * represents a geometry belonging to a specific region resource.
 */
export class GeometryForRegion {
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-still-image',
  templateUrl: './still-image.component.html',
  styleUrls: ['./still-image.component.scss'],
})
export class StillImageComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() images: FileRepresentation[];
  @Input() imageCaption?: string;
  @Input() resourceIri: string;
  @Input() project: string;
  @Input() activateRegion?: string; // highlight a region
  @Input() compoundNavigation?: DspCompoundPosition;
  @Input() currentTab: string;
  @Input() parentResource: ReadResource;
  @Input() editorPermissions: boolean;

  @Output() goToPage = new EventEmitter<number>();

  @Output() regionClicked = new EventEmitter<string>();

  @Output() regionAdded = new EventEmitter<string>();

  @Output() loaded = new EventEmitter<boolean>();

  imagesSub: Subscription;
  fileInfoSub: Subscription;

  loading = true;
  failedToLoad = false;
  originalFilename: string;

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
    private _valueOperationEventService: ValueOperationEventService
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

  ngOnChanges(changes: SimpleChanges) {
    if (changes.images && changes.images.isFirstChange()) {
      this._setupViewer();
      this.loadImages();
    }
    // only if the image changed
    if (
      changes.images &&
      changes.images.previousValue &&
      changes.images.currentValue &&
      changes.images.currentValue[0].fileValue.fileUrl !== changes.images.previousValue[0].fileValue.fileUrl
    ) {
      this.loadImages();
    }

    if (this.currentTab === 'annotations') {
      this.renderRegions();
    }
    if (this.activateRegion !== undefined) {
      this._highlightRegion(this.activateRegion);
    }
    if (changes.activateRegion) {
      this._unhighlightAllRegions();
    }
  }

  ngAfterViewInit() {
    this.loaded.emit(true);
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

  private loadImages() {
    // closing, so no more loading of short in between images if turning
    // multiple pages
    this._viewer.close();
    if (this.imagesSub) {
      this.imagesSub.unsubscribe();
    }
    this.imagesSub = this._rs
      .getFileInfo(this.images[0].fileValue.fileUrl, this.images[0].fileValue.filename)
      .subscribe(
        (res: { originalFilename: string }) => {
          this.originalFilename = res.originalFilename;
          this._openImages();
          this._unhighlightAllRegions();
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
   * renders all regions to be found in [[this.images]].
   * (Although this.images is an Angular Input property, the built-in change detection of Angular does not detect changes in complex objects or arrays, only reassignment of objects/arrays.
   * Use this method if additional regions were added to the resources.images)
   */
  updateRegions() {
    if (!this._viewer) {
      this._setupViewer();
    }
    this.renderRegions();
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
   * adds a ROI-overlay to the viewer for every region of every image in this.images
   */
  renderRegions(): void {
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

    this.removeOverlays();

    let imageXOffset = 0; // see documentation in this.openImages() for the usage of imageXOffset

    for (const image of this.images) {
      const stillImage = image.fileValue as ReadStillImageFileValue;
      const aspectRatio = stillImage.dimY / stillImage.dimX;

      // collect all geometries belonging to this page
      const geometries: GeometryForRegion[] = [];
      image.annotations.forEach(reg => {
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
          this._createSVGOverlay(geom.region.id, geometry, aspectRatio, imageXOffset, geom.region.label, commentValue);
        }

        imageXOffset++;
      }
    }
  }

  /**
   * removes SVG overlays from the DOM.
   */
  removeOverlays() {
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

  /**
   * display message to confirm the copy of the citation link (ARK URL)
   */
  openSnackBar(message: string) {
    this._notification.openSnackBar(message);
  }

  download(url: string) {
    this._rs.downloadFile(url, this.images[0].fileValue.filename);
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

  openPage(p: number) {
    this.regionDrawMode = false;
    this.goToPage.emit(p);
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
        mergeMap((res: WriteValueResponse) =>
          this._dspApiConnection.v2.values.getValue(this.parentResource.id, res.uuid)
        )
      )
      .subscribe((res2: ReadResource) => {
        this._valueOperationEventService.emit(
          new EmitEvent(
            Events.FileValueUpdated,
            new UpdatedFileEventValue(res2.properties[Constants.HasStillImageFileValue][0])
          )
        );

        this._rs
          .getFileInfo(this.images[0].fileValue.fileUrl, this.images[0].fileValue.filename)
          .subscribe((res: { originalFilename: string }) => {
            this.originalFilename = res.originalFilename;
          });
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
    const x1 = Math.max(Math.min(startPoint.x, imageSize.x), 0) / imageSize.x;
    const x2 = Math.max(Math.min(endPoint.x, imageSize.x), 0) / imageSize.x;
    const y1 = Math.max(Math.min(startPoint.y, imageSize.y), 0) / imageSize.y;
    const y2 = Math.max(Math.min(endPoint.y, imageSize.y), 0) / imageSize.y;
    const geomStr = `{"status":"active","lineColor":"${color}","lineWidth":2,"points":[{"x":${x1.toString()},"y":${y1.toString()}},{"x":${x2.toString()},"y":${y2.toString()}}],"type":"rectangle"}`;
    const createResource = new CreateResource();
    createResource.label = label;
    createResource.type = Constants.Region;
    createResource.attachedToProject = this.project;
    const geomVal = new CreateGeomValue();
    geomVal.type = Constants.GeomValue;
    geomVal.geometryString = geomStr;
    const colorVal = new CreateColorValue();
    colorVal.type = Constants.ColorValue;
    colorVal.color = color;
    const linkVal = new CreateLinkValue();
    linkVal.type = Constants.LinkValue;
    linkVal.linkedResourceIri = this.resourceIri;
    createResource.properties = {
      [Constants.HasColor]: [colorVal],
      [Constants.IsRegionOfValue]: [linkVal],
      [Constants.HasGeometry]: [geomVal],
    };
    if (comment) {
      const commentVal = new CreateTextValueAsString();
      commentVal.type = Constants.TextValue;
      commentVal.text = comment;
      createResource.properties[Constants.HasComment] = [commentVal];
    }

    this._dspApiConnection.v2.res.createResource(createResource).subscribe((res: ReadResource) => {
      this._viewer.destroy();
      this._setupViewer();
      this.loadImages();
      this.regionAdded.emit(res.id);
    });
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
  private _highlightRegion(regionIri) {
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
    const osdOptions = {
      element: viewerContainer,
      sequenceMode: false,
      showReferenceStrip: true,
      zoomInButton: 'DSP_OSD_ZOOM_IN',
      zoomOutButton: 'DSP_OSD_ZOOM_OUT',
      previousButton: 'DSP_OSD_PREV_PAGE',
      nextButton: 'DSP_OSD_NEXT_PAGE',
      homeButton: 'DSP_OSD_HOME',
      fullPageButton: 'DSP_OSD_FULL_PAGE',
      // rotateLeftButton: 'DSP_OSD_ROTATE_LEFT',        // doesn't work yet
      // rotateRightButton: 'DSP_OSD_ROTATE_RIGHT',       // doesn't work yet
      showNavigator: true,
      navigatorPosition: 'ABSOLUTE' as const,
      navigatorTop: 'calc(100% - 136px)',
      navigatorLeft: 'calc(100% - 136px)',
      navigatorHeight: '120px',
      navigatorWidth: '120px',
      gestureSettingsMouse: {
        clickToZoom: false, // do not zoom in on click
        dblClickToZoom: true, // but zoom on double click
        flickEnabled: true, // perform a flick gesture to drag image
        animationTime: 0.1, // direct and instant drag performance
      },
      visibilityRatio: 1.0, // viewers focus limited to the image borders; no more cutting the image on zooming out
    };
    this._viewer = new OpenSeadragon.Viewer(osdOptions);

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
    // imageXOffset controls the x coordinate of the left side of each image in the OpenSeadragon viewport coordinate system.
    // the first image has its left side at x = 0, and all images are scaled to have a width of 1 in viewport coordinates.
    // see also: https://openseadragon.github.io/examples/viewport-coordinates/

    // reset the status
    this.failedToLoad = false;

    const fileValues: ReadFileValue[] = this.images.map(img => img.fileValue);

    // display only the defined range of this.images
    const tileSources: object[] = this._prepareTileSourcesFromFileValues(fileValues);

    this.removeOverlays();
    this._viewer.addOnceHandler('open', args => {
      // check if the current image exists
      if (this.images[0].fileValue.fileUrl.includes(args.source['@id'])) {
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
  private _prepareTileSourcesFromFileValues(imagesToDisplay: ReadFileValue[]): object[] {
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

  /**
   * creates and adds a ROI-overlay to the viewer
   * @param regionIri the Iri of the region.
   * @param geometry - the geometry describing the ROI
   * @param aspectRatio -  the aspectRatio (h/w) of the image on which the geometry should be placed
   * @param xOffset -  the x-offset in Openseadragon viewport coordinates of the image on which the geometry should be placed
   * @param regionLabel -  the label of the region
   * @param regionComment - the comment of the region
   */
  private _createSVGOverlay(
    regionIri: string,
    geometry: RegionGeometry,
    aspectRatio: number,
    xOffset: number,
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
        this.regionClicked.emit((<any>event).originalTarget.dataset.regionIri);
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
      this.regionClicked.emit(regionIri);
    });
  }
}
