import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListItemsFormComponent } from './list-items-form.component';

describe('ListItemsFormComponent', () => {
  let component: ListItemsFormComponent;
  let fixture: ComponentFixture<ListItemsFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListItemsFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListItemsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
