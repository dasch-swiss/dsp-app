import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { ResourceMoreMenuComponent } from './resource-more-menu.component';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/1',
    type: 'http://example.org/Thing',
    label: 'Test Resource',
    lastModificationDate: '2024-06-15T10:00:00.000Z',
    userHasPermission: 'D',
  }) as any;

const meta: Meta<ResourceMoreMenuComponent> = {
  title: 'Devs / Resource Editor / More Menu / Resource More Menu',
  component: ResourceMoreMenuComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: ResourceFetcherService, useValue: { userCanDelete$: of(true), userCanEdit$: of(true), projectIri$: of('http://rdfh.ch/projects/test') } },
        { provide: DspApiConnectionToken, useValue: { v2: { res: { canDeleteResource: () => of({ canDo: true }) } } } },
        { provide: UserService, useValue: { user$: of(null) } },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The resource for which the more menu is displayed.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceMoreMenuComponent>;

export const DefaultView: Story = {
  name: 'Shows more_vert button when user can delete',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('More menu button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="resource-toolbar-more-button"]');
      await expect(button).not.toBeNull();
    });
  },
};
