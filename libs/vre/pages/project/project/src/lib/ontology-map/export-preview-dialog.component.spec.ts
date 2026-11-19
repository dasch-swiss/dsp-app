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
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            render,
            fileName: 'beol_ontology-map',
            title: 'The BEOL ontology',
            filter: 'Filtered on: Only Person',
          },
        },
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: NotificationService, useValue: { openSnackBar: jest.fn() } },
      ],
    });
    fixture = TestBed.createComponent(ExportPreviewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('draws what is in view, at 2x, with the legend and the data model name, at first', () => {
    expect(render).toHaveBeenCalledWith('view', {
      format: 'png',
      scale: 2,
      legend: true,
      title: 'The BEOL ontology',
      subtitle: 'Filtered on: Only Person',
    });
  });

  it('draws it again when a setting changes', () => {
    component.area.set('whole');
    component.level.set(component.levels[2]);
    component.legend.set(false);
    component.title.set(false);
    fixture.detectChanges();

    expect(render).toHaveBeenLastCalledWith('whole', {
      format: 'png',
      scale: 8,
      legend: false,
      title: undefined,
      subtitle: undefined,
    });
  });

  it('draws an SVG at its own size, with no resolution to choose', () => {
    component.format.set('svg');
    fixture.detectChanges();

    expect(render).toHaveBeenLastCalledWith('view', expect.objectContaining({ format: 'svg', scale: 1 }));
    expect(fixture.nativeElement.querySelector('[data-cy=export-preview-scale]')).toBeNull();
  });

  it('says it failed when nothing can be drawn', () => {
    render.mockReturnValue(undefined);
    component.level.set(component.levels[0]);
    fixture.detectChanges();

    expect(component.failed()).toBe(true);
  });
});
