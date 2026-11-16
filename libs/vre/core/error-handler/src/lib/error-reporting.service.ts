/// <reference types="window" />

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponseError } from '@dasch-swiss/dsp-js';
import { reasonFromApiError } from './api-error-reason';

/**
 * How long the same fingerprint stays suppressed after being reported, per browser tab.
 *
 * A triplestore timeout (DEV-6864) fails for every user at once, and a user who keeps hitting retry
 * multiplies that again. Collapsing repeats of an *identical* failure inside a short window keeps one
 * incident from burning the Sentry quota; every distinct failure still gets through.
 */
const DEDUP_WINDOW_MS = 60_000;

/** `HttpErrorResponse` carries no request method, and dsp-js leaves it empty when the xhr had none. */
const UNKNOWN_METHOD = 'UNKNOWN';

const UNKNOWN_ROUTE = 'unknown';

/** Cap on the server's reason. Generous enough for any dsp-api message, far inside the event limits. */
const MAX_REASON_LENGTH = 2000;

/**
 * The Sentry severity levels this service assigns. Declared locally rather than imported from
 * `@sentry/angular`: the SDK is lazy loaded and reached only through `window`.
 */
type ReportLevel = 'error' | 'warning';

/** The request-shaped fields shared by the types a dsp-api failure can arrive as. */
interface ApiFailure {
  status: number;
  method: string;
  url: string;
}

interface ReportPayload {
  /**
   * What Sentry captures. An `Error` wherever one exists, otherwise the raw value, so Sentry keeps
   * applying its own serialization to whatever was thrown.
   */
  sentryError: unknown;
  /** Faro's `pushError` accepts only `Error | string`. */
  faroError: Error | string;
  /** Set for API failures only — see `_buildPayload`. */
  fingerprint?: string[];
  /** Deliberately outside the fingerprint, but part of the dedup key — see `_isSuppressed`. */
  reason?: string;
  tags: Record<string, string>;
  /**
   * Unindexed event detail. The request URL and the server's reason go here rather than into tags: a
   * Gravsearch query runs to thousands of characters, well past Sentry's 200-character tag-value cap,
   * and every URL is unique, so as a tag it would only inflate the tag index.
   *
   * The split is Sentry's constraint alone — Faro receives tags and extra alike.
   */
  extra?: Record<string, string>;
  /** Left unset for JS errors, which Sentry captures at `error` level by default. */
  level?: ReportLevel;
}

/**
 * Reports errors to telemetry (Sentry, Faro) **without** notifying the user.
 *
 * This is the half of error handling that `AppErrorHandler` used to fuse with the snackbar: anything
 * that got a snackbar got no telemetry, and vice versa, so no `ApiResponseError` or
 * `HttpErrorResponse` had ever reached Sentry (DEV-6872). Degraded paths that deliberately stay
 * silent towards the user — a failed count query next to a rendered result list — call this directly.
 */
@Injectable({
  providedIn: 'root',
})
export class ErrorReportingService {
  private readonly _reportedAt = new Map<string, number>();

  /**
   * @param error the caught value, in any shape.
   * @param context low-cardinality key/value pairs attached as Sentry tags — a component and
   * operation name, so a silent failure can be traced back to the call site that swallowed it.
   */
  report(error: unknown, context?: Record<string, string>): void {
    const payload = this._buildPayload(error, context);

    if (payload.fingerprint && this._isSuppressed(payload.fingerprint, payload.reason)) {
      return;
    }

    this._sendToSentry(payload);
    this._sendToFaro(payload);
  }

  private _buildPayload(error: unknown, context?: Record<string, string>): ReportPayload {
    const failure = ErrorReportingService._asApiFailure(error);

    if (!failure) {
      return {
        sentryError: error,
        faroError: error instanceof Error ? error : String(error),
        tags: { ...context },
      };
    }

    const route = ErrorReportingService._routeOf(failure.url);
    const status = `${failure.status}`;
    const reason = ErrorReportingService._reasonOf(error)?.slice(0, MAX_REASON_LENGTH);
    // Neither ApiResponseError nor HttpErrorResponse extends Error, so Sentry would file every one of
    // them as "Non-Error exception captured with keys: …" and Faro would reject them outright.
    // Re-express the failure as a real Error whose message is the part worth grouping on.
    const reported = new Error(`dsp-api ${status} ${failure.method} ${route}`);
    reported.name = 'DspApiError';

    return {
      sentryError: reported,
      faroError: reported,
      // Without a stack trace Sentry groups by message, and dsp-api puts resource IRIs and whole
      // Gravsearch queries in the URL — left alone that is one issue per request. Group on the coarse
      // route instead; the full URL stays on the event.
      fingerprint: ['dsp-api', failure.method, status, route],
      reason,
      tags: {
        'dsp.status': status,
        'dsp.method': failure.method,
        'dsp.route': route,
        ...context,
      },
      extra: { 'dsp.url': failure.url, ...(reason ? { 'dsp.response': reason } : {}) },
      // A 5xx is a fault; a 4xx is the API rejecting what we sent, and a 0 is a request the browser
      // could not attribute to any response at all — which is not evidence of the user's own
      // connectivity, and is as likely to be our own ingress refusing the request (DEV-6935). Grading
      // them alike would make an invalid date indistinguishable from a triplestore timeout in
      // alerting, and that is how reporting ends up switched off again.
      level: failure.status >= 500 ? 'error' : 'warning',
    };
  }

