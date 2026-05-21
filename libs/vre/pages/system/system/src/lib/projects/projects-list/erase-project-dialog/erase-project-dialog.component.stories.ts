import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { StoredProject } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { makeReadUser, STORY_PROVIDERS } from '../../../stories.helpers';
import { EraseProjectDialogComponent } from './erase-project-dialog.component';

const sampleProject: Partial<StoredProject> = {
  id: 'http://rdfh.ch/projects/0001',
  shortcode: '0ABC',
  shortname: 'sample',
  longname: 'Sample Project',
};

const sharedProviders = [
  ...STORY_PROVIDERS,
  { provide: MAT_DIALOG_DATA, useValue: { project: sampleProject } },
  { provide: MatDialogRef, useValue: { close: () => {} } },
  { provide: ProjectApiService, useValue: { erase: () => of({ project: sampleProject }) } },
  { provide: UserService, useValue: { currentUser: makeReadUser({ username: 'admin' }) } },
  { provide: DspApiConnectionToken, useValue: { v2: { auth: { login: () => of({}) } } } },
];

const meta: Meta<EraseProjectDialogComponent> = {
  title: 'Pages / System / Projects / Erase Project Dialog',
  component: EraseProjectDialogComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<EraseProjectDialogComponent>;

export const EmptyForm: Story = {
  name: 'Shows form with short code and password fields, confirm button disabled',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Short code input is present', async () => {
      await expect(canvas.getByTestId('short-code-input')).toBeInTheDocument();
    });
    await step('Password input is present', async () => {
      await expect(canvas.getByTestId('password-input')).toBeInTheDocument();
    });
    await step('Confirm button is disabled when form is empty', async () => {
      await expect(canvas.getByRole('button', { name: /confirm/i })).toBeDisabled();
    });
  },
};

export const WrongShortCode: Story = {
  name: 'Shows validation error when short code does not match',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Type a wrong short code', async () => {
      await userEvent.type(canvas.getByTestId('short-code-input'), 'XXXX');
    });
    await step('Blur the field to trigger validation', async () => {
      await userEvent.tab();
    });
    await step('Validation error is shown', async () => {
      await expect(canvas.getByText('Short code does not match')).toBeInTheDocument();
    });
  },
};

export const ValidForm: Story = {
  name: 'Enables confirm button when short code and password are filled correctly',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Type matching short code', async () => {
      await userEvent.type(canvas.getByTestId('short-code-input'), '0ABC');
    });
    await step('Type password', async () => {
      await userEvent.type(canvas.getByTestId('password-input'), 'secret');
    });
    await step('Confirm button is enabled', async () => {
      await expect(canvas.getByRole('button', { name: /confirm/i })).not.toBeDisabled();
    });
  },
};
