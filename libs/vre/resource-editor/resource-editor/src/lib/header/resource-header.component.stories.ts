import { importProvidersFrom } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Constants } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
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

const makeTextValue = (id: string, text: string) =>
  ({
    id,
    type: Constants.TextValue,
    text,
    strval: text,
    valueHasComment: null,
    property: Constants.HasDescription,
    userHasPermission: 'RV',
    uuid: id,
    valueCreationDate: '2024-06-15T10:00:00Z',
  }) as any;

const makeDescriptionProp = (values: any[]) => ({
  guiDef: {
    cardinality: 3, // Cardinality._0_n
    isInherited: false,
    propertyIndex: Constants.HasDescription,
  } as any,
  propDef: {
    id: Constants.HasDescription,
    isEditable: true,
    labels: [{ language: 'en', value: 'Description' }],
    comments: [],
  } as any,
  values,
});

const makeResource = (options?: { descriptionValues?: any[]; userCanEdit?: boolean }) =>
  ({
    res: {
      id: 'http://rdfh.ch/resource/1',
      type: THING_CLASS,
      label: 'My Test Resource',
      versionArkUrl: 'ark:/99999/1/test',
      attachedToProject: 'http://rdfh.ch/projects/test',
      attachedToUser: 'http://rdfh.ch/users/test-user',
      creationDate: '2024-06-15T10:00:00.000Z',
      userHasPermission: options?.userCanEdit ? 'CR' : 'RV',
      entityInfo: {
        classes: {
          [THING_CLASS]: {
            label: 'Thing',
            comment: 'A generic thing resource',
            labels: [{ language: 'en', value: 'Thing' }],
            comments: [{ language: 'en', value: 'A generic thing resource' }],
            propertiesList: [{ propertyIndex: Constants.HasDescription, isInherited: false }],
          },
        },
      },
      getValues: () => [],
    },
    resProps: [makeDescriptionProp(options?.descriptionValues ?? [])],
  }) as any;

const meta: Meta<ResourceHeaderComponent> = {
  title: 'Resource Editor / 2. Header / __Resource Header',
  component: ResourceHeaderComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(RouterModule.forRoot([])),
        {
          provide: ResourceFetcherService,
          useValue: makeResourceFetcherServiceStub({
            attachedUser: { givenName: 'Jane', familyName: 'Doe', username: 'jane.doe' },
          }),
        },
        {
          provide: ProjectApiService,
          useValue: {
            get: () =>
              of({ project: { id: 'http://rdfh.ch/projects/test', shortname: 'test', longname: 'Test Project' } }),
          },
        },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: ResourceService, useValue: { getResourcePath: () => '/project/test/resource/1' } },
        { provide: UserService, useValue: { user$: of(null) } },
        { provide: DspApiConnectionToken, useValue: { v2: { res: { canDeleteResource: () => of({ canDo: true }) } } } },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'Full DspResource containing res (ReadResource) and entityInfo.',
      table: { type: { summary: 'DspResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceHeaderComponent>;

export const DefaultView: Story = {
  name: 'Shows resource class label, resource label and info bar',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Resource label is displayed', async () => {
      const label = canvasElement.querySelector('[data-cy="resource-header-label"]');
      await expect(label?.textContent?.trim()).toBe('My Test Resource');
    });
    await step('Resource class label is displayed', async () => {
      await expect(canvasElement.textContent).toContain('Thing');
    });
  },
};

export const ShowsSingleDescription: Story = {
  name: 'Shows the description under the resource label when one description is present',
  args: {
    resource: makeResource({
      descriptionValues: [makeTextValue('http://rdfh.ch/values/desc-1', 'A first description')],
    }),
  },
  play: async ({ canvasElement, step }) => {
    await step('Description block is rendered', async () => {
      const description = canvasElement.querySelector('[data-cy="resource-header-description"]');
      await expect(description).not.toBeNull();
      await expect(description?.textContent).toContain('A first description');
    });
  },
};

export const ShowsMultipleDescriptions: Story = {
  name: 'Shows all descriptions under the resource label when several are present',
  args: {
    resource: makeResource({
      descriptionValues: [
        makeTextValue('http://rdfh.ch/values/desc-1', 'A first description'),
        makeTextValue('http://rdfh.ch/values/desc-2', 'A second description'),
      ],
    }),
  },
  play: async ({ canvasElement, step }) => {
    await step('Both descriptions are rendered', async () => {
      const description = canvasElement.querySelector('[data-cy="resource-header-description"]');
      await expect(description?.textContent).toContain('A first description');
      await expect(description?.textContent).toContain('A second description');
    });
  },
};

export const ShowsAddAffordanceWhenNoDescriptionAndEditor: Story = {
  name: 'Shows the description block with an add affordance when there are no descriptions and the user can edit',
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(RouterModule.forRoot([])),
        {
          provide: ResourceFetcherService,
          useValue: makeResourceFetcherServiceStub({
            userCanEdit: true,
            attachedUser: { givenName: 'Jane', familyName: 'Doe', username: 'jane.doe' },
          }),
        },
        {
          provide: ProjectApiService,
          useValue: {
            get: () =>
              of({ project: { id: 'http://rdfh.ch/projects/test', shortname: 'test', longname: 'Test Project' } }),
          },
        },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: ResourceService, useValue: { getResourcePath: () => '/project/test/resource/1' } },
        { provide: UserService, useValue: { user$: of(null) } },
        { provide: DspApiConnectionToken, useValue: { v2: { res: { canDeleteResource: () => of({ canDo: true }) } } } },
      ],
    }),
  ],
  args: { resource: makeResource({ descriptionValues: [], userCanEdit: true }) },
  play: async ({ canvasElement, step }) => {
    await step('Description block is rendered for the editor', async () => {
      const description = canvasElement.querySelector('[data-cy="resource-header-description"]');
      await expect(description).not.toBeNull();
    });
    await step('Add-value affordance is rendered', async () => {
      const addButton = canvasElement.querySelector('[data-cy="add-property-value-button"]');
      await expect(addButton).not.toBeNull();
    });
  },
};

export const HidesBlockWhenNoDescriptionAndViewer: Story = {
  name: 'Renders nothing when there are no descriptions and the user cannot edit',
  args: { resource: makeResource({ descriptionValues: [], userCanEdit: false }) },
  play: async ({ canvasElement, step }) => {
    await step('Description block is absent', async () => {
      const description = canvasElement.querySelector('[data-cy="resource-header-description"]');
      await expect(description).toBeNull();
    });
  },
};

export const WithEditPermission: Story = {
  name: 'Shows edit label button when user can edit',
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(RouterModule.forRoot([])),
        {
          provide: ResourceFetcherService,
          useValue: makeResourceFetcherServiceStub({
            userCanEdit: true,
            attachedUser: { givenName: 'Jane', familyName: 'Doe', username: 'jane.doe' },
          }),
        },
        {
          provide: ProjectApiService,
          useValue: {
            get: () =>
              of({ project: { id: 'http://rdfh.ch/projects/test', shortname: 'test', longname: 'Test Project' } }),
          },
        },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: ResourceService, useValue: { getResourcePath: () => '/project/test/resource/1' } },
        { provide: UserService, useValue: { user$: of(null) } },
        { provide: DspApiConnectionToken, useValue: { v2: { res: { canDeleteResource: () => of({ canDo: true }) } } } },
      ],
    }),
  ],
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Edit label button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="edit-label-button"]');
      await expect(button).not.toBeNull();
    });
  },
};
