import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Constants,
  CreateTextValueAsXml,
  DeleteValue,
  ReadResource,
  ReadTextValueAsXml,
  UpdateTextValueAsXml,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { of } from 'rxjs';
import { ResourceFetcherService } from '../representation/resource-fetcher.service';
import {
  EditResourceDescriptionDialogComponent,
  EditResourceDescriptionDialogData,
  isRichTextEmpty,
} from './edit-resource-description-dialog.component';

const resource = {
  id: 'http://rdfh.ch/0001/a-thing',
  type: 'http://example.org/ontology#Photograph',
  label: 'A thing',
  entityInfo: {
    properties: { [Constants.HasDescription]: { id: Constants.HasDescription, guiElement: Constants.GuiRichText } },
  },
} as unknown as ReadResource;

const existing = Object.assign(new ReadTextValueAsXml(), {
  id: 'http://rdfh.ch/0001/a-thing/values/d1',
  type: Constants.TextValue,
  strval: '<?xml version="1.0" encoding="UTF-8"?>\n<text><p>Old</p></text>',
});

describe('EditResourceDescriptionDialogComponent', () => {
  const values = {
    createValue: jest.fn(() => of({})),
    updateValue: jest.fn(() => of({})),
    deleteValue: jest.fn(() => of({})),
  };
  const dialogRef = { close: jest.fn() };
  const reload = jest.fn();

  const create = (data: EditResourceDescriptionDialogData) => {
    TestBed.configureTestingModule({
      imports: [EditResourceDescriptionDialogComponent],
      providers: [
        { provide: DspApiConnectionToken, useValue: { v2: { values } } },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: ResourceFetcherService, useValue: { reload, projectShortcode$: of('0001') } },
      ],
    }).overrideComponent(EditResourceDescriptionDialogComponent, { set: { template: '' } });
    return TestBed.createComponent(EditResourceDescriptionDialogComponent).componentInstance;
  };

  beforeEach(() => jest.clearAllMocks());

  it('creates a value when there was none', () => {
    const component = create({ resource });
    component.control.setValue('<p>New</p>');
    component.submit();

    const payload = (values.createValue.mock.calls[0] as unknown[])[0] as { property: string; value: unknown };
    expect(payload.property).toBe(Constants.HasDescription);
    expect(payload.value).toBeInstanceOf(CreateTextValueAsXml);
    expect(reload).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('updates the existing value', () => {
    const component = create({ resource, value: existing });
    expect(component.control.value).toBe('<p>Old</p>');
    component.control.setValue('<p>New</p>');
    component.submit();

    const payload = (values.updateValue.mock.calls[0] as unknown[])[0] as { value: UpdateTextValueAsXml };
    expect(payload.value).toBeInstanceOf(UpdateTextValueAsXml);
    expect(payload.value.id).toBe(existing.id);
  });

  it('deletes the existing value when the editor is emptied', () => {
    const component = create({ resource, value: existing });
    component.control.setValue('<p>&nbsp;</p>');
    component.submit();

    const payload = (values.deleteValue.mock.calls[0] as unknown[])[0] as { value: DeleteValue };
    expect(payload.value.id).toBe(existing.id);
  });

  it.each([
    ['unchanged', { resource, value: existing }, '<p>Old</p>'],
    ['empty without a value', { resource }, ''],
  ])('sends nothing when %s', (_case, data, content) => {
    const component = create(data);
    component.control.setValue(content);
    component.submit();

    expect(values.createValue).not.toHaveBeenCalled();
    expect(values.updateValue).not.toHaveBeenCalled();
    expect(values.deleteValue).not.toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });
});

describe('isRichTextEmpty', () => {
  it.each([null, '', '<p></p>', '<p>&nbsp;</p>', '<p><br></p>', ' <p>\u00a0</p> '])('treats %p as empty', html => {
    expect(isRichTextEmpty(html)).toBe(true);
  });

  it.each(['<p>x</p>', '<p><img src="a.png"></p>', '<hr>', '<footnote content="n"/>'])('keeps %p', html => {
    expect(isRichTextEmpty(html)).toBe(false);
  });
});
