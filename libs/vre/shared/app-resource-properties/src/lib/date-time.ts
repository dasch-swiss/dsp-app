import { GregorianCalendarDate } from '@dasch-swiss/jdnconvertiblecalendar';

export class DateTime {
  constructor(
    public date: GregorianCalendarDate,
    public time: string
  ) {}
}
