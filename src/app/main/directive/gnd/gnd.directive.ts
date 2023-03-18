import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

export class GNDConstants {
    public static GND_PREFIX = '(DE-588)';
    public static GND_RESOLVER = 'http://d-nb.info/gnd/';

    public static VIAF_PREFIX = '(VIAF)';
    public static VIAF_RESOLVER = 'https://viaf.org/viaf/';
}

/**
 * this directive renders a GND/IAF or a VIAF identifier as a link to the respective resolver.
 */
@Directive({
    selector: '[appGnd]'
})
export class GndDirective implements OnChanges {

    // the GND identifier to be rendered
    private _gnd: string;

    constructor(private _ele: ElementRef) {}

    get gnd() {
        return this._gnd;
    }

    @Input()
    set gnd(value: string) {
        this._gnd = value;
    }

    ngOnChanges() {
        if (this._gnd.length < 30) {

            if (this._gnd.indexOf(GNDConstants.GND_PREFIX) === 0) {
                // gnd/iaf identifier
                this._ele.nativeElement.innerHTML = `<a href="${GNDConstants.GND_RESOLVER + this._gnd.replace(GNDConstants.GND_PREFIX, '')}" target="_blank">${this._gnd}</a>`;
            } else if (this._gnd.indexOf(GNDConstants.VIAF_PREFIX) === 0) {
                // viaf identifier
                this._ele.nativeElement.innerHTML = `<a href="${GNDConstants.VIAF_RESOLVER + this._gnd.replace(GNDConstants.VIAF_PREFIX, '')}" target="_blank">${this._gnd}</a>`;
            } else {
                // no identifier, leave unchanged
                this._ele.nativeElement.innerHTML = this._gnd;
            }

        } else {
            // no identifier, leave unchanged
            this._ele.nativeElement.innerHTML = this._gnd;
        }
    }
}
