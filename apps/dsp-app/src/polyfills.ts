/**
 * Polyfills for DSP-APP
 *
 * This file includes polyfills required by Angular and is loaded before the app.
 *
 * Target browsers: Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
 * - ES2022 features are natively supported
 * - No legacy browser support (IE11, older Safari/Chrome versions)
 *
 * Learn more: https://angular.dev/reference/configs/workspace-config#browser-support
 */

/** *************************************************************************************************
 * ZONE.JS - Required by Angular
 *
 * Zone.js is required for Angular's change detection mechanism.
 * Must be imported before the application bootstrap.
 */
import 'zone.js';

/** *************************************************************************************************
 * APPLICATION POLYFILLS
 *
 * Global object polyfill for Node.js compatibility in browser environments.
 * Some libraries (e.g., OpenSeadragon, certain Node-based packages) expect
 * a global 'global' object that's available in Node but not in browsers.
 */
(window as any).global = window;

/** *************************************************************************************************
 * ZONE.JS CONFIGURATION (Optional)
 *
 * Uncomment below to customize zone.js behavior for performance optimization.
 * Only enable if you experience performance issues with specific event types.
 */

// Disable patching of specific events (reduces zone.js overhead)
// (window as any).__Zone_disable_requestAnimationFrame = true;
// (window as any).__Zone_disable_on_property = true;
// (window as any).__zone_symbol__UNPATCHED_EVENTS = ['scroll', 'mousemove'];

// Disable cross-context checks (for iframe/worker scenarios)
// (window as any).__Zone_enable_cross_context_check = true;
