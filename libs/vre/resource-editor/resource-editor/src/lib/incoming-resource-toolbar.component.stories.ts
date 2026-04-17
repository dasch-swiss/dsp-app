import { importProvidersFrom } from '@angular/core';
import { RouterModule } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { IncomingResourceToolbarComponent } from './incoming-resource-toolbar.component';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/2',
    type: 'http://example.org/Thing',
    label: 'Incoming Resource',
    versionArkUrl: 'ark:/99999/1/incoming',
    attachedToProject: 'http://rdfh.ch/projects/test',
    userHasPermission: 'RV',
    entityInfo: { classes: {} },
    getValues: () => [],
  }) as any;

const meta: Meta<IncomingResourceToolbarComponent> = {
  title: 'Devs / Resource Editor / Resource Header / Incoming Resource Toolbar',
  component: IncomingResourceToolbarComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(RouterModule.forRoot([])),
        { provide: ResourceFetcherService, useValue: { userCanDelete$: of(false), userCanEdit$: of(false) } },
        { provide: NotificationService, useValue: { openSnackBar: () => {} } },
        { provide: ResourceService, useValue: { getResourcePath: () => '/project/test/resource/2' } },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The incoming resource for which actions and more menu are displayed.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<IncomingResourceToolbarComponent>;

export const DefaultView: Story = {
  name: 'Shows resource actions and more menu for incoming resource',
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
