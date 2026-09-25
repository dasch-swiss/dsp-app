import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cardinality, Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { DspResource, PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ResourceFetcherService } from '../representation/resource-fetcher.service';
import { ResourceHeaderComponent } from './resource-header.component';

const KNORA_API_V2 = 'http://api.knora.org/ontology/knora-api/v2#';
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

const makeDescriptionProp = (values: PropertyInfoValues['values']): PropertyInfoValues =>
  ({
    guiDef: { cardinality: Cardinality._0_n },
    propDef: { id: Constants.HasDescription, isEditable: true, labels: [], comments: [] },
    values,
  }) as unknown as PropertyInfoValues;

const makeDspResource = (
  type: string,
  entityInfoPropertyIris: string[],
  options?: { descriptionValues?: PropertyInfoValues['values']; userHasPermission?: string }
): DspResource => {
  const res = {
    type,
    userHasPermission: options?.userHasPermission ?? 'RV',
    entityInfo: makeEntityInfo(type, entityInfoPropertyIris),
  } as unknown as ReadResource;

  const resource = new DspResource(res);
  resource.resProps = [makeDescriptionProp(options?.descriptionValues ?? [])];
  return resource;
};

describe('ResourceHeaderComponent', () => {
  let component: ResourceHeaderComponent;
  let fixture: ComponentFixture<ResourceHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceHeaderComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideTranslateService(),
        { provide: ResourceFetcherService, useValue: { userCanEdit$: of(false) } },
      ],
    })
      .overrideComponent(ResourceHeaderComponent, { set: { template: '<div></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(ResourceHeaderComponent);
    component = fixture.componentInstance;
  });

  it('shows the description for a project resource with values', () => {
    component.resource = makeDspResource(PROJECT_CLASS, [Constants.HasDescription], {
      descriptionValues: [{ id: 'value-1' } as any],
    });
    component.ngOnChanges();

    expect(component.descriptionProp?.propDef.id).toBe(Constants.HasDescription);
    expect(component.showDescription).toBe(true);
  });

  it('hides the description for a project resource without values as a viewer', () => {
    component.resource = makeDspResource(PROJECT_CLASS, [Constants.HasDescription], {
      descriptionValues: [],
      userHasPermission: 'RV',
    });
    component.ngOnChanges();

    expect(component.showDescription).toBe(false);
  });

  it('shows the description for a project resource without values as an editor', () => {
    component.resource = makeDspResource(PROJECT_CLASS, [Constants.HasDescription], {
      descriptionValues: [],
      userHasPermission: 'CR',
    });
    component.ngOnChanges();

    expect(component.showDescription).toBe(true);
  });

  it('hides the description for a Region resource', () => {
    component.resource = makeDspResource(Constants.Region, [Constants.HasDescription], {
      descriptionValues: [{ id: 'value-1' } as any],
      userHasPermission: 'CR',
    });
    component.ngOnChanges();

    expect(component.descriptionProp).toBeUndefined();
    expect(component.showDescription).toBe(false);
  });
});
