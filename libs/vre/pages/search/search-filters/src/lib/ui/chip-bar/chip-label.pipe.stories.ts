import { Component } from '@angular/core';
import { Constants, StringLiteralV2 } from '@dasch-swiss/dsp-js';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';
import { IriLabelPair, StatementElement } from '../../model';
import { Operator } from '../../operators.config';
import { ListNodeLabelResolver } from '../../service/list-node-label.resolver';
import { OntologyDataService } from '../../service/ontology-data.service';
import {
  CHIP_LABEL_STORY_PROVIDERS,
  makeListNodeLabelResolverStub,
  makeOntologyDataServiceStub,
  STORY_PROVIDERS,
} from '../../stories.helpers';
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
  objectValueType?: string;
  isLinkProperty?: boolean;
  listObjectIri?: string;
  predicateLabels?: StringLiteralV2[];
}): StatementElement => {
  const s = new StatementElement();
  if (overrides.predicateLabel || overrides.predicateLabels) {
    s.selectedPredicate = {
      iri: 'http://ex.org/prop',
      labels: overrides.predicateLabels ?? toLabels(overrides.predicateLabel ?? ''),
      comments: [],
      objectValueType: overrides.objectValueType ?? 'TextValue',
      isLinkProperty: overrides.isLinkProperty ?? false,
      listObjectIri: overrides.listObjectIri,
    };
  }
  if (overrides.operator) s.selectedOperator = overrides.operator;
  if (overrides.objectValue !== undefined) s.selectedObjectValue = overrides.objectValue;
  return s;
};

// The ChipLabelPipe injects LocalizationService (only reads currentLanguage) and StatementDraftStore
// (for nested subcriteria) plus, since DEV-6857, OntologyDataService (for resource-class Matches labels)
// and ListNodeLabelResolver (for list-node labels). CHIP_LABEL_STORY_PROVIDERS bundles the two new deps
// with the manager pair for convenience; individual stories override them with more specific stubs.
const baseProviders = [
  ...STORY_PROVIDERS,
  { provide: LocalizationService, useValue: { currentLanguage: 'en' } as Partial<LocalizationService> },
  ...CHIP_LABEL_STORY_PROVIDERS,
];

const meta: Meta<ChipLabelPipeHarnessComponent> = {
  title: 'Search / Advanced Search / Search bar / 3. Filter Chip / Chip Label Pipe',
  component: ChipLabelPipeHarnessComponent,
  decorators: [applicationConfig({ providers: baseProviders })],
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

// DEV-6857: the chip must resolve list-node labels from the loaded list tree at render time (not from
// a frozen URL string), so it re-translates on language switch. The story stubs a mutable
// LocalizationService and a list-node resolver seeded with de/en/fr labels for one node; the play
// function asserts the chip picks the currently-active language and reacts to a mid-run language flip.
const LIST_ROOT_IRI = 'http://ex.org/lists/root';
const LIST_NODE_IRI = 'http://ex.org/lists/node/1';
const LIST_NODE_LABELS: StringLiteralV2[] = [
  { language: 'de', value: 'Berufs-/Meisterprüfung' },
  { language: 'en', value: 'Professional exam' },
  { language: 'fr', value: 'Examen professionnel' },
];

export const ListValueLabelFromResolver: Story = {
  name: 'DEV-6857: list value chip resolves label from the list-node resolver',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        { provide: LocalizationService, useValue: { currentLanguage: 'en' } },
        ...CHIP_LABEL_STORY_PROVIDERS,
        // Override the empty list-resolver stub from CHIP_LABEL_STORY_PROVIDERS with one that returns
        // real multi-language labels for the story's node IRI.
        {
          provide: ListNodeLabelResolver,
          useValue: makeListNodeLabelResolverStub({ [LIST_NODE_IRI]: LIST_NODE_LABELS }),
        },
      ],
    }),
  ],
  args: {
    statement: makeStatement({
      predicateLabel: 'Field',
      operator: Operator.Equals,
      objectValueType: Constants.ListValue,
      listObjectIri: LIST_ROOT_IRI,
      objectValue: { iri: LIST_NODE_IRI, labels: [], comments: [] },
    }),
  },
  play: async ({ canvasElement }) => {
    const label = canvasElement.querySelector('.label')?.textContent?.trim() ?? '';
    // The chip's IriLabelPair carries no `labels` (mirroring the DEV-6857 URL round-trip where the
    // label is no longer persisted). The pipe pulls the current-language label from the resolver.
    // Full language-switch coverage lives in the Jest spec (chip-label.pipe.spec.ts) — mutating a
    // captured injector value from a play() scope is awkward and would only duplicate that check.
    await expect(label).toBe('Field equals Professional exam');
  },
};

// DEV-6857: same shape but for the resource-class picked with `Matches` on a link property. Labels
// come from the ontology stub. Language change coverage lives in the Jest spec.
const CLASS_IRI = 'http://ex.org/onto/Person';
const CLASS_LABELS: StringLiteralV2[] = [
  { language: 'de', value: 'Person' },
  { language: 'en', value: 'Person' },
  { language: 'fr', value: 'Personne' },
];

export const ResourceClassMatchesFromOntology: Story = {
  name: 'DEV-6857: resource-class Matches chip resolves label from ontology',
  decorators: [
    applicationConfig({
      providers: [
        ...STORY_PROVIDERS,
        { provide: LocalizationService, useValue: { currentLanguage: 'en' } },
        ...CHIP_LABEL_STORY_PROVIDERS,
        // Ontology stub that exposes exactly one resource class, matching the story's IRI.
        {
          provide: OntologyDataService,
          useValue: makeOntologyDataServiceStub({
            resourceClasses$: of([{ iri: CLASS_IRI, labels: CLASS_LABELS, comments: [] }]),
          }),
        },
      ],
    }),
  ],
  args: {
    statement: makeStatement({
      predicateLabels: [
        { language: 'en', value: 'author' },
        { language: 'fr', value: 'auteur' },
      ],
      operator: Operator.Matches,
      // Real link predicates carry the target-class IRI as `objectValueType`, not
      // `knora-api#LinkValue` — see `Predicate` construction in the ontology-data service.
      // `StatementElement.objectType` derives `RESOURCE_OBJECT` from
      // (objectValueType !== KnoraApiV2) + Matches, so the value must be an ontology IRI.
      objectValueType: CLASS_IRI,
      isLinkProperty: true,
      objectValue: { iri: CLASS_IRI, labels: [], comments: [] },
    }),
  },
  play: async ({ canvasElement }) => {
    const label = canvasElement.querySelector('.label')?.textContent?.trim() ?? '';
    // The chip pulled the class label from the ontology stub, not from any URL-frozen `valueLabel`.
    await expect(label).toBe('author matches Person');
  },
};
