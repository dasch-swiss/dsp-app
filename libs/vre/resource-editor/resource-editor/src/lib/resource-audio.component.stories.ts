import { provideRouter } from '@angular/router';
import { Constants, ReadAudioFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource, generateDspResource } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { of, Subject } from 'rxjs';
import { expect } from 'storybook/test';

import { RepresentationService } from './representations/representation.service';
import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { ResourceAudioComponent } from './resource-audio.component';
import {
  DEFAULT_HAS_PERMISSIONS,
  addDescriptionToResource,
  dspApiConnectionStub,
  resourceFetcherServiceStub,
} from './resource-stories.helper';
import { SegmentsService } from './segment-support/segments.service';

const makeResource = (permission = 'CR'): DspResource => {
  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/1';
  res.type = 'http://api.dasch.swiss/ontology/knora-api/v2#AudioRepresentation';
  res.label = 'My Storybook Audio';
  res.attachedToProject = 'http://rdfh.ch/projects/0001';
  res.attachedToUser = 'http://rdfh.ch/users/test';
  res.userHasPermission = permission;
  res.hasPermissions = DEFAULT_HAS_PERMISSIONS;
  res.creationDate = '2024-03-15T10:30:00Z';
  res.properties = {
    [Constants.HasAudioFileValue]: [
      {
        type: Constants.AudioFileValue,
        id: 'http://rdfh.ch/value/audio-1',
        fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        filename: 'audio.mp3',
        userHasPermission: 'RV',
      } as unknown as ReadAudioFileValue,
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

const meta: Meta<ResourceAudioComponent> = {
  title: 'Resource Editor / Resource / Audio',
  component: ResourceAudioComponent,
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
          useValue: { get: () => of({ project: { id: '', shortcode: '0001', shortname: 'test', longname: 'Test' } }) },
        },
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceStub() },
        {
          provide: RepresentationService,
          useValue: { getFileInfo: () => of({ originalFilename: 'audio.mp3' }), downloadProjectFile: () => {} },
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
      description: 'The audio resource to display.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceAudioComponent>;

export const Editable: Story = {
  name: 'Shows audio resource with header, legal info, player and media tabs when user can edit (CR permission)',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Resource header is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-header')).not.toBeNull();
    });
    await step('Audio player is rendered', async () => {
      await expect(canvasElement.querySelector('app-audio')).not.toBeNull();
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
