import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertyDefinition } from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { DownloadPropertyListComponent } from './download-property-list.component';

describe('DownloadPropertyListComponent', () => {
  let component: DownloadPropertyListComponent;
  let fixture: ComponentFixture<DownloadPropertyListComponent>;

  // Mock property definitions
  const createMockPropertyInfo = (id: string, label: string, comment?: string): PropertyInfoValues => ({
    propDef: {
      id,
      label,
      comment,
    } as PropertyDefinition,
    guiDef: {} as any,
    values: [],
  });

  const mockProperty1 = createMockPropertyInfo('prop-1', 'Title', 'The title of the resource');
  const mockProperty2 = createMockPropertyInfo('prop-2', 'Description');
  const mockProperty3 = createMockPropertyInfo('prop-3', 'Date', 'Creation date');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadPropertyListComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideTranslateService(), TranslateService],
    })
      .overrideComponent(DownloadPropertyListComponent, {
        set: {
          // Template is overridden to isolate unit test from template rendering
          template: '<div>Mock Template</div>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DownloadPropertyListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize properties with selected=true', () => {
      component.propertyDefinitions = [mockProperty1, mockProperty2, mockProperty3];
      component.ngOnInit();

      expect(component.properties).toHaveLength(3);
      expect(component.properties.every(p => p.selected === true)).toBe(true);
    });

    it('should map property definitions correctly', () => {
      component.propertyDefinitions = [mockProperty1, mockProperty2];
      component.ngOnInit();

      expect(component.properties[0].property).toBe(mockProperty1);
      expect(component.properties[1].property).toBe(mockProperty2);
    });

    it('should handle empty property definitions', () => {
      component.propertyDefinitions = [];
      component.ngOnInit();

      expect(component.properties).toHaveLength(0);
    });
  });

  describe('selectedCount', () => {
    beforeEach(() => {
      component.propertyDefinitions = [mockProperty1, mockProperty2, mockProperty3];
      component.ngOnInit();
    });

    it('should return 3 when all properties selected by default', () => {
      expect(component.selectedCount).toBe(3);
    });

    it('should return correct count when some properties deselected', () => {
      component.properties[1].selected = false;

      expect(component.selectedCount).toBe(2);
    });

    it('should return total count when all properties selected', () => {
      component.properties.forEach(p => (p.selected = true));

      expect(component.selectedCount).toBe(3);
    });
  });

  describe('selectAll', () => {
    beforeEach(() => {
      component.propertyDefinitions = [mockProperty1, mockProperty2, mockProperty3];
      component.ngOnInit();
    });

    it('should select all properties', () => {
      component.selectAll();

      expect(component.properties.every(p => p.selected === true)).toBe(true);
    });

    it('should emit all property IDs', () => {
      const emitSpy = jest.spyOn(component.propertiesChange, 'emit');

      component.selectAll();

      expect(emitSpy).toHaveBeenCalledWith(['prop-1', 'prop-2', 'prop-3']);
    });

    it('should work when some properties are already selected', () => {
      component.properties[0].selected = true;

      component.selectAll();

      expect(component.properties.every(p => p.selected === true)).toBe(true);
    });
  });

  describe('selectNone', () => {
    beforeEach(() => {
      component.propertyDefinitions = [mockProperty1, mockProperty2, mockProperty3];
      component.ngOnInit();
      // All are selected by default, no need to call selectAll()
    });

    it('should deselect all properties', () => {
      component.selectNone();

      expect(component.properties.every(p => p.selected === false)).toBe(true);
    });

    it('should emit empty array', () => {
      const emitSpy = jest.spyOn(component.propertiesChange, 'emit');

      component.selectNone();

      expect(emitSpy).toHaveBeenCalledWith([]);
    });

    it('should work when no properties are selected', () => {
      component.selectNone();
      component.selectNone(); // Call twice

      expect(component.properties.every(p => p.selected === false)).toBe(true);
    });
  });

  describe('toggleProperty', () => {
    beforeEach(() => {
      component.propertyDefinitions = [mockProperty1, mockProperty2, mockProperty3];
      component.ngOnInit();
    });

    it('should toggle property from true to false', () => {
      const property = component.properties[0];
      expect(property.selected).toBe(true);

      component.toggleProperty(property);

      expect(property.selected).toBe(false);
    });

    it('should toggle property from false to true', () => {
      const property = component.properties[0];
      property.selected = false;

      component.toggleProperty(property);

      expect(property.selected).toBe(true);
    });

    it('should emit updated property IDs when toggling off', () => {
      const emitSpy = jest.spyOn(component.propertiesChange, 'emit');

      component.toggleProperty(component.properties[1]);

      expect(emitSpy).toHaveBeenCalledWith(['prop-1', 'prop-3']);
    });

    it('should emit correct IDs when toggling multiple properties off', () => {
      const emitSpy = jest.spyOn(component.propertiesChange, 'emit');

      component.toggleProperty(component.properties[0]);
      component.toggleProperty(component.properties[2]);

      expect(emitSpy).toHaveBeenLastCalledWith(['prop-2']);
    });

    it('should emit correct IDs when toggling on a property after deselecting others', () => {
      const emitSpy = jest.spyOn(component.propertiesChange, 'emit');

      component.properties[0].selected = false;
      component.properties[2].selected = false;

      component.toggleProperty(component.properties[0]); // Toggle on

      expect(emitSpy).toHaveBeenCalledWith(['prop-1', 'prop-2']);
    });
  });

  describe('emitProperties', () => {
    beforeEach(() => {
      component.propertyDefinitions = [mockProperty1, mockProperty2, mockProperty3];
      component.ngOnInit();
    });

    it('should emit only selected property IDs', () => {
      const emitSpy = jest.spyOn(component.propertiesChange, 'emit');

      component.properties[0].selected = false;
      component.properties[1].selected = true;
      component.properties[2].selected = true;
      component.emitProperties();

      expect(emitSpy).toHaveBeenCalledWith(['prop-2', 'prop-3']);
    });

    it('should emit empty array when no properties selected', () => {
      const emitSpy = jest.spyOn(component.propertiesChange, 'emit');

      component.properties.forEach(p => (p.selected = false));
      component.emitProperties();

      expect(emitSpy).toHaveBeenCalledWith([]);
    });

    it('should maintain order of property IDs', () => {
      const emitSpy = jest.spyOn(component.propertiesChange, 'emit');

      // All are already selected by default, just call emit
      component.emitProperties();

      // Should maintain original order
      expect(emitSpy).toHaveBeenCalledWith(['prop-1', 'prop-2', 'prop-3']);
    });
  });
});
