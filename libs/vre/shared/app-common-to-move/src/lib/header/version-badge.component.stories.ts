import { AppConfigService } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { VersionBadgeComponent } from './version-badge.component';

const meta: Meta<VersionBadgeComponent> = {
  title: 'Shared / Header / Version Badge',
  component: VersionBadgeComponent,
};
export default meta;
type Story = StoryObj<VersionBadgeComponent>;

export const NonProductionEnvironment: Story = {
  name: 'Shows environment and release badge in non-production',
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: AppConfigService,
          useValue: {
            dspConfig: { production: false, environment: 'dev', release: 'v30.1.0', color: 'warn' },
          },
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('"dev" environment label is visible', async () => {
      await expect(canvas.getByText('dev')).toBeInTheDocument();
    });
    await step('"v30.1.0" release label is visible', async () => {
      await expect(canvas.getByText('v30.1.0')).toBeInTheDocument();
    });
  },
};

export const ProductionEnvironment: Story = {
  name: 'Hides badge in production environment',
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: AppConfigService,
          useValue: {
            dspConfig: { production: true, environment: 'production', release: 'v30.1.0', color: 'primary' },
          },
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('No badge is rendered in production', async () => {
      await expect(canvasElement.querySelector('.badge')).toBeNull();
    });
  },
};
