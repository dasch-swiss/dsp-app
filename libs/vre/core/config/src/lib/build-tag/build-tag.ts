/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { z } from 'zod';

export const BuildTagSchema = z.object({
  build_tag: z.string().nonempty(),
});

export type BuildTag = z.infer<typeof BuildTagSchema>;

export function buildTagFactory(): Observable<BuildTag> {
  const httpClient = inject(HttpClient);

  return httpClient.get('/config/build.json').pipe(map(buildTagValue => BuildTagSchema.parse(buildTagValue)));
}
