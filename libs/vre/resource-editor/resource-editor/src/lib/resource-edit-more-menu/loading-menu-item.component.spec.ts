import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { LoadingMenuItemComponent } from './loading-menu-item.component';

describe('LoadingMenuItemComponent', () => {
  let component: LoadingMenuItemComponent;
  let fixture: ComponentFixture<LoadingMenuItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingMenuItemComponent, TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(LoadingMenuItemComponent, {
        set: {
          template: '<div>Mock Template</div>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(LoadingMenuItemComponent);
    component = fixture.componentInstance;
  });

  describe('component initialization', () => {
    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should have required inputs', () => {
      component.dataCy = 'test-cy';
      component.tooltipKey = 'test.tooltip';
      component.labelKey = 'test.label';

      expect(component.dataCy).toBe('test-cy');
      expect(component.tooltipKey).toBe('test.tooltip');
      expect(component.labelKey).toBe('test.label');
    });
  });
});
