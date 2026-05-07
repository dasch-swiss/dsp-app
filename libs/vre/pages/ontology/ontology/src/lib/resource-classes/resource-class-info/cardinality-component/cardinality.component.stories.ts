import { provideAnimations } from '@angular/platform-browser/animations';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { makeClassPropertyInfo } from '../../../stories.helpers';
import { CardinalityComponent } from './cardinality.component';

const classProp = makeClassPropertyInfo();

const meta: Meta<CardinalityComponent> = {
  title: 'Ontology / Resource Classes / Cardinality',
  component: CardinalityComponent,
  argTypes: {
    classProp: {
      description: 'The class property info containing the IHasProperty cardinality data.',
      table: { type: { summary: 'ClassPropertyInfo' }, category: 'Inputs' },
    },
    disabled: {
      description: 'When true the checkboxes are read-only.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, category: 'Inputs' },
    },
    cardinalityChange: {
      description: 'Emitted when the user confirms a cardinality change.',
      table: { type: { summary: 'Cardinality' }, category: 'Outputs' },
    },
  },
};
export default meta;
type Story = StoryObj<CardinalityComponent>;

const sharedDecorators = [
  applicationConfig({
    providers: [provideAnimations(), ...TranslateModule.forRoot().providers!],
  }),
];

export const NotRequiredNotMultiple: Story = {
  name: 'Shows unchecked checkboxes for 0-1 cardinality',
  decorators: sharedDecorators,
  args: {
    classProp: { ...classProp, iHasProperty: { ...classProp.iHasProperty, cardinality: Cardinality._0_1 } },
    disabled: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Two checkboxes are rendered', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      await expect(checkboxes).toHaveLength(2);
    });
    await step('Both checkboxes are unchecked', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      await expect(checkboxes[0]).not.toBeChecked();
      await expect(checkboxes[1]).not.toBeChecked();
    });
  },
};

export const RequiredSingle: Story = {
  name: 'Shows required checked for exactly-one cardinality',
  decorators: sharedDecorators,
  args: {
    classProp: { ...classProp, iHasProperty: { ...classProp.iHasProperty, cardinality: Cardinality._1 } },
    disabled: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Required checkbox is checked', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      await expect(checkboxes[1]).toBeChecked();
    });
  },
};

export const DisabledState: Story = {
  name: 'Disables checkboxes when disabled input is true',
  decorators: sharedDecorators,
  args: {
    classProp,
    disabled: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Both checkboxes are disabled', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      await expect(checkboxes[0]).toBeDisabled();
      await expect(checkboxes[1]).toBeDisabled();
    });
  },
};
