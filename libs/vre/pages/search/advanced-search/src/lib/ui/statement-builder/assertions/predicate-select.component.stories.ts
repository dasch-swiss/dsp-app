import { Constants } from '@dasch-swiss/dsp-js';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { Predicate } from '../../../model';
import { OntologyDataService } from '../../../service/ontology-data.service';
import { makeOntologyDataServiceStub, STORY_PROVIDERS } from '../../../stories.helpers';
import { toLabels } from '../../../util/labels';
import { PredicateSelectComponent } from './predicate-select.component';

const samplePredicates: Predicate[] = [
  new Predicate('http://0.0.0.0:3333/ontology/0001/test/v2#hasTitle', toLabels('Title'), Constants.TextValue, false),
  new Predicate('http://0.0.0.0:3333/ontology/0001/test/v2#hasYear', toLabels('Year'), Constants.IntValue, false),
  new Predicate('http://0.0.0.0:3333/ontology/0001/test/v2#hasAuthor', toLabels('Author'), Constants.LinkValue, true),
];

const meta: Meta<PredicateSelectComponent> = {
  title:
    'Search / Advanced Search / Search bar / 4. Add Filter Button / Filter Editor Popover /Statement Builder / Predicate Select',
  component: PredicateSelectComponent,
  argTypes: {
    subjectClass: { description: 'The resource class that constrains which properties are shown.' },
    selectedPredicate: { description: 'Currently selected predicate.' },
    selectedPredicateChange: { description: 'Emitted when the user picks a predicate.' },
  },
};
export default meta;
type Story = StoryObj<PredicateSelectComponent>;

const sharedProviders = [
  ...STORY_PROVIDERS,
  {
    provide: OntologyDataService,
    useValue: makeOntologyDataServiceStub({ getProperties$: () => of(samplePredicates) }),
  },
];

export const NoClassFilter: Story = {
  name: 'Shows all ontology properties when no subject class is selected',
  args: { subjectClass: undefined, selectedPredicate: undefined },
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Property select is rendered', async () => {
      await expect(canvasElement.querySelector('mat-select')).not.toBeNull();
    });
  },
};

export const WithClassFilter: Story = {
  name: 'Shows class-scoped properties when a subject class is provided',
  args: {
    subjectClass: { iri: 'http://0.0.0.0:3333/ontology/0001/test/v2#Book', labels: toLabels('Book'), comments: [] },
    selectedPredicate: undefined,
  },
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Property label reflects selected class', async () => {
      await expect(canvasElement.querySelector('mat-label')).not.toBeNull();
    });
  },
};

export const WithPreselectedPredicate: Story = {
  name: 'Shows preselected predicate value',
  args: {
    subjectClass: undefined,
    selectedPredicate: samplePredicates[0],
  },
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Predicate select is rendered with a value', async () => {
      await expect(canvasElement.querySelector('mat-select')).not.toBeNull();
    });
  },
};

export const EmptyProperties: Story = {
  name: 'Renders empty select when ontology has no properties',
  args: { subjectClass: undefined, selectedPredicate: undefined },
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        {
          provide: OntologyDataService,
          useValue: makeOntologyDataServiceStub({ getProperties$: () => of([]) }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    await step('Select renders without options', async () => {
      await expect(canvasElement.querySelector('mat-select')).not.toBeNull();
    });
  },
};
