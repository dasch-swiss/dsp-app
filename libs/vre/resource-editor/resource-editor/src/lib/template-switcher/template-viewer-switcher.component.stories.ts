import { NgTemplateOutlet } from '@angular/common';
import { Component, Input, TemplateRef, signal } from '@angular/core';
import {
  Constants,
  ReadBooleanValue,
  ReadColorValue,
  ReadIntValue,
  ReadTextValueAsString,
  ReadUriValue,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { FootnoteService } from '../resource-properties/footnotes/footnote.service';
import { GeonameService } from './geoname.service';
import { TemplateViewerSwitcherComponent } from './template-viewer-switcher.component';

const makePropDef = (objectType: string) => ({ objectType }) as any;

const resourceServiceStub: Partial<ResourceService> = {
  getResourcePath: (iri: string) => iri.replace('http://rdfh.ch', ''),
};

const geonameServiceStub: Partial<GeonameService> = {
  resolveGeonameID: () =>
    of({
      displayName: 'Bern, Switzerland',
      name: 'Bern',
      country: 'Switzerland',
      location: { lat: 46.948, lng: 7.4474 },
    } as any),
};

const footnoteServiceStub: Partial<FootnoteService> = {
  reloadToken: signal(0),
};

const dspApiConnectionStub = {
  v2: {
    list: {
      getNode: () =>
        of({
          id: 'http://rdfh.ch/lists/0001/item',
          label: 'Item',
          hasRootNode: 'http://rdfh.ch/lists/0001/root',
          children: [],
          comments: [],
        }),
      getList: () =>
        of({ id: 'http://rdfh.ch/lists/0001/root', label: 'Root', isRootNode: true, children: [], comments: [] }),
    },
  },
};

const resourceFetcherServiceStub: Partial<ResourceFetcherService> = {
  resource$: of(undefined),
  projectShortcode$: of('0001'),
};

const sharedProviders = [
  { provide: ResourceService, useValue: resourceServiceStub },
  { provide: GeonameService, useValue: geonameServiceStub },
  { provide: FootnoteService, useValue: footnoteServiceStub },
  { provide: DspApiConnectionToken, useValue: dspApiConnectionStub },
  { provide: ResourceFetcherService, useValue: resourceFetcherServiceStub },
];

@Component({
  selector: 'app-viewer-switcher-host',
  template: `
    <app-template-viewer-switcher
      [value]="value"
      [myPropertyDefinition]="propDef"
      (templateFound)="template = $event" />
    @if (template) {
      <ng-container *ngTemplateOutlet="template; context: { item: value }" />
    }
  `,
  imports: [TemplateViewerSwitcherComponent, NgTemplateOutlet],
})
class ViewerSwitcherHostComponent {
  @Input() value: any;
  @Input() propDef: any;
  template?: TemplateRef<any>;
}

const meta: Meta<ViewerSwitcherHostComponent> = {
  title: 'Devs / Resource Editor / Template Switcher / Viewer Switcher',
  component: ViewerSwitcherHostComponent,
  decorators: [applicationConfig({ providers: sharedProviders })],
  argTypes: {
    value: {
      description: 'The ReadValue to display. The component selects the correct viewer based on value type.',
      table: { type: { summary: 'ReadValue' }, category: 'State' },
    },
    propDef: {
      description: 'PropertyDefinition used to determine the value type.',
      table: { type: { summary: 'PropertyDefinition' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ViewerSwitcherHostComponent>;

export const IntValue: Story = {
  name: 'Displays an integer value',
  args: {
    value: { int: 42, strval: '42', type: Constants.IntValue } as unknown as ReadIntValue,
    propDef: makePropDef(Constants.IntValue),
  },
  play: async ({ canvasElement, step }) => {
    await step('Integer value is rendered', async () => {
      await expect(canvasElement.textContent).toContain('42');
    });
  },
};

export const BooleanValue: Story = {
  name: 'Displays a boolean toggle in read-only mode',
  args: {
    value: { bool: true, strval: 'true', type: Constants.BooleanValue } as unknown as ReadBooleanValue,
    propDef: makePropDef(Constants.BooleanValue),
  },
  play: async ({ canvasElement, step }) => {
    await step('Slide toggle is rendered for boolean value', async () => {
      const toggle = canvasElement.querySelector('mat-slide-toggle');
      await expect(toggle).not.toBeNull();
    });
  },
};

export const ColorValue: Story = {
  name: 'Displays a color swatch',
  args: {
    value: { color: '#ff6600', strval: '#ff6600', type: Constants.ColorValue } as unknown as ReadColorValue,
    propDef: makePropDef(Constants.ColorValue),
  },
  play: async ({ canvasElement, step }) => {
    await step('Color box is rendered', async () => {
      const box = canvasElement.querySelector('[data-cy="color-box"]');
      await expect(box).not.toBeNull();
    });
  },
};

export const TextValue: Story = {
  name: 'Displays a plain text value',
  args: {
    value: {
      text: 'Hello, world!',
      strval: 'Hello, world!',
      type: Constants.TextValue,
    } as unknown as ReadTextValueAsString,
    propDef: { objectType: Constants.TextValue, guiElement: Constants.GuiSimpleText } as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Text content is rendered', async () => {
      await expect(canvasElement.textContent).toContain('Hello, world!');
    });
  },
};

export const UriValue: Story = {
  name: 'Displays a URI as a clickable link',
  args: {
    value: {
      uri: 'https://www.dasch.swiss',
      strval: 'https://www.dasch.swiss',
      type: Constants.UriValue,
    } as unknown as ReadUriValue,
    propDef: makePropDef(Constants.UriValue),
  },
  play: async ({ canvasElement, step }) => {
    await step('URI link is rendered', async () => {
      const link = canvasElement.querySelector('a');
      await expect(link).not.toBeNull();
    });
  },
};
