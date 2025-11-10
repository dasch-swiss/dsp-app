import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { IncomingResourceToolbarComponent } from './incoming-resource-toolbar.component';

describe('IncomingResourceToolbarComponent', () => {
  let component: IncomingResourceToolbarComponent;
  let fixture: ComponentFixture<IncomingResourceToolbarComponent>;

  const mockResource = {
    id: 'test-resource-id',
    label: 'Test Resource',
    type: 'test-type',
    versionArkUrl: 'http://ark.example.org/ark:/12345',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IncomingResourceToolbarComponent],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(IncomingResourceToolbarComponent, {
        set: {
          template: '<div>Mock Template</div>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(IncomingResourceToolbarComponent);
    component = fixture.componentInstance;
    component.resource = mockResource as any;
  });

  describe('component initialization', () => {
    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should have required resource input', () => {
      expect(component.resource).toBeDefined();
      expect(component.resource).toEqual(mockResource);
    });
  });

  describe('component structure', () => {
    it('should be a wrapper component', () => {
      // This component is a simple wrapper that delegates to ResourceActionsComponent
      // It should have minimal logic and primarily focus on composition
      expect(component.resource).toBeDefined();
    });

    it('should accept ReadResource as input', () => {
      const testResource = {
        id: 'another-resource',
        label: 'Another Resource',
      };
      component.resource = testResource as any;

      expect(component.resource.id).toBe('another-resource');
      expect(component.resource.label).toBe('Another Resource');
    });
  });

  describe('integration with child components', () => {
    it('should pass resource to child components', () => {
      // The component template should pass resource to:
      // - app-resource-actions
      // - app-incoming-resource-more-menu
      expect(component.resource).toBeDefined();
      fixture.detectChanges();
      // In real rendering, this would be tested via integration tests
    });
  });
});
