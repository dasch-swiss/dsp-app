import { ReadResource, SystemPropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspResource } from './dsp-resource';
import { GenerateProperty } from './generateProperty';

export function generateDspResource(resource: ReadResource) {
  const res = new DspResource(resource);
  res.resProps = GenerateProperty.commonProperty(res.res);
  res.systemProps = res.res.entityInfo.getPropertyDefinitionsByType(SystemPropertyDefinition);
  return res;
}
