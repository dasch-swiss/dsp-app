import { FormControl } from '@angular/forms';
import { PaginatedApiService } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { AuthorshipFormFieldComponent } from './authorship-form-field.component';

const meta: Meta<AuthorshipFormFieldComponent> = {
  title: 'Resource Creator / 2. Legal / Authorship Form Field',
  component: AuthorshipFormFieldComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: PaginatedApiService, useValue: { getAuthorships: () => of([]) } }],
    }),
  ],
  argTypes: {
    control: {
      description: 'FormControl holding the list of selected authorship strings.',
      table: { type: { summary: 'FormControl<string[]>' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<AuthorshipFormFieldComponent>;

export const Empty: Story = {
  name: 'Shows authorship chip input with no selections',
  args: {
    control: new FormControl<string[]>([]) as any,
    projectShortcode: 'test',
  },
  play: async ({ canvasElement, step }) => {
    await step('Authorship chip input is rendered', async () => {
      const input = canvasElement.querySelector('[data-cy="authorship-chips"]');
      await expect(input).not.toBeNull();
    });
  },
};

export const WithAuthors: Story = {
  name: 'Shows authorship chip input ready to add authors',
  args: {
    control: new FormControl<string[]>(['Jane Doe', 'John Smith']) as any,
    projectShortcode: 'test',
  },
  play: async ({ canvasElement, step }) => {
    await step('Authorship chip input is rendered', async () => {
      const input = canvasElement.querySelector('[data-cy="authorship-chips"]');
      await expect(input).not.toBeNull();
    });
  },
};
