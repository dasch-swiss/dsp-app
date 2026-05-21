import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { makeReadResource, makeUserServiceStub, STORY_PROVIDERS } from '../stories.helpers';
import { ResourceLinkDialogComponent } from './resource-link-dialog.component';
import { UserService } from '@dasch-swiss/vre/core/session';

const twoResources = [
  makeReadResource({ id: 'r1', label: 'Codex Sinaiticus' }),
  makeReadResource({ id: 'r2', label: 'Book of Hours' }),
];

const sharedProviders = [
  ...STORY_PROVIDERS,
  { provide: MAT_DIALOG_DATA, useValue: { resources: twoResources, projectUuid: 'http://rdfh.ch/projects/0001' } },
  { provide: MatDialogRef, useValue: { close: () => {} } },
  { provide: DspApiConnectionToken, useValue: { v2: { res: { createResource: () => of({ id: 'new-res' }) } } } },
  { provide: ResourceService, useValue: { getProjectShortcode: () => '0001', getResourcePath: () => '/0001/res1' } },
];

const meta: Meta<ResourceLinkDialogComponent> = {
  title: 'Pages / Data Browser / Resource Link Dialog',
  component: ResourceLinkDialogComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<ResourceLinkDialogComponent>;

export const EmptyForm: Story = {
  name: 'Shows label input, resource list, and disabled submit button on open',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Dialog subtitle is shown', async () => {
      await expect(canvas.getByText('Link resources')).toBeInTheDocument();
    });
    await step('Both resource labels are listed', async () => {
      await expect(canvas.getByText('Codex Sinaiticus')).toBeInTheDocument();
      await expect(canvas.getByText('Book of Hours')).toBeInTheDocument();
    });
    await step('Submit button is disabled when label is empty', async () => {
      await expect(canvas.getByTestId('submit-button')).toBeDisabled();
    });
  },
};

export const FilledForm: Story = {
  name: 'Enables submit button when collection label is filled',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Type a collection label', async () => {
      await userEvent.type(canvas.getByRole('textbox', { name: /collection label/i }), 'My Collection');
    });
    await step('Submit button is enabled', async () => {
      await expect(canvas.getByTestId('submit-button')).not.toBeDisabled();
    });
  },
};

export const ThreeResources: Story = {
  name: 'Shows all three resource labels in the connection list',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            resources: [
              makeReadResource({ id: 'r1', label: 'Resource Alpha' }),
              makeReadResource({ id: 'r2', label: 'Resource Beta' }),
              makeReadResource({ id: 'r3', label: 'Resource Gamma' }),
            ],
            projectUuid: 'http://rdfh.ch/projects/0001',
          },
        },
        { provide: MatDialogRef, useValue: { close: () => {} } },
        {
          provide: DspApiConnectionToken,
          useValue: { v2: { res: { createResource: () => of({ id: 'new-res' }) } } },
        },
        { provide: ResourceService, useValue: { getProjectShortcode: () => '0001', getResourcePath: () => '/0001/r' } },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('All three resource labels are displayed', async () => {
      await expect(canvas.getByText('Resource Alpha')).toBeInTheDocument();
      await expect(canvas.getByText('Resource Beta')).toBeInTheDocument();
      await expect(canvas.getByText('Resource Gamma')).toBeInTheDocument();
    });
  },
};
