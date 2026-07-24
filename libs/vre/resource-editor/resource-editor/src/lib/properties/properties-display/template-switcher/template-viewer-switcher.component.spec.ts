import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Constants, PropertyDefinition } from '@dasch-swiss/dsp-js';
import { TemplateViewerSwitcherComponent } from './template-viewer-switcher.component';

/**
 * Guards the display half of the "four dispatch points land together" invariant (R1):
 * a RegionPreviewValue property must resolve to the region preview template, not hit the
 * throwing `default` branch of the switcher.
 */
describe('TemplateViewerSwitcherComponent — RegionPreviewValue dispatch', () => {
  let fixture: ComponentFixture<TemplateViewerSwitcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TemplateViewerSwitcherComponent] }).compileComponents();
    fixture = TestBed.createComponent(TemplateViewerSwitcherComponent);
  });

  it('dispatches a RegionPreviewValue property to the region preview display template (no default throw)', () => {
    fixture.componentRef.setInput('value', undefined);
    fixture.componentRef.setInput('myPropertyDefinition', {
      objectType: Constants.RegionPreviewValue,
    } as PropertyDefinition);

    let emitted: unknown;
    fixture.componentInstance.templateFound.subscribe(t => (emitted = t));
    fixture.detectChanges(); // triggers ngAfterViewInit -> _getDisplayTemplate()

    expect(emitted).toBeDefined();
    expect(emitted).toBe(fixture.componentInstance.regionPreviewDisplayTpl);
  });
});
