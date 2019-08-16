import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListItemFormComponent } from './list-item-form.component';

describe('ListItemFormComponent', () => {
  let component: ListItemFormComponent;
  let fixture: ComponentFixture<ListItemFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListItemFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListItemFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
