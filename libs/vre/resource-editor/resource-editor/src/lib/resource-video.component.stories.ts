import { provideRouter } from '@angular/router';
import { Constants, ReadMovingImageFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { of, Subject } from 'rxjs';
import { expect } from 'storybook/test';

import { RepresentationService } from './representations/representation.service';
import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { ResourceVideoComponent } from './resource-video.component';
import { DEFAULT_HAS_PERMISSIONS, resourceFetcherServiceStub } from './resource-stories.helper';
import { SegmentsService } from './segment-support/segments.service';

const makeResource = (permission = 'CR'): DspResource =>
  new DspResource({
    id: 'http://rdfh.ch/resource/1',
    type: 'http://api.dasch.swiss/ontology/knora-api/v2#MovingImageRepresentation',
    label: 'My Storybook Video',
    attachedToProject: 'http://rdfh.ch/projects/0869',
    attachedToUser: 'http://rdfh.ch/users/test',
    userHasPermission: permission,
    hasPermissions: DEFAULT_HAS_PERMISSIONS,
    creationDate: '2024-03-15T10:30:00Z',
    properties: {
      [Constants.HasMovingImageFileValue]: [
        {
          type: Constants.MovingImageFileValue,
          id: 'http://rdfh.ch/value/video-1',
          fileUrl: 'https://iiif.stage.dasch.swiss:443/0869/3xUzuLcE9nC-MjBgXRjjsos.mp4/file',
          filename: 'video.mp4',
          userHasPermission: 'RV',
        } as unknown as ReadMovingImageFileValue,
      ],
    },
    entityInfo: { classes: { 'http://api.dasch.swiss/ontology/knora-api/v2#MovingImageRepresentation': { label: 'Moving Image Representation' } }, getPropertyDefinitionsByType: () => [] },
  } as unknown as ReadResource);

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
          useValue: { get: () => of({ project: { id: '', shortcode: '0869', shortname: 'example', longname: 'My Storybook Project' } }) },
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
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              search: { doSearchIncomingLinks: () => of({ resources: [], mayHaveMoreResults: false }) },
            },
          },
        },
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

export const DefaultView: Story = {
  name: 'Shows video resource with header, legal info, player and media tabs',
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

export const RestrictedView: Story = {
  name: 'Shows restriction banner when user has only restricted view permission',
  args: { resource: makeResource('RV') },
  play: async ({ canvasElement, step }) => {
    await step('Restriction banner is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-restriction')).not.toBeNull();
    });
  },
};
