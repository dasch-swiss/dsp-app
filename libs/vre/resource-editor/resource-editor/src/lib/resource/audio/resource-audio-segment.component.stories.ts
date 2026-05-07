import { provideRouter } from '@angular/router';
import { Constants, ReadAudioFileValue, ReadIntervalValue, ReadLinkValue, ReadResource } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource, generateDspResource } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { of, Subject } from 'rxjs';
import { expect } from 'storybook/test';

import { RepresentationService } from '../../representation/representation.service';
import { ResourceFetcherService } from '../../representation/resource-fetcher.service';
import { ResourceAudioSegmentComponent } from './resource-audio-segment.component';
import {
  addDescriptionToResource,
  DEFAULT_HAS_PERMISSIONS,
  makeEntityInfo,
  makePropEntry,
  makeTextPropDef,
  makeTextValue,
  resourceFetcherServiceStub,
} from '../../resource-stories.helper';
import { SegmentsService } from '../../representation/segments/segments.service';

const AUDIO_IRI = 'http://rdfh.ch/resource/audio-1';
const IS_AUDIO_SEGMENT_OF_VALUE = 'http://api.knora.org/ontology/knora-api/v2#isAudioSegmentOfValue';
const HAS_SEGMENT_BOUNDS = 'http://api.knora.org/ontology/knora-api/v2#hasSegmentBounds';

const makeAudioResource = (): ReadResource =>
  ({
    id: AUDIO_IRI,
    attachedToProject: 'http://rdfh.ch/projects/0001',
    attachedToUser: 'http://rdfh.ch/users/test',
    userHasPermission: 'CR',
    properties: {
      [Constants.HasAudioFileValue]: [
        {
          type: Constants.AudioFileValue,
          id: 'http://rdfh.ch/value/audio-1',
          fileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          filename: 'audio.mp3',
          userHasPermission: 'CR',
        } as unknown as ReadAudioFileValue,
      ],
    },
  }) as unknown as ReadResource;

const makeResource = (permission = 'CR'): DspResource => {
  const titlePropId = 'http://0.0.0.0:3333/ontology/0001/example/v2#hasTitle';
  const titleDef = makeTextPropDef(titlePropId, 'Title');
  const propEntries = [makePropEntry(titleDef, 0)];

  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/audio-segment-1';
  res.type = 'http://api.knora.org/ontology/knora-api/v2#AudioSegment';
  res.label = 'My Storybook Audio Segment';
  res.attachedToProject = 'http://rdfh.ch/projects/0001';
  res.attachedToUser = 'http://rdfh.ch/users/test';
  res.userHasPermission = permission;
  res.hasPermissions = DEFAULT_HAS_PERMISSIONS;
  res.creationDate = '2024-03-15T10:30:00Z';
  res.versionArkUrl = 'ark:/99999/1/audio-segment';
  res.properties = {
    [titlePropId]: [makeTextValue('http://rdfh.ch/value/title-1', 'First verse', permission)],
    [IS_AUDIO_SEGMENT_OF_VALUE]: [{ linkedResourceIri: AUDIO_IRI } as unknown as ReadLinkValue],
    [HAS_SEGMENT_BOUNDS]: [{ start: 5, end: 20 } as unknown as ReadIntervalValue],
  };
  res.entityInfo = makeEntityInfo(res.type, propEntries, 'AudioSegment');
  return generateDspResource(addDescriptionToResource(res, permission));
};

const segmentsServiceStub: Partial<SegmentsService> = {
  segments: [],
  onInit: () => {},
  playSegment$: new Subject<any>().asObservable(),
  highlightSegment$: new Subject<any>().asObservable(),
};

const meta: Meta<ResourceAudioSegmentComponent> = {
  title: 'Resource Editor / Resource / Audio Segment',
  component: ResourceAudioSegmentComponent,
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
            get: () => of({ project: { id: '', shortcode: '0001', shortname: 'test', longname: 'Test' } }),
          },
        },
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceStub() },
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              res: { getResource: () => of(makeAudioResource()) },
              search: {
                doSearchIncomingLinks: () => of({ resources: [], mayHaveMoreResults: false }),
                doExtendedSearch: () => of({ resources: [], mayHaveMoreResults: false }),
                doSearchIncomingRegions: () => of({ resources: [], mayHaveMoreResults: false }),
              },
            },
          },
        },
        {
          provide: RepresentationService,
          useValue: { getFileInfo: () => of({ originalFilename: 'audio.mp3' }), downloadProjectFile: () => {} },
        },
        { provide: NotificationService, useValue: { openSnackBar: () => {} } },
        {
          provide: AdminAPIApiService,
          useValue: { getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: () => of({ data: [] }) },
        },
      ],
    }),
    moduleMetadata({
      providers: [{ provide: SegmentsService, useFactory: () => segmentsServiceStub }],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The audio segment resource to display.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceAudioSegmentComponent>;

export const Editable: Story = {
  name: 'Shows audio segment with header, audio player at start time and properties tab when user can edit (CR permission)',
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
