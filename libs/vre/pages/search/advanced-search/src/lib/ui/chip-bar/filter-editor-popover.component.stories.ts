import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { StatementElement } from '../../model';
import { Operator } from '../../operators.config';
import { OntologyDataService } from '../../service/ontology-data.service';
import {
  makeDspApiConnectionStub,
  makeOntologyDataServiceStub,
  PROPERTY_FORM_MANAGER_STORY_PROVIDERS,
  STORY_PROVIDERS,
} from '../../stories.helpers';
import { toLabels } from '../../util/labels';
import { FilterEditorPopoverComponent } from './filter-editor-popover.component';

const blankStatement = (): StatementElement => new StatementElement();

const statementWithPredicate = (): StatementElement => {
  const s = new StatementElement();
  s.selectedPredicate = {
    iri: 'http://ex.org/hasTitle',
    labels: toLabels('Title'),
    comments: [],
    objectValueType: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
    isLinkProperty: false,
  };
  return s;
};

const statementWithOperator = (): StatementElement => {
  const s = statementWithPredicate();
  s.selectedOperator = Operator.IsLike;
  return s;
};

const statementWithExistsOperator = (): StatementElement => {
  const s = statementWithPredicate();
  s.selectedOperator = Operator.Exists;
  return s;
};

const statementWithNotExistsOperator = (): StatementElement => {
  const s = statementWithPredicate();
  s.selectedOperator = Operator.NotExists;
  return s;
};

const meta: Meta<FilterEditorPopoverComponent> = {
  title: 'Search / Advanced Search / Search bar / 4. Add Filter Button / Filter Editor Popover',
  component: FilterEditorPopoverComponent,
  argTypes: {
    statement: { description: 'The StatementElement being edited.' },
  },
};
export default meta;
type Story = StoryObj<FilterEditorPopoverComponent>;

const baseProviders = [
  ...STORY_PROVIDERS,
  importProvidersFrom(OverlayModule),
  { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
  { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
  ...PROPERTY_FORM_MANAGER_STORY_PROVIDERS,
];

export const ShowsPredicateSelect: Story = {
  name: 'Shows predicate select for a blank statement',
  args: { statement: blankStatement() },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Predicate select component is rendered', async () => {
      await expect(canvasElement.querySelector('app-predicate-select')).not.toBeNull();
    });
    await step('Comparison operator component is present', async () => {
      await expect(canvasElement.querySelector('app-comparison-operator')).not.toBeNull();
    });
  },
};

export const ShowsOperatorAfterPredicateSelected: Story = {
  name: 'Shows comparison operator once a predicate is selected',
  args: { statement: statementWithPredicate() },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Predicate select is rendered', async () => {
      await expect(canvasElement.querySelector('app-predicate-select')).not.toBeNull();
    });
    await step('Comparison operator is shown', async () => {
      await expect(canvasElement.querySelector('app-comparison-operator')).not.toBeNull();
    });
  },
};

export const ShowsStringValueInput: Story = {
  name: 'Shows string value input after operator is selected',
  args: { statement: statementWithOperator() },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('String value input is rendered', async () => {
      await expect(canvasElement.querySelector('app-string-value')).not.toBeNull();
    });
  },
};

export const PopoverLayout: Story = {
  name: 'Renders inside an elevated card with correct structure',
  args: { statement: blankStatement() },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Elevated popover container is present', async () => {
      const container = canvasElement.querySelector('.filter-editor-popover');
      await expect(container).not.toBeNull();
    });
  },
};

export const HidesValueInputForExistsOperator: Story = {
  name: 'Hides value input when operator is Exists',
  args: { statement: statementWithExistsOperator() },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Comparison operator is shown', async () => {
      await expect(canvasElement.querySelector('app-comparison-operator')).not.toBeNull();
    });
    await step('No value input is rendered for Exists operator', async () => {
      await expect(canvasElement.querySelector('app-string-value')).toBeNull();
      await expect(canvasElement.querySelector('app-link-value')).toBeNull();
      await expect(canvasElement.querySelector('app-list-value')).toBeNull();
      await expect(canvasElement.querySelector('app-resource-value')).toBeNull();
    });
  },
};

export const HidesValueInputForNotExistsOperator: Story = {
  name: 'Hides value input when operator is NotExists',
  args: { statement: statementWithNotExistsOperator() },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Comparison operator is shown', async () => {
      await expect(canvasElement.querySelector('app-comparison-operator')).not.toBeNull();
    });
    await step('No value input is rendered for NotExists operator', async () => {
      await expect(canvasElement.querySelector('app-string-value')).toBeNull();
      await expect(canvasElement.querySelector('app-link-value')).toBeNull();
      await expect(canvasElement.querySelector('app-list-value')).toBeNull();
      await expect(canvasElement.querySelector('app-resource-value')).toBeNull();
    });
  },
};

// Dispatch a real, bubbling Enter keydown from a field inside the popover. Angular's `(keydown.enter)`
// on the container catches the bubbling event — this mirrors a user pressing Enter while typing in a
// field, without depending on the container div being focusable.
const pressEnterInside = (canvasElement: HTMLElement) => {
  const target = canvasElement.querySelector('.filter-editor-popover app-predicate-select') as HTMLElement;
  target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
};

export const ConfirmsOnEnterWhenComplete: Story = {
  name: 'Pressing Enter confirms the filter when it is complete',
  // Exists is a complete statement on its own (no value required), so Enter should submit immediately.
  args: { statement: statementWithExistsOperator(), filterConfirm: fn() },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, args, step }) => {
    await step('Press Enter inside the popover', async () => {
      pressEnterInside(canvasElement);
    });
    await step('filterConfirm is emitted', async () => {
      await expect(args.filterConfirm).toHaveBeenCalled();
    });
  },
};

export const DoesNotConfirmOnEnterWhenIncomplete: Story = {
  name: 'Pressing Enter does not confirm an incomplete filter',
  // Only a predicate is selected (no operator/value), so the statement is incomplete and Enter must not submit.
  args: { statement: statementWithPredicate(), filterConfirm: fn() },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, args, step }) => {
    await step('Press Enter on the incomplete popover', async () => {
      pressEnterInside(canvasElement);
    });
    await step('filterConfirm is not emitted', async () => {
      await expect(args.filterConfirm).not.toHaveBeenCalled();
    });
  },
};
