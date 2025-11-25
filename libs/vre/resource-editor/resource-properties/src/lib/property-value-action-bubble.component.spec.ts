import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cardinality, ReadValue } from '@dasch-swiss/dsp-js';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { PropertyValueActionBubbleComponent } from './property-value-action-bubble.component';
import { PropertyValueService } from './property-value.service';

describe('PropertyValueActionBubbleComponent', () => {
  let component: PropertyValueActionBubbleComponent;
  let fixture: ComponentFixture<PropertyValueActionBubbleComponent>;
  let mockPropertyValueService: jest.Mocked<Partial<PropertyValueService>>;
  let mockResourceFetcherService: jest.Mocked<Partial<ResourceFetcherService>>;

  const mockValue = {
    id: 'test-value-id',
    type: 'test-type',
    valueCreationDate: '2023-01-01',
  } as ReadValue;

  const mockResource = {
    res: {
      id: 'test-resource-id',
      attachedToUser: 'test-user',
    },
  };

  beforeEach(async () => {
    mockPropertyValueService = {
      cardinality: Cardinality._0_1,
      editModeData: {
        resource: {} as any,
        values: [mockValue],
      },
    };

    mockResourceFetcherService = {
      resourceVersion: undefined,
      resource$: of(mockResource as any),
    };

    await TestBed.configureTestingModule({
      declarations: [PropertyValueActionBubbleComponent],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: PropertyValueService, useValue: mockPropertyValueService },
        { provide: ResourceFetcherService, useValue: mockResourceFetcherService },
      ],
    })
      .overrideComponent(PropertyValueActionBubbleComponent, {
        set: {
          template: '<div>Mock Template</div>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PropertyValueActionBubbleComponent);
    component = fixture.componentInstance;
    component.date = '2023-01-01';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('component initialization', () => {
    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should have required inputs', () => {
      expect(component.date).toBeDefined();
    });
  });

  describe('disableDeleteButton getter', () => {
    describe('when cardinality is 0-1 (optional, single)', () => {
      beforeEach(() => {
        mockPropertyValueService.cardinality = Cardinality._0_1;
        mockPropertyValueService.editModeData = {
          resource: {} as any,
          values: [mockValue],
        };
      });

      it('should return false when there is only one value', () => {
        expect(component.disableDeleteButton).toBe(false);
      });
    });

    describe('when cardinality is 0-n (optional, multiple)', () => {
      beforeEach(() => {
        mockPropertyValueService.cardinality = Cardinality._0_n;
        mockPropertyValueService.editModeData = {
          resource: {} as any,
          values: [mockValue],
        };
      });

      it('should return false when there is only one value', () => {
        expect(component.disableDeleteButton).toBe(false);
      });

      it('should return false when there are multiple values', () => {
        mockPropertyValueService.editModeData = {
          resource: {} as any,
          values: [mockValue, mockValue],
        };
        expect(component.disableDeleteButton).toBe(false);
      });
    });

    describe('when cardinality is 1 (required, single)', () => {
      beforeEach(() => {
        mockPropertyValueService.cardinality = Cardinality._1;
      });

      it('should return true when there is only one value', () => {
        mockPropertyValueService.editModeData = {
          resource: {} as any,
          values: [mockValue],
        };
        expect(component.disableDeleteButton).toBe(true);
      });

      it('should return false when there are multiple values', () => {
        mockPropertyValueService.editModeData = {
          resource: {} as any,
          values: [mockValue, mockValue],
        };
        expect(component.disableDeleteButton).toBe(false);
      });
    });

    describe('when cardinality is 1-n (required, multiple)', () => {
      beforeEach(() => {
        mockPropertyValueService.cardinality = Cardinality._1_n;
      });

      it('should return true when there is only one value', () => {
        mockPropertyValueService.editModeData = {
          resource: {} as any,
          values: [mockValue],
        };
        expect(component.disableDeleteButton).toBe(true);
      });

      it('should return false when there are multiple values', () => {
        mockPropertyValueService.editModeData = {
          resource: {} as any,
          values: [mockValue, mockValue],
        };
        expect(component.disableDeleteButton).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should return true for required field with exactly one value', () => {
        mockPropertyValueService.cardinality = Cardinality._1;
        mockPropertyValueService.editModeData = {
          resource: {} as any,
          values: [mockValue],
        };
        expect(component.disableDeleteButton).toBe(true);
      });

      it('should return false when there are no values (edge case)', () => {
        mockPropertyValueService.cardinality = Cardinality._1;
        mockPropertyValueService.editModeData = {
          resource: {} as any,
          values: [],
        };
        expect(component.disableDeleteButton).toBe(false);
      });
    });
  });

  describe('userHasPermission', () => {
    it('should return false when resourceVersion is set (viewing old version)', () => {
      mockResourceFetcherService.resourceVersion = '2023-01-01' as any;
      expect(component.userHasPermission('edit')).toBe(false);
      expect(component.userHasPermission('delete')).toBe(false);
    });
  });

  describe('event emitters', () => {
    it('should emit editAction', done => {
      component.editAction.subscribe(() => {
        expect(true).toBe(true);
        done();
      });
      component.editAction.emit();
    });

    it('should emit deleteAction', done => {
      component.deleteAction.subscribe(() => {
        expect(true).toBe(true);
        done();
      });
      component.deleteAction.emit();
    });
  });
});
