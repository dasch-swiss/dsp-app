import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { OntologyListComponent } from './ontology-list.component';
import { KuiCoreModule, KuiCoreConfigToken, KuiCoreConfig } from '@knora/core';
import { RouterTestingModule } from '@angular/router/testing';

// TODO: fix test
// TypeError: Cannot read property 'snapshot' of undefined
xdescribe('OntologyListComponent', () => {
    let component: OntologyListComponent;
    let fixture: ComponentFixture<OntologyListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [OntologyListComponent],
            imports: [
              KuiCoreModule,
              RouterTestingModule
            ],
            providers: [
                {
                    provide: KuiCoreConfigToken,
                    useValue: KuiCoreConfig
                }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(OntologyListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
