import { provideRouter } from '@angular/router';
import { Constants, ReadDocumentFileValue, ReadResource } from '@dasch-swiss/dsp-js';
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
import { ResourceDocumentComponent } from './resource-document.component';

const makeResource = (permission = 'CR'): DspResource =>
  new DspResource({
    id: 'http://rdfh.ch/resource/1',
    type: 'http://api.dasch.swiss/ontology/knora-api/v2#DocumentRepresentation',
    label: 'My Storybook Document',
    attachedToProject: 'http://rdfh.ch/projects/0001',
    attachedToUser: 'http://rdfh.ch/users/test',
    userHasPermission: permission,
    creationDate: '2024-03-15T10:30:00Z',
    properties: {
      [Constants.HasDocumentFileValue]: [
        {
          type: Constants.DocumentFileValue,
          id: 'http://rdfh.ch/value/document-1',
          fileUrl: 'https://example.org/document.docx',
          filename: 'document.docx',
          userHasPermission: 'RV',
        } as unknown as ReadDocumentFileValue,
      ],
    },
    entityInfo: { classes: { 'http://api.dasch.swiss/ontology/knora-api/v2#DocumentRepresentation': { label: 'Document Representation' } }, getPropertyDefinitionsByType: () => [] },
  } as unknown as ReadResource);

const meta: Meta<ResourceDocumentComponent> = {
  title: 'Resource Editor / Resource / Document',
  component: ResourceDocumentComponent,
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
          useValue: { getFileInfo: () => of({ originalFilename: 'document.docx' }), downloadProjectFile: () => {} },
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
      description: 'The document resource to display.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceDocumentComponent>;

export const DefaultView: Story = {
  name: 'Shows document resource with header, legal info, representation and properties tab',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Resource header is rendered', async () => {
      await expect(canvasElement.querySelector('app-resource-header')).not.toBeNull();
    });
    await step('Document viewer is rendered', async () => {
      await expect(canvasElement.querySelector('app-document')).not.toBeNull();
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
