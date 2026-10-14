import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { StatementElement } from '../../model';
import { Operator } from '../../operators.config';
import { ListNodeLabelResolver } from '../../service/list-node-label.resolver';
import { OntologyDataService } from '../../service/ontology-data.service';
import {
  makeDspApiConnectionStub,
  makeListNodeLabelResolverStub,
  makeOntologyDataServiceStub,
  PROPERTY_FORM_MANAGER_STORY_PROVIDERS,
  STORY_PROVIDERS,
} from '../../stories.helpers';
import { toLabels } from '../../util/labels';
import { FilterChipComponent } from './filter-chip.component';

const titleStatement = (): StatementElement => {
  const s = new StatementElement();
  s.selectedPredicate = {
    iri: 'http://ex.org/hasTitle',
    labels: toLabels('Title'),
    comments: [],
    objectValueType: 'TextValue',
    isLinkProperty: false,
  };
  s.selectedOperator = Operator.IsLike;
  s.selectedObjectValue = 'Hamlet';
  return s;
};

/** An "is like" filter holding a glob-style pattern, which is not a valid regex (DEV-7441). */
const globPatternStatement = (): StatementElement => {
  const s = new StatementElement();
  s.selectedPredicate = {
    iri: 'http://ex.org/hasTitle',
    labels: toLabels('Title'),
    comments: [],
    objectValueType: Constants.TextValue,
    isLinkProperty: false,
  };
  s.selectedOperator = Operator.IsLike;
  s.selectedObjectValue = '*MAL*';
  return s;
};

const predicateOnlyStatement = (): StatementElement => {
  const s = new StatementElement();
  s.selectedPredicate = {
    iri: 'http://ex.org/hasAuthor',
    labels: toLabels('Author'),
    comments: [],
    objectValueType: 'TextValue',
    isLinkProperty: false,
  };
  return s;
};

const meta: Meta<FilterChipComponent> = {
  title: 'Search / Advanced Search / Search bar / 3. Filter Chip',
  component: FilterChipComponent,
  argTypes: {
    statement: { description: 'The StatementElement this chip represents.' },
    isOpen: { description: 'Whether the edit popover is open.' },
    openChange: { description: 'Emitted when the popover open state changes.' },
    remove: { description: 'Emitted when the remove button is clicked.' },
  },
};
export default meta;
type Story = StoryObj<FilterChipComponent>;

const baseProviders = [
  ...STORY_PROVIDERS,
  importProvidersFrom(OverlayModule),
  { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
  { provide: OntologyDataService, useValue: makeOntologyDataServiceStub() },
  { provide: ListNodeLabelResolver, useValue: makeListNodeLabelResolverStub() },
  ...PROPERTY_FORM_MANAGER_STORY_PROVIDERS,
];

export const ShowsChipLabel: Story = {
  name: 'Shows the formatted filter label on the chip',
  args: { statement: titleStatement(), isOpen: false },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Chip label contains predicate name', async () => {
      await expect(canvasElement.textContent).toContain('Title');
    });
    await step('Chip label contains operator and value', async () => {
      await expect(canvasElement.textContent).toContain('Hamlet');
    });
  },
};

export const ShowsPredicateWithoutOperator: Story = {
  name: 'Shows only predicate label when operator is not yet selected',
  args: { statement: predicateOnlyStatement(), isOpen: false },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Chip label shows predicate name', async () => {
      await expect(canvasElement.textContent).toContain('Author');
    });
  },
};

export const OpenState: Story = {
  name: 'Renders the chip as a button when popover is open',
  args: { statement: titleStatement(), isOpen: true },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Chip renders as a stroked button', async () => {
      const btn = canvasElement.querySelector('button.filter-chip-button');
      await expect(btn).not.toBeNull();
    });
  },
};

export const ClickingRemoveRendersButton: Story = {
  name: 'Remove button is accessible via aria-label',
  args: { statement: titleStatement(), isOpen: false },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Remove control with aria-label is rendered', async () => {
      const removeBtn = canvasElement.querySelector('[aria-label="Remove filter"]');
      await expect(removeBtn).not.toBeNull();
    });
    await step('Remove control is the cancel icon', async () => {
      const icon = canvasElement.querySelector('mat-icon[aria-label="Remove filter"]');
      await expect(icon?.textContent?.trim()).toBe('cancel');
    });
  },
};

export const InvalidChipShowsWarnColor: Story = {
  name: 'Shows warn color when chip has an incomplete statement',
  args: { statement: titleStatement(), isOpen: false, isValid: false },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Chip button is flagged invalid when the statement is incomplete', async () => {
      const btn = canvasElement.querySelector('button.filter-chip-button');
      await expect(btn).not.toBeNull();
      await expect(btn?.classList.contains('filter-chip-button--invalid')).toBe(true);
    });
  },
};

export const ShowsRegexErrorInsideTheOpenPopover: Story = {
  name: 'Shows why an "is like" filter with an invalid pattern cannot be added',
  args: { statement: globPatternStatement(), isOpen: true },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    // The popover renders in a CDK overlay, outside the story canvas.
    const page = within(document.body);
    await step('Open the filter for editing', async () => {
      await userEvent.click(canvasElement.querySelector('button.filter-chip-button') as HTMLElement);
    });
    await step('Leave the pattern field', async () => {
      await userEvent.click(await page.findByDisplayValue('*MAL*'));
      await userEvent.tab();
    });
    await step('The regex error is visible inside the popover', async () => {
      // The popover used to hide every form-field subscript, and with it this error.
      await expect(await page.findByText(/Not a valid regular expression/)).toBeVisible();
    });
  },
};
