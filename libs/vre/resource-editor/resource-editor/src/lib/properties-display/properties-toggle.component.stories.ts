import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { PropertiesDisplayService } from '../resource-properties/properties-display.service';
import { PropertiesToggleComponent } from './properties-toggle.component';

const meta: Meta<PropertiesToggleComponent> = {
  title: 'Devs / Resource Editor / Properties Display / Properties Toggle',
  component: PropertiesToggleComponent,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: PropertiesDisplayService,
          useValue: {
            showAllProperties$: of(false),
            showComments$: of(false),
            toggleShowProperties: () => {},
            toggleShowComments: () => {},
          },
        },
      ],
    }),
  ],
  argTypes: {
    properties: {
      description: 'List of property values used to compute the comment count.',
      table: { type: { summary: 'PropertyInfoValues[]' }, category: 'State' },
    },
    displayIconsOnly: {
      description: 'When true, shows icon-only buttons instead of labelled buttons.',
      table: { type: { summary: 'boolean' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<PropertiesToggleComponent>;

export const DefaultView: Story = {
  name: 'Shows show-all-properties toggle button',
  args: { properties: [], displayIconsOnly: false },
  play: async ({ canvasElement, step }) => {
    await step('Show all properties button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="show-all-properties"]');
      await expect(button).not.toBeNull();
    });
  },
};

export const IconsOnly: Story = {
  name: 'Shows icon-only toggle buttons when displayIconsOnly is true',
  args: { properties: [], displayIconsOnly: true },
  play: async ({ canvasElement, step }) => {
    await step('Show all properties icon button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="show-all-properties"]');
      await expect(button).not.toBeNull();
    });
  },
};
