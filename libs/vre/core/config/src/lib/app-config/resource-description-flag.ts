import { inject, InjectionToken } from '@angular/core';
import { AppConfigService } from './app-config.service';

/**
 * Whether dsp-app shows resource descriptions in the resource header, the resource list and the
 * creation form (`featureFlags.resourceDescription`). Read through `?.` because stories stub
 * `AppConfigService` without feature flags; a stub then means off.
 */
export const RESOURCE_DESCRIPTION_ENABLED = new InjectionToken<boolean>('featureFlags.resourceDescription', {
  providedIn: 'root',
  factory: () => inject(AppConfigService).dspFeatureFlagsConfig?.resourceDescription ?? false,
});
