/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

export class DspDataDogConfig {
    constructor(
        public enabled: boolean,
        public applicationId: string | undefined,
        public clientToken: string | undefined,
        public site: string | undefined,
        public service: string | undefined
    ) {}
}

export class DspRollbarConfig {
    constructor(
        public enabled: boolean,
        public accessToken: string | undefined
    ) {}
}

export class DspInstrumentationConfig {
    constructor(
        public environment: string,
        public dataDog: DspDataDogConfig,
        public rollbar: DspRollbarConfig
    ) {}
}
