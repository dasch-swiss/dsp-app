import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { UploadComponent } from '../upload/upload.component';

import { ReplaceFileFormComponent } from './replace-file-form.component';

@Component({
    selector: 'test-host-component',
    template: `
        <app-replace-file-form
            #replaceFileForm
            [representation]="representation"
            [propId]="propId"
        ></app-replace-file-form>
    `,
})
class TestHostComponent implements OnInit {
    @ViewChild('replaceFileForm') replaceFileFormComp: ReplaceFileFormComponent;

    representation:
        | 'stillImage'
        | 'movingImage'
        | 'audio'
        | 'document'
        | 'text'
        | 'archive';
    propId: string;

    ngOnInit(): void {
        this.representation = 'stillImage';
        this.propId =
            'http://rdfh.ch/0123/yryzB6ROTaGER3F9kMZoUA/values/mEm67WJiSAqaWf572GzA9Q';
    }
}

@Component({
    selector: 'app-upload',
    template: '',
})
class TestUploadComponent {
    @Input() parentForm?: UntypedFormGroup;

    @Input() representation:
        | 'stillImage'
        | 'movingImage'
        | 'audio'
        | 'document'
        | 'text'
        | 'archive';

    @Input() formName: string;
}

describe('ReplaceFileFormComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                TestHostComponent,
                TestUploadComponent,
                ReplaceFileFormComponent,
            ],
            imports: [
                MatButtonModule,
                MatIconModule,
                TranslateModule.forRoot(),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();
        expect(testHostComponent).toBeTruthy();
    });

    it('generate the error messages for a still image file representation', () => {
        expect(
            testHostComponent.replaceFileFormComp.warningMessages[0]
        ).toEqual('Image will be replaced.');
        expect(
            testHostComponent.replaceFileFormComp.warningMessages[1]
        ).toEqual('Please note that you are about to replace the image.');
    });
});
