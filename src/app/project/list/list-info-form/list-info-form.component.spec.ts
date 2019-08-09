import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListInfoFormComponent } from './list-info-form.component';

describe('ListInfoFormComponent', () => {
  let component: ListInfoFormComponent;
  let fixture: ComponentFixture<ListInfoFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListInfoFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListInfoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
