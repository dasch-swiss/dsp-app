import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoMenuComponent } from './info-menu.component';

describe('InfoMenuComponent', () => {
  let component: InfoMenuComponent;
  let fixture: ComponentFixture<InfoMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InfoMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
