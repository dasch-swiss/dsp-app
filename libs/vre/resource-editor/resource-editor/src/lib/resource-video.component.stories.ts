import { provideRouter } from '@angular/router';
import { Constants, ReadMovingImageFileValue } from '@dasch-swiss/dsp-js';
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
import { SegmentsService } from './segment-support/segments.service';

const makeResource = (overrides: Record<string, unknown> = {}): DspResource => {
  const fileValue = {
    type: Constants.MovingImageFileValue,
    fileUrl: 'https://iiif.stage.dasch.swiss:443/0869/3xUzuLcE9nC-MjBgXRjjsos.mp4/file',
    filename: 'video.mp4',
    userHasPermission: 'CR',
    copyrightHolder: null,
    authorship: [],
    license: null,
  } as unknown as ReadMovingImageFileValue;

  return {
    res: {
      id: 'http://rdfh.ch/resource/1',
      type: 'http://example.org/Thing',
      label: 'Test Video Resource',
      attachedToProject: 'http://rdfh.ch/projects/test',
      attachedToUser: 'http://rdfh.ch/users/test',
      userHasPermission: 'CR',
      properties: { [Constants.HasMovingImageFileValue]: [fileValue] },
      entityInfo: { classes: { 'http://example.org/Thing': { label: 'Thing' } } },
      getValues: (prop: string) => (prop === Constants.HasMovingImageFileValue ? [fileValue] : []),
      ...overrides,
    },
    resProps: [],
    incomingAnnotations: [],
  } as unknown as DspResource;
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
          useValue: { get: () => of({ project: { id: '', shortcode: '0001', shortname: 'test', longname: 'Test' } }) },
        },
        { provide: ResourceFetcherService, useValue: { userCanEdit$: of(false), projectShortcode$: of('0001') } },
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
    await step('Resource representation is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-representation')).not.toBeNull();
    });
  },
};

export const RestrictedView: Story = {
  name: 'Shows restriction banner when user has only restricted view permission',
  args: { resource: makeResource({ userHasPermission: 'RV' }) },
  play: async ({ canvasElement, step }) => {
    await step('Restriction banner is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-restriction')).not.toBeNull();
    });
  },
};
