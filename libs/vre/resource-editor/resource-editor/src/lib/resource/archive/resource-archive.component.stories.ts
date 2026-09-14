import { provideRouter } from '@angular/router';
import { Constants, ReadArchiveFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource, generateDspResource } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { RepresentationService } from '../../representation/representation.service';
import { ResourceFetcherService } from '../../representation/resource-fetcher.service';
import {
  addDescriptionToResource,
  DEFAULT_HAS_PERMISSIONS,
  dspApiConnectionStub,
  resourceFetcherServiceStub,
  withheldFileValue,
} from '../../resource-stories.helper';
import { ResourceArchiveComponent } from './resource-archive.component';

const makeResource = (permission = 'CR'): DspResource => {
  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/1';
  res.type = 'http://api.dasch.swiss/ontology/knora-api/v2#ArchiveRepresentation';
  res.label = 'My Storybook Archive';
  res.attachedToProject = 'http://rdfh.ch/projects/0001';
  res.attachedToUser = 'http://rdfh.ch/users/test';
  res.userHasPermission = permission;
  res.hasPermissions = DEFAULT_HAS_PERMISSIONS;
  res.creationDate = '2024-03-15T10:30:00Z';
  res.properties = {
    [Constants.HasArchiveFileValue]: [
      {
        type: Constants.ArchiveFileValue,
        id: 'http://rdfh.ch/value/archive-1',
        fileUrl: 'https://example.org/archive.zip',
        filename: 'archive.zip',
        userHasPermission: 'RV',
      } as unknown as ReadArchiveFileValue,
    ],
  };
  return generateDspResource(addDescriptionToResource(res, permission));
};

/**
 * Same resource, but its file value is withheld: `getFileValue()` returns `null` while the
 * resource stays viewable. The class still declares the `HasArchiveFileValue` cardinality,
 * which is what routes it to this wrapper rather than to the plain view (DEV-7072).
 */
const makeResourceWithheldFile = (): DspResource =>
  generateDspResource(withheldFileValue(makeResource().res, Constants.HasArchiveFileValue));

const meta: Meta<ResourceArchiveComponent> = {
  title: 'Resource Editor / Resource / Archive',
  component: ResourceArchiveComponent,
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([{ path: '**', component: class {} }]),
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
          useValue: { getFileInfo: () => of({ originalFilename: 'archive.zip' }), downloadProjectFile: () => {} },
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
      description: 'The archive resource to display.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceArchiveComponent>;

export const Editable: Story = {
  name: 'Shows archive resource with header, legal info, representation and properties tab when user can edit (CR permission)',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Resource header is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-header')).not.toBeNull();
    });
    await step('Archive viewer is rendered', async () => {
      await expect(canvasElement.querySelector('app-archive')).not.toBeNull();
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

export const WithheldFileValue: Story = {
  name: 'Shows the restricted notice instead of the viewer when the file value is withheld',
  args: { resource: makeResourceWithheldFile() },
  play: async ({ canvasElement, step }) => {
    await step('Restricted notice is rendered', async () => {
      await expect(canvasElement.querySelector('app-representation-restricted')).not.toBeNull();
    });
    await step('Viewer is not rendered', async () => {
      await expect(canvasElement.querySelector('app-archive')).toBeNull();
    });
    await step('Legal panel is not rendered, so it never receives a null file value', async () => {
      await expect(canvasElement.querySelector('app-resource-legal')).toBeNull();
    });
  },
};
