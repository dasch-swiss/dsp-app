import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Predicate, StatementElement } from '../../model';
import { Operator } from '../../operators.config';
import { OntologyDataService } from '../../service/ontology-data.service';
import {
  makeOntologyDataServiceStub,
  PROPERTY_FORM_MANAGER_STORY_PROVIDERS,
  STORY_PROVIDERS,
} from '../../stories.helpers';
import { toLabels } from '../../util/labels';
import { FilterEditorPopoverComponent } from './filter-editor-popover.component';

const TITLE = new Predicate(
  'http://0.0.0.0:3333/ontology/0001/test/v2#hasTitle',
  toLabels('Title'),
  Constants.TextValue,
  false
);

const statementWith = (value?: string): StatementElement => {
  const s = new StatementElement();
  s.selectedPredicate = TITLE;
  s.selectedOperator = Operator.Equals;
  if (value !== undefined) s.selectedObjectValue = value;
  return s;
};

const filterConfirm = fn();

const meta: Meta<FilterEditorPopoverComponent> = {
  title: 'Search / Advanced Search / Search bar / 4. Add Filter Button / Filter Editor Popover',
  component: FilterEditorPopoverComponent,
  // Bind the output to a spy explicitly, so play() can assert on what the popover emitted.
  render: args => ({
    props: { ...args, filterConfirm },
    template: '<app-filter-editor-popover [statement]="statement" (filterConfirm)="filterConfirm()" />',
  }),
  beforeEach: () => {
    filterConfirm.mockClear();
  },
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        ...PROPERTY_FORM_MANAGER_STORY_PROVIDERS,
        { provide: OntologyDataService, useValue: makeOntologyDataServiceStub({ getProperties$: () => of([TITLE]) }) },
      ],
    }),
  ],
  argTypes: {
    statement: {
      description: 'The filter being edited, with all its subcriteria.',
      table: { type: { summary: 'StatementElement' }, category: 'Content' },
    },
    isPristine: {
      description: 'Whether the filter is new and untouched.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Behavior' },
    },
    filterConfirm: {
      description: 'Emitted when "Add" is clicked (or Enter pressed) and the whole filter is complete.',
      table: { category: 'Events', type: { summary: 'EventEmitter<void>' } },
    },
    filterCancel: {
      description: 'Emitted when editing is cancelled.',
      table: { category: 'Events', type: { summary: 'EventEmitter<void>' } },
    },
  },
};
export default meta;
type Story = StoryObj<FilterEditorPopoverComponent>;

export const DoesNotConfirmIncompleteFilter: Story = {
  name: 'Does not confirm a filter that has no value yet',
  args: { statement: statementWith() },
  play: async ({ canvasElement, step }) => {
    await step('Click "Add"', async () => {
      await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Add' }));
    });
    await step('The filter is not confirmed', async () => {
      await expect(filterConfirm).not.toHaveBeenCalled();
    });
  },
};

export const ConfirmsCompleteFilter: Story = {
  name: 'Confirms a complete filter when "Add" is clicked',
  args: { statement: statementWith('Hamlet') },
  play: async ({ canvasElement, step }) => {
    await step('Click "Add"', async () => {
      await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Add' }));
    });
    await step('The filter is confirmed', async () => {
      await expect(filterConfirm).toHaveBeenCalledOnce();
    });
  },
};

export const ConfirmsOnEnter: Story = {
  name: 'Confirms a complete filter when Enter is pressed',
  args: { statement: statementWith('Hamlet') },
  play: async ({ canvasElement, step }) => {
    await step('Press Enter in the value input', async () => {
      const input = await within(canvasElement).findByDisplayValue('Hamlet');
      await userEvent.type(input, '{Enter}');
    });
    await step('The filter is confirmed', async () => {
      await expect(filterConfirm).toHaveBeenCalledOnce();
    });
  },
};
