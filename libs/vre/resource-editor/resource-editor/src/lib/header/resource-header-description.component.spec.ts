import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Constants, ReadResource, ReadTextValueAsXml } from '@dasch-swiss/dsp-js';
import { RESOURCE_DESCRIPTION_ENABLED } from '@dasch-swiss/vre/core/config';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { FootnotesComponent } from '../properties/properties-display/footnotes/footnotes.component';
import { RichTextViewerComponent } from '../properties/properties-display/template-switcher/viewer-components/rich-text-viewer.component';
import { ResourceFetcherService } from '../representation/resource-fetcher.service';
import { EditResourceDescriptionDialogComponent } from './edit-resource-description-dialog.component';
import { ResourceHeaderDescriptionComponent } from './resource-header-description.component';

const PROJECT_CLASS = 'http://example.org/ontology#Photograph';

const makeDescription = (id: string) =>
  Object.assign(new ReadTextValueAsXml(), {
    id,
    strval: '<?xml version="1.0" encoding="UTF-8"?>\n<text><p>A description</p></text>',
  });

const makeResource = (type: string, descriptions: ReadTextValueAsXml[]): ReadResource =>
  ({
    id: 'http://rdfh.ch/0001/a-thing',
    type,
    entityInfo: {
      classes: { [type]: { propertiesList: [{ propertyIndex: Constants.HasDescription }] } },
      properties: {},
    },
    getValues: (property: string) => (property === Constants.HasDescription ? descriptions : []),
  }) as unknown as ReadResource;

describe('ResourceHeaderDescriptionComponent', () => {
  let fixture: ComponentFixture<ResourceHeaderDescriptionComponent>;
  const dialog = { open: jest.fn() };

  const render = (resource: ReadResource, { enabled = true, userCanEdit = false } = {}) => {
    TestBed.configureTestingModule({
      imports: [ResourceHeaderDescriptionComponent],
      providers: [
        provideTranslateService(),
        { provide: RESOURCE_DESCRIPTION_ENABLED, useValue: enabled },
        { provide: ResourceFetcherService, useValue: { userCanEdit$: of(userCanEdit) } },
        { provide: MatDialog, useValue: dialog },
      ],
    }).overrideComponent(ResourceHeaderDescriptionComponent, {
      remove: { imports: [RichTextViewerComponent, FootnotesComponent] },
      add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] },
    });
    fixture = TestBed.createComponent(ResourceHeaderDescriptionComponent);
    fixture.componentRef.setInput('resource', resource);
    fixture.detectChanges();
  };

  const query = (selector: string) => fixture.nativeElement.querySelector(selector);

  beforeEach(() => dialog.open.mockReset());

  it('renders the first description value', () => {
    const first = makeDescription('first');
    render(makeResource(PROJECT_CLASS, [first, makeDescription('second')]));
    expect(fixture.componentInstance.value).toBe(first);
    expect(query('[data-cy="resource-header-description"] app-rich-text-viewer')).not.toBeNull();
  });

  it('renders nothing while the feature flag is off', () => {
    render(makeResource(PROJECT_CLASS, [makeDescription('first')]), { enabled: false, userCanEdit: true });
    expect(query('[data-cy="resource-header-description"]')).toBeNull();
  });

  it('renders nothing for a viewer of a resource without a description', () => {
    render(makeResource(PROJECT_CLASS, []));
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('offers an editor a placeholder and the edit button when there is no description', () => {
    render(makeResource(PROJECT_CLASS, []), { userCanEdit: true });
    expect(query('.placeholder')).not.toBeNull();
    query('[data-cy="edit-description-button"]').click();
    expect(dialog.open).toHaveBeenCalledWith(
      EditResourceDescriptionDialogComponent,
      expect.objectContaining({ data: expect.objectContaining({ value: undefined }) })
    );
  });

  it('opens the dialog from the placeholder too', () => {
    render(makeResource(PROJECT_CLASS, []), { userCanEdit: true });
    query('[data-cy="add-description-placeholder"]').click();
    expect(dialog.open).toHaveBeenCalledWith(EditResourceDescriptionDialogComponent, expect.anything());
  });

  it('gives a viewer no edit button', () => {
    render(makeResource(PROJECT_CLASS, [makeDescription('first')]));
    expect(query('[data-cy="edit-description-button"]')).toBeNull();
  });

  it('renders nothing on a Region', () => {
    render(makeResource(Constants.Region, [makeDescription('first')]), { userCanEdit: true });
    expect(query('[data-cy="resource-header-description"]')).toBeNull();
  });
});
