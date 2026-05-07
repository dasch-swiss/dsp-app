import { provideRouter } from '@angular/router';
import { Constants, ReadMovingImageFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource, generateDspResource } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { of, Subject } from 'rxjs';
import { expect } from 'storybook/test';

import { RepresentationService } from './representation/representation.service';
import { ResourceFetcherService } from './representation/resource-fetcher.service';
import {
  addDescriptionToResource,
  DEFAULT_HAS_PERMISSIONS,
  dspApiConnectionStub,
  resourceFetcherServiceStub,
} from './resource-stories.helper';
import { ResourceVideoComponent } from './resource-video.component';
import { SegmentsService } from './representation/segments/segments.service';

const makeResource = (permission = 'CR'): DspResource => {
  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/1';
  res.type = 'http://api.dasch.swiss/ontology/knora-api/v2#MovingImageRepresentation';
  res.label = 'My Storybook Video';
  res.attachedToProject = 'http://rdfh.ch/projects/0869';
  res.attachedToUser = 'http://rdfh.ch/users/test';
  res.userHasPermission = permission;
  res.hasPermissions = DEFAULT_HAS_PERMISSIONS;
  res.creationDate = '2024-03-15T10:30:00Z';
  res.properties = {
    [Constants.HasMovingImageFileValue]: [
      {
        type: Constants.MovingImageFileValue,
        id: 'http://rdfh.ch/value/video-1',
        fileUrl: 'https://iiif.stage.dasch.swiss:443/0869/3xUzuLcE9nC-MjBgXRjjsos.mp4/file',
        filename: 'video.mp4',
        userHasPermission: 'RV',
      } as unknown as ReadMovingImageFileValue,
    ],
  };
  return generateDspResource(addDescriptionToResource(res, permission));
};

const segmentsServiceStub: Partial<SegmentsService> = {
  segments: [],
  onInit: () => {},
  playSegment$: new Subject<any>().asObservable(),
  highlightSegment$: new Subject<any>().asObservable(),
};

const meta: Meta<ResourceVideoComponent> = {
  title: 'Resource Editor / Resource / Video',
  component: ResourceVideoComponent,
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
              of({ project: { id: '', shortcode: '0869', shortname: 'example', longname: 'My Storybook Project' } }),
          },
        },
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceStub('0869') },
        {
          provide: RepresentationService,
          useValue: { getFileInfo: () => of({ originalFilename: 'video.mp4' }), downloadProjectFile: () => {} },
        },
        { provide: NotificationService, useValue: { openSnackBar: () => {} } },
        {
          provide: AdminAPIApiService,
          useValue: { getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: () => of({ data: [] }) },
        },
        { provide: DspApiConnectionToken, useValue: dspApiConnectionStub },
      ],
    }),
    moduleMetadata({
      providers: [{ provide: SegmentsService, useFactory: () => segmentsServiceStub }],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The video resource to display.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceVideoComponent>;

export const Editable: Story = {
  name: 'Shows video resource with header, legal info, player and media tabs when user can edit (CR permission)',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Resource header is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-header')).not.toBeNull();
    });
    await step('Video player is rendered', async () => {
      await expect(canvasElement.querySelector('app-video')).not.toBeNull();
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
