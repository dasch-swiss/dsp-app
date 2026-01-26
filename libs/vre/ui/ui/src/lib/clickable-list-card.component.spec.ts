// Import Component decorator for test wrapper
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClickableListCardComponent } from './clickable-list-card.component';

describe('ClickableListCardComponent', () => {
  let component: ClickableListCardComponent;
  let fixture: ComponentFixture<ClickableListCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClickableListCardComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ClickableListCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render mat-card with outlined appearance', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const matCard = compiled.querySelector('mat-card');

    expect(matCard).toBeTruthy();
    expect(matCard?.getAttribute('appearance')).toBe('outlined');
  });

  it('should render mat-list inside mat-card', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const matList = compiled.querySelector('mat-card mat-list');

    expect(matList).toBeTruthy();
  });

  it('should have mat-card with margin style', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const matCard = compiled.querySelector('mat-card') as HTMLElement;

    expect(matCard).toBeTruthy();
    expect(matCard.style.margin).toBe('16px 0px');
  });

  it('should have mat-list with zero padding style', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const matList = compiled.querySelector('mat-list') as HTMLElement;

    expect(matList).toBeTruthy();
    expect(matList.style.padding).toBe('0px');
  });

  it('should project content through ng-content', () => {
    // Create a new component with content projection
    @Component({
      selector: 'app-test-wrapper',
      template: `
        <app-clickable-list-card>
          <div class="test-content">Test Content</div>
        </app-clickable-list-card>
      `,
      imports: [ClickableListCardComponent],
    })
    class TestWrapperComponent {}

    const wrapperFixture = TestBed.createComponent(TestWrapperComponent);
    wrapperFixture.detectChanges();

    const compiled = wrapperFixture.nativeElement as HTMLElement;
    const testContent = compiled.querySelector('.test-content');

    expect(testContent).toBeTruthy();
    expect(testContent?.textContent).toBe('Test Content');
  });

  it('should use ViewEncapsulation.None', () => {
    const componentMetadata =
      (component.constructor as any).__annotations__?.[0] || (component.constructor as any).ɵcmp;

    // ViewEncapsulation.None = 2
    expect(componentMetadata?.encapsulation).toBe(2);
  });
});
