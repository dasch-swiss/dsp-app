import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { provideTranslateService } from '@ngx-translate/core';
import { ExportPreviewDialogComponent } from './export-preview-dialog.component';

describe('ExportPreviewDialogComponent', () => {
  let fixture: ComponentFixture<ExportPreviewDialogComponent>;
  let component: ExportPreviewDialogComponent;
  const render = jest.fn();

  beforeEach(() => {
    render.mockReset().mockReturnValue(new Promise<Blob>(() => undefined));
    TestBed.configureTestingModule({
      imports: [ExportPreviewDialogComponent],
      providers: [
        provideTranslateService(),
        { provide: MAT_DIALOG_DATA, useValue: { render, fileName: 'beol_ontology-map' } },
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: NotificationService, useValue: { openSnackBar: jest.fn() } },
      ],
    });
    fixture = TestBed.createComponent(ExportPreviewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('draws what is in view, at 2x, with the legend, at first', () => {
    expect(render).toHaveBeenCalledWith('view', { scale: 2, legend: true });
  });

  it('draws it again when a setting changes', () => {
    component.area.set('whole');
    component.scale.set(4);
    component.legend.set(false);
    fixture.detectChanges();

    expect(render).toHaveBeenLastCalledWith('whole', { scale: 4, legend: false });
  });

  it('says it failed when nothing can be drawn', () => {
    render.mockReturnValue(undefined);
    component.scale.set(1);
    fixture.detectChanges();

    expect(component.failed()).toBe(true);
  });
});
