import { provideRouter } from '@angular/router';
import {
  Constants,
  ReadResource,
  ReadStillImageFileValue,
} from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource, generateDspResource } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { RegionService } from './representations/region.service';
import { RepresentationService } from './representations/representation.service';
import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { OpenSeaDragonService } from './representations/still-image/open-sea-dragon.service';
import { OsdDrawerService } from './representations/still-image/osd-drawer.service';
import { ResourceAnnotationComponent } from './resource-annotation.component';
import { DEFAULT_HAS_PERMISSIONS, dspApiConnectionStub, makeEntityInfo, makePropEntry, makeTextPropDef, makeTextValue, resourceFetcherServiceStub } from './resource-stories.helper';

const makeResource = (permission = 'CR'): DspResource => {
  const titlePropId = 'http://0.0.0.0:3333/ontology/0001/example/v2#hasTitle';
  const descriptionPropId = 'http://0.0.0.0:3333/ontology/0001/example/v2#hasDescription';
  const titleDef = makeTextPropDef(titlePropId, 'Title');
  const descriptionDef = makeTextPropDef(descriptionPropId, 'Description');
  const propEntries = [makePropEntry(titleDef, 0), makePropEntry(descriptionDef, 1)];

  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/1';
  res.type = 'http://api.knora.org/ontology/knora-api/v2#Region';
  res.label = 'My Storybook Annotation';
  res.attachedToProject = 'http://rdfh.ch/projects/0001';
  res.attachedToUser = 'http://rdfh.ch/users/test';
  res.userHasPermission = permission;
  res.hasPermissions = DEFAULT_HAS_PERMISSIONS;
  res.creationDate = '2024-03-15T10:30:00Z';
  res.versionArkUrl = 'ark:/99999/1/annotation';
  res.properties = {
    [titlePropId]: [makeTextValue('http://rdfh.ch/value/title-1', 'My Storybook Annotation', permission)],
    [descriptionPropId]: [makeTextValue('http://rdfh.ch/value/desc-1', 'A sample annotation for Storybook previews.', permission)],
    [Constants.HasStillImageFileValue]: [
      {
        type: Constants.StillImageFileValue,
        id: 'http://rdfh.ch/value/image-1',
        fileUrl: 'https://iiif.dev.dasch.swiss/0803/1awyJYmiA5Z-FQ9xDcEh2Hi.jp2/full/1333,1815/0/default.jpg',
        iiifBaseUrl: 'https://iiif.dev.dasch.swiss/0803',
        filename: '1awyJYmiA5Z-FQ9xDcEh2Hi.jp2',
        dimX: 1333,
        dimY: 1815,
        userHasPermission: permission,
      } as unknown as ReadStillImageFileValue,
    ],
  };
  res.entityInfo = makeEntityInfo(res.type, propEntries, 'Region');
  return generateDspResource(res);
};

const osdServiceStub = {
  viewer: {
    open: () => {},
    destroy: () => {},
    loadTilesWithAjax: false,
    addHandler: () => {},
    removeHandler: () => {},
  },
  onInit: () => {},
  drawing: false,
  toggleDrawing: () => {},
  zoom: () => {},
  createdRectangle$: of(),
};

const osdDrawerServiceStub = {
  onInit: () => {},
  update: () => {},
};

const meta: Meta<ResourceAnnotationComponent> = {
  title: 'Resource Editor / Resource / Annotation',
  component: ResourceAnnotationComponent,
  decorators: [
    moduleMetadata({
      providers: [
        { provide: OpenSeaDragonService, useValue: osdServiceStub },
        { provide: OsdDrawerService, useValue: osdDrawerServiceStub },
      ],
    }),
    applicationConfig({
      providers: [
        provideRouter([{ path: '**', redirectTo: '' }]),
        {
          provide: AppConfigService,
          useValue: { dspApiConfig: { apiUrl: '' }, dspAppConfig: { iriBase: 'http://rdfh.ch' } },
        },
        {
          provide: ProjectApiService,
          useValue: { get: () => of({ project: { id: '', shortcode: '0001', shortname: 'test', longname: 'Test' } }) },
        },
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceStub() },
        { provide: DspApiConnectionToken, useValue: dspApiConnectionStub },
        {
          provide: RegionService,
          useValue: {
            regions$: of([]),
            regionsLoading$: of(false),
            showRegions$: of(false),
            selectedRegion$: of(null),
            highlightedRegionClicked$: of(null),
            initialize: () => {},
            showRegions: () => {},
            selectRegion: () => {},
            setHighlightedRegionClicked: () => {},
            filterToRegion: () => {},
            updateRegions: () => {},
          },
        },
        {
          provide: RepresentationService,
          useValue: {
            downloadProjectFile: () => {},
            getFileInfo: () => of({ originalFilename: 'image.jp2' }),
            getIngestOriginalUrl: () => of(''),
          },
        },
        { provide: NotificationService, useValue: { openSnackBar: () => {} } },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The annotation resource to display.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceAnnotationComponent>;

export const Editable: Story = {
  name: 'Shows annotation resource with header and properties tab when user can edit (CR permission)',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Resource header is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-header')).not.toBeNull();
    });
    await step('Tab group is rendered', async () => {
      await expect(canvasElement.querySelector('mat-tab-group')).not.toBeNull();
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
