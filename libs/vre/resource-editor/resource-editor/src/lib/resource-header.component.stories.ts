import { importProvidersFrom } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { ResourceHeaderComponent } from './resource-header.component';

const makeResource = () =>
  ({
    res: {
      id: 'http://rdfh.ch/resource/1',
      type: 'http://example.org/Thing',
      label: 'My Test Resource',
      versionArkUrl: 'ark:/99999/1/test',
      attachedToProject: 'http://rdfh.ch/projects/test',
      attachedToUser: 'http://rdfh.ch/users/test-user',
      creationDate: '2024-06-15T10:00:00.000Z',
      userHasPermission: 'RV',
      entityInfo: {
        classes: {
          'http://example.org/Thing': {
            label: 'Thing',
            comment: 'A generic thing resource',
          },
        },
      },
      getValues: () => [],
    },
  }) as any;

const meta: Meta<ResourceHeaderComponent> = {
  title: 'Devs / Resource Editor / Header / Resource Header',
  component: ResourceHeaderComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(RouterModule.forRoot([])),
        {
          provide: ResourceFetcherService,
          useValue: {
            userCanEdit$: of(false),
            userCanDelete$: of(false),
            attachedUser$: of({ givenName: 'Jane', familyName: 'Doe', username: 'jane.doe' }),
          },
        },
        {
          provide: ProjectApiService,
          useValue: {
            get: () =>
              of({ project: { id: 'http://rdfh.ch/projects/test', shortname: 'test', longname: 'Test Project' } }),
          },
        },
        { provide: NotificationService, useValue: { openSnackBar: () => {} } },
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

export const WithEditPermission: Story = {
  name: 'Shows edit label button when user can edit',
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(RouterModule.forRoot([])),
        {
          provide: ResourceFetcherService,
          useValue: {
            userCanEdit$: of(true),
            userCanDelete$: of(false),
            attachedUser$: of({ givenName: 'Jane', familyName: 'Doe', username: 'jane.doe' }),
          },
        },
        {
          provide: ProjectApiService,
          useValue: {
            get: () =>
              of({ project: { id: 'http://rdfh.ch/projects/test', shortname: 'test', longname: 'Test Project' } }),
          },
        },
        { provide: NotificationService, useValue: { openSnackBar: () => {} } },
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
