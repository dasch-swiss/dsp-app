import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpertSearchComponent } from './expert-search.component';

describe('ExpertSearchComponent', () => {
  let component: ExpertSearchComponent;
  let fixture: ComponentFixture<ExpertSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExpertSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpertSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
