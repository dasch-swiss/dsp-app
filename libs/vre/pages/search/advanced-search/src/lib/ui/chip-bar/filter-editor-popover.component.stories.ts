import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { StatementElement } from '../../model';
import { Operator } from '../../operators.config';
import { OntologyDataService } from '../../service/ontology-data.service';
import { PropertyFormManager } from '../../service/property-form.manager';
import { SearchStateService } from '../../service/search-state.service';
import {
  makeDspApiConnectionStub,
  makeOntologyDataServiceStub,
  makeSearchStateServiceStub,
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
  title: 'Search / Advanced Search / Chip Bar / 3b. Filter Editor Popover',
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
  { provide: SearchStateService, useValue: makeSearchStateServiceStub() },
  PropertyFormManager,
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
