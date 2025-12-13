import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { ReadTimeValue } from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { DateTime } from '../../resource-properties/date-time';
import { convertTimestampToDateTime, dateTimeTimestamp } from '../../resource-properties/date-time-timestamp';

@Component({
  selector: 'app-time-viewer',
  imports: [DatePipe, TranslateModule],
  template: `
    <span data-cy="time-switch-date">{{ dateTime | date: 'dd.MM.yyyy' }}</span>
    {{ 'resourceEditor.templateSwitcher.timeViewer.at' | translate }}
    <span data-cy="time-switch-time">{{ dateTime | date: 'HH:mm' }}</span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeViewerComponent implements OnChanges {
  @Input({ required: true }) value!: ReadTimeValue;
  myDate!: DateTime;

  ngOnChanges() {
    this.myDate = convertTimestampToDateTime(this.value.time, new DatePipe('en-US'));
  }

  get dateTime() {
    return dateTimeTimestamp(this.myDate.date, this.myDate.time);
  }
}
