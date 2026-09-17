import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReadGeolocationValue } from '@dasch-swiss/dsp-js';
import { TranslatePipe } from '@ngx-translate/core';
import { CRS_84, crsByIri, parseGeolocation } from '../value-components/geolocation-crs';

/**
 * Renders a geolocation as text: the coordinates with their ordinates named, and the CRS by its
 * human-readable label. No map, no tiles, no external request of any kind.
 */
@Component({
  selector: 'app-geolocation-viewer',
  imports: [TranslatePipe],
  template: `
    <span data-cy="geolocation-coordinates">
      @if (parts) {
        {{ xLabelKey | translate }} {{ parts.x }}, {{ yLabelKey | translate }} {{ parts.y }}
      } @else {
        <!-- A geometry this release cannot represent (a line, an area, an elevation) still reads back
             as it was stored, rather than showing nothing. -->
        {{ value.coordinates || value.geolocation }}
      }
      <span class="crs" data-cy="geolocation-crs" [title]="crsIri">({{ crsLabelKey | translate }})</span>
    </span>
  `,
  styles: [
    `
      .crs {
        opacity: 0.7;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeolocationViewerComponent {
  @Input({ required: true }) value!: ReadGeolocationValue;

  get parts() {
    return parseGeolocation(this.value);
  }

  get crsIri(): string {
    return this.parts?.crs ?? this.value.crs ?? CRS_84.iri;
  }

  private get _crs() {
    return crsByIri(this.crsIri);
  }

  get crsLabelKey(): string {
    // An unrecognised CRS shows its IRI rather than being mislabelled as a known one.
    return this._crs?.labelKey ?? this.crsIri;
  }

  get xLabelKey(): string {
    return this._crs?.xLabelKey ?? CRS_84.xLabelKey;
  }

  get yLabelKey(): string {
    return this._crs?.yLabelKey ?? CRS_84.yLabelKey;
  }
}
