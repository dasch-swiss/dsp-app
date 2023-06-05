import { z } from 'zod';

/**
 * If enabled, then the following values are required:
 * - applicationId
 * - clientToken
 * - site
 * - service
 */
export const Datadog = z.discriminatedUnion('enabled', [
    z.object({
        enabled: z.literal(true),
        applicationId: z.string().nonempty(),
        clientToken: z.string().nonempty(),
        site: z.string().nonempty(),
        service: z.string().nonempty(),
    }),
    z.object({
        enabled: z.literal(false),
        applicationId: z.string().optional(),
        clientToken: z.string().optional(),
        site: z.string().optional(),
        service: z.string().optional(),
    }),
]);
export type Datadog = z.infer<typeof Datadog>;

/**
 * If enabled, then the following values are required:
 * - accessToken
 */
export const Rollbar = z.discriminatedUnion('enabled', [
    z.object({
        enabled: z.literal(true),
        accessToken: z.string().nonempty(),
    }),
    z.object({ enabled: z.literal(false), accessToken: z.string().optional() }),
]);
export type Rollbar = z.infer<typeof Rollbar>;

export const Instrumentation = z.object({
    environment: z
        .string()
        .nonempty("required 'environment' value missing in config"),
    dataDog: Datadog,
    rollbar: Rollbar,
});

/**
 * Our codebase requires number | null. The config will contain either a number
 * or an empty string. We need to transform the empty string case into a null.
 */
export const ApiPort = z
    .number()
    .or(z.string().max(0))
    .transform((val) => {
        if (typeof val === 'number') {
            return val;
        } else {
            return null;
        }
    });

/**
 * Our codebase requires number | null. The config will contain either a number
 * or an empty string. We need to transform the empty string case into a null.
 */
export const IiifPort = z
    .number()
    .or(z.string().max(0))
    .transform((val) => {
        if (typeof val === 'number') {
            return val;
        } else {
            return null;
        }
    });

/**
 * Definition of the AppConfig schema for validation of config.json.
 */
export const AppConfig = z.object({
    dspRelease: z.string(),
    apiProtocol: z.enum(['http', 'https']),
    apiHost: z.string().nonempty("required 'apiHost' value missing in config"),
    apiPort: ApiPort,
    zioPrefix: z.enum(['/zio', ':5555']),
    zioEndpoints: z.array(z.string()), // array of strings
    apiPath: z.string(),
    iiifProtocol: z.enum(['http', 'https']),
    iiifHost: z
        .string()
        .nonempty("required 'iiifHost' value missing in config"),
    iiifPort: IiifPort,
    iiifPath: z.string(),
    geonameToken: z
        .string()
        .nonempty("required 'geonameToken' value missing in config"),
    jsonWebToken: z.string(),
    iriBase: z.literal('http://rdfh.ch'),
    logErrors: z.boolean(),
    instrumentation: Instrumentation,
});

/**
 * Definition of the AppConfig type, which can be inferred from the schema.
 */
export type AppConfig = z.infer<typeof AppConfig>;
