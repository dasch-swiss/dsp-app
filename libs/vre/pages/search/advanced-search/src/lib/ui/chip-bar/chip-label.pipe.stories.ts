import { Component } from '@angular/core';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { IriLabelPair, StatementElement } from '../../model';
import { Operator } from '../../operators.config';
import { toLabels } from '../../util/labels';
import { ChipLabelPipe } from './chip-label.pipe';

@Component({
  selector: 'app-chip-label-pipe-harness',
  standalone: true,
  imports: [ChipLabelPipe],
  template: `<span class="label">{{ statement | chipLabel }}</span>`,
})
class ChipLabelPipeHarnessComponent {
  statement = new StatementElement();
}

const makeStatement = (overrides: {
  predicateLabel?: string;
  operator?: Operator;
  objectValue?: string | IriLabelPair;
}): StatementElement => {
  const s = new StatementElement();
  if (overrides.predicateLabel) {
    s.selectedPredicate = {
      iri: 'http://ex.org/prop',
      labels: toLabels(overrides.predicateLabel),
      comments: [],
      objectValueType: 'TextValue',
      isLinkProperty: false,
    };
  }
  if (overrides.operator) s.selectedOperator = overrides.operator;
  if (overrides.objectValue !== undefined) s.selectedObjectValue = overrides.objectValue;
  return s;
};

const meta: Meta<ChipLabelPipeHarnessComponent> = {
  title: 'Search / Advanced Search / Chip Bar / 3b. Filter Editor Popover / Chip Label Pipe',
  component: ChipLabelPipeHarnessComponent,
};
export default meta;
type Story = StoryObj<ChipLabelPipeHarnessComponent>;

export const PredicateWithDefaultOperator: Story = {
  name: 'Shows predicate with default equals operator when no value is set',
  args: { statement: makeStatement({ predicateLabel: 'Title' }) },
  play: async ({ canvasElement }) => {
    const label = canvasElement.querySelector('.label')?.textContent?.trim() ?? '';
    await expect(label).toContain('Title');
    await expect(label).toContain('equals');
  },
};

export const ExistsOperator: Story = {
  name: 'Shows "exists" suffix for Exists operator',
  args: { statement: makeStatement({ predicateLabel: 'Author', operator: Operator.Exists }) },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.label')?.textContent?.trim()).toBe('Author exists');
  },
};

export const NotExistsOperator: Story = {
  name: 'Shows "does not exist" suffix for NotExists operator',
  args: { statement: makeStatement({ predicateLabel: 'Author', operator: Operator.NotExists }) },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.label')?.textContent?.trim()).toBe('Author does not exist');
  },
};

export const IsLikeWithValue: Story = {
  name: 'Shows is-like pattern with quoted value',
  args: {
    statement: makeStatement({ predicateLabel: 'Title', operator: Operator.IsLike, objectValue: 'Hamlet' }),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.label')?.textContent?.trim()).toBe('Title is like "Hamlet"');
  },
};

export const EqualsWithObjectLabel: Story = {
  name: 'Shows object label for IriLabelPair value',
  args: {
    statement: makeStatement({
      predicateLabel: 'Author',
      operator: Operator.Equals,
      objectValue: { iri: 'http://ex.org/person1', labels: toLabels('Shakespeare'), comments: [] },
    }),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.label')?.textContent?.trim()).toBe('Author equals Shakespeare');
  },
};

export const TruncatesLongValue: Story = {
  name: 'Truncates value labels longer than 20 characters',
  args: {
    statement: makeStatement({
      predicateLabel: 'Title',
      operator: Operator.IsLike,
      objectValue: 'A Very Long Title That Exceeds Limit',
    }),
  },
  play: async ({ canvasElement }) => {
    const label = canvasElement.querySelector('.label')?.textContent?.trim() ?? '';
    await expect(label).toContain('…');
    await expect(label.length).toBeLessThan(60);
  },
};
