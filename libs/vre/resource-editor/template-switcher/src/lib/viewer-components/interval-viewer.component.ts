import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReadIntervalValue } from '@dasch-swiss/dsp-js';
import { secondsToTimeString } from '@dasch-swiss/vre/ui/ui';

@Component({
  selector: 'app-interval-viewer',
  template: `{{ secondsToTimeString(value.start) }}{{ ' ' }}- {{ secondsToTimeString(value.end) }}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntervalViewerComponent {
  @Input({ required: true }) value!: ReadIntervalValue;

  secondsToTimeString(value: number) {
    return secondsToTimeString(value);
  }
}
