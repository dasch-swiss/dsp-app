/**
 * Global Window interface extensions for observability tools
 * These types provide type safety for lazy-loaded monitoring services
 */

/**
 * Sentry SDK types for error tracking
 * Sentry is lazy-loaded in production environments
 */
interface SentrySDK {
  captureException(error: any): void;
  captureMessage(message: string): void;
  init(options: any): void;
  browserTracingIntegration(): any;
  replayIntegration(options: any): any;
}

/**
 * Grafana Faro SDK types for observability
 * Faro is lazy-loaded when enabled in configuration
 */
interface FaroSDK {
  api: {
    pushError(error: Error | string, context?: { context?: Record<string, string> }): void;
    pushEvent(name: string, attributes?: Record<string, string>, type?: string): void;
    setUser(user: { id?: string }): void;
  };
}

declare global {
  interface Window {
    /**
     * Sentry SDK instance (lazy-loaded in production)
     * Used by AppErrorHandler for error tracking
     */
    Sentry?: SentrySDK;

    /**
     * Grafana Faro instance (lazy-loaded when enabled)
     * Used by GrafanaFaroService and AppErrorHandler for observability
     */
    __FARO__?: FaroSDK;
  }
}

export {};
