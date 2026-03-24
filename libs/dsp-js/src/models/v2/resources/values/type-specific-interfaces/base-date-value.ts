/**
 * @category Internal
 */
export interface IBaseDateValue {
  calendar: string;

  startDay?: number;

  startMonth?: number;

  startYear: number;

  startEra?: string;

  endDay?: number;

  endMonth?: number;

  endYear: number;

  endEra?: string;
}
