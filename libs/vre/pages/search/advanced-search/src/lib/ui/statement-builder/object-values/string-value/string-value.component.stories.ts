import { Constants } from '@dasch-swiss/dsp-js';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { STORY_PROVIDERS } from '../../../../stories.helpers';
import { StringValueComponent } from './string-value.component';

const meta: Meta<StringValueComponent> = {
  title: 'Search / Advanced Search / Value Inputs / String Value',
  component: StringValueComponent,
  argTypes: {
    valueType: { description: 'The Knora value type constant that determines which input to render.' },
    value: { description: 'The pre-filled value to show in the input.' },
    emitValueChanged: { description: 'Emitted with the new value string when the input changes.' },
  },
};
export default meta;
type Story = StoryObj<StringValueComponent>;

const baseDecorators = [applicationConfig({ providers: STORY_PROVIDERS })];

export const TextInput: Story = {
  name: 'Renders text input for TextValue type',
  args: { valueType: Constants.TextValue },
  decorators: baseDecorators,
  play: async ({ canvasElement, step }) => {
    await step('Text input is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="text-value-input"]')).not.toBeNull();
    });
  },
};

export const IntegerInput: Story = {
  name: 'Renders integer input for IntValue type',
  args: { valueType: Constants.IntValue },
  decorators: baseDecorators,
  play: async ({ canvasElement, step }) => {
    await step('Integer input is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="integer-input"]')).not.toBeNull();
    });
  },
};

export const DecimalInput: Story = {
  name: 'Renders decimal input for DecimalValue type',
  args: { valueType: Constants.DecimalValue },
  decorators: baseDecorators,
  play: async ({ canvasElement, step }) => {
    await step('Decimal input is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="decimal-input"]')).not.toBeNull();
    });
  },
};

export const UriInput: Story = {
  name: 'Renders URI input for UriValue type',
  args: { valueType: Constants.UriValue },
  decorators: baseDecorators,
  play: async ({ canvasElement, step }) => {
    await step('URI input is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="uri-value-input"]')).not.toBeNull();
    });
  },
};

export const BooleanSelect: Story = {
  name: 'Renders boolean select for BooleanValue type',
  args: { valueType: Constants.BooleanValue },
  decorators: baseDecorators,
  play: async ({ canvasElement, step }) => {
    await step('Boolean select is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="value-select"]')).not.toBeNull();
    });
  },
};

export const PrefilledTextValue: Story = {
  name: 'Shows pre-filled value in text input',
  args: { valueType: Constants.TextValue, value: 'Hamlet' },
  decorators: baseDecorators,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input shows the pre-filled value', async () => {
      const input = canvas.getByRole('textbox') as HTMLInputElement;
      await expect(input.value).toBe('Hamlet');
    });
  },
};

export const ShowsValidationErrorForInvalidUri: Story = {
  name: 'Shows validation error for an invalid URI input',
  args: { valueType: Constants.UriValue },
  decorators: baseDecorators,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Type an invalid URI', async () => {
      const input = canvas.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.type(input, 'not-a-valid-uri');
      await userEvent.tab();
    });
    await step('Validation error is shown', async () => {
      await expect(canvasElement.querySelector('mat-error')).not.toBeNull();
    });
  },
};
