import { Component, DebugElement, ElementRef, OnInit } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { GndDirective } from './gnd.directive';

/**
 * test component for a GND/IAF identifier.
 */
@Component({
    template: '<span appGnd [gnd]="\'(DE-588)118696149\'"></span>',
})
class TestGnd1Component {}

/**
 * test component for a VIAF identifier.
 */
@Component({
    template: '<span appGnd [gnd]="\'(VIAF)22936072\'"></span>',
})
class TestGnd2Component {}

/**
 * test component for normal text.
 */
@Component({
    template: '<span appGnd [gnd]="\'normal text\'"></span>',
})
class TestGnd3Component {}

/**
 * test component for long normal text.
 */
@Component({
    template: `<span
        appGnd
        [gnd]="
            'normal text that is quite long and will not even be looked at because it cannot possibly be a GND/IAF or VIAF identifier'
        "
    ></span>`,
})
class TestGnd4Component {}

/**
 * test component with an updated text.
 */
@Component({
    template: '<span appGnd [gnd]="gndValue"></span>',
})
class TestGnd5Component implements OnInit {
    gndValue;

    ngOnInit() {
        this.gndValue = 'initial text';
    }
}

class MockElementRef implements ElementRef {
    nativeElement = {};
}

describe('GndDirective', () => {
    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                TestGnd1Component,
                TestGnd2Component,
                TestGnd3Component,
                TestGnd4Component,
                TestGnd5Component,
                GndDirective,
            ],
            providers: [{ provide: ElementRef, useClass: MockElementRef }],
        }).compileComponents();
    }));

    it('should create an instance', () => {
        const directive = new GndDirective(new MockElementRef());
        expect(directive).toBeTruthy();
    });

    it('should transform a GND/IAF identifier to a hyperlink pointing to the resolver', () => {
        const fixture: ComponentFixture<TestGnd1Component> =
            TestBed.createComponent(TestGnd1Component);
        fixture.detectChanges();

        const spanEle: DebugElement = fixture.debugElement.query(
            By.css('span')
        );

        expect(spanEle.nativeElement.innerHTML).toEqual(
            '<a href="http://d-nb.info/gnd/118696149" target="_blank">(DE-588)118696149</a>'
        );
    });

    it('should transform a VIAF identifier to a hyperlink pointing to the resolver', () => {
        const fixture: ComponentFixture<TestGnd2Component> =
            TestBed.createComponent(TestGnd2Component);
        fixture.detectChanges();

        const spanEle: DebugElement = fixture.debugElement.query(
            By.css('span')
        );

        expect(spanEle.nativeElement.innerHTML).toEqual(
            '<a href="https://viaf.org/viaf/22936072" target="_blank">(VIAF)22936072</a>'
        );
    });

    it('should not transform normal text', () => {
        const fixture: ComponentFixture<TestGnd3Component> =
            TestBed.createComponent(TestGnd3Component);
        fixture.detectChanges();

        const spanEle: DebugElement = fixture.debugElement.query(
            By.css('span')
        );

        expect(spanEle.nativeElement.innerHTML).toEqual('normal text');
    });

    it('should not transform long normal text', () => {
        const fixture: ComponentFixture<TestGnd4Component> =
            TestBed.createComponent(TestGnd4Component);
        fixture.detectChanges();

        const spanEle: DebugElement = fixture.debugElement.query(
            By.css('span')
        );

        expect(spanEle.nativeElement.innerHTML).toEqual(
            'normal text that is quite long and will not even be looked at because it cannot possibly be a GND/IAF or VIAF identifier'
        );
    });

    it('should be equal to the updated text', () => {
        const fixture: ComponentFixture<TestGnd5Component> =
            TestBed.createComponent(TestGnd5Component);
        fixture.detectChanges();

        const spanEle: DebugElement = fixture.debugElement.query(
            By.css('span')
        );

        expect(spanEle.nativeElement.innerHTML).toEqual('initial text');

        fixture.componentInstance.gndValue = 'updated text';
        fixture.detectChanges();

        expect(spanEle.nativeElement.innerHTML).toEqual('updated text');
    });
});
