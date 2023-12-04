import { KnoraApiConfig } from '@dasch-swiss/dsp-js';

export class TestConfig {

    public static ApiConfig = new KnoraApiConfig('http', '0.0.0.0', 3333);

    public static ProjectCode = '0001';

    public static ProjectUuid = '0123';

    public static CurrentSession: any = {
        id: 1555226377250,
        user: {
            jwt: '',
            lang: 'en',
            name: 'root',
            projectAdmin: [],
            sysAdmin: false
        }
    };
}
