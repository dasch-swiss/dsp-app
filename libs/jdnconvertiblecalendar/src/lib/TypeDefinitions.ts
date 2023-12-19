/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TypeDefinitionsModule {
  /**
   * Type alias for a Julian Day Number (JDN).
   *
   * A JDN is an integer representing a Julian Day (without fraction).
   */
  export type JDN = number;

  /**
   * Type alias for a Julian Day Count (JDC).
   *
   * A JDC is a number representing a Julian Day with daytime (including a fraction).
   *
   * Attention: A fraction of .5 represents midnight, .0 represents noon.
   *
   */
  export type JDC = number;
}
