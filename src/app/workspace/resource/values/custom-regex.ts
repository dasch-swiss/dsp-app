// @dynamic
// https://github.com/ng-packagr/ng-packagr/issues/641

export class CustomRegex {

    public static readonly INT_REGEX = /^-?\d+$/;

    public static readonly DECIMAL_REGEX = /^[-+]?[0-9]*\.?[0-9]*$/;

    public static readonly URI_REGEX = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;

    public static readonly COLOR_REGEX = /^#(?:[0-9a-fA-F]{6})$/;

    public static readonly TIME_REGEX = /^([0-1]{1}[0-9]{1}|[2]{1}[0-4]{1}):{1}[0-5]{1}[0-9]{1}$/;

    public static readonly GEONAME_REGEX = /^[0-9]{7}$/;

    public static readonly EMAIL_REGEX = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

    public static readonly PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-zA-Z]).{8,}$/i;

    public static readonly USERNAME_REGEX = /^[a-zA-Z0-9]+$/;

    public static readonly SHORTNAME_REGEX = /^[a-zA-Z]+\S*$/;

    public static readonly ONTOLOGYNAME_REGEX = /^(?![vV][0-9]|[0-9]|[\u00C0-\u017F]).[a-zA-Z0-9]+\S*$/;
}
