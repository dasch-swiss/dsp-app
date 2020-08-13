import { KnoraApiConfig } from '@dasch-swiss/dsp-js';
import { Session } from '@dasch-swiss/dsp-ui';

export class TestConfig {

    public static ApiConfig = new KnoraApiConfig('http', '0.0.0.0', 3333);
    public static AppConfig = { name: 'DSP-APP', url: '0.0.0.0:4200' };

    public static ProjectCode = '0001';

    public static CurrentSession: Session = {
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
