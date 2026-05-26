import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { Operator } from '../../../operators.config';
import { STORY_PROVIDERS } from '../../../stories.helpers';
import { ComparisonOperatorComponent } from './comparison-operator.component';

const meta: Meta<ComparisonOperatorComponent> = {
  title: 'Search / Advanced Search / 2b. Statement Builder / Comparison Operator',
  component: ComparisonOperatorComponent,
  argTypes: {
    operators: { description: 'List of available operators to display in the select.' },
    selectedOperator: { description: 'Currently selected operator value.' },
    operatorChange: { description: 'Emitted when the user selects a different operator.' },
  },
};
export default meta;
type Story = StoryObj<ComparisonOperatorComponent>;

const sharedProviders = [...STORY_PROVIDERS];

const ALL_OPERATORS = [
  Operator.Equals,
  Operator.NotEquals,
  Operator.Exists,
  Operator.NotExists,
  Operator.GreaterThan,
  Operator.LessThan,
];

export const DefaultSelection: Story = {
  name: 'Renders operator select with equals pre-selected',
  args: {
    operators: ALL_OPERATORS,
    selectedOperator: Operator.Equals,
  },
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Operator select is rendered', async () => {
      await expect(canvasElement.querySelector('mat-select')).not.toBeNull();
    });
  },
};

export const ExistenceOperators: Story = {
  name: 'Renders only existence operators for URI and Boolean properties',
  args: {
    operators: [Operator.Exists, Operator.NotExists],
    selectedOperator: Operator.Exists,
  },
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Operator select is rendered', async () => {
      await expect(canvasElement.querySelector('mat-select')).not.toBeNull();
    });
  },
};

export const TextOperators: Story = {
  name: 'Renders full text operator set including IsLike and Matches',
  args: {
    operators: [
      Operator.Equals,
      Operator.NotEquals,
      Operator.Exists,
      Operator.NotExists,
      Operator.IsLike,
      Operator.Matches,
    ],
    selectedOperator: Operator.IsLike,
  },
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Operator select is rendered', async () => {
      await expect(canvasElement.querySelector('mat-select')).not.toBeNull();
    });
  },
};
