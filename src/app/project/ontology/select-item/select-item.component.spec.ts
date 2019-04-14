import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectItemComponent } from './select-item.component';

// TODO: write test
// component not yet implemented
xdescribe('SelectItemComponent', () => {
  let component: SelectItemComponent;
  let fixture: ComponentFixture<SelectItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
