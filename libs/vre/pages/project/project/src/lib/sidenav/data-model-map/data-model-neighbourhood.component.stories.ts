import { Meta, StoryObj } from '@storybook/angular';
import { expect, fn, userEvent } from 'storybook/test';
import { DataModelEdge, DataModelGraph, DataModelNode } from './data-model-graph';
import { DataModelNeighbourhoodComponent } from './data-model-neighbourhood.component';

const ONTO = 'http://0.0.0.0:3333/ontology/0001/dasch/v2#';
const cls = (name: string, count: number, extra: Partial<DataModelNode> = {}): DataModelNode => ({
  id: ONTO + name,
  label: name,
  kind: 'class',
  count,
  navigable: true,
  ...extra,
});
const link = (source: string, target: string, label: string): DataModelEdge => ({
  source: ONTO + source,
  target: ONTO + target,
  property: ONTO + label,
  label,
  kind: 'link',
});

/** The neighbourhood of the I1 design: Events and Videos link to Slides and Posters, which links to Author. */
const GRAPH: DataModelGraph = {
  nodes: [
    cls('Slides and Posters', 91, {
      representationClass: 'DocumentRepresentation',
      description: 'Slides and posters presented at DaSCH events.',
      properties: ['Title', 'Language', 'Topic', 'Licence', 'Other PID', 'Date', 'Keywords'],
    }),
    cls('Events', 24),
    cls('Videos', 35, { representationClass: 'MovingImageRepresentation' }),
    cls('Author', 69),
    cls('Institution', 11),
  ],
  edges: [
    link('Events', 'Slides and Posters', 'contributions'),
    link('Videos', 'Slides and Posters', 'slides / poster'),
    link('Slides and Posters', 'Author', 'author(s)'),
    link('Institution', 'Author', 'author(s)'),
  ],
};

const meta: Meta<DataModelNeighbourhoodComponent> = {
  title: 'Data Browser / Sidebar / Class Neighbourhood',
  component: DataModelNeighbourhoodComponent,
  render: args => ({
    props: args,
    template: `<div style="width: 300px"><app-data-model-neighbourhood [graph]="graph" [classIri]="classIri" (classSelected)="classSelected($event)" /></div>`,
  }),
  args: { graph: GRAPH, classIri: ONTO + 'Slides and Posters', classSelected: fn() },
  argTypes: {
    graph: { description: 'The data model the class belongs to.' },
    classIri: { description: 'IRI of the class shown in the middle.' },
    anyResourceLabel: { description: 'Label of the card for links that point at any resource.' },
    subclassLabel: { description: 'Label of a line between a class and its superclass or subclass.' },
    classSelected: { description: 'Emits the IRI of a linked class card that was clicked.' },
  },
};

export default meta;
type Story = StoryObj<DataModelNeighbourhoodComponent>;

const names = (canvasElement: HTMLElement, row: number) =>
  Array.from(canvasElement.querySelectorAll('.row')[row].querySelectorAll('.card .name')).map(n =>
    n.textContent?.trim()
  );

/** Classes that link to the class sit above it, the classes it links to below, each line named after its property. */
export const ShowsLinkingClassesAboveAndLinkedClassesBelow: Story = {
  play: async ({ canvasElement }) => {
    await expect(names(canvasElement, 0)).toEqual(['Events', 'Videos']);
    await expect(names(canvasElement, 1)).toEqual(['Author']);
    const labels = Array.from(canvasElement.querySelectorAll('.connector span')).map(l => l.textContent?.trim());
    await expect(labels).toEqual(['contributions', 'slides / poster', 'author(s)']);
  },
};

/** The class in the middle shows its count, description and the first four properties, then "+N". */
export const SummarisesTheClassInTheMiddle: Story = {
  play: async ({ canvasElement }) => {
    const centre = canvasElement.querySelector('[data-cy="data-model-neighbourhood-centre"]') as HTMLElement;

    await expect(centre).toHaveTextContent('Slides and Posters');
    await expect(centre).toHaveTextContent('Slides and posters presented at DaSCH events.');
    await expect(centre.querySelectorAll('.chip')).toHaveLength(4);
    await expect(centre.querySelector('.more')).toHaveTextContent('+3');
  },
};

/** Clicking a linked class opens it. */
export const OpensALinkedClassWhenClicked: Story = {
  play: async ({ args, canvasElement }) => {
    const author = Array.from(canvasElement.querySelectorAll<HTMLElement>('.card')).find(card =>
      card.textContent?.includes('Author')
    )!;

    await userEvent.click(author);
    await expect(args.classSelected).toHaveBeenCalledWith(ONTO + 'Author');
  },
};

/** A class without links says so instead of drawing empty rows. */
export const SaysWhenTheClassHasNoLinks: Story = {
  args: { graph: { nodes: [cls('Visuals', 3)], edges: [] }, classIri: ONTO + 'Visuals' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.no-links')).not.toBeNull();
    await expect(canvasElement.querySelectorAll('.card')).toHaveLength(0);
  },
};
