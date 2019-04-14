import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule, MatFormFieldModule } from '@angular/material';
import { KuiCoreConfig, KuiCoreConfigToken, KuiCoreModule } from '@knora/core';
import { SelectGroupComponent } from './select-group.component';
import { CacheService } from 'src/app/main/cache/cache.service';

// TODO: fix test
// TypeError: Cannot read property 'subscribe' of undefined
xdescribe('SelectGroupComponent', () => {
    let component: SelectGroupComponent;
    let fixture: ComponentFixture<SelectGroupComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SelectGroupComponent],
            imports: [
                KuiCoreModule,
                MatFormFieldModule,
                MatSelectModule,
                ReactiveFormsModule
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
        fixture = TestBed.createComponent(SelectGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
