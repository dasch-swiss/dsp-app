/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents an error that occurred when using `JDNConvertibleCalendarModule`.
 */
export class JDNConvertibleCalendarError extends Error {

    /**
     *
     * @param message description of the error.
     */
    constructor(message: string) {
        super(message);
    }
}
