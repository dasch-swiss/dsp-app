import { provideRouter } from '@angular/router';
import {
  Constants,
  ReadIntervalValue,
  ReadLinkValue,
  ReadMovingImageFileValue,
  ReadResource,
} from '@dasch-swiss/dsp-js';
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
import {
  addDescriptionToResource,
  DEFAULT_HAS_PERMISSIONS,
  makeEntityInfo,
  makePropEntry,
  makeTextPropDef,
  makeTextValue,
  resourceFetcherServiceStub,
} from './resource-stories.helper';
import { ResourceVideoSegmentComponent } from './resource-video-segment.component';
import { SegmentsService } from './segment-support/segments.service';

const VIDEO_IRI = 'http://rdfh.ch/resource/video-1';
const IS_VIDEO_SEGMENT_OF_VALUE = 'http://api.knora.org/ontology/knora-api/v2#isVideoSegmentOfValue';
const HAS_SEGMENT_BOUNDS = 'http://api.knora.org/ontology/knora-api/v2#hasSegmentBounds';

const makeVideoResource = (): ReadResource =>
  ({
    id: VIDEO_IRI,
    attachedToProject: 'http://rdfh.ch/projects/0869',
    attachedToUser: 'http://rdfh.ch/users/test',
    userHasPermission: 'CR',
    properties: {
      [Constants.HasMovingImageFileValue]: [
        {
          type: Constants.MovingImageFileValue,
          id: 'http://rdfh.ch/value/video-1',
          fileUrl: 'https://iiif.stage.dasch.swiss:443/0869/3xUzuLcE9nC-MjBgXRjjsos.mp4/file',
          filename: 'video.mp4',
          userHasPermission: 'CR',
        } as unknown as ReadMovingImageFileValue,
      ],
    },
  }) as unknown as ReadResource;

const makeResource = (permission = 'CR'): DspResource => {
  const titlePropId = 'http://0.0.0.0:3333/ontology/0001/example/v2#hasTitle';
  const titleDef = makeTextPropDef(titlePropId, 'Title');
  const propEntries = [makePropEntry(titleDef, 0)];

  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/video-segment-1';
  res.type = 'http://api.knora.org/ontology/knora-api/v2#VideoSegment';
  res.label = 'My Storybook Video Segment';
  res.attachedToProject = 'http://rdfh.ch/projects/0869';
  res.attachedToUser = 'http://rdfh.ch/users/test';
  res.userHasPermission = permission;
  res.hasPermissions = DEFAULT_HAS_PERMISSIONS;
  res.creationDate = '2024-03-15T10:30:00Z';
  res.versionArkUrl = 'ark:/99999/1/video-segment';
  res.properties = {
    [titlePropId]: [makeTextValue('http://rdfh.ch/value/title-1', 'Intro scene', permission)],
    [IS_VIDEO_SEGMENT_OF_VALUE]: [{ linkedResourceIri: VIDEO_IRI } as unknown as ReadLinkValue],
    [HAS_SEGMENT_BOUNDS]: [{ start: 10, end: 30 } as unknown as ReadIntervalValue],
  };
  res.entityInfo = makeEntityInfo(res.type, propEntries, 'VideoSegment');
  return generateDspResource(addDescriptionToResource(res, permission));
};

const segmentsServiceStub: Partial<SegmentsService> = {
  segments: [],
  onInit: () => {},
  playSegment$: new Subject<any>().asObservable(),
  highlightSegment$: new Subject<any>().asObservable(),
};

const meta: Meta<ResourceVideoSegmentComponent> = {
  title: 'Resource Editor / Resource / Video Segment',
  component: ResourceVideoSegmentComponent,
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
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              res: { getResource: () => of(makeVideoResource()) },
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
          useValue: { getFileInfo: () => of({ originalFilename: 'video.mp4' }), downloadProjectFile: () => {} },
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
      description: 'The video segment resource to display.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceVideoSegmentComponent>;

export const Editable: Story = {
  name: 'Shows video segment with header, video player at start time and properties tab when user can edit (CR permission)',
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
