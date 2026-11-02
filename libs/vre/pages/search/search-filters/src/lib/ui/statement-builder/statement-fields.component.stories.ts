import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { Predicate, StatementElement } from '../../model';
import { Operator } from '../../operators.config';
import { OntologyDataService } from '../../service/ontology-data.service';
import {
  makeOntologyDataServiceStub,
  PROPERTY_FORM_MANAGER_STORY_PROVIDERS,
  STORY_PROVIDERS,
} from '../../stories.helpers';
import { toLabels } from '../../util/labels';
import { StatementFieldsComponent } from './statement-fields.component';

const TITLE = new Predicate(
  'http://0.0.0.0:3333/ontology/0001/test/v2#hasTitle',
  toLabels('Title'),
  Constants.TextValue,
  false
);
// A link property whose object is a project class (not a knora-api value type): with "Matches" it opens a sub-query.
const AUTHOR = new Predicate(
  'http://0.0.0.0:3333/ontology/0001/test/v2#hasAuthor',
  toLabels('Author'),
  'http://0.0.0.0:3333/ontology/0001/test/v2#Person',
  true
);

const titleStatement = (): StatementElement => {
  const s = new StatementElement();
  s.selectedPredicate = TITLE;
  s.selectedOperator = Operator.Equals;
  s.selectedObjectValue = 'Hamlet';
  return s;
};

const subQueryStatement = (): StatementElement => {
  const s = new StatementElement();
  s.selectedPredicate = AUTHOR;
  s.selectedOperator = Operator.Matches;
  return s;
};

// Subcriterion rows only — Storybook's own host element for the story is also an app-statement-fields.
const NESTED_ROWS = '.statement-fields__children app-statement-fields';

const meta: Meta<StatementFieldsComponent> = {
  title:
    'Search / Advanced Search / Search bar / 4. Add Filter Button / Filter Editor Popover /Statement Builder / Statement Fields',
  component: StatementFieldsComponent,
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        importProvidersFrom(OverlayModule),
        ...PROPERTY_FORM_MANAGER_STORY_PROVIDERS,
        {
          provide: OntologyDataService,
          useValue: makeOntologyDataServiceStub({ getProperties$: () => of([TITLE, AUTHOR]) }),
        },
      ],
    }),
  ],
  argTypes: {
    statement: {
      description: 'The statement whose predicate, operator and value inputs are rendered.',
      table: { type: { summary: 'StatementElement' }, category: 'Content' },
    },
    isSubcriterion: {
      description: 'Marks the row as a subcriterion, which adds a remove button.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Behavior' },
    },
    showErrors: {
      description: 'Highlights incomplete inputs; passed down to subcriteria.',
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Behavior' },
    },
  },
};
export default meta;
type Story = StoryObj<StatementFieldsComponent>;

export const ShowsPredicateOperatorAndValue: Story = {
  name: 'Shows the predicate, operator and text value of a top-level statement',
  args: { statement: titleStatement() },
  play: async ({ canvasElement, step }) => {
    await step('Predicate, operator and text value inputs are rendered', async () => {
      await expect(canvasElement.querySelector('app-predicate-select')).not.toBeNull();
      await expect(canvasElement.querySelector('app-comparison-operator')).not.toBeNull();
      await expect(canvasElement.querySelector('app-string-value')).not.toBeNull();
    });
    await step('A top-level row has no remove button', async () => {
      await expect(canvasElement.querySelector('.statement-fields__remove')).toBeNull();
    });
  },
};

export const SubcriterionHasRemoveButton: Story = {
  name: 'Shows a remove button on a subcriterion row',
  args: { statement: titleStatement(), isSubcriterion: true },
  play: async ({ canvasElement, step }) => {
    await step('Remove sub-criteria button is rendered', async () => {
      await expect(
        await within(canvasElement).findByRole('button', { name: 'Remove sub-criteria' })
      ).toBeInTheDocument();
    });
  },
};

export const AddsSubcriterionToSubQuery: Story = {
  name: 'Adds a nested subcriterion row when a link property matches a resource class',
  args: { statement: subQueryStatement() },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('The sub-query renders a resource value and no subcriteria yet', async () => {
      await expect(canvasElement.querySelector('app-resource-value')).not.toBeNull();
      await expect(canvasElement.querySelectorAll(NESTED_ROWS)).toHaveLength(0);
    });
    await step('Click "Add sub-criteria"', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /Add sub-criteria/ }));
    });
    await step('A nested subcriterion row with a remove button appears', async () => {
      await expect(canvasElement.querySelectorAll(NESTED_ROWS)).toHaveLength(1);
      await expect(canvas.getByRole('button', { name: 'Remove sub-criteria' })).toBeInTheDocument();
    });
  },
};
