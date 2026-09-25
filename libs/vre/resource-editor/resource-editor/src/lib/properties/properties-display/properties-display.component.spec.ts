import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cardinality, Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { DspResource, PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { provideTranslateService } from '@ngx-translate/core';
import { PropertiesDisplayComponent } from './properties-display.component';

const KNORA_API_V2 = 'http://api.knora.org/ontology/knora-api/v2#';
const HAS_SEGMENT_BOUNDS = `${KNORA_API_V2}hasSegmentBounds`;
const PROJECT_CLASS = 'http://example.org/ontology#Photograph';

const makeEntityInfo = (resourceType: string, propertyIris: string[]) =>
  ({
    classes: {
      [resourceType]: {
        propertiesList: propertyIris.map(propertyIndex => ({
          propertyIndex,
          cardinality: Cardinality._0_1,
          isInherited: false,
        })),
      },
    },
    properties: {},
  }) as unknown as ReadResource['entityInfo'];

const makeProp = (id: string): PropertyInfoValues =>
  ({
    guiDef: { cardinality: Cardinality._0_1 },
    propDef: { id, isEditable: true, labels: [], comments: [] },
    values: [],
  }) as unknown as PropertyInfoValues;

const makeDspResource = (type: string, entityInfoPropertyIris: string[]): DspResource => {
  const res = {
    type,
    properties: {},
    entityInfo: makeEntityInfo(type, entityInfoPropertyIris),
  } as unknown as ReadResource;

  const resource = new DspResource(res);
  resource.resProps = [makeProp(Constants.HasComment), makeProp(Constants.HasDescription)];
  return resource;
};

describe('PropertiesDisplayComponent', () => {
  let component: PropertiesDisplayComponent;
  let fixture: ComponentFixture<PropertiesDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertiesDisplayComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideTranslateService()],
    })
      .overrideComponent(PropertiesDisplayComponent, { set: { template: '<div></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(PropertiesDisplayComponent);
    component = fixture.componentInstance;
  });

  it('hides the hasDescription row for a project resource', () => {
    component.resource = makeDspResource(PROJECT_CLASS, [Constants.HasDescription]);
    component.ngOnChanges();

    expect(component.editableProperties.some(prop => prop.propDef.id === Constants.HasDescription)).toBe(false);
  });

  it('hides the hasDescription row for a Region', () => {
    component.resource = makeDspResource(Constants.Region, [Constants.HasDescription]);
    component.ngOnChanges();

    expect(component.editableProperties.some(prop => prop.propDef.id === Constants.HasDescription)).toBe(false);
  });

  it('keeps the hasDescription row for an AudioSegment resource', () => {
    component.resource = makeDspResource(`${KNORA_API_V2}AudioSegment`, [Constants.HasDescription, HAS_SEGMENT_BOUNDS]);
    component.ngOnChanges();

    expect(component.editableProperties.some(prop => prop.propDef.id === Constants.HasDescription)).toBe(true);
  });
});
