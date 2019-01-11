import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FullframeDialogComponent } from './fullframe-dialog.component';

describe('FullframeDialogComponent', () => {
  let component: FullframeDialogComponent;
  let fixture: ComponentFixture<FullframeDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FullframeDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FullframeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
