import { HttpErrorResponse } from '@angular/common/http';
import { ApiResponseError } from '@dasch-swiss/dsp-js';

/**
 * The server's own account of a failure, read out of whichever field carries it.
 *
 * dsp-api answers in more than one shape: the JSON-LD `knora-api:error` of the v2 endpoints, the
 * `{ message }` of the exceptions declared in the OpenAPI spec (`ConflictException`,
 * `NotFoundException`, …), an `{ error }`, or a bare string body.
 *
 * Shared by the snackbar and the telemetry payload deliberately. Keeping two narrower copies of this
 * precedence is what let a 409 report its reason to Sentry while telling the user to contact support
 * (DEV-6872).
 */
export function reasonFromErrorBody(body: unknown): string | undefined {
  if (typeof body === 'string') {
    return body || undefined;
  }

  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const shape = body as { 'knora-api:error'?: unknown; message?: unknown; error?: unknown };
  return [shape['knora-api:error'], shape.message, shape.error].find(
    (candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0
  );
}

/**
 * The `{ message }` of an exception declared in the OpenAPI spec, when the body carries one.
 *
 * Lives next to `reasonFromErrorBody` so that knowledge of the response shapes stays in one module: a
 * caller that tidies up raw exception text before showing it needs to know whether the reason it was
 * handed is that text or a sentence dsp-api already wrote for the user.
 */
export function declaredMessageOf(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const message = (body as { message?: unknown }).message;
  return typeof message === 'string' && message.length > 0 ? message : undefined;
}

/** The same reason, read off a whole error rather than a body already dug out of it. */
export function reasonFromApiError(error: unknown): string | undefined {
  if (error instanceof ApiResponseError) {
    // `error` is the wrapped `AjaxError` for a JS-LIB failure and a plain string otherwise.
    return reasonFromErrorBody(typeof error.error === 'string' ? error.error : error.error?.response);
  }

  if (error instanceof HttpErrorResponse) {
    return reasonFromErrorBody(error.error);
  }

  return undefined;
}

/**
 * Statuses whose body explains something the user can act on. A 400 names the constraint they broke
 * ("a wildcard search term must contain at least 3 characters"); a 409 names the conflict. Everything
 * else is deliberately excluded: 403/404/504 already have curated messages, and a 500 body carries
 * server internals that do not belong on screen — which is why `AppErrorHandler` answers those with
 * "contact support" rather than the raw text.
 */
const REASON_BEARING_STATUSES = new Set([400, 409]);

/**
 * Whether dsp-api rejected the request itself (a status in {@link REASON_BEARING_STATUSES}), as opposed
 * to failing to serve it. A caller whose own UI already shows the rejection, such as the advanced
 * search's failure panel, uses this to skip the snackbar on top of it (DEV-7370).
 */
export function isRequestRejection(error: unknown): boolean {
  const status = error instanceof ApiResponseError || error instanceof HttpErrorResponse ? error.status : undefined;
  return status !== undefined && REASON_BEARING_STATUSES.has(status);
}

/** dsp-api prefixes its own exceptions with their class; the user only wants what follows it. */
const DSP_EXCEPTION_PREFIX = /^dsp\.errors\.\w+:\s*([\s\S]*)$/;

/**
 * A package-qualified exception class still leading the text once dsp's own prefix is gone — dsp-api
 * forwards some failures verbatim from the triplestore, so a malformed Lucene term comes back as
 * `org.apache.jena.query.text.TextIndexParseException: Text search parse error: Cannot parse …`.
 * That names internals rather than anything the user can act on, so it is withheld even though the
 * status says the request was bad, and the caller falls back to its own wording.
 */
const FOREIGN_EXCEPTION = /^[a-z][\w$]*(\.[\w$]+)*\.[A-Z][\w$]*(Exception|Error)\b/;

/**
 * The server's explanation, when it is fit to show the user directly.
 *
 * Returns `undefined` when the failure has no actionable text, so callers can fall back to their own
 * generic wording. Used to give a persistent failure panel the same sentence the snackbar shows —
 * before this, a rejected query explained itself for five seconds and then left the user looking at
 * "something went wrong, please try again", advice that cannot work for a malformed query (DEV-6866).
 */
export function userFacingReason(error: unknown): string | undefined {
  if (!isRequestRejection(error)) {
    return undefined;
  }

  const reason = reasonFromApiError(error);
  if (!reason) {
    return undefined;
  }

  const withoutDspPrefix = reason.match(DSP_EXCEPTION_PREFIX)?.[1].trim() ?? reason;
  return FOREIGN_EXCEPTION.test(withoutDspPrefix) ? undefined : withoutDspPrefix;
}
