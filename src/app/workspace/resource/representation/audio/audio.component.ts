import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { FileRepresentation } from '../file-representation';

@Component({
    selector: 'app-audio',
    templateUrl: './audio.component.html',
    styleUrls: ['./audio.component.scss']
})
export class AudioComponent implements OnInit {

    @Input() src: FileRepresentation;

    audio: SafeUrl;

    constructor(
        private _sanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        this.audio = this._sanitizer.bypassSecurityTrustUrl(this.src.fileValue.fileUrl);
    }

}
