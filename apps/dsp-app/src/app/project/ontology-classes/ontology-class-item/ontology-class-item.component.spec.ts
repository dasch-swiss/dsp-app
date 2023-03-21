import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { ClassDefinition, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppInitService } from '@dsp-app/src/app/app-init.service';
import {
    DspApiConfigToken,
    DspApiConnectionToken,
} from '@dsp-app/src/app/main/declarations/dsp-api-tokens';
import { TestConfig } from '@dsp-app/src/test.config';
import { OntologyClassItemComponent } from './ontology-class-item.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    selector: 'test-host-component',
    template: `
        <app-ontology-class-item #ontoClassItem [resClass]="resClass">
        </app-ontology-class-item>
    `,
})
class TestHostComponent {
    @ViewChild('ontoClassItem') ontoClassItem: OntologyClassItemComponent;

    resClass: ClassDefinition = {
        id: 'http://0.0.0.0:3333/ontology/0001/something/v2#Something',
        subClassOf: ['http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'],
        comment: 'A something is a thing.',
        label: 'Something',
        propertiesList: [
            {
                propertyIndex:
                    'http://api.knora.org/ontology/knora-api/v2#arkUrl',
                cardinality: 0,
                isInherited: true,
            },
            {
                propertyIndex:
                    'http://api.knora.org/ontology/knora-api/v2#attachedToProject',
                cardinality: 0,
                isInherited: true,
            },
        ],
    };
}

describe('OntologyClassItemComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let ontoClassItemComponentDe;
    let hostCompDe;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [OntologyClassItemComponent],
            imports: [MatSnackBarModule, MatDialogModule, RouterTestingModule],
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
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        hostCompDe = testHostFixture.debugElement;
        ontoClassItemComponentDe = hostCompDe.query(
            By.directive(OntologyClassItemComponent)
        );
    });

    it('should create', () => {
        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.ontoClassItem).toBeTruthy();
    });
});
