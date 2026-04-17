import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { IncomingResourceMoreMenuComponent } from './incoming-resource-more-menu.component';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/2',
    type: 'http://example.org/Thing',
    label: 'Incoming Resource',
    lastModificationDate: '2024-06-15T10:00:00.000Z',
    userHasPermission: 'D',
  }) as any;

const meta: Meta<IncomingResourceMoreMenuComponent> = {
  title: 'Devs / Resource Editor / More Menu / Incoming Resource More Menu',
  component: IncomingResourceMoreMenuComponent,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: ResourceFetcherService,
          useValue: {
            userCanDelete$: of(true),
            userCanEdit$: of(true),
            projectIri$: of('http://rdfh.ch/projects/test'),
          },
        },
        { provide: DspApiConnectionToken, useValue: { v2: { res: { canDeleteResource: () => of({ canDo: true }) } } } },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The incoming resource for which the more menu is displayed.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<IncomingResourceMoreMenuComponent>;

export const DefaultView: Story = {
  name: 'Shows more_vert button when user can edit or delete',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('More menu button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="resource-toolbar-more-button"]');
      await expect(button).not.toBeNull();
    });
  },
};
