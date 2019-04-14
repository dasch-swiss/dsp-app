import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyItemComponent } from './property-item.component';

// TODO: write test
// component not yet implemented
xdescribe('PropertyItemComponent', () => {
  let component: PropertyItemComponent;
  let fixture: ComponentFixture<PropertyItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PropertyItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
