/* eslint-disable max-len */
import { AdminImageDirective } from './admin-image.directive';
import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

@Component({
    template: ` <img appAdminImage [image]="img" [type]="type" alt="text"/>`,
})
class TestAdminImageComponent {
    img = 'http://dasch.swiss/content/images/2017/11/DaSCH_Logo_RGB.png';
    type = 'project';

    constructor() {}
}

describe('Directive: AdminImageDirective', () => {
    let component: TestAdminImageComponent;
    let fixture: ComponentFixture<TestAdminImageComponent>;
    let imageEl: DebugElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [AdminImageDirective, TestAdminImageComponent],
        });

        fixture = TestBed.createComponent(TestAdminImageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        imageEl = fixture.debugElement.query(By.css('img'));
    });

    it('should create an instance', () => {
        expect(component).toBeTruthy();
    });

    it('should display the project logo of the DaSCH', () => {
        expect(imageEl.nativeElement.src).toBe(
            'http://dasch.swiss/content/images/2017/11/DaSCH_Logo_RGB.png'
        );
    });

    it('should display the default project logo if the image is null or undefined', () => {
        component.img = null;
        fixture.detectChanges();

        expect(imageEl.nativeElement.src).toBe(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAQAAAD9CzEMAAAAuUlEQVR4Ae2XP8rCUBAHp5F4gPxBsA45mpUgXkt4Se4Rkc97fIQkhVZrK+JbxGwhujN9Bh77K8IPsWTPkSsXOnYkGLPmjNx5YoUhCX/Igx0LzNgiT9zwBhU1AxLxQEpGQCJOtFT653tEMQUgRxR7LVEjqhkABaLaEGVAVAM5BQ2iOhJFjPSAXeBVPKADfqa+Aw/4Dr53Bx6wD/iZfkZgQgwcidIiBgb0H5CZ/lOClmgYZzxOoMRxjLkBL3E6cltSSnYAAAAASUVORK5CYII='
        );
    });

    it('should detect the change of type to "user" and display the user logo', () => {
        component.img = 'salsah@milchkannen.ch';
        component.type = 'user';
        fixture.detectChanges();

        expect(imageEl.nativeElement.src).toBe(
            'http://www.gravatar.com/avatar/dd74bbb106986f9ef074743e3c7fc555?d=mp&s=256'
        );
    });

    it('should display the default user logo if the image is null or undefined', () => {
        component.img = undefined;
        component.type = 'user';
        fixture.detectChanges();

        expect(imageEl.nativeElement.src).toBe(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAQAAAD9CzEMAAAA+klEQVR4Ae3SMUrDYBjG8X+n1kPoKg4l5g6Cu7jokaxbW5KhNxAcdZMiiOgB2iaXMChKO5jHrEr7Ncn7OSjf77/nScJLEAQNxKTkrKoyEiK82mGCvlWS0vP3+Hu0pqmviQnaUIIHMdpYSYRZihyNMcuRozlmK+Ro+QcGMuRohlmCHA0xiygdZ9qH3zzUEV70mKI13dEFXxMp5Y+fM6KLVxFj5iyrZgzpE/wre5xzyS0LCj6rChbcMOCMXYxiBuTIUcYFh7TQ4ZRnVLMnTujQwAGPqGEP7FPTMW+oRa8c1Xv7D9Sy9zpfcY0MXbFVgQy9sJWMNR8IA0EQfAFx/QsJxgdnsQAAAABJRU5ErkJggg=='
        );
    });
});
