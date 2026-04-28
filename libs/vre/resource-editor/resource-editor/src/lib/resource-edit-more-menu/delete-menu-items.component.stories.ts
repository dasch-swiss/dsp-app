import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { DeleteMenuItemsComponent } from './delete-menu-items.component';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/1',
    type: 'http://example.org/Thing',
    label: 'Test Resource',
    lastModificationDate: '2024-06-15T10:00:00.000Z',
    userHasPermission: 'D',
  }) as any;

const makeUser = () =>
  ({
    id: 'http://rdfh.ch/users/test-user',
    username: 'test.user',
    projects: [],
    permissions: { groupsPerProject: {} },
    isSystemAdmin: false,
  }) as any;

const meta: Meta<DeleteMenuItemsComponent> = {
  title: 'Resource Editor / 2. Header / More Menu / Delete Menu Items',
  component: DeleteMenuItemsComponent,
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
        {
          provide: DspApiConnectionToken,
          useValue: { v2: { res: { canDeleteResource: () => of({ canDo: true }) } } },
        },
        { provide: UserService, useValue: { user$: of(makeUser()) } },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The resource for which delete/erase items are displayed.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<DeleteMenuItemsComponent>;

export const DefaultView: Story = {
  name: 'Shows delete button when user can delete',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Delete button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="resource-more-menu-delete-button"]');
      await expect(button).not.toBeNull();
    });
  },
};
