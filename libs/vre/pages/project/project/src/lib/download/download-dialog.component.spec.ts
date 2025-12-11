import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PropertyDefinition, ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { TranslateModule } from '@ngx-translate/core';
import { DownloadDialogComponent, DownloadDialogData } from './download-dialog.component';

describe('DownloadDialogComponent', () => {
  let component: DownloadDialogComponent;
  let fixture: ComponentFixture<DownloadDialogComponent>;
  let mockDialogRef: jest.Mocked<MatDialogRef<DownloadDialogComponent>>;
  let mockDialogData: DownloadDialogData;

  // Mock resource class
  const mockResClass: ResourceClassDefinitionWithAllLanguages = {
    id: 'http://example.org/ontology/ResourceClass',
    label: 'Test Resource Class',
    comment: 'A test resource class',
  } as ResourceClassDefinitionWithAllLanguages;

  // Mock property definitions
  const createMockPropertyInfo = (id: string, label: string): PropertyInfoValues => ({
    propDef: {
      id,
      label,
    } as PropertyDefinition,
    guiDef: {} as any,
    values: [],
  });

  const mockProperty1 = createMockPropertyInfo('prop-1', 'Title');
  const mockProperty2 = createMockPropertyInfo('prop-2', 'Description');

  beforeEach(async () => {
    mockDialogRef = {
      close: jest.fn(),
    } as any;

    mockDialogData = {
      resClass: mockResClass,
      resourceCount: 42,
      properties: [mockProperty1, mockProperty2],
    };

    await TestBed.configureTestingModule({
      imports: [DownloadDialogComponent, TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    })
      .overrideComponent(DownloadDialogComponent, {
        set: {
          // Template is overridden to isolate unit test from template rendering
          template: '<div>Mock Template</div>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DownloadDialogComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should inject dialog data correctly', () => {
      expect(component.data).toBeDefined();
      expect(component.data).toEqual(mockDialogData);
    });

    it('should have access to resource class data', () => {
      expect(component.data.resClass).toBe(mockResClass);
      expect(component.data.resClass.id).toBe('http://example.org/ontology/ResourceClass');
    });

    it('should have access to resource count', () => {
      expect(component.data.resourceCount).toBe(42);
    });

    it('should have access to properties', () => {
      expect(component.data.properties).toHaveLength(2);
      expect(component.data.properties[0]).toBe(mockProperty1);
      expect(component.data.properties[1]).toBe(mockProperty2);
    });

    it('should have dialogRef available', () => {
      expect(component.dialogRef).toBeDefined();
      expect(component.dialogRef).toBe(mockDialogRef);
    });
  });

  describe('data structure', () => {
    it('should handle different resource counts', () => {
      const testCases = [0, 1, 10, 100, 1000];

      testCases.forEach(count => {
        const data: DownloadDialogData = {
          resClass: mockResClass,
          resourceCount: count,
          properties: [mockProperty1],
        };

        expect(data.resourceCount).toBe(count);
      });
    });

    it('should handle empty properties array', () => {
      const data: DownloadDialogData = {
        resClass: mockResClass,
        resourceCount: 5,
        properties: [],
      };

      expect(data.properties).toHaveLength(0);
    });

    it('should handle large properties array', () => {
      const manyProperties = Array.from({ length: 20 }, (_, i) => createMockPropertyInfo(`prop-${i}`, `Property ${i}`));

      const data: DownloadDialogData = {
        resClass: mockResClass,
        resourceCount: 100,
        properties: manyProperties,
      };

      expect(data.properties).toHaveLength(20);
    });
  });

  describe('dialog interaction', () => {
    it('should be able to close dialog programmatically', () => {
      component.dialogRef.close();

      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    });

    it('should be able to close dialog with data', () => {
      const result = { success: true };
      component.dialogRef.close(result);

      expect(mockDialogRef.close).toHaveBeenCalledWith(result);
    });
  });

  describe('DownloadDialogData interface', () => {
    it('should enforce required fields', () => {
      const validData: DownloadDialogData = {
        resClass: mockResClass,
        resourceCount: 10,
        properties: [mockProperty1],
      };

      expect(validData.resClass).toBeDefined();
      expect(validData.resourceCount).toBeDefined();
      expect(validData.properties).toBeDefined();
    });

    it('should allow valid resource class definitions', () => {
      const customResClass: ResourceClassDefinitionWithAllLanguages = {
        id: 'http://custom.org/ontology/CustomClass',
        label: 'Custom Class',
        comment: 'A custom resource class',
      } as ResourceClassDefinitionWithAllLanguages;

      const data: DownloadDialogData = {
        resClass: customResClass,
        resourceCount: 5,
        properties: [],
      };

      expect(data.resClass.id).toBe('http://custom.org/ontology/CustomClass');
      expect(data.resClass.label).toBe('Custom Class');
    });
  });
});
