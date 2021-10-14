export class DspDataDogConfig {
    constructor(public dataDogLogging: boolean,
        public dataDogApplicationId: string,
        public dataDogClientToken: string,
        public dataDogSite: string,
        public dataDogService: string) { }
}
