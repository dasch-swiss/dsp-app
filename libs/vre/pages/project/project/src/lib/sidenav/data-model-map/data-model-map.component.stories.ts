import { Constants } from '@dasch-swiss/dsp-js';
import { Meta, StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { DataModelEdge, DataModelGraph, DataModelNode } from './data-model-graph';
import { DataModelMapComponent } from './data-model-map.component';

const ONTO = 'http://0.0.0.0:3333/ontology/0001/dasch/v2#';
const cls = (name: string, count: number): DataModelNode => ({
  id: ONTO + name,
  label: name,
  kind: 'class',
  count,
  navigable: true,
});
const link = (source: string, target: string, property: string): DataModelEdge => ({
  source: ONTO + source,
  target: ONTO + target,
  property: ONTO + property,
  label: property,
  kind: 'link',
});

/** The model of the J1 design: six classes link to Author, Events link to Slides, Visuals stand alone. */
const DASCH: DataModelGraph = {
  nodes: [
    cls('Events', 24),
    cls('Visuals', 3),
    cls('Institution', 11),
    cls('Programmes', 9),
    cls('Archive', 4),
    cls('Publications', 6),
    cls('Slides and Posters', 91),
    cls('Videos', 35),
    cls('Manuals', 1),
    cls('Author', 69),
    cls('Reports', 6),
  ],
  edges: [
    link('Events', 'Slides and Posters', 'slides'),
    ...['Institution', 'Programmes', 'Archive', 'Publications', 'Slides and Posters', 'Videos'].map(name =>
      link(name, 'Author', 'author')
    ),
    link('Publications', 'Reports', 'report'),
    link('Archive', 'Manuals', 'manual'),
    { source: ONTO + 'Archive', target: Constants.Resource, property: 'isPartOf', label: 'is part of', kind: 'link' },
  ],
};
DASCH.nodes.push({ id: Constants.Resource, label: 'Resource', kind: 'generic', navigable: false });

const large = (count: number): DataModelGraph => {
  const nodes = Array.from({ length: count }, (_, i) => cls(`Class ${i + 1}`, i * 3));
  return { nodes, edges: nodes.slice(1).map((n, i) => link(`Class ${Math.floor(i / 4) + 1}`, n.label, `p${i % 3}`)) };
};

/** The map's inputs and outputs, plus the width of the sidebar around it, which only the story sets. */
type MapArgs = {
  width: number;
  full?: boolean;
  graph: DataModelGraph;
  selectedIri?: string;
  anyResourceLabel?: string;
  classSelected: (iri: string) => void;
  openFullMap?: () => void;
};

const meta: Meta<MapArgs> = {
  title: 'Data Browser / Sidebar / Data Model Map',
  component: DataModelMapComponent,
  render: args => ({
    props: args,
    template: `<div [style.width.px]="width"><app-data-model-map [graph]="graph" [selectedIri]="selectedIri" (classSelected)="classSelected($event)" /></div>`,
  }),
  args: { width: 360, graph: DASCH, selectedIri: ONTO + 'Slides and Posters', classSelected: fn() },
  argTypes: {
    width: { description: 'Width of the sidebar around the map, in pixels.' },
    graph: { description: 'The data model: a card per class, an edge per link or subclass relation.' },
    selectedIri: { description: 'IRI of the class being browsed; it and its linked classes are highlighted.' },
    anyResourceLabel: { description: 'Label of the card for links that point at any resource.' },
    classSelected: { description: 'Emits the IRI of a class card that was clicked or activated by keyboard.' },
    openFullMap: { description: 'Emits when "Full map" is clicked; the container opens the map over the page.' },
    full: { description: 'Draws the map large, as in the full-map dialog: no header, full cards, wider rows.' },
  },
};

export default meta;
type Story = StoryObj<MapArgs>;

const card = (canvasElement: HTMLElement, label: string) =>
  Array.from(canvasElement.querySelectorAll<HTMLElement>('.card')).find(c =>
    c.querySelector('.label')?.textContent?.includes(label)
  )!;

/** The class being browsed is filled, the classes it links with are outlined, the rest stays grey. */
export const HighlightsTheCurrentClassAndItsNeighbours: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(card(canvasElement, 'Author')).toBeTruthy());

    await expect(card(canvasElement, 'Slides and Posters')).toHaveClass('selected');
    await expect(card(canvasElement, 'Slides and Posters')).toHaveAttribute('aria-current', 'page');
    await expect(card(canvasElement, 'Author')).toHaveClass('neighbour');
    await expect(card(canvasElement, 'Events')).toHaveClass('neighbour');
    await expect(card(canvasElement, 'Institution')).not.toHaveClass('neighbour');
    await expect(canvasElement.querySelectorAll('path.highlighted')).toHaveLength(2);
  },
};

/** Clicking a card opens that class. */
export const OpensAClassWhenItsCardIsClicked: Story = {
  play: async ({ args, canvasElement }) => {
    await waitFor(() => expect(card(canvasElement, 'Author')).toBeTruthy());

    await userEvent.click(card(canvasElement, 'Author'));
    await expect(args.classSelected).toHaveBeenCalledWith(ONTO + 'Author');
  },
};

/** A class without any link has a dashed border and says so. */
export const MarksUnlinkedClassesDashed: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(card(canvasElement, 'Visuals')).toBeTruthy());

    await expect(card(canvasElement, 'Visuals')).toHaveClass('unlinked');
    await expect(getComputedStyle(card(canvasElement, 'Visuals')).borderStyle).toBe('dashed');
  },
};

/** The map is one tab stop on the current class; arrow keys move between cards. */
export const MovesBetweenCardsWithTheArrowKeys: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(card(canvasElement, 'Author')).toBeTruthy());
    await expect(canvasElement.querySelectorAll('.card[tabindex="0"]')).toHaveLength(1);

    card(canvasElement, 'Slides and Posters').focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(document.activeElement).toBe(card(canvasElement, 'Author'));
  },
};

/** Past 20 classes, cards show their name only. */
export const CondensesALargeModel: Story = {
  args: { graph: large(30), selectedIri: undefined },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('.map')).toHaveClass('condensed'));
    await expect(canvasElement.querySelectorAll('.card .meta')).toHaveLength(0);
  },
};

/** Too narrow a sidebar keeps only the header, with the class count and "Full map". */
export const ShowsOnlyTheHeaderWhenTooNarrow: Story = {
  args: { width: 170 },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('.class-count')).toBeTruthy());
    await expect(canvasElement.querySelector('.map')).toBeNull();
    await expect(canvasElement.querySelector('[data-cy="data-model-map-full-map"]')).not.toBeNull();
  },
};

/** The map can be hidden and shown again from its header. */
export const HidesAndShowsTheMap: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('.map')).not.toBeNull());
    const toggle = canvasElement.querySelector('[data-cy="data-model-map-toggle"]') as HTMLElement;

    await userEvent.click(toggle);
    await expect(canvasElement.querySelector('.map')).toBeNull();
    await userEvent.click(toggle);
    await expect(canvasElement.querySelector('.map')).not.toBeNull();
  },
};
