import { Component, DebugElement, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { By } from '@angular/platform-browser';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppInitService } from '@dsp-app/src/app/app-init.service';
import {
    DspApiConfigToken,
    DspApiConnectionToken,
} from '@dsp-app/src/app/main/declarations/dsp-api-tokens';
import { TestConfig } from '@dsp-app/src/test.config';
import { FilteredResources } from '../results/list-view/list-view.component';
import { IntermediateComponent } from './intermediate.component';

/**
 * test host component to simulate parent component
 */
@Component({
    template:
        '<app-intermediate #intermediateView [resources]="resources"></app-intermediate>',
})
class OneSelectedResourcesComponent {
    @ViewChild('intermediateView') intermediateComponent: IntermediateComponent;

    resources: FilteredResources = {
        count: 1,
        resListIndex: [1],
        resInfo: [
            {
                id: 'http://rdfh.ch/0803/83616f8d8501',
                label: '65r',
            },
        ],
        selectionType: 'multiple',
    };

    constructor() {}
}

/**
 * test host component to simulate parent component
 */
@Component({
    template:
        '<app-intermediate #intermediateView [resources]="resources"></app-intermediate>',
})
class ThreeSelectedResourcesComponent {
    @ViewChild('intermediateView') intermediateComponent: IntermediateComponent;

    resources: FilteredResources = {
        count: 3,
        resListIndex: [3, 2, 1],
        resInfo: [
            {
                id: 'http://rdfh.ch/0803/83616f8d8501',
                label: '65r',
            },
            {
                id: 'http://rdfh.ch/0803/71e0b9958a01',
                label: '76r',
            },
            {
                id: 'http://rdfh.ch/0803/683d5cd26f01',
                label: '17v',
            },
        ],
        selectionType: 'multiple',
    };

    constructor() {}
}

describe('IntermediateComponent', () => {
    let host1Component: OneSelectedResourcesComponent;
    let host1Fixture: ComponentFixture<OneSelectedResourcesComponent>;

    let host3Component: ThreeSelectedResourcesComponent;
    let host3Fixture: ComponentFixture<ThreeSelectedResourcesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                IntermediateComponent,
                OneSelectedResourcesComponent,
                ThreeSelectedResourcesComponent,
            ],
            imports: [
                MatButtonModule,
                MatDialogModule,
                MatIconModule,
                MatSnackBarModule,
                MatTooltipModule,
            ],
            providers: [
                AppInitService,
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig,
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig),
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        host1Fixture = TestBed.createComponent(OneSelectedResourcesComponent);
        host1Component = host1Fixture.componentInstance;
        host1Fixture.detectChanges();

        expect(host1Component).toBeTruthy();

        host3Fixture = TestBed.createComponent(ThreeSelectedResourcesComponent);
        host3Component = host3Fixture.componentInstance;
        host3Fixture.detectChanges();

        expect(host3Component).toBeTruthy();
    });

    describe('One selected resource', () => {
        it('expect count to be "1" and text to be "Resource Selected', () => {
            expect(host1Component.intermediateComponent).toBeTruthy();
            expect(
                host1Component.intermediateComponent.resources
            ).toBeDefined();

            const hostCompDe = host1Fixture.debugElement;

            const count: DebugElement = hostCompDe.query(By.css('.count'));
            expect(count.nativeElement.innerText).toEqual('1');
            const text: DebugElement = hostCompDe.query(By.css('.text'));
            expect(text.nativeElement.innerText).toEqual(' Resource Selected ');
        });

        it('expect compare button to be disabled', () => {
            expect(host1Component.intermediateComponent).toBeTruthy();
            expect(
                host1Component.intermediateComponent.resources
            ).toBeDefined();

            const hostCompDe = host1Fixture.debugElement;

            const button: DebugElement = hostCompDe.query(By.css('.compare'));
            expect(button.nativeElement.disabled).toBeTruthy();
        });

        it('expect no card stack', () => {
            expect(host1Component.intermediateComponent).toBeTruthy();
            expect(
                host1Component.intermediateComponent.resources
            ).toBeDefined();

            const hostCompDe = host1Fixture.debugElement;

            const twoCards: DebugElement = hostCompDe.query(By.css('.two'));
            expect(twoCards).toBeFalsy();
            const threeCards: DebugElement = hostCompDe.query(By.css('.three'));
            expect(threeCards).toBeFalsy();
            const moreCards: DebugElement = hostCompDe.query(By.css('.more'));
            expect(moreCards).toBeFalsy();
        });
    });

    describe('Three selected resources', () => {
        it('expect count to be "3" and text to be "Resources Selected', () => {
            expect(host3Component.intermediateComponent).toBeTruthy();
            expect(
                host3Component.intermediateComponent.resources
            ).toBeDefined();

            const hostCompDe = host3Fixture.debugElement;

            const count: DebugElement = hostCompDe.query(By.css('.count'));
            expect(count.nativeElement.innerText).toEqual('3');
            const text: DebugElement = hostCompDe.query(By.css('.text'));
            expect(text.nativeElement.innerText).toEqual('Resources Selected');
        });

        it('expect compare button to be enabled', () => {
            expect(host3Component.intermediateComponent).toBeTruthy();
            expect(
                host3Component.intermediateComponent.resources
            ).toBeDefined();

            const hostCompDe = host3Fixture.debugElement;

            const button: DebugElement = hostCompDe.query(By.css('.compare'));
            expect(button.nativeElement.disabled).toBeFalsy();
        });

        it('expect card stack of more than 2', () => {
            expect(host3Component.intermediateComponent).toBeTruthy();
            expect(
                host3Component.intermediateComponent.resources
            ).toBeDefined();

            const hostCompDe = host3Fixture.debugElement;

            const twoCards: DebugElement = hostCompDe.query(By.css('.two'));
            expect(twoCards.nativeElement).toBeDefined();
            const threeCards: DebugElement = hostCompDe.query(By.css('.three'));
            expect(threeCards.nativeElement).toBeDefined();
            const moreCards: DebugElement = hostCompDe.query(By.css('.more'));
            expect(moreCards).toBeFalsy();
        });
    });
});
