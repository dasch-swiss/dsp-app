import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { ResourceRepresentationContainerComponent } from './resource-representation-container.component';

const meta: Meta<ResourceRepresentationContainerComponent> = {
  title: 'Resource Editor / 3. Representation / Resource Representation Container',
  component: ResourceRepresentationContainerComponent,
  argTypes: {
    height: {
      description: "Controls the height mode of the representation container: 'auto', 'small', or 'big'.",
      table: { type: { summary: "'auto' | 'small' | 'big'" }, category: 'State' },
      control: { type: 'select' },
      options: ['auto', 'small', 'big'],
    },
    restrictedView: {
      description:
        'Whether the asset inside the container is served in reduced quality, i.e. the file value is RV. Overlays the asset-level restriction badge.',
      table: { type: { summary: 'boolean' }, category: 'State' },
      control: { type: 'boolean' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceRepresentationContainerComponent>;

export const BigHeight: Story = {
  name: 'Shows representation container in big height mode',
  args: { height: 'big' },
  render: args => ({
    props: args,
    template: `<app-resource-representation-container height="big">Content</app-resource-representation-container>`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Container renders with projected content', async () => {
      await expect(canvasElement.textContent).toContain('Content');
    });
  },
};

export const SmallHeight: Story = {
  name: 'Shows representation container in small height mode',
  args: { height: 'small' },
  render: args => ({
    props: args,
    template: `<app-resource-representation-container height="small">Content</app-resource-representation-container>`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Container renders with projected content', async () => {
      await expect(canvasElement.textContent).toContain('Content');
    });
  },
};

export const RestrictedView: Story = {
  name: 'Overlays the restriction badge on the asset without displacing the content',
  args: { height: 'small', restrictedView: true },
  render: args => ({
    props: args,
    template: `<app-resource-representation-container height="small" [restrictedView]="restrictedView">Content</app-resource-representation-container>`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Badge is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="asset-restricted-badge"]')).not.toBeNull();
    });
    await step('Badge is overlaid, so it takes no space from the asset', async () => {
      const badge = canvasElement.querySelector('[data-cy="asset-restricted-badge"]') as HTMLElement;
      await expect(getComputedStyle(badge.parentElement!).position).toBe('absolute');
    });
    await step('Projected content is still rendered', async () => {
      await expect(canvasElement.textContent).toContain('Content');
    });
  },
};

export const UnrestrictedView: Story = {
  name: 'Shows no badge when the asset is served in full quality',
  args: { height: 'small', restrictedView: false },
  render: args => ({
    props: args,
    template: `<app-resource-representation-container height="small" [restrictedView]="restrictedView">Content</app-resource-representation-container>`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('No badge is rendered', async () => {
      await expect(canvasElement.querySelector('[data-cy="asset-restricted-badge"]')).toBeNull();
    });
  },
};
