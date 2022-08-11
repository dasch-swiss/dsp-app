import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppInitService } from 'src/app/app-init.service';
import { DspApiConfigToken, DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { TestConfig } from 'test.config';
import { FileRepresentation } from '../file-representation';

import { TextComponent } from './text.component';
import { MatMenuModule } from '@angular/material/menu';

const textFileValue = {
    'arkUrl': 'http://0.0.0.0:3336/ark:/72163/1/9876/=wcU1HzYTEKbJCYPybyKmAs/Kp81r_BPTHKa4oSd5iIxXgd',
    'attachedToUser': 'http://rdfh.ch/users/root',
    'fileUrl': 'http://0.0.0.0:1024/9876/Jjic1ixccX7-BUHCAFNlEts.txt/file',
    'filename': 'Jjic1ixccX7-BUHCAFNlEts.txt',
    'hasPermissions': 'CR knora-admin:ProjectAdmin|M knora-admin:ProjectMember',
    'id': 'http://rdfh.ch/9876/-wcU1HzYTEKbJCYPybyKmA/values/95Ny4a1_S6ey5JQZWjf07g',
    'property': 'http://api.knora.org/ontology/knora-api/v2#hasTextFileValue',
    'propertyComment': 'Connects a Representation to a text file',
    'propertyLabel': 'hat Textdatei',
    'strval': 'http://0.0.0.0:1024/9876/Jjic1ixccX7-BUHCAFNlEts.txt/file',
    'type': 'http://api.knora.org/ontology/knora-api/v2#TextFileValue',
    'userHasPermission': 'CR',
    'uuid': 'Kp81r_BPTHKa4oSd5iIxXg',
    'valueCreationDate': '2022-05-25T09:20:19.907631398Z',
    'valueHasComment': undefined,
    'versionArkUrl': 'http://0.0.0.0:3336/ark:/72163/1/9876/=wcU1HzYTEKbJCYPybyKmAs/Kp81r_BPTHKa4oSd5iIxXgd.20220525T092019907631398Z'
};

@Component({
    template: `
        <app-text [src]="textFileRepresentation">
        </app-text>`
})
class TestHostComponent implements OnInit {

    @ViewChild(TextComponent) textComp: TextComponent;

    textFileRepresentation: FileRepresentation;

    ngOnInit() {

        this.textFileRepresentation = new FileRepresentation(textFileValue);
    }
}
describe('TextComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let loader: HarnessLoader;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                TextComponent,
                TestHostComponent
            ],
            imports: [
                HttpClientTestingModule,
                MatDialogModule,
                MatSnackBarModule,
                MatMenuModule
            ],
            providers: [
                AppInitService,
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig)
                }
            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        loader = TestbedHarnessEnvironment.loader(testHostFixture);
        testHostFixture.detectChanges();
        expect(testHostComponent).toBeTruthy();
    });

    it('should have a file url', () => {
        expect(testHostComponent.textFileRepresentation.fileValue.fileUrl).toEqual('http://0.0.0.0:1024/9876/Jjic1ixccX7-BUHCAFNlEts.txt/file');
    });
});
