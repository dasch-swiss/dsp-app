import { Meta, StoryObj } from '@storybook/angular';
import { expect, fn, userEvent } from 'storybook/test';
import { DataClassConnectionsComponent } from './data-class-connections.component';
import { DataModelEdge, DataModelGraph, DataModelNode } from './data-model-graph';

const ONTO = 'http://0.0.0.0:3333/ontology/0102/scenario-tanner/v2#';
const cls = (name: string, count: number): DataModelNode => ({
  id: ONTO + name,
  label: name,
  kind: 'class',
  count,
  navigable: true,
});
const link = (source: string, target: string, label: string): DataModelEdge => ({
  source: ONTO + source,
  target: ONTO + target,
  property: ONTO + label,
  label,
  kind: 'link',
});

/** scenario-tanner around Film: six classes link to it, it links to Person. */
const GRAPH: DataModelGraph = {
  nodes: [
    cls('Film', 319),
    cls('Person', 1086),
    cls('Page', 17949),
    cls('Script', 207),
    cls('Promotion', 453),
    cls('Production', 831),
    cls('Correspondence', 865),
    cls('Critical reception', 1559),
  ],
  edges: [
    link('Film', 'Person', 'Director'),
    link('Film', 'Person', 'Writer'),
    ...['Page', 'Script', 'Promotion', 'Production', 'Correspondence', 'Critical reception'].map(name =>
      link(name, 'Film', 'Film related to the document')
    ),
  ],
};

/** Spy for the class a chip opened; outputs bound in a host template, as args do not reach signal outputs. */
const classSelected = fn().mockName('classSelected');

const meta: Meta<DataClassConnectionsComponent> = {
  title: 'Data Browser / Class Header / Connections',
  component: DataClassConnectionsComponent,
  render: args => ({
    props: { ...args, onClassSelected: classSelected },
    template: `<div style="width: 720px"><app-data-class-connections [graph]="graph" [classIri]="classIri" (classSelected)="onClassSelected($event)" /></div>`,
  }),
  args: { graph: GRAPH, classIri: ONTO + 'Film' },
  argTypes: {
    graph: { description: 'The data model the class belongs to.' },
    classIri: { description: 'IRI of the class in the middle of the line.' },
    anyResourceLabel: { description: 'Label of the chip for links that point at any resource.' },
    subclassLabel: { description: 'Label of a line between a class and its superclass or subclass.' },
    classSelected: { description: 'Emits the IRI of a linked class chip that was clicked.' },
  },
};

export default meta;
type Story = StoryObj<DataClassConnectionsComponent>;

const names = (canvasElement: HTMLElement, side: 'incoming' | 'outgoing') =>
  Array.from(canvasElement.querySelectorAll(`.${side} .chip .label`)).map(n => n.textContent?.trim());

/** One line: the classes linking to the class, an arrow, the class, an arrow, the classes it links to. */
export const ShowsLinkingClassesBeforeAndLinkedClassesAfter: Story = {
  play: async ({ canvasElement }) => {
    await expect(names(canvasElement, 'incoming')).toHaveLength(3);
    await expect(canvasElement.querySelector('.incoming .more')).toHaveTextContent('+3');
    await expect(names(canvasElement, 'outgoing')).toEqual(['Person']);
    await expect(canvasElement.querySelector('[data-cy="data-class-connections-centre"]')).toHaveTextContent('Film');
  },
};

/** "+N more" shows the rest of that side. */
export const ShowsTheRestWhenMoreIsClicked: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(canvasElement.querySelector('.incoming .more') as HTMLElement);

    await expect(names(canvasElement, 'incoming')).toHaveLength(6);
    await expect(canvasElement.querySelector('.incoming .more')).toBeNull();
  },
};

/** Clicking a linked class opens it. */
export const OpensALinkedClassWhenClicked: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(canvasElement.querySelector('.outgoing .chip') as HTMLElement);
    await expect(classSelected).toHaveBeenCalledWith(ONTO + 'Person');
  },
};

/** A class nothing links to starts the line. */
export const StartsWithTheClassWhenNothingLinksToIt: Story = {
  args: { classIri: ONTO + 'Page' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.incoming')).toBeNull();
    await expect(names(canvasElement, 'outgoing')).toEqual(['Film']);
  },
};