  /**
   * The server's own account of the failure. `AppErrorHandler` reads the same fields to build the
   * snackbar and then drops them, so without this a Sentry issue records that a 400 happened but not
   * which constraint dsp-api rejected — the only actionable part of it.
   *
   * Angular's own `HttpErrorResponse.message` is not used as a fallback: it is composed from the status
   * and URL, both already on the event. A present `dsp.response` therefore means the server really did
   * say something.
   */
  private static _reasonOf(error: unknown): string | undefined {
    return reasonFromApiError(error);
  }

  private static _asApiFailure(error: unknown): ApiFailure | null {
    if (error instanceof ApiResponseError) {
      // ApiResponseError copies status/method/url off the AjaxError it wraps, so its own fields are
      // enough here; the wrapped error only adds the response body.
      return {
        status: error.status,
        method: error.method || UNKNOWN_METHOD,
        url: error.url,
      };
    }

    if (error instanceof HttpErrorResponse) {
      return {
        status: error.status,
        method: UNKNOWN_METHOD,
        url: error.url ?? '',
      };
    }

    return null;
  }

  /**
   * Collapses a request URL to a coarse route, so that "same endpoint, same status" is one Sentry
   * issue. Everything past the second path segment is dropped because that is where dsp-api puts
   * search terms, IRIs and Gravsearch queries. A `/count` segment survives: a failing count query is
   * a distinct — and far more expensive — operation than the paged query beside it (DEV-6809).
   */
  private static _routeOf(url: string): string {
    if (!url) {
      return UNKNOWN_ROUTE;
    }

    const path = url.split('?')[0].replace(/^[a-z][a-z\d+.-]*:\/\/[^/]+/i, '');
    const segments = path.split('/').filter(Boolean);

    if (segments.length === 0) {
      return '/';
    }

    const head = segments.slice(0, 2);
    const route = `/${head.join('/')}`;

    return segments.includes('count') && !head.includes('count') ? `${route}/count` : route;
  }

  /**
   * Keyed on the reason as well as the fingerprint. Two different rejections on one route are two
   * different failures and both deserve reporting, while a retry loop against the same one still
   * collapses. Grouping is unaffected — the reason stays out of the fingerprint.
   */
  private _isSuppressed(fingerprint: string[], reason?: string): boolean {
    const key = [...fingerprint, reason ?? ''].join('|');
    const now = Date.now();
    const previous = this._reportedAt.get(key);

    if (previous !== undefined && now - previous < DEDUP_WINDOW_MS) {
      return true;
    }

    this._reportedAt.set(key, now);
    return false;
  }

  /**
   * Sentry is lazy loaded by main.ts and only in the environments that are not excluded there, so its
   * absence is the normal case locally and on the dev servers.
   */
  private _sendToSentry(payload: ReportPayload): void {
    try {
      if (window.Sentry && typeof window.Sentry.captureException === 'function') {
        window.Sentry.captureException(payload.sentryError, {
          tags: payload.tags,
          extra: payload.extra,
          fingerprint: payload.fingerprint,
          level: payload.level,
        });
      }
    } catch (sentryError) {
      console.error('Failed to send error to Sentry:', sentryError);
    }
  }

  /**
   * Faro is lazy loaded by GrafanaFaroService, and currently disabled in every environment.
   *
   * It gets the full context, `extra` included: Faro's context is a flat map with neither a
   * cardinality penalty nor a length cap, so the split Sentry's tag limits force has no counterpart
   * here, and withholding `extra` would leave Faro with strictly less than Sentry. The severity is
   * passed as a field of its own because `pushError` has no level — every Faro error is error-level —
   * and deriving "was this a server fault" from a numeric status is awkward to express in a query.
   */
  private _sendToFaro(payload: ReportPayload): void {
    try {
      if (window.__FARO__ && typeof window.__FARO__.api?.pushError === 'function') {
        window.__FARO__.api.pushError(payload.faroError, {
          context: {
            ...payload.tags,
            ...payload.extra,
            ...(payload.level ? { 'dsp.severity': payload.level } : {}),
          },
        });
      }
    } catch (faroError) {
      console.error('Failed to send error to Faro:', faroError);
    }
  }
}
