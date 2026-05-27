import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { HeaderLogoComponent } from './header-logo.component';

const meta: Meta<HeaderLogoComponent> = {
  title: 'Shared / Header / Header Logo',
  component: HeaderLogoComponent,
  decorators: [
    applicationConfig({
      providers: [provideRouter([])],
    }),
  ],
};
export default meta;
type Story = StoryObj<HeaderLogoComponent>;

export const DefaultView: Story = {
  name: 'Shows DaSCH logo as a home link',
  play: async ({ canvasElement, step }) => {
    await step('Anchor link wrapping the logo is rendered', async () => {
      await expect(canvasElement.querySelector('a.logo')).not.toBeNull();
    });
    await step('SVG icon element is rendered', async () => {
      await expect(canvasElement.querySelector('mat-icon')).not.toBeNull();
    });
  },
};
