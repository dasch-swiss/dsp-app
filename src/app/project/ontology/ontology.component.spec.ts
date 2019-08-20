import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OntologyComponent } from './ontology.component';
import { MatCardModule } from '@angular/material';
import { KuiActionModule } from '@knora/action';
import { RouterTestingModule } from '@angular/router/testing';

describe('OntologyComponent', () => {
    let component: OntologyComponent;
    let fixture: ComponentFixture<OntologyComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [OntologyComponent],
            imports: [
                KuiActionModule,
                MatCardModule,
                RouterTestingModule
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(OntologyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
