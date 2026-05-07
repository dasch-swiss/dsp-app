import { provideRouter } from '@angular/router';
import {
  Constants,
  ReadColorValue,
  ReadGeomValue,
  ReadResource,
  ReadStillImageFileValue,
  RegionGeometry,
} from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource, generateDspResource } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { RegionService } from '../../representation/region.service';
import { RepresentationService } from '../../representation/representation.service';
import { ResourceFetcherService } from '../../representation/resource-fetcher.service';
import { ResourceImageComponent } from './resource-image.component';
import {
  addDescriptionToResource,
  DEFAULT_HAS_PERMISSIONS,
  dspApiConnectionStub,
  resourceFetcherServiceStub,
} from '../../resource-stories.helper';

const makeResource = (permission = 'CR'): DspResource => {
  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/1';
  res.type = 'http://api.dasch.swiss/ontology/knora-api/v2#StillImageRepresentation';
  res.label = 'My Storybook Image';
  res.attachedToProject = 'http://rdfh.ch/projects/0803';
  res.attachedToUser = 'http://rdfh.ch/users/test';
  res.userHasPermission = permission;
  res.hasPermissions = DEFAULT_HAS_PERMISSIONS;
  res.creationDate = '2024-03-15T10:30:00Z';
  res.properties = {
    [Constants.HasStillImageFileValue]: [
      {
        type: Constants.StillImageFileValue,
        id: 'http://rdfh.ch/value/image-1',
        fileUrl: 'https://iiif.dev.dasch.swiss/0803/1awyJYmiA5Z-FQ9xDcEh2Hi.jp2/full/1333,1815/0/default.jpg',
        iiifBaseUrl: 'https://iiif.dev.dasch.swiss/0803',
        filename: '1awyJYmiA5Z-FQ9xDcEh2Hi.jp2',
        dimX: 1333,
        dimY: 1815,
        userHasPermission: 'RV',
      } as unknown as ReadStillImageFileValue,
    ],
  };
  return generateDspResource(addDescriptionToResource(res, permission));
};

const makeGeomValue = (id: string, type: 'rectangle' | 'circle', lineColor: string): ReadGeomValue =>
  ({
    id,
    type: Constants.GeomValue,
    userHasPermission: 'RV',
    geometry: new RegionGeometry(
      'active',
      lineColor,
      2,
      type === 'rectangle'
        ? [
            { x: 0.1, y: 0.1 },
            { x: 0.4, y: 0.4 },
          ]
        : [{ x: 0.6, y: 0.3 }],
      type,
      type === 'circle' ? { x: 0.1, y: 0.1 } : undefined
    ),
  }) as unknown as ReadGeomValue;

const makeColorValue = (id: string, color: string): ReadColorValue =>
  ({ id, type: Constants.ColorValue, userHasPermission: 'RV', color }) as unknown as ReadColorValue;

const makeRegion = (id: string, label: string, geomType: 'rectangle' | 'circle', color: string): DspResource => {
  const res = {
    id,
    type: Constants.Region,
    label,
    attachedToProject: 'http://rdfh.ch/projects/0803',
    attachedToUser: 'http://rdfh.ch/users/test',
    userHasPermission: 'CR',
    hasPermissions: 'CR knora-admin:Creator',
    properties: {
      [Constants.HasGeometry]: [makeGeomValue(`${id}/geom`, geomType, color)],
      [Constants.HasColor]: [makeColorValue(`${id}/color`, color)],
    },
    entityInfo: {
      classes: {
        [Constants.Region]: {
          label: 'Region',
          getResourcePropertiesList: () => [],
        },
      },
      getPropertyDefinitionsByType: () => [],
    },
    getValues: () => [],
    getValuesAs: () => [],
  } as unknown as ReadResource;
  return new DspResource(res);
};

const REGIONS = [
  makeRegion('http://rdfh.ch/region/1', 'Region A', 'rectangle', '#ff3333'),
  makeRegion('http://rdfh.ch/region/2', 'Region B', 'circle', '#33aaff'),
];

const regionServiceStub = (regions: DspResource[] = [], showRegions = false) => ({
  regions$: of(regions),
  regionsLoading$: of(false),
  showRegions$: of(showRegions),
  selectedRegion$: of(null),
  highlightedRegionClicked$: of(null),
  initialize: () => {},
  showRegions: () => {},
  selectRegion: () => {},
  setHighlightedRegionClicked: () => {},
  filterToRegion: () => {},
  updateRegions: () => {},
});

const meta: Meta<ResourceImageComponent> = {
  title: 'Resource Editor / Resource / Still Image',
  component: ResourceImageComponent,
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([{ path: '**', redirectTo: '' }]),
        {
          provide: AppConfigService,
          useValue: { dspApiConfig: { apiUrl: '' }, dspAppConfig: { iriBase: 'http://rdfh.ch' } },
        },
        {
          provide: ProjectApiService,
          useValue: {
            get: () =>
              of({ project: { id: '', shortcode: '0803', shortname: 'example', longname: 'My Storybook Project' } }),
          },
        },
        { provide: RegionService, useValue: regionServiceStub() },
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceStub('0803') },
        {
          provide: RepresentationService,
          useValue: { getFileInfo: () => of({ originalFilename: 'image.jpx' }), downloadProjectFile: () => {} },
        },
        { provide: NotificationService, useValue: { openSnackBar: () => {} } },
        {
          provide: AdminAPIApiService,
          useValue: { getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: () => of({ data: [] }) },
        },
        { provide: DspApiConnectionToken, useValue: dspApiConnectionStub },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The image resource to display.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
    annotationIri: {
      description: 'Optional IRI of an annotation to highlight on load.',
      table: { type: { summary: 'string | null' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceImageComponent>;

export const Editable: Story = {
  name: 'Shows image resource with header, legal info, viewer and image tabs when user can edit (CR permission)',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Resource header is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-header')).not.toBeNull();
    });
    await step('Still image viewer is rendered', async () => {
      await expect(canvasElement.querySelector('app-still-image')).not.toBeNull();
    });
  },
};

export const WithAnnotations: Story = {
  name: 'Shows regions drawn over the image when annotations are present',
  args: {
    resource: makeResource(),
    annotationIri: 'http://rdfh.ch/region/1',
  },
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              search: {
                ...dspApiConnectionStub.v2.search,
                doSearchIncomingRegions: () => of({ resources: REGIONS.map(r => r.res), mayHaveMoreResults: false }),
              },
            },
          },
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Still image viewer is rendered', async () => {
      await expect(canvasElement.querySelector('app-still-image')).not.toBeNull();
    });
  },
};

export const ReadOnly: Story = {
  name: 'Shows restriction banner when user has read-only permission (RV)',
  args: { resource: makeResource('RV') },
  play: async ({ canvasElement, step }) => {
    await step('Restriction banner is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-restriction')).not.toBeNull();
    });
  },
};
