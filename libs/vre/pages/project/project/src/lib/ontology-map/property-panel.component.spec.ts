import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { provideTranslateService } from '@ngx-translate/core';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { PropertyPanelComponent } from './property-panel.component';

const graph: DataModelGraph = {
  nodes: [
    {
      id: 'Film',
      label: 'Film',
      kind: 'class',
      navigable: true,
      propertyDetails: [
        {
          id: 'director',
          label: 'Director',
          description: 'Who directed it',
          type: 'Link',
          linkTarget: 'Person',
          cardinality: Cardinality._0_n,
        },
      ],
    },
    { id: 'Short', label: 'Short', kind: 'class', navigable: true },
    { id: 'Person', label: 'Person', kind: 'class', navigable: true },
  ],
  edges: [
    { source: 'Film', target: 'Person', property: 'director', label: 'Director', kind: 'link' },
    { source: 'Short', target: 'Film', property: 'subClassOf', label: '', kind: 'subclass' },
  ],
};

describe('PropertyPanelComponent', () => {
  let fixture: ComponentFixture<PropertyPanelComponent>;
  let component: PropertyPanelComponent;
  const text = (selector: string) =>
    Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll(selector)).map(e => e.textContent?.trim());

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PropertyPanelComponent], providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(PropertyPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('graph', graph);
    fixture.componentRef.setInput('propertyIri', 'director');
    fixture.detectChanges();
  });

  it('shows the property, the class it points at and the classes that have it', () => {
    expect(text('[data-cy="property-panel-title"]')).toEqual(['Director']);
    expect(text('[data-cy="property-panel-target"]')[0]).toContain('Person');
    expect(text('[data-cy="property-panel-user"] .class-link')).toEqual(['Film', 'Short']);
    expect(fixture.nativeElement.querySelectorAll('.inherited')).toHaveLength(1);
  });

  it('opens a class the property points at', () => {
    const selected = jest.fn();
    component.classSelected.subscribe(selected);

    fixture.nativeElement.querySelector('[data-cy="property-panel-target"]').click();

    expect(selected).toHaveBeenCalledWith('Person');
  });
});
