import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { ReadGeonameValue } from '@dasch-swiss/dsp-js';
import { Observable } from 'rxjs';
import { DisplayPlace, GeonameService } from '../geoname.service';

@Component({
  selector: 'app-geoname-viewer',
  template: `
    <a
      class="link"
      target="_blank"
      rel="noopener"
      data-cy="geoname-switch-link"
      [href]="'https://www.geonames.org/' + value.geoname"
      >{{ (geonameLabel$ | async)?.displayName }}</a
    >
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeonameViewerComponent implements OnChanges {
  @Input({ required: true }) value!: ReadGeonameValue;

  geonameLabel$!: Observable<DisplayPlace>;

  constructor(private _geonameService: GeonameService) {}

  ngOnChanges() {
    this.geonameLabel$ = this._geonameService.resolveGeonameID(this.value.geoname);
  }
}
