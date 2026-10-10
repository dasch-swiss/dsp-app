import { importProvidersFrom } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Constants, ReadTextValueAsXml } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspApiConnectionToken, RESOURCE_DESCRIPTION_ENABLED } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../representation/resource-fetcher.service';
import { makeResourceFetcherServiceStub, notificationServiceStub } from '../stories.helpers';
import { ResourceHeaderComponent } from './resource-header.component';

const THING_CLASS = 'http://example.org/Thing';

const makeDescription = (html: string) =>
  Object.assign(new ReadTextValueAsXml(), {
    id: 'http://rdfh.ch/resource/1/values/description',
    type: Constants.TextValue,
    property: Constants.HasDescription,
    xml: `<?xml version="1.0" encoding="UTF-8"?>\n<text>${html}</text>`,
    strval: `<?xml version="1.0" encoding="UTF-8"?>\n<text>${html}</text>`,
    mapping: Constants.StandardMapping,
    userHasPermission: 'CR',
  });

const makeResource = (descriptions: ReadTextValueAsXml[] = []) =>
  ({
    res: {
      id: 'http://rdfh.ch/resource/1',
      type: THING_CLASS,
      label: 'My Test Resource',
      versionArkUrl: 'ark:/99999/1/test',
      attachedToProject: 'http://rdfh.ch/projects/test',
      attachedToUser: 'http://rdfh.ch/users/test-user',
      creationDate: '2024-06-15T10:00:00.000Z',
      userHasPermission: 'RV',
      entityInfo: {
        classes: {
          [THING_CLASS]: {
            label: 'Thing',
            comment: 'A generic thing resource',
            labels: [{ language: 'en', value: 'Thing' }],
            comments: [{ language: 'en', value: 'A generic thing resource' }],
            // Inherited from kb:Resource on knora-base v58.
            propertiesList: [{ propertyIndex: Constants.HasDescription }],
          },
        },
        properties: {},
      },
      getValues: (property: string) => (property === Constants.HasDescription ? descriptions : []),
    },
  }) as any;

const headerProviders = ({ userCanEdit = false, descriptionEnabled = true } = {}) => [
  importProvidersFrom(RouterModule.forRoot([])),
  {
    provide: ResourceFetcherService,
    useValue: makeResourceFetcherServiceStub({
      userCanEdit,
      attachedUser: { givenName: 'Jane', familyName: 'Doe', username: 'jane.doe' },
    }),
  },
  {
    provide: ProjectApiService,
    useValue: {
      get: () => of({ project: { id: 'http://rdfh.ch/projects/test', shortname: 'test', longname: 'Test Project' } }),
    },
  },
  { provide: NotificationService, useValue: notificationServiceStub },
  { provide: ResourceService, useValue: { getResourcePath: () => '/project/test/resource/1' } },
  { provide: UserService, useValue: { user$: of(null) } },
  { provide: DspApiConnectionToken, useValue: { v2: { res: { canDeleteResource: () => of({ canDo: true }) } } } },
  { provide: RESOURCE_DESCRIPTION_ENABLED, useValue: descriptionEnabled },
];

const meta: Meta<ResourceHeaderComponent> = {
  title: 'Resource Editor / 2. Header / __Resource Header',
  component: ResourceHeaderComponent,
  decorators: [applicationConfig({ providers: headerProviders() })],
  argTypes: {
    resource: {
      description: 'Full DspResource containing res (ReadResource) and entityInfo.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceHeaderComponent>;

const description = (canvasElement: HTMLElement) =>
  canvasElement.querySelector('[data-cy="resource-header-description"]');

export const DefaultView: Story = {
  name: 'Shows resource class label, info bar and resource label',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Resource label is displayed', async () => {
      const label = canvasElement.querySelector('[data-cy="resource-header-label"]');
      await expect(label?.textContent?.trim()).toBe('My Test Resource');
    });
    await step('Resource class label is displayed', async () => {
      await expect(canvasElement.textContent).toContain('Thing');
    });
    await step('The info bar comes before the resource label', async () => {
      const infoBar = canvasElement.querySelector('app-resource-info-bar')!;
      const label = canvasElement.querySelector('[data-cy="resource-header-label"]')!;
      await expect(infoBar.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
    await step('A viewer of a resource without a description sees no description element', async () => {
      await expect(description(canvasElement)).toBeNull();
    });
  },
};

export const WithEditPermission: Story = {
  name: 'Shows edit label button when user can edit',
  decorators: [applicationConfig({ providers: headerProviders({ userCanEdit: true }) })],
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Edit label button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="edit-label-button"]');
      await expect(button).not.toBeNull();
    });
  },
};

export const WithDescription: Story = {
  name: 'Shows the description under the label',
  args: { resource: makeResource([makeDescription('<p>A <strong>rich</strong> description.</p>')]) },
  play: async ({ canvasElement, step }) => {
    await step('The description is rendered as rich text', async () => {
      await expect(description(canvasElement)?.querySelector('strong')?.textContent).toBe('rich');
    });
    await step('A viewer gets no edit button', async () => {
      await expect(canvasElement.querySelector('[data-cy="edit-description-button"]')).toBeNull();
    });
  },
};

export const EditorWithoutDescription: Story = {
  name: 'Offers an editor to add a description',
  decorators: [applicationConfig({ providers: headerProviders({ userCanEdit: true }) })],
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('A placeholder and the edit button are rendered', async () => {
      await expect(description(canvasElement)).not.toBeNull();
      await expect(canvasElement.querySelector('[data-cy="edit-description-button"]')).not.toBeNull();
    });
  },
};

export const FeatureFlagOff: Story = {
  name: 'Shows no description while the feature flag is off',
  decorators: [applicationConfig({ providers: headerProviders({ userCanEdit: true, descriptionEnabled: false }) })],
  args: { resource: makeResource([makeDescription('<p>Hidden.</p>')]) },
  play: async ({ canvasElement, step }) => {
    await step('No description element is rendered', async () => {
      await expect(description(canvasElement)).toBeNull();
    });
  },
};
