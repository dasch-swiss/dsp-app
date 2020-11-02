import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';

import { VisualizerComponent } from './visualizer.component';

describe('VisualizerComponent', () => {
  let component: VisualizerComponent;
  let fixture: ComponentFixture<VisualizerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VisualizerComponent ],
      imports: [
        MatRadioModule,
        MatSliderModule,
        MatSlideToggleModule
    ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
});
