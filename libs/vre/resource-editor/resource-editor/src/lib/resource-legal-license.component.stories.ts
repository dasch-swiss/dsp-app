import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { ResourceLegalLicenseComponent } from './resource-legal-license.component';

const ccByLicense = {
  id: 'http://creativecommons.org/licenses/by/4.0',
  labelEn: 'CC BY 4.0',
  uri: 'https://creativecommons.org/licenses/by/4.0/',
  labelDe: 'CC BY 4.0',
};

const unknownLicense = {
  id: 'http://example.org/custom-license',
  labelEn: 'Custom License',
  uri: 'https://example.org/license',
  labelDe: 'Eigene Lizenz',
};

const meta: Meta<ResourceLegalLicenseComponent> = {
  title: 'Resource Editor / 3. Representation / Legal / Resource Legal License',
  component: ResourceLegalLicenseComponent,
  argTypes: {
    license: {
      description: 'License DTO containing id, label and URI.',
      table: { type: { summary: 'ProjectLicenseDto' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceLegalLicenseComponent>;

export const WithLogoLicense: Story = {
  name: 'Shows license logo image for known Creative Commons license',
  args: { license: ccByLicense as any },
  play: async ({ canvasElement, step }) => {
    await step('License link is rendered', async () => {
      const link = canvasElement.querySelector('a');
      await expect(link).not.toBeNull();
    });
  },
};

export const WithTextLicense: Story = {
  name: 'Shows license label text when no logo is available',
  args: { license: unknownLicense as any },
  play: async ({ canvasElement, step }) => {
    await step('License label text is rendered', async () => {
      await expect(canvasElement.textContent).toContain('Custom License');
    });
    await step('Open in new icon is shown', async () => {
      const icon = canvasElement.querySelector('mat-icon');
      await expect(icon?.textContent?.trim()).toBe('open_in_new');
    });
  },
};
