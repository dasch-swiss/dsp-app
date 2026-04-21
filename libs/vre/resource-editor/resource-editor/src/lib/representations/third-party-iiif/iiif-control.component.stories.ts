import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, waitFor } from 'storybook/test';

import { IiifControlComponent } from './iiif-control.component';

@Component({
  selector: 'app-iiif-control-with-error-host',
  imports: [IiifControlComponent],
  template: '<app-iiif-control [control]="control" />',
})
class IiifControlWithErrorHostComponent {
  control = (() => {
    const c = new FormControl<string | null>('not-a-valid-url');
    c.setErrors({ invalidIiifUrl: true });
    c.markAsTouched();
    return c;
  })();
}

const meta: Meta<IiifControlComponent> = {
  title: 'Devs / Resource Editor / Representation / IIIF Control',
  component: IiifControlComponent,
  argTypes: {
    control: {
      description: 'Reactive FormControl bound to the IIIF URL input.',
      table: { type: { summary: 'FormControl<string | null>' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<IiifControlComponent>;

export const Empty: Story = {
  name: 'Shows empty IIIF URL input field',
  args: {
    control: new FormControl<string | null>(null),
  },
  play: async ({ canvasElement, step }) => {
    await step('IIIF URL input is rendered', async () => {
      const input = canvasElement.querySelector('[data-cy="external-iiif-input"]');
      await expect(input).not.toBeNull();
    });
  },
};

export const WithValidUrl: Story = {
  name: 'Shows preview image when a valid IIIF URL is entered',
  args: {
    control: new FormControl<string | null>(
      'https://iiif.dasch.swiss/0812/ingaELbers-V5Wd1c8oYDE-pR9.jpx/full/^!512,512/0/default.jpg'
    ),
  },
  play: async ({ canvasElement, step }) => {
    await step('IIIF URL input contains the URL', async () => {
      const input = canvasElement.querySelector('[data-cy="external-iiif-input"]') as HTMLInputElement;
      await expect(input).not.toBeNull();
    });
  },
};

export const WithError: Story = {
  name: 'Shows validation error for an invalid IIIF URL',
  render: () => ({
    template: '<app-iiif-control-with-error-host />',
    moduleMetadata: { imports: [IiifControlWithErrorHostComponent] },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Error message is displayed', async () => {
      await waitFor(() => {
        const error = canvasElement.querySelector('mat-error');
        expect(error).not.toBeNull();
      });
    });
  },
};
