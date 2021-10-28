export interface IConfig {
    apiProtocol: 'http' | 'https';
    apiHost: string;
    apiPort: number;
    apiPath: string;
    iiifProtocol: 'http' | 'https';
    iiifHost: string;
    iiifPort: number;
    iiifPath: string;
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
