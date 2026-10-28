import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { provideTranslateService } from '@ngx-translate/core';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { ResourceClassDetailsDialogComponent } from './resource-class-details-dialog.component';

const graph: DataModelGraph = {
  nodes: [
    {
      id: 'Film',
      label: 'Film',
      kind: 'class',
      count: 319,
      navigable: true,
      description: 'All films by Alain Tanner.',
      propertyDetails: [
        { id: 'title', label: 'Title', description: '', type: 'Text', cardinality: Cardinality._1 },
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
    { id: 'Person', label: 'Person', kind: 'class', count: 1086, navigable: true, propertyDetails: [] },
  ],
  edges: [{ source: 'Film', target: 'Person', property: 'director', label: 'Director', kind: 'link' }],
};

describe('ResourceClassDetailsDialogComponent', () => {
  let fixture: ComponentFixture<ResourceClassDetailsDialogComponent>;
  let component: ResourceClassDetailsDialogComponent;
  let close: jest.Mock;

  beforeEach(() => {
    close = jest.fn();
    TestBed.configureTestingModule({
      imports: [ResourceClassDetailsDialogComponent],
      providers: [
        provideTranslateService(),
        { provide: MAT_DIALOG_DATA, useValue: { graph, classIri: 'Film', anyResourceLabel: '', subclassLabel: '' } },
        { provide: MatDialogRef, useValue: { close } },
      ],
    });
    fixture = TestBed.createComponent(ResourceClassDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('lists the properties of the class, a link named after the class it points at', () => {
    const rows = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.properties li'));

    expect(rows.map(row => row.querySelector('.property-label')?.textContent?.trim())).toEqual(['Title', 'Director']);
    expect(rows[1].querySelector('.type')?.textContent).toContain('Person');
    expect(component.cardinalityKey(graph.nodes[0].propertyDetails![1])).toBe('anyNumber');
  });

  it('describes a linked class clicked in the panel instead', () => {
    component.classIri.set('Person');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-cy="class-details-title"]').textContent).toContain('Person');
  });

  it('closes with the class to open in the Data tab', () => {
    fixture.nativeElement.querySelector('[data-cy="class-details-open"]').click();

    expect(close).toHaveBeenCalledWith('Film');
  });
});
