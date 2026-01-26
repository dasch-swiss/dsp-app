import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourceRepresentationContainerComponent } from './resource-representation-container.component';

describe('ResourceRepresentationContainerComponent', () => {
  let component: ResourceRepresentationContainerComponent;
  let fixture: ComponentFixture<ResourceRepresentationContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceRepresentationContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceRepresentationContainerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('heightValue', () => {
    it('should return "auto" when height is "auto"', () => {
      component.height = 'auto';
      expect(component.heightValue).toBe('auto');
    });

    it('should return "200px" when height is "small"', () => {
      component.height = 'small';
      expect(component.heightValue).toBe('200px');
    });

    it('should return "900px" when height is "big"', () => {
      component.height = 'big';
      expect(component.heightValue).toBe('900px');
    });

    it('should return "900px" as default when height is undefined', () => {
      component.height = undefined as any;
      expect(component.heightValue).toBe('900px');
    });

    it('should default height to "big" on initialization', () => {
      expect(component.height).toBe('big');
      expect(component.heightValue).toBe('900px');
    });
  });
});
