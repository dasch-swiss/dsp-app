import { KnoraApiConfig } from '@dasch-swiss/dsp-js';
import { Session } from 'src/app/main/services/session.service';

export class TestConfig {

    public static ApiConfig = new KnoraApiConfig('http', '0.0.0.0', 3333);

    public static ProjectCode = '0001';

    public static ProjectUuid = '9aQ4EuRKReCXnO0pTJ92ug';

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
