import { OverlayModule } from '@angular/cdk/overlay';
import { NgTemplateOutlet } from '@angular/common';
import { Component, importProvidersFrom, Input, TemplateRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Constants } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, waitFor } from 'storybook/test';

import { GeonameService } from './geoname.service';
import { TemplateEditorSwitcherComponent } from './template-editor-switcher.component';
import { LinkValueDataService } from './value-components/link-value-data.service';

const geonameServiceStub: Partial<GeonameService> = {
  resolveGeonameID: () =>
    of({
      displayName: 'Bern, Switzerland',
      name: 'Bern',
      country: 'Switzerland',
      location: { lat: 46.948, lng: 7.4474 },
    } as any),
  searchPlace: () => of([]),
};

const linkValueDataServiceStub: Partial<LinkValueDataService> = {
  onInit: () => {},
  resourceClasses: [],
};

const dspApiConnectionStub = {
  v2: {
    ontologyCache: {
      getOntology: () => of(new Map()),
      getResourceClassDefinition: () => of({ classes: {}, properties: {} }),
    },
    list: {
      getList: () =>
        of({ id: 'http://rdfh.ch/lists/0001/root', label: 'Root', isRootNode: true, children: [], comments: [] }),
    },
  },
};

const sharedProviders = [
  importProvidersFrom(OverlayModule),
  { provide: DspApiConnectionToken, useValue: dspApiConnectionStub },
  { provide: GeonameService, useValue: geonameServiceStub },
  { provide: LinkValueDataService, useValue: linkValueDataServiceStub },
];

@Component({
  selector: 'app-editor-switcher-host',
  template: `
    <app-template-editor-switcher
      [myPropertyDefinition]="propDef"
      [resourceClassIri]="resourceClassIri"
      [projectIri]="projectIri"
      [projectShortcode]="projectShortcode"
      (templateFound)="template = $event" />
    @if (template) {
      <ng-container *ngTemplateOutlet="template; context: { item: control }" />
    }
  `,
  imports: [TemplateEditorSwitcherComponent, NgTemplateOutlet],
})
class EditorSwitcherHostComponent {
  @Input() propDef: any;
  @Input() resourceClassIri = 'http://api.dasch.swiss/ontology/0001/anything/v2#Thing';
  @Input() projectIri = 'http://rdfh.ch/projects/0001';
  @Input() projectShortcode = '0001';
  control = new FormControl<any>(false);
  template?: TemplateRef<any>;
}

const meta: Meta<EditorSwitcherHostComponent> = {
  title: 'Devs / Resource Editor / Resource Properties / Template Switcher / Editor Switcher',
  component: EditorSwitcherHostComponent,
  decorators: [applicationConfig({ providers: sharedProviders })],
  argTypes: {
    propDef: {
      description: 'PropertyDefinition used to determine which editor to render.',
      table: { type: { summary: 'PropertyDefinition' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<EditorSwitcherHostComponent>;

export const IntEditor: Story = {
  name: 'Renders integer input editor',
  args: {
    propDef: { objectType: Constants.IntValue } as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Integer input is rendered', async () => {
      const input = canvasElement.querySelector('[data-cy="int-input"]');
      await expect(input).not.toBeNull();
    });
  },
};

export const TextEditor: Story = {
  name: 'Renders plain text input editor',
  args: {
    propDef: { objectType: Constants.TextValue, guiElement: Constants.GuiSimpleText } as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Text input is rendered', async () => {
      const input = canvasElement.querySelector('[data-cy="text-input"]');
      await expect(input).not.toBeNull();
    });
  },
};

export const BooleanEditor: Story = {
  name: 'Renders boolean toggle editor',
  args: {
    propDef: { objectType: Constants.BooleanValue } as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Boolean toggle is rendered', async () => {
      await waitFor(() => {
        const toggle = canvasElement.querySelector('mat-slide-toggle, [data-cy="bool-toggle"]');
        expect(toggle).not.toBeNull();
      });
    });
  },
};

export const ColorEditor: Story = {
  name: 'Renders color picker editor',
  args: {
    propDef: { objectType: Constants.ColorValue } as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Color picker is rendered', async () => {
      const picker = canvasElement.querySelector('app-color-value, app-nullable-editor');
      await expect(picker).not.toBeNull();
    });
  },
};

export const GeonameEditor: Story = {
  name: 'Renders geoname autocomplete editor',
  args: {
    propDef: { objectType: Constants.GeonameValue } as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Geoname autocomplete input is rendered', async () => {
      const input = canvasElement.querySelector('[data-cy="geoname-autocomplete"]');
      await expect(input).not.toBeNull();
    });
  },
};
