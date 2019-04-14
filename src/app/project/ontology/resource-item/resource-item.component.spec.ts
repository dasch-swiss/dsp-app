import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceItemComponent } from './resource-item.component';

// TODO: write test
// component not yet implemented
xdescribe('ResourceItemComponent', () => {
  let component: ResourceItemComponent;
  let fixture: ComponentFixture<ResourceItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResourceItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourceItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
