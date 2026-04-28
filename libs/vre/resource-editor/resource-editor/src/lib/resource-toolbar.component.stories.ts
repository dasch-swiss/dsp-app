import { importProvidersFrom } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { ResourceToolbarComponent } from './resource-toolbar.component';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/1',
    type: 'http://example.org/Thing',
    label: 'Test Resource',
    versionArkUrl: 'ark:/99999/1/test',
    attachedToProject: 'http://rdfh.ch/projects/test',
    userHasPermission: 'RV',
    entityInfo: { classes: {} },
    getValues: () => [],
  }) as any;

const meta: Meta<ResourceToolbarComponent> = {
  title: 'Resource Editor / 2. Header / Resource Toolbar',
  component: ResourceToolbarComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(RouterModule.forRoot([])),
        { provide: ResourceFetcherService, useValue: { userCanDelete$: of(false), userCanEdit$: of(false) } },
        { provide: NotificationService, useValue: { openSnackBar: () => {} } },
        { provide: ResourceService, useValue: { getResourcePath: () => '/project/test/resource/1' } },
        { provide: UserService, useValue: { user$: of(null) } },
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: { res: { canDeleteResource: () => of({ canDo: true }), getResourcePermissions: () => of([]) } },
          },
        },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The resource for which actions and more menu are displayed.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceToolbarComponent>;

export const DefaultView: Story = {
  name: 'Shows resource actions and more menu',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Open in new window button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="open-in-new-window-button"]');
      await expect(button).not.toBeNull();
    });
    await step('Share button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="share-button"]');
      await expect(button).not.toBeNull();
    });
  },
};
