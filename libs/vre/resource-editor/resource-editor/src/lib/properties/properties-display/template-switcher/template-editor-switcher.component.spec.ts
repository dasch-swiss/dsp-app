import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Constants, PropertyDefinition } from '@dasch-swiss/dsp-js';
import { provideTranslateService } from '@ngx-translate/core';
import { TemplateEditorSwitcherComponent } from './template-editor-switcher.component';

/**
 * Guards the edit half of the "four dispatch points land together" invariant (R1):
 * a RegionPreviewValue property must resolve to the add-by-IRI editor template, not hit the
 * throwing `default` branch of the switcher.
 */
describe('TemplateEditorSwitcherComponent — RegionPreviewValue dispatch', () => {
  let fixture: ComponentFixture<TemplateEditorSwitcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateEditorSwitcherComponent],
      providers: [provideTranslateService()],
    }).compileComponents();
    fixture = TestBed.createComponent(TemplateEditorSwitcherComponent);
  });

  it('dispatches a RegionPreviewValue property to the region preview editor template (no default throw)', () => {
    fixture.componentRef.setInput('myPropertyDefinition', {
      objectType: Constants.RegionPreviewValue,
    } as PropertyDefinition);
    fixture.componentRef.setInput('resourceClassIri', 'http://example/class');
    fixture.componentRef.setInput('projectIri', 'http://rdfh.ch/projects/0001');
    fixture.componentRef.setInput('projectShortcode', '0001');

    let emitted: unknown;
    fixture.componentInstance.templateFound.subscribe(t => (emitted = t));
    fixture.detectChanges(); // triggers ngAfterViewInit -> _getEditorTemplate()

    expect(emitted).toBeDefined();
    expect(emitted).toBe(fixture.componentInstance.regionPreviewEditorTpl);
  });
});
