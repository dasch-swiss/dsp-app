/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { JDNConvertibleCalendarError } from './JDNConvertibleCalendarError';
import { TypeDefinitionsModule } from './TypeDefinitions';
import { Utils } from './Utils';

/**
 * Represents a period as two JDNs.
 */
export class JDNPeriod {
  /**
   * Indicates if the date is exact (day precision).
   */
  public readonly exactDate: boolean;

  /**
   *
   * @param periodStart start of the period.
   * @param periodEnd End of the period.
   */
  constructor(
    public readonly periodStart: TypeDefinitionsModule.JDN,
    public readonly periodEnd: TypeDefinitionsModule.JDN
  ) {
    // check that periodStart equals or is before periodEnd
    if (periodStart > periodEnd)
      throw new JDNConvertibleCalendarError(`start of a JDNPeriod must not be greater than its end`);

    // check that given arguments are integers (JDNs have no fractions)
    if (!(Utils.isInteger(periodStart) && Utils.isInteger(periodEnd))) {
      throw new JDNConvertibleCalendarError('JDNs are expected to be integers');
    }

    this.exactDate = periodStart === periodEnd;
  }
}
