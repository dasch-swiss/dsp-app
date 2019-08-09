import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListDataFormComponent } from './list-data-form.component';

describe('ListDataFormComponent', () => {
  let component: ListDataFormComponent;
  let fixture: ComponentFixture<ListDataFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListDataFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListDataFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
