import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OntologyComponent } from './ontology.component';
import { MatCardModule } from '@angular/material';

describe('OntologyComponent', () => {
  let component: OntologyComponent;
  let fixture: ComponentFixture<OntologyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OntologyComponent ],
      imports: [
        MatCardModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OntologyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
