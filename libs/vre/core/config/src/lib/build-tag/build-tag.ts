import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { z } from 'zod';

export const BuildTagSchema = z.object({
  build_tag: z.string().nonempty(),
});

export type BuildTag = z.infer<typeof BuildTagSchema>;

export function buildTagFactory(): Observable<BuildTag> {
  const httpClient = inject(HttpClient);

  return httpClient.get('/config/build.json').pipe(map(buildTagValue => BuildTagSchema.parse(buildTagValue)));
}
