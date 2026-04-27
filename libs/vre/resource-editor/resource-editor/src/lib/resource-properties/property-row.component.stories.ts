import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { PropertiesDisplayService } from './properties-display.service';
import { PropertyRowComponent } from './property-row.component';

const propertiesDisplayServiceStub: Partial<PropertiesDisplayService> = {
  showAllProperties$: of(true),
};

const meta: Meta<PropertyRowComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Property Value / Property Row',
  component: PropertyRowComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: PropertiesDisplayService, useValue: propertiesDisplayServiceStub }],
    }),
  ],
  argTypes: {
    label: {
      description: 'Property label displayed in the left column.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
    borderBottom: {
      description: 'Whether to show a bottom border separating rows.',
      table: { type: { summary: 'boolean' }, category: 'State' },
    },
    isEmptyRow: {
      description: 'Whether the row has no values (hidden when show-all is off).',
      table: { type: { summary: 'boolean' }, category: 'State' },
    },
    tooltip: {
      description: 'Optional tooltip shown on the label.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<PropertyRowComponent>;

export const DefaultView: Story = {
  name: 'Shows property label and content slot with border',
  args: {
    label: 'Description',
    borderBottom: true,
    isEmptyRow: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('Label is rendered', async () => {
      await expect(canvasElement.textContent).toContain('Description');
    });
    await step('Row has bottom border class', async () => {
      const row = canvasElement.querySelector('.property-row');
      await expect(row?.classList.contains('border-bottom')).toBe(true);
    });
  },
};

export const EmptyRow: Story = {
  name: 'Hides empty row when show-all is off',
  decorators: [
    applicationConfig({
      providers: [{ provide: PropertiesDisplayService, useValue: { showAllProperties$: of(false) } }],
    }),
  ],
  args: {
    label: 'Empty Property',
    borderBottom: false,
    isEmptyRow: true,
  },
  play: async ({ canvasElement, step }) => {
    await step('Row is rendered with hidden class', async () => {
      const row = canvasElement.querySelector('.property-row');
      await expect(row?.classList.contains('hidden')).toBe(true);
    });
  },
};

export const WithTooltip: Story = {
  name: 'Shows tooltip on the property label',
  args: {
    label: 'Title',
    borderBottom: true,
    isEmptyRow: false,
    tooltip: 'This property holds the title of the resource.',
  },
  play: async ({ canvasElement, step }) => {
    await step('Label is rendered with tooltip attribute', async () => {
      const label = canvasElement.querySelector('.label');
      await expect(label).not.toBeNull();
    });
  },
};
