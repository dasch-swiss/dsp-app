import { provideRouter } from '@angular/router';
import { Constants, ReadTextFileValue } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { RepresentationService } from './representations/representation.service';
import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { ResourceTextComponent } from './resource-text.component';

const makeResource = (overrides: Record<string, unknown> = {}): DspResource => {
  const fileValue = {
    type: Constants.TextFileValue,
    fileUrl: 'https://example.org/document.txt',
    filename: 'document.txt',
    userHasPermission: 'CR',
    copyrightHolder: null,
    authorship: [],
    license: null,
  } as unknown as ReadTextFileValue;

  return {
    res: {
      id: 'http://rdfh.ch/resource/1',
      type: 'http://example.org/Thing',
      label: 'Test Text Resource',
      attachedToProject: 'http://rdfh.ch/projects/test',
      attachedToUser: 'http://rdfh.ch/users/test',
      userHasPermission: 'CR',
      properties: { [Constants.HasTextFileValue]: [fileValue] },
      entityInfo: { classes: { 'http://example.org/Thing': { label: 'Thing' } } },
      getValues: (prop: string) => (prop === Constants.HasTextFileValue ? [fileValue] : []),
      ...overrides,
    },
    resProps: [],
    incomingAnnotations: [],
  } as unknown as DspResource;
};

const meta: Meta<ResourceTextComponent> = {
  title: 'Resource Editor / Resource / Text',
  component: ResourceTextComponent,
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
          useValue: { getFileInfo: () => of({ originalFilename: 'document.txt' }), downloadProjectFile: () => {} },
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
  ],
  argTypes: {
    resource: {
      description: 'The text resource to display.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceTextComponent>;

export const DefaultView: Story = {
  name: 'Shows text resource with header, legal info, representation and properties tab',
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
