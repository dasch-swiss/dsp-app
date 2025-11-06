import { FeatureFlagsType } from './app-config';

export class DspFeatureFlagsConfig {
  constructor(public readonly allowEraseProjects: FeatureFlagsType['allowEraseProjects']) {}
}
