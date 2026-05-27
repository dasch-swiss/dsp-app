import { MatDialog } from '@angular/material/dialog';
import { UserService } from '@dasch-swiss/vre/core/session';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, fn, userEvent, within } from 'storybook/test';
import { MultipleViewerService } from '../comparison/multiple-viewer.service';
import {
  makeMultipleViewerServiceStub,
  makeReadResource,
  makeUserServiceStub,
  STORY_PROVIDERS,
} from '../stories.helpers';
import { ResourceListSelectionComponent } from './resource-list-selection.component';

const baseProviders = [...STORY_PROVIDERS, { provide: MatDialog, useValue: { open: () => {} } }];

const meta: Meta<ResourceListSelectionComponent> = {
  title: 'Pages / Data Browser / Resource List Selection',
  component: ResourceListSelectionComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<ResourceListSelectionComponent>;

export const TwoResourcesSelected: Story = {
  name: 'Shows selected count and create link button for two selected resources',
  decorators: [
    applicationConfig({
      providers: [
        ...baseProviders,
        {
          provide: MultipleViewerService,
          useValue: makeMultipleViewerServiceStub({
            selectMode: true,
            selectedResources$: of([
              makeReadResource({ id: 'r1', label: 'Resource A' }),
              makeReadResource({ id: 'r2', label: 'Resource B' }),
            ]),
          }),
        },
        {
          provide: UserService,
          useValue: makeUserServiceStub({ isSysAdmin$: of(true), user$: of({ id: 'u1' } as any) }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Count shows 2 resources selected', async () => {
      await expect(canvas.getByText(/2 resources selected/)).toBeInTheDocument();
    });
    await step('Create link object button is visible', async () => {
      await expect(canvas.getByRole('button', { name: /create a link object/i })).toBeInTheDocument();
    });
  },
};

export const SingleResourceSelected: Story = {
  name: 'Hides create link button when only one resource is selected',
  decorators: [
    applicationConfig({
      providers: [
        ...baseProviders,
        {
          provide: MultipleViewerService,
          useValue: makeMultipleViewerServiceStub({
            selectMode: true,
            selectedResources$: of([makeReadResource({ id: 'r1', label: 'Resource A' })]),
          }),
        },
        {
          provide: UserService,
          useValue: makeUserServiceStub({ isSysAdmin$: of(true), user$: of({ id: 'u1' } as any) }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Count shows 1 resource selected', async () => {
      await expect(canvas.getByText(/1 resources selected/)).toBeInTheDocument();
    });
    await step('Create link button is not shown for single selection', async () => {
      await expect(canvas.queryByRole('button', { name: /create a link object/i })).toBeNull();
    });
  },
};

const resetSpy = fn();

export const ResetsSelectionOnClose: Story = {
  name: 'Resets selection when close button is clicked',
  decorators: [
    applicationConfig({
      providers: [
        ...baseProviders,
        {
          provide: MultipleViewerService,
          useValue: makeMultipleViewerServiceStub({
            selectedResources$: of([makeReadResource({ id: 'r1' }), makeReadResource({ id: 'r2' })]),
            reset: resetSpy,
          }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    resetSpy.mockClear();
    const canvas = within(canvasElement);
    await step('Click the close icon button', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });
    await step('MultipleViewerService.reset was called', async () => {
      await expect(resetSpy).toHaveBeenCalledTimes(1);
    });
  },
};
