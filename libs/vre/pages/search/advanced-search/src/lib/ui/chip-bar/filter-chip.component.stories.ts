import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, within } from 'storybook/test';
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
import { FilterChipComponent } from './filter-chip.component';

const titleStatement = (): StatementElement => {
  const s = new StatementElement();
  s.selectedPredicate = { iri: 'http://ex.org/hasTitle', label: 'Title', objectValueType: 'TextValue' } as any;
  s.selectedOperator = Operator.IsLike;
  s.selectedObjectValue = 'Hamlet';
  return s;
};

const predicateOnlyStatement = (): StatementElement => {
  const s = new StatementElement();
  s.selectedPredicate = { iri: 'http://ex.org/hasAuthor', label: 'Author', objectValueType: 'TextValue' } as any;
  return s;
};

const meta: Meta<FilterChipComponent> = {
  title: 'Search / Advanced Search / Chip Bar / 3a. Filter Chip',
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
  { provide: SearchStateService, useValue: makeSearchStateServiceStub() },
  PropertyFormManager,
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
  name: 'Highlights chip when popover is open',
  args: { statement: titleStatement(), isOpen: true },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Chip carries highlighted attribute when isOpen is true', async () => {
      const chip = canvasElement.querySelector('mat-chip');
      await expect(chip).not.toBeNull();
      await expect(chip?.classList.contains('mat-mdc-chip-highlighted') || chip?.hasAttribute('highlighted')).toBe(true);
    });
  },
};

export const ClickingRemoveEmitsEvent: Story = {
  name: 'Emits remove event when remove button is clicked',
  args: { statement: titleStatement(), isOpen: false, remove: fn() },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, args, step }) => {
    await step('Remove button is rendered', async () => {
      const removeBtn = canvasElement.querySelector('[matChipRemove]');
      await expect(removeBtn).not.toBeNull();
    });
    await step('Click the remove button', async () => {
      const removeBtn = canvasElement.querySelector('[matChipRemove]') as HTMLElement;
      await userEvent.click(removeBtn);
    });
    await step('remove output was emitted once', async () => {
      await expect(args.remove).toHaveBeenCalledTimes(1);
    });
  },
};

export const InvalidChipShowsWarnColor: Story = {
  name: 'Shows warn color when chip has an incomplete statement',
  args: { statement: titleStatement(), isOpen: false, isValid: false },
  decorators: [applicationConfig({ providers: baseProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Chip is rendered', async () => {
      await expect(canvasElement.querySelector('mat-chip')).not.toBeNull();
    });
    await step('Chip carries highlighted attribute due to invalid state', async () => {
      const chip = canvasElement.querySelector('mat-chip');
      await expect(chip?.classList.contains('mat-mdc-chip-highlighted') || chip?.hasAttribute('highlighted')).toBe(true);
    });
  },
};
