import {
  Constants,
  CreateColorValue,
  CreateGeomValue,
  CreateLinkValue,
  CreateResource,
  CreateTextValueAsString,
  Point2D,
  ReadFileValue,
  ReadStillImageFileValue,
  RegionGeometry,
} from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { Region } from '../region';
import { GeometryForRegion } from './geometry-for-region';
import { PolygonsForRegion } from './still-image.component';

export class StillImageHelper {
  static getPayloadUploadRegion(
    resourceIri: string,
    attachedProject: string,
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
    linkVal.linkedResourceIri = resourceIri;
    createResource.properties = {
      [Constants.HasColor]: [colorVal],
      [Constants.IsRegionOfValue]: [linkVal],
      [Constants.HasGeometry]: [geomVal],
    };

    createResource.attachedToProject = attachedProject;
    if (comment) {
      const commentVal = new CreateTextValueAsString();
      commentVal.type = Constants.TextValue;
      commentVal.text = comment;
      createResource.properties[Constants.HasComment] = [commentVal];
    }
    return createResource;
  }

  static prepareTileSourcesFromFileValues(imagesToDisplay: ReadFileValue[], pngFormat = false): object[] {
    const images = imagesToDisplay as ReadStillImageFileValue[];

    let imageXOffset = 0;
    const imageYOffset = 0;
    const tileSources = [];

    // let i = 0;

    for (const image of images) {
      const sipiBasePath = `${image.iiifBaseUrl}/${image.filename}`;
      const width = image.dimX;
      const height = image.dimY;
      let tileSource = {
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
      } as any;

      if (pngFormat) {
        tileSource = { ...tileSource, preferredFormats: ['png'] };
      }

      // construct OpenSeadragon tileSources according to https://openseadragon.github.io/docs/OpenSeadragon.Viewer.html#open
      tileSources.push({
        // construct IIIF tileSource configuration according to https://iiif.io/api/image/3.0
        tileSource,
        x: imageXOffset,
        y: imageYOffset,
        preload: true,
      });

      imageXOffset++;
    }

    return tileSources;
  }

  static sortRectangularRegion = (geom1: GeometryForRegion, geom2: GeometryForRegion) => {
    if (geom1.geometry.type === 'rectangle' && geom2.geometry.type === 'rectangle') {
      const surf1 = this.surfaceOfRectangularRegion(geom1.geometry);
      const surf2 = this.surfaceOfRectangularRegion(geom2.geometry);

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

  static collectAndSortGeometries(regions: DspResource[], regionsMap: PolygonsForRegion): GeometryForRegion[] {
    const geometries: GeometryForRegion[] = [];

    regions
      .map(_resource => new Region(_resource.res))
      .forEach(reg => {
        regionsMap[reg.regionResource.id] = [];
        const geoms = reg.getGeometries();

        geoms.forEach(geom => {
          const geomForReg = new GeometryForRegion(geom.geometry, reg.regionResource);
          geometries.push(geomForReg);
        });
      });

    // sort all geometries belonging to this page
    geometries.sort(StillImageHelper.sortRectangularRegion);

    return geometries;
  }

  private static surfaceOfRectangularRegion(geom: RegionGeometry): number {
    if (geom.type !== 'rectangle') {
      return 0;
    }

    const w = Math.max(geom.points[0].x, geom.points[1].x) - Math.min(geom.points[0].x, geom.points[1].x);
    const h = Math.max(geom.points[0].y, geom.points[1].y) - Math.min(geom.points[0].y, geom.points[1].y);

    return w * h;
  }
}
