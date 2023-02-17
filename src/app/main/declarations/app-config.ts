export interface IConfig {
    dspRelease: string;
    apiProtocol: 'http' | 'https';
    apiHost: string;
    apiPort: number;
    zioPrefix: '/zio' | ':5555';
    zioEndpoints: string[];
    apiPath: string;
    iiifProtocol: 'http' | 'https';
    iiifHost: string;
    iiifPort: number;
    iiifPath: string;
    iriBase: string;
    jsonWebToken: string;
    geonameToken: string;
    logErrors: boolean;
    instrumentation: {
        environment: string;
        dataDog: {
            enabled: boolean;
            applicationId: string;
            clientToken: string;
            site: string;
            service: string;
        };
        rollbar: {
            enabled: boolean;
            accessToken: string;
        };
    };
}
